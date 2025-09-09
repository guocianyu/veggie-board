/**
 * Supabase Realtime Presence 管理
 */
import { RealtimeChannel } from '@supabase/supabase-js';
import { PRESENCE_CHANNEL } from './limits';

let presenceChannel: RealtimeChannel | null = null;
let onlineCount = 0;

/**
 * 生成唯一的 tabId
 */
function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 加入 Presence 頻道
 */
export async function joinPresence(client: any): Promise<number> {
  // 在沒有 Supabase 配置時，模擬正常情況
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mock')) {
    console.log('[Presence] 使用模擬模式，直接放行');
    onlineCount = 1; // 模擬只有 1 個用戶
    return onlineCount;
  }

  if (presenceChannel) {
    return onlineCount;
  }

  const tabId = generateTabId();
  
  try {
    presenceChannel = client
      .channel(PRESENCE_CHANNEL, {
        config: {
          presence: {
            key: tabId,
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel?.presenceState();
        onlineCount = Object.keys(presenceState || {}).length;
        console.log(`[Presence] 目前線上人數: ${onlineCount}`);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: any[] }) => {
        console.log(`[Presence] 用戶加入: ${key}`, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: any[] }) => {
        console.log(`[Presence] 用戶離開: ${key}`, leftPresences);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel?.track({
            tabId,
            at: new Date().toISOString(),
          });
        }
      });

    // 等待初始同步
    await new Promise(resolve => setTimeout(resolve, 1000));
    return onlineCount;
  } catch (error) {
    console.error('[Presence] 加入頻道失敗:', error);
    return 0;
  }
}

/**
 * 取得目前線上人數
 */
export function getOnlineCount(): number {
  return onlineCount;
}

/**
 * 離開 Presence 頻道
 */
export async function leavePresence(): Promise<void> {
  if (presenceChannel) {
    try {
      await presenceChannel.unsubscribe();
      presenceChannel = null;
      onlineCount = 0;
      console.log('[Presence] 已離開頻道');
    } catch (error) {
      console.error('[Presence] 離開頻道失敗:', error);
    }
  }
}

/**
 * 監聽人數變化
 */
export function onPresenceChange(callback: (count: number) => void): () => void {
  const interval = setInterval(() => {
    callback(onlineCount);
  }, 1000);

  return () => clearInterval(interval);
}
