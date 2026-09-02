import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // 在開發時給出明確訊息，避免用 mock/真實來回切造成抖動
  // 缺少 env 時改用占位連線，讓模組能載入；所有 Supabase 呼叫會失敗並走各自的 fallback
  console.warn('[Supabase] Missing envs: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY，使用占位連線')
}

export const supabase =
  (globalThis as any).__veggieboard_supabase__ ??
  createClient(supabaseUrl || 'http://localhost:54321', supabaseAnonKey || 'placeholder-anon-key', {
    auth: {
      // 專案專屬的 storageKey，避免與其它 client 衝突
      storageKey: 'veggieboard.auth.token',
      // 若暫時不需要持久化登入，可以打開下一行
      // persistSession: false,
    },
  })

if (!(globalThis as any).__veggieboard_supabase__) {
  ;(globalThis as any).__veggieboard_supabase__ = supabase
}

export default supabase
