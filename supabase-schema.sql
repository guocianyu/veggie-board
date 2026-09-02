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

-- 注意：絕不可在此塞入假的價格資料——daily_aggregates 的內容會直接顯示為「最新菜價」，
-- 假資料曾被當成真實行情顯示在線上。真實資料由 /api/jobs/daily-ingest 每日寫入。

-- 插入測試蔬菜資料（vegetables 僅為連線測試用表，不會顯示在網站上）
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


