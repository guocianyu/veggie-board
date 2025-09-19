import { createClient } from '@supabase/supabase-js'

// 假的 URL/Key 只是為了通過型別，實際不連線
export const mockSupabase = createClient('http://mock.local', 'mock-key', {
  auth: { storageKey: 'veggieboard.mock.auth.token' },
})

export default mockSupabase
