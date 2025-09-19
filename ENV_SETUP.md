# 環境變數設定說明

## 建立 .env.local 檔案

在專案根目錄建立 `.env.local` 檔案，並填入以下環境變數：

```bash
# Supabase 專案 URL
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here

# Supabase 匿名金鑰
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 資料表名稱（可選，預設為 daily_aggregates）
NEXT_PUBLIC_SUPABASE_TABLE=daily_aggregates

# 是否使用 mock 模式（可選，設為 1 時使用模擬資料）
# NEXT_PUBLIC_USE_MOCK=1
```

## 取得 Supabase 憑證

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 前往 Settings > API
4. 複製 Project URL 和 anon public key

## 模式說明

- **真實模式**：當 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 都設定且有效時，會使用真實的 Supabase 資料庫
- **Mock 模式**：當設定 `NEXT_PUBLIC_USE_MOCK=1` 或 Supabase 憑證無效時，會使用模擬資料

## 注意事項

- `.env.local` 檔案不會被提交到版本控制系統
- 重新啟動開發伺服器後環境變數才會生效
- 確保 Supabase 專案已正確設定 RLS 政策和資料表結構
