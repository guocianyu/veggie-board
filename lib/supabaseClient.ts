// 這個檔案已棄用，請使用 lib/supabaseBrowser.ts 或 lib/db.ts
// 保留此檔案僅為了向後相容性，但建議遷移到新的單例模式

import supabase from './supabaseBrowser'

// 重新導出單例 client
export { supabase }
