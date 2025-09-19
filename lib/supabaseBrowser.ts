import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  // 在開發時給出明確訊息，避免用 mock/真實來回切造成抖動
  // 你也可以改成 throw Error 直接中斷
  console.warn('[Supabase] Missing envs: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase =
  (globalThis as any).__veggieboard_supabase__ ??
  createClient(supabaseUrl, supabaseAnonKey, {
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
