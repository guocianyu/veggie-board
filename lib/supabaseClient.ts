import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 檢查是否為有效的 Supabase 憑證
const isValidSupabaseConfig = url && 
  anonKey && 
  !url.includes('your_supabase_url_here') && 
  !anonKey.includes('your_supabase_anon_key_here') &&
  url.startsWith('https://') &&
  anonKey.length > 20

let supabase: any = null

if (isValidSupabaseConfig) {
  try {
    supabase = createClient(url, anonKey)
  } catch (error) {
    console.warn('Failed to create Supabase client:', error)
    supabase = null
  }
} else {
  console.warn('Supabase credentials not configured or invalid. Using mock data mode.')
}

export { supabase }
