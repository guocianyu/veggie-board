-- 每日 ingest 管線的資料庫遷移
-- 在 Supabase SQL Editor 中執行此腳本（可重複執行，冪等）

-- 1. 市場明細表：市場 × 作物 × 交易日（未來分地區查詢的基礎）
CREATE TABLE IF NOT EXISTS market_prices (
  trade_date DATE NOT NULL,
  market TEXT NOT NULL,
  crop_code TEXT NOT NULL,
  crop_name TEXT NOT NULL,
  avg_price DECIMAL(10,2) NOT NULL,
  volume INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (trade_date, market, crop_code)
);

CREATE INDEX IF NOT EXISTS idx_market_prices_trade_date ON market_prices(trade_date);
CREATE INDEX IF NOT EXISTS idx_market_prices_crop_code ON market_prices(crop_code);

-- 2. 確保彙總表存在（與 supabase-schema.sql 相同定義）
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

CREATE INDEX IF NOT EXISTS idx_daily_aggregates_trade_date ON daily_aggregates(trade_date);

-- 3. 刪除舊 schema 腳本塞入的假測試資料（id 1~5 的高麗菜等假價格）
--    這些假資料若不刪，會被當成「最新交易日」顯示在網站上
DELETE FROM daily_aggregates WHERE id IN ('1', '2', '3', '4', '5');

-- 4. RLS：公開唯讀（寫入走 service role key，會繞過 RLS）
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON market_prices;
CREATE POLICY "Allow public read access" ON market_prices
  FOR SELECT USING (true);

-- daily_aggregates 與 update_ledger 的 RLS 已在 supabase-rls.sql 設定，
-- 若尚未執行過，補上：
ALTER TABLE daily_aggregates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON daily_aggregates;
CREATE POLICY "Allow public read access" ON daily_aggregates
  FOR SELECT USING (true);
