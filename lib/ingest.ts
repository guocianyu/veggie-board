/**
 * 每日資料 ingest：從農業部 AMIS 抓取全部市場資料，寫入 Supabase
 * - market_prices：市場×作物×日期 明細（未來可做分地區查詢）
 * - daily_aggregates：全國加權彙總×作物×日期，dod 以資料庫中前一交易日計算
 */
import { AMIS_ALL_MARKETS, fetchAmisByDay, AmisRow } from "./amis";
import { getSupabaseServer } from "./supabaseServer";

export interface IngestResult {
  date: string;
  fetched: number;
  marketRows: number;
  aggregateRows: number;
}

/**
 * 抓取並寫入單一日期的資料（冪等：重跑會 upsert 覆蓋）
 * @returns 寫入統計；該日無交易資料時 rows 為 0
 */
export async function ingestDay(dateStr: string): Promise<IngestResult> {
  const db = getSupabaseServer();
  if (!db) {
    throw new Error("Supabase 未設定（缺 SUPABASE_SERVICE_ROLE_KEY）");
  }

  console.log(`[Ingest] 開始抓取 ${dateStr} 全部 ${AMIS_ALL_MARKETS.length} 個市場`);
  const rows = await fetchAmisByDay(dateStr, AMIS_ALL_MARKETS);

  if (rows.length === 0) {
    console.log(`[Ingest] ${dateStr} 無交易資料（休市或尚未發布）`);
    return { date: dateStr, fetched: 0, marketRows: 0, aggregateRows: 0 };
  }

  // 只保留該日期的資料（API 偶爾會回別天的列）
  const dayRows = rows.filter((r) => r.tradeDate === dateStr);

  // 1. 寫入市場明細（分批 upsert，避免單一請求過大）
  const marketRecords = dayRows.map((r) => ({
    trade_date: r.tradeDate,
    market: r.market,
    crop_code: r.cropCode,
    crop_name: r.cropName,
    avg_price: r.price,
    volume: r.volume,
    updated_at: new Date().toISOString(),
  }));

  for (let i = 0; i < marketRecords.length; i += 500) {
    const chunk = marketRecords.slice(i, i + 500);
    const { error } = await db
      .from("market_prices")
      .upsert(chunk, { onConflict: "trade_date,market,crop_code" });
    if (error) {
      throw new Error(`寫入 market_prices 失敗: ${error.message}`);
    }
  }

  // 2. 計算全國加權彙總
  const aggregates = aggregateByCrop(dayRows);

  // 3. 從資料庫撈前一個交易日的彙總，計算真實 dod
  const prevWavgMap = await fetchPrevDayWavg(db, dateStr);

  const aggregateRecords = aggregates.map((agg) => {
    const prevWavg = prevWavgMap.get(agg.cropCode);
    const dod =
      prevWavg && prevWavg > 0
        ? Math.round(((agg.wavg - prevWavg) / prevWavg) * 100 * 10) / 10
        : 0;

    return {
      id: `${dateStr}-${agg.cropCode}`,
      trade_date: dateStr,
      crop_code: agg.cropCode,
      crop_name: agg.cropName,
      wavg: agg.wavg,
      vol: agg.vol,
      dod,
      updated_at: new Date().toISOString(),
    };
  });

  for (let i = 0; i < aggregateRecords.length; i += 500) {
    const chunk = aggregateRecords.slice(i, i + 500);
    const { error } = await db
      .from("daily_aggregates")
      .upsert(chunk, { onConflict: "id" });
    if (error) {
      throw new Error(`寫入 daily_aggregates 失敗: ${error.message}`);
    }
  }

  console.log(
    `[Ingest] ${dateStr} 完成：明細 ${marketRecords.length} 筆、彙總 ${aggregateRecords.length} 筆`
  );

  return {
    date: dateStr,
    fetched: rows.length,
    marketRows: marketRecords.length,
    aggregateRows: aggregateRecords.length,
  };
}

/**
 * 找出資料庫裡 dateStr 之前最近的「有效」交易日，回傳該日各作物的加權均價
 * 筆數過少的日子（全國性休市、或只寫入一半的日子）不當基準，往前再找（最多 3 天）
 */
async function fetchPrevDayWavg(
  db: NonNullable<ReturnType<typeof getSupabaseServer>>,
  dateStr: string
): Promise<Map<string, number>> {
  const MIN_ROWS_PER_DAY = 50;
  const map = new Map<string, number>();
  let cursor = dateStr;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: prevDate, error: dateError } = await db
      .from("daily_aggregates")
      .select("trade_date")
      .lt("trade_date", cursor)
      .order("trade_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dateError || !prevDate) return map;

    const { data: prevRows, error: rowsError } = await db
      .from("daily_aggregates")
      .select("crop_code, wavg")
      .eq("trade_date", prevDate.trade_date)
      .limit(2000);

    if (rowsError || !prevRows) return map;

    if (prevRows.length >= MIN_ROWS_PER_DAY) {
      for (const row of prevRows) {
        map.set(row.crop_code, Number(row.wavg));
      }
      return map;
    }

    console.log(
      `[Ingest] ${prevDate.trade_date} 僅 ${prevRows.length} 筆彙總，不當 dod 基準，往前找`
    );
    cursor = prevDate.trade_date;
  }

  return map;
}

/**
 * 按作物分組計算加權平均價與總量
 */
function aggregateByCrop(rows: AmisRow[]): Array<{
  cropCode: string;
  cropName: string;
  wavg: number;
  vol: number;
}> {
  const cropMap = new Map<
    string,
    { cropName: string; totalPrice: number; totalVolume: number }
  >();

  for (const row of rows) {
    if (!cropMap.has(row.cropCode)) {
      cropMap.set(row.cropCode, {
        cropName: row.cropName,
        totalPrice: 0,
        totalVolume: 0,
      });
    }
    const crop = cropMap.get(row.cropCode)!;
    crop.totalPrice += row.price * row.volume;
    crop.totalVolume += row.volume;
  }

  const result: Array<{
    cropCode: string;
    cropName: string;
    wavg: number;
    vol: number;
  }> = [];

  for (const [cropCode, crop] of Array.from(cropMap.entries())) {
    if (crop.totalVolume > 0) {
      result.push({
        cropCode,
        cropName: crop.cropName,
        wavg: Math.round((crop.totalPrice / crop.totalVolume) * 10) / 10,
        vol: crop.totalVolume,
      });
    }
  }

  return result;
}

/**
 * 記錄 ingest 執行結果到 update_ledger（失敗不拋錯，僅記 log）
 */
export async function writeLedger(
  status: "success" | "error",
  message: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const db = getSupabaseServer();
  if (!db) return;

  const { error } = await db.from("update_ledger").insert({
    id: `daily-ingest-${Date.now()}`,
    job_type: "daily-ingest",
    status,
    message,
    metadata,
  });

  if (error) {
    console.warn(`[Ingest] 寫入 update_ledger 失敗: ${error.message}`);
  }
}
