/**
 * 最新資料 API
 * 提供前端頁面 SSR/CSR 使用的最新蔬果價格資料
 */

import { NextRequest, NextResponse } from "next/server";
import { getLatest } from "@/lib/datasource";
import { getOnlineCount } from "../../_lib/online";
import { HARD_CAP, API_BUFFER, RETRY_AFTER } from "@/lib/limits";
import { getCategory } from "@/lib/retail";

export const dynamic = "force-dynamic"; // Next 14

export async function GET(request: NextRequest) {
  try {
    // 檢查線上人數，實施 API 保護
    const onlineCount = await getOnlineCount();
    const apiLimit = HARD_CAP + API_BUFFER;

    if (onlineCount > apiLimit) {
      console.warn(`[API] 線上人數過多 (${onlineCount}/${apiLimit})，拒絕請求`);
      return NextResponse.json(
        { error: "busy", message: "目前使用人數較多，請稍後再試" },
        {
          status: 503,
          headers: {
            "Retry-After": RETRY_AFTER.toString(),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    console.log("[API] 開始查詢最新資料");

    // 直接從數據源取得最新資料（支援 mock 和真實 API）
    const latestData = await getLatest();

    if (latestData.items.length === 0) {
      console.warn("[API] 沒有找到資料");
      return NextResponse.json({ error: "No data available" }, { status: 404 });
    }

    // 過濾掉花卉類別
    const filteredItems = latestData.items.filter(item => 
      getCategory(item.cropName) !== 'flower'
    );

    console.log(`[API] 原始資料: ${latestData.items.length} 筆，過濾花卉後: ${filteredItems.length} 筆`);

    const response = {
      updatedAt: latestData.updatedAt,
      tradeDate: latestData.tradeDate,
      scope: latestData.scope,
      items: filteredItems,
      onlineCount, // 回傳目前線上人數供前端參考
    };

    console.log(
      `[API] 成功回傳 ${filteredItems.length} 筆最新資料，交易日: ${latestData.tradeDate}，線上人數: ${onlineCount}`
    );

    // 4. 暫時關閉快取，便於驗證
    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知錯誤";
    console.error("[API] 查詢最新資料失敗:", error);

    return NextResponse.json(
      { error: `資料查詢失敗: ${errorMessage}` },
      { status: 500 }
    );
  }
}
