-- Row Level Security 設定
-- 在 Supabase SQL Editor 中執行此腳本

-- 啟用 RLS
ALTER TABLE daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE vegetables ENABLE ROW LEVEL SECURITY;

-- 設定讀取權限（任何人都可以讀取）
CREATE POLICY "Allow public read access" ON daily_aggregates
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON vegetables
  FOR SELECT USING (true);

-- 設定 update_ledger 的讀取權限
CREATE POLICY "Allow public read access" ON update_ledger
  FOR SELECT USING (true);

-- 如果需要寫入權限，可以建立服務角色金鑰的寫入政策
-- 這裡先設定為只讀，確保安全性

