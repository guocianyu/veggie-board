/**
 * AMIS 農業部開放資料抓取
 * 資料來源：https://amis.afa.gov.tw
 */

export interface AmisRow {
  market: string;
  cropCode: string;
  cropName: string;
  tradeDate: string;
  price: number;
  volume: number;
  unit: string;
}

/**
 * AMIS 全部蔬果批發市場清單（2026-09 由 API 實測確認；「台北市場」為花卉市場已排除）
 * 注意：API 不指定市場時每次最多只回 1000 筆且分頁參數無效，
 * 會被截斷成只剩台北地區的資料，因此必須按市場逐一查詢
 */
export const AMIS_ALL_MARKETS = [
  "台北一",
  "台北二",
  "三重區",
  "板橋區",
  "宜蘭市",
  "桃農",
  "台中市",
  "豐原區",
  "東勢鎮",
  "永靖鄉",
  "溪湖鎮",
  "南投市",
  "西螺鎮",
  "嘉義市",
  "高雄市",
  "鳳山區",
  "屏東市",
  "台東市",
  "花蓮市",
];

/**
 * 即時查詢實際抓取的市場（北部四大市場）
 * 政府 API 單一請求約需 1~2 秒且無法承受高併發（實測 20 個併發大量逾時、
 * 全部 19 個市場抓完約需 60 秒以上），無法在使用者請求當下抓完全部市場。
 * 要涵蓋全國需改用背景排程抓取後存入資料庫（daily-ingest 管線）。
 */
export const AMIS_FETCH_MARKETS = ["台北一", "台北二", "三重區", "板橋區"];

// 農業部 API 端點
const AMIS_API_URL = "https://data.moa.gov.tw/api/v1/AgriProductsTransType/";

// 轉換日期格式 (YYYY-MM-DD -> 民國年.MM.DD)
function formatDateForAPI(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  const rocYear = parseInt(year) - 1911; // 西元年轉民國年
  return `${rocYear}.${month}.${day}`;
}

// 將 API 回傳的原始列轉換為 AmisRow
function convertRawRows(rawData: any): AmisRow[] {
  const amisData: AmisRow[] = [];

  if (Array.isArray(rawData?.Data)) {
    for (const item of rawData.Data) {
      // 驗證必要欄位
      if (
        item.TransDate &&
        item.MarketName &&
        item.CropName &&
        item.Avg_Price &&
        item.Trans_Quantity
      ) {
        amisData.push({
          market: item.MarketName,
          cropCode: item.CropCode,
          cropName: item.CropName,
          tradeDate: formatDateFromAPI(item.TransDate),
          price: parseFloat(item.Avg_Price) || 0,
          volume: parseInt(item.Trans_Quantity) || 0,
          unit: "公斤",
        });
      }
    }
  }

  return amisData;
}

/**
 * 抓取單一市場、單一日期的資料（單一市場一天最多約 400 筆，不會被 1000 筆上限截斷）
 */
async function fetchAmisMarketDay(
  market: string,
  dateStr: string
): Promise<AmisRow[]> {
  const rocDate = formatDateForAPI(dateStr);
  const params = new URLSearchParams({
    Start_time: rocDate,
    End_time: rocDate,
    MarketName: market,
  });

  const response = await fetch(`${AMIS_API_URL}?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000), // 10秒超時
    // 快取 30 分鐘，避免每個訪客都直接打政府 API
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
  }

  const rawData = await response.json();

  if (rawData?.Next === true) {
    console.warn(`[AMIS] ${market} ${dateStr} 資料超過單次上限被截斷`);
  }

  return convertRawRows(rawData);
}

// 失敗時重試一次（政府 API 偶爾逾時或回錯誤）
async function fetchMarketDayWithRetry(
  market: string,
  dateStr: string
): Promise<AmisRow[]> {
  try {
    return await fetchAmisMarketDay(market, dateStr);
  } catch (firstError) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return fetchAmisMarketDay(market, dateStr);
  }
}

/**
 * 抓取單一日期指定市場的完整資料
 * 併發上限 2：政府 API 承受不了高併發，實測併發過高會大量逾時
 * @param dateStr 日期 (YYYY-MM-DD)
 * @param markets 市場清單，預設北部四大市場（即時查詢用）；背景 ingest 傳 AMIS_ALL_MARKETS
 */
export async function fetchAmisByDay(
  dateStr: string,
  markets: string[] = AMIS_FETCH_MARKETS
): Promise<AmisRow[]> {
  const queue = [...markets];
  const rows: AmisRow[] = [];

  const workers = Array.from({ length: 2 }, async () => {
    while (queue.length > 0) {
      const market = queue.shift()!;
      try {
        rows.push(...(await fetchMarketDayWithRetry(market, dateStr)));
      } catch (error) {
        console.warn(
          `[AMIS] ${market} ${dateStr} 查詢失敗:`,
          error instanceof Error ? error.message : error
        );
      }
    }
  });

  await Promise.all(workers);

  console.log(`[AMIS] ${dateStr} 共取得 ${rows.length} 筆資料`);
  return rows;
}

/**
 * 抓取指定日期範圍的 AMIS 資料（逐日、逐市場查詢後合併）
 * 注意：範圍越大請求數越多（天數 × 20 個市場），大範圍查詢請斟酌使用
 * @param start 開始日期 (YYYY-MM-DD)
 * @param end 結束日期 (YYYY-MM-DD)
 * @returns AMIS 原始資料陣列
 */
export async function fetchAmisByDateRange(
  start: string,
  end: string
): Promise<AmisRow[]> {
  try {
    console.log(`[AMIS] 抓取資料範圍: ${start} ~ ${end}`);

    // 列舉範圍內的每一天
    const days: string[] = [];
    const cursor = new Date(`${start}T00:00:00Z`);
    const endDate = new Date(`${end}T00:00:00Z`);
    while (cursor <= endDate) {
      days.push(cursor.toISOString().split("T")[0]);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // 逐日抓取（每一天內部已平行查 20 個市場）
    const amisData: AmisRow[] = [];
    for (const day of days) {
      const rows = await fetchAmisByDay(day);
      amisData.push(...rows);
    }

    console.log(`[AMIS] 成功取得 ${amisData.length} 筆有效資料`);
    return amisData;
  } catch (error) {
    console.error("[AMIS] 抓取資料失敗:", error);

    // 如果 API 失敗，回傳空陣列而不是拋出錯誤
    // 這樣系統可以繼續運行，只是沒有新資料
    console.warn("[AMIS] API 失敗，回傳空資料");
    return [];
  }
}

/**
 * 從作物名稱生成作物代碼
 */
function generateCropCode(cropName: string): string {
  // 簡化的作物代碼映射
  const cropCodeMap: Record<string, string> = {
    甘藍: "C001",
    高麗菜: "C001",
    青江菜: "C002",
    小白菜: "C008",
    番茄: "C003",
    香蕉: "C004",
    馬鈴薯: "C005",
    洋蔥: "C006",
    蘋果: "C007",
    玉米: "C009",
    菠菜: "C010",
    蘿蔔: "C021",
    胡蘿蔔: "C022",
    地瓜: "C024",
    芋頭: "C025",
    小黃瓜: "C036",
    大黃瓜: "C037",
    苦瓜: "C038",
    絲瓜: "C039",
    冬瓜: "C040",
    南瓜: "C041",
    茄子: "C042",
    青椒: "C044",
    甜椒: "C045",
    鳳梨: "F002",
    芒果: "F003",
    木瓜: "F004",
    西瓜: "F005",
    哈密瓜: "F006",
    香瓜: "F007",
    葡萄: "F008",
    梨子: "F010",
    橘子: "F011",
    柳丁: "F012",
    檸檬: "F013",
    草莓: "F014",
    蓮霧: "F015",
    芭樂: "F016",
    荔枝: "F017",
    龍眼: "F018",
    奇異果: "F019",
    火龍果: "F020",
  };

  return cropCodeMap[cropName] || `UNKNOWN_${cropName.replace(/\s+/g, "_")}`;
}

/**
 * 將 API 回傳的日期格式轉換為標準格式
 */
function formatDateFromAPI(apiDate: string): string {
  try {
    // API 回傳的日期格式可能是 "114.1.15" (民國年) 或 "2025/1/15" (西元年)
    let date: Date;

    if (apiDate.includes(".")) {
      // 民國年格式: "114.1.15"
      const [rocYear, month, day] = apiDate.split(".");
      const adYear = parseInt(rocYear) + 1911; // 民國年轉西元年
      date = new Date(adYear, parseInt(month) - 1, parseInt(day));
    } else {
      // 西元年格式: "2025/1/15" 或 "2025-01-15"
      date = new Date(apiDate);
    }

    return date.toISOString().split("T")[0];
  } catch (error) {
    console.warn(`[AMIS] 日期格式轉換失敗: ${apiDate}`);
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * 驗證 AMIS 資料格式
 */
export function validateAmisRow(row: any): row is AmisRow {
  return (
    typeof row === "object" &&
    typeof row.market === "string" &&
    typeof row.cropCode === "string" &&
    typeof row.cropName === "string" &&
    typeof row.tradeDate === "string" &&
    typeof row.price === "number" &&
    typeof row.volume === "number" &&
    typeof row.unit === "string"
  );
}
