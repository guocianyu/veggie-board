/**
 * 線上人數檢查 API 工具
 * 以觀察者身分訂閱與前端 Gatekeeper 相同的 Presence 頻道（不 track 自己），
 * 每個伺服器實例只建立一條長駐 channel，持續同步人數——
 * 不能每個請求都開新 channel（會洩漏且每次多 1 秒延遲）
 */
import { RealtimeChannel } from "@supabase/supabase-js";
import db from "../../../lib/db";
import { PRESENCE_CHANNEL } from "../../../lib/limits";

let channel: RealtimeChannel | null = null;
let latestCount = 0;
let subscribing: Promise<void> | null = null;

function hasSupabaseConfig(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * 確保 presence 頻道已訂閱（只做一次，之後靠事件持續更新 latestCount）
 */
function ensureSubscribed(): Promise<void> {
  if (subscribing) return subscribing;

  subscribing = new Promise<void>((resolve) => {
    // 保底：訂閱卡住時最多等 2 秒就放行（fail-open）
    const failSafe = setTimeout(resolve, 2000);

    channel = db
      .channel(PRESENCE_CHANNEL)
      .on("presence", { event: "sync" }, () => {
        latestCount = Object.keys(channel?.presenceState() ?? {}).length;
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(failSafe);
          // 給初始 presence 同步一點時間
          setTimeout(resolve, 500);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`[Online] Presence 頻道訂閱失敗: ${status}`);
          clearTimeout(failSafe);
          // 讓下次呼叫重新嘗試訂閱
          subscribing = null;
          channel = null;
          resolve();
        }
      });
  });

  return subscribing;
}

/**
 * 取得目前線上人數
 * Supabase 未設定或訂閱失敗時回傳 0（不做限流）——絕不編造假人數
 */
export async function getOnlineCount(): Promise<number> {
  if (!hasSupabaseConfig()) {
    return 0;
  }

  try {
    await ensureSubscribed();
    return latestCount;
  } catch (error) {
    console.error("[Online] 檢查線上人數異常:", error);
    // 發生錯誤時允許通過，避免完全無法使用
    return 0;
  }
}
