/**
 * 線上人數檢查 API 工具
 */
import { supabase } from '../../../lib/supabaseClient';

// 模擬線上人數計數器（用於測試）
let mockOnlineCount = 0;
let lastRequestTime = 0;

// 重置計數器
export function resetMockCount(): void {
  mockOnlineCount = 0;
  lastRequestTime = 0;
}

/**
 * 取得目前線上人數
 */
export async function getOnlineCount(): Promise<number> {
  try {
    // 在沒有 Supabase 配置時，使用模擬數據進行測試
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('mock')) {
      // 重置為正常模式：每次請求增加 1-2 人，模擬正常使用
      const now = Date.now();
      if (now - lastRequestTime > 100) { // 100ms 內只增加一次
        mockOnlineCount += Math.floor(Math.random() * 2) + 1; // 1-2 人
        lastRequestTime = now;
      }
      
      // 模擬一些人離開（較少機率減少）
      if (Math.random() < 0.1) { // 10% 機率減少
        mockOnlineCount = Math.max(0, mockOnlineCount - Math.floor(Math.random() * 2));
      }
      
      // 確保人數不會過高
      if (mockOnlineCount > 100) {
        mockOnlineCount = Math.floor(Math.random() * 20) + 10; // 10-30 之間
      }
      
      console.log(`[Online] 模擬線上人數: ${mockOnlineCount}`);
      return mockOnlineCount;
    }

    if (!supabase) {
      console.log('[Online] Supabase 未初始化，使用模擬數據');
      return mockOnlineCount;
    }

    const channel = supabase.channel('presence:vb-online');
    
    // 訂閱頻道以取得 presence 狀態
    await channel.subscribe();
    
    // 等待一下讓 presence 同步
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const presenceState = channel.presenceState();
    const count = Object.keys(presenceState).length;
    
    console.log(`[Online] 目前線上人數: ${count}`);
    return count;
  } catch (error) {
    console.error('[Online] 檢查線上人數異常:', error);
    // 發生錯誤時允許通過，避免完全無法使用
    return 0;
  }
}

