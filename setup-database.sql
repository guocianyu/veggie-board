-- 簡化的資料庫設定腳本
-- 請在 Supabase SQL Editor 中執行此腳本

-- 建立 daily_aggregates 表格
CREATE TABLE IF NOT EXISTS daily_aggregates (
  id TEXT PRIMARY KEY,
  trade_date DATE NOT NULL,
  crop_code TEXT NOT NULL,
  crop_name TEXT NOT NULL,
  wavg DECIMAL(10,2) NOT NULL,
  vol INTEGER NOT NULL,
  dod DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入測試資料
INSERT INTO daily_aggregates (id, trade_date, crop_code, crop_name, wavg, vol, dod) VALUES
('1', CURRENT_DATE, 'C001', '高麗菜', 25.5, 1500, 5.2),
('2', CURRENT_DATE, 'C002', '小白菜', 18.3, 800, -2.1),
('3', CURRENT_DATE, 'C003', '菠菜', 32.7, 600, 8.5),
('4', CURRENT_DATE, 'C004', '青江菜', 22.1, 900, -1.3),
('5', CURRENT_DATE, 'C005', '空心菜', 28.9, 700, 3.7)
ON CONFLICT (id) DO NOTHING;

-- 啟用 RLS 並設定讀取權限
ALTER TABLE daily_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON daily_aggregates
  FOR SELECT USING (true);

