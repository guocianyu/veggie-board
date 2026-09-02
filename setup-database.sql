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

-- 注意：絕不可在此塞入假的價格資料——daily_aggregates 的內容會直接顯示為「最新菜價」，
-- 假資料曾被當成真實行情顯示在線上。真實資料由 /api/jobs/daily-ingest 每日寫入。

-- 啟用 RLS 並設定讀取權限
ALTER TABLE daily_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON daily_aggregates
  FOR SELECT USING (true);


