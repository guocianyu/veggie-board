/**
 * 每日資料擷取 API
 * 支援 Vercel Cron（GET）與手動觸發（POST + Bearer）
 * 抓取全部 19 個市場的資料寫入 Supabase；可用 ?date=YYYY-MM-DD 手動補抓單日
 */

import { NextResponse } from "next/server";
import { ingestDay, writeLedger, IngestResult } from "@/lib/ingest";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
// 全部市場循序抓一天約 20~30 秒，最多抓兩天
export const maxDuration = 300;

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}

/**
 * 台灣時區的今天日期 (YYYY-MM-DD)
 */
function taiwanToday(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function handle(req: Request) {
  const startTime = Date.now();

  try {
    // 1. 驗證授權：Vercel Cron 或手動觸發
    const isCron = req.headers.get("x-vercel-cron") != null;
    const auth = req.headers.get("authorization") || "";
    const hasSecret =
      !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCron && !hasSecret) {
      console.error("[CRON] 未授權的請求");
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = getSupabaseServer();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Supabase 未設定（缺 SUPABASE_SERVICE_ROLE_KEY）" },
        { status: 500 }
      );
    }

    // 2. 決定目標日期
    const url = new URL(req.url);
    const manualDate = url.searchParams.get("date");

    let targetDates: string[];

    if (manualDate) {
      // 手動補抓指定單日
      if (!/^\d{4}-\d{2}-\d{2}$/.test(manualDate)) {
        return NextResponse.json(
          { ok: false, error: "date 格式須為 YYYY-MM-DD" },
          { status: 400 }
        );
      }
      targetDates = [manualDate];
    } else {
      // 例行執行：台灣今天＋回補最近 3 天內資料庫還沒有的日期（最多抓 2 天）
      const candidates: string[] = [];
      for (let i = 0; i < 4; i++) {
        const d = taiwanToday();
        d.setDate(d.getDate() - i);
        candidates.push(toDateStr(d));
      }

      const { data: existing } = await db
        .from("daily_aggregates")
        .select("trade_date")
        .in("trade_date", candidates);

      const existingDates = new Set(
        (existing || []).map((r: { trade_date: string }) => r.trade_date)
      );

      // 今天永遠重抓（當天資料會隨時間更新），其他日期只補缺的
      targetDates = candidates
        .filter((date, index) => index === 0 || !existingDates.has(date))
        .slice(0, 2);
    }

    console.log(`[CRON] 開始每日資料擷取，目標日期: ${targetDates.join(", ")}`);

    // 3. 逐日抓取並寫入
    const results: IngestResult[] = [];
    for (const date of targetDates) {
      results.push(await ingestDay(date));
    }

    const tookMs = Date.now() - startTime;
    const totalRows = results.reduce((sum, r) => sum + r.marketRows, 0);

    await writeLedger("success", `寫入 ${totalRows} 筆明細`, {
      results,
      tookMs,
    });

    const response = {
      ok: true,
      results,
      ranAt: new Date().toISOString(),
      tookMs,
    };

    console.log(`[CRON] 每日資料擷取完成:`, response);
    return NextResponse.json(response);
  } catch (error) {
    const tookMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "未知錯誤";

    console.error("[CRON] 每日資料擷取失敗:", error);
    await writeLedger("error", errorMessage, { tookMs });

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
        ranAt: new Date().toISOString(),
        tookMs,
      },
      { status: 500 }
    );
  }
}
