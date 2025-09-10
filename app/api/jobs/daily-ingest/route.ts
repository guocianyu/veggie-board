/**
 * 每日資料擷取 API
 * 支援 Vercel Cron（GET）與手動觸發（POST + Bearer）
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchAmisByDateRange } from "@/lib/amis";

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}

async function handle(req: Request) {
  const startTime = Date.now();

  try {
    // 1. 驗證授權：Vercel Cron 或手動觸發
    const isCron = req.headers.get("x-vercel-cron") != null;
    const auth = req.headers.get("authorization") || "";
    const hasSecret = auth === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCron && !hasSecret) {
      console.error("[CRON] 未授權的請求");
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. 計算目標日期（台灣今天 + 前2天）
    const now = new Date();
    const taiwanTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Taipei" })
    );

    const targetDates = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(taiwanTime);
      date.setDate(date.getDate() - i);
      targetDates.push(date.toISOString().split("T")[0]);
    }

    console.log(`[CRON] 開始每日資料擷取，目標日期: ${targetDates.join(", ")}`);

    // 3. 抓取 AMIS 資料
    const amisData = await fetchAmisByDateRange(targetDates[2], targetDates[0]);
    console.log(`[CRON] 成功抓取 ${amisData.length} 筆 AMIS 資料`);

    // 4. 直接從農業部 API 取得資料，無需存儲到數據庫
    // 資料會在前端請求時即時從農業部 API 獲取

    // 5. 記錄成功日誌
    const tookMs = Date.now() - startTime;
    console.log(
      `[CRON] 每日資料擷取完成，處理 ${amisData.length} 筆資料，耗時 ${tookMs}ms`
    );

    // 6. 回傳結果
    const response = {
      ok: true,
      dates: targetDates,
      inserted: amisData.length,
      message: "資料已從農業部 API 成功取得",
      ranAt: new Date().toISOString(),
      tookMs,
    };

    console.log(`[CRON] 每日資料擷取完成:`, response);

    return NextResponse.json(response);
  } catch (error) {
    const tookMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "未知錯誤";

    console.error("[CRON] 每日資料擷取失敗:", error);

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
