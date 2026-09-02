# 環境變數設定說明

## 建立 .env.local 檔案

在專案根目錄建立 `.env.local` 檔案，並填入以下環境變數：

```bash
# 資料來源模式：mock（模擬資料）或 api（真實資料）
DATA_SOURCE=api

# Supabase 專案 URL
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here

# Supabase 匿名金鑰（瀏覽器端讀取用）
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase service role 金鑰（伺服器端寫入用，daily-ingest 管線必需）
# ⚠️ 這把金鑰可繞過 RLS，只能放在伺服器端環境變數，絕不可加 NEXT_PUBLIC_ 前綴
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cron 手動觸發密鑰（手動呼叫 /api/jobs/daily-ingest 時用）
CRON_SECRET=any_random_secret_string
```

## 取得 Supabase 憑證

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 前往 Settings > API
4. 複製 Project URL、anon public key 與 service_role key

## 每日 ingest 管線設定（一次性）

1. **建立資料表**：在 Supabase SQL Editor 執行 `supabase-migration-ingest.sql`
2. **設定 Vercel 環境變數**：在 Vercel 專案 Settings > Environment Variables 加入上面全部變數
3. **部署後驗證**：手動觸發一次 ingest 確認資料寫入：

```bash
curl -X POST "https://你的網域/api/jobs/daily-ingest" -H "Authorization: Bearer 你的CRON_SECRET"
```

之後 Vercel Cron 每天台灣時間 14:05 會自動抓全部 19 個市場的資料（`vercel.json`）。
可用 `?date=YYYY-MM-DD` 補抓歷史日期。

## 資料流說明

- **有資料庫資料**：網站顯示全部 19 個市場的全國彙總（`daily_aggregates`），漲跌幅以資料庫前一交易日計算
- **資料庫沒資料**（未設定或剛部署）：fallback 即時抓北部四大市場（台北一、台北二、三重、板橋），30 分鐘快取
- **Mock 模式**：`DATA_SOURCE=mock` 時使用 `public/mock/` 的模擬資料（僅開發用）

## 注意事項

- `.env.local` 檔案不會被提交到版本控制系統
- 重新啟動開發伺服器後環境變數才會生效
- 政府 AMIS API 承受不了高併發且單次最多回 1000 筆，抓取邏輯的限制說明見 `lib/amis.ts`
