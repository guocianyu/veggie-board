-- Supabase 資料庫結構設定
-- 在 Supabase SQL Editor 中執行此腳本

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

-- 建立 update_ledger 表格
CREATE TABLE IF NOT EXISTS update_ledger (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立 vegetables 表格（用於測試）
CREATE TABLE IF NOT EXISTS vegetables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入一些測試資料
INSERT INTO daily_aggregates (id, trade_date, crop_code, crop_name, wavg, vol, dod) VALUES
('1', CURRENT_DATE, 'C001', '高麗菜', 25.5, 1500, 5.2),
('2', CURRENT_DATE, 'C002', '小白菜', 18.3, 800, -2.1),
('3', CURRENT_DATE, 'C003', '菠菜', 32.7, 600, 8.5),
('4', CURRENT_DATE, 'C004', '青江菜', 22.1, 900, -1.3),
('5', CURRENT_DATE, 'C005', '空心菜', 28.9, 700, 3.7)
ON CONFLICT (id) DO NOTHING;

-- 插入測試蔬菜資料
INSERT INTO vegetables (id, name, category, price) VALUES
('1', '高麗菜', '葉菜類', 25.5),
('2', '小白菜', '葉菜類', 18.3),
('3', '菠菜', '葉菜類', 32.7),
('4', '青江菜', '葉菜類', 22.1),
('5', '空心菜', '葉菜類', 28.9)
ON CONFLICT (id) DO NOTHING;

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_daily_aggregates_trade_date ON daily_aggregates(trade_date);
CREATE INDEX IF NOT EXISTS idx_daily_aggregates_crop_code ON daily_aggregates(crop_code);
CREATE INDEX IF NOT EXISTS idx_update_ledger_created_at ON update_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_update_ledger_status ON update_ledger(status);

