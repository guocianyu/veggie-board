/**
 * Supabase 單例客戶端
 * 統一管理 Supabase 連線，避免重複建立客戶端
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 檢查環境變數，如果沒有則使用模擬數據
const hasSupabaseConfig = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE;

// 建立 Supabase 客戶端（使用 Service Role Key）
export const supabase: SupabaseClient | null = hasSupabaseConfig ? createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

// 導出類型定義
export type { SupabaseClient } from '@supabase/supabase-js';
