/**
 * 伺服器端 Supabase client（使用 service role key，可繞過 RLS 寫入）
 * 只能在 API route / server 端使用，絕不可 import 進瀏覽器端程式碼
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null | undefined

/**
 * 取得 service role client；環境變數未設定時回傳 null（呼叫端需自行 fallback）
 */
export function getSupabaseServer(): SupabaseClient | null {
  if (cached !== undefined) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.warn(
      '[Supabase] 未設定 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY，資料庫功能停用'
    )
    cached = null
    return cached
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
  return cached
}
