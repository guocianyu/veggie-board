# CRON 排程說明

## 概述

VeggieBoard 使用 Vercel Cron 功能，每天自動抓取 AMIS 農業部開放資料並更新到資料庫。

## 排程設定

- **觸發時間**：每天台灣時間 03:05
- **UTC 時間**：19:05（前一日）
- **API 路徑**：`/api/jobs/daily-ingest`
- **設定檔案**：`vercel.json`

## 環境變數

在 Vercel 專案設定中需要配置以下環境變數：

```bash
# Supabase 設定
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key_here

# Cron 安全設定
CRON_SECRET=your_secure_random_string_here

# 時區設定
TZ=Asia/Taipei

# 資料來源模式
DATA_SOURCE=db
```

## 本地測試

### 1. 手動觸發 Cron Job

```bash
# 設定環境變數
export CRON_SECRET="your-secret-here"

# 觸發每日資料擷取
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  https://your-domain.vercel.app/api/jobs/daily-ingest
```

### 2. 本地開發測試

```bash
# 啟動開發伺服器
npm run dev

# 在另一個終端觸發 API
curl -X POST \
  -H "Authorization: Bearer change-me" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/jobs/daily-ingest
```

## 監控與除錯

### 1. 查看 Vercel 函數日誌

1. 登入 Vercel Dashboard
2. 選擇專案
3. 進入 Functions 頁面
4. 查看 `api/jobs/daily-ingest` 的執行日誌

### 2. 檢查 API 回應

成功的回應格式：
```json
{
  "ok": true,
  "dates": ["2024-01-15", "2024-01-14", "2024-01-13"],
  "inserted": 30,
  "aggregated": 10,
  "tookMs": 2500
}
```

錯誤的回應格式：
```json
{
  "ok": false,
  "error": "錯誤訊息",
  "tookMs": 1000
}
```

### 3. 檢查資料更新

```bash
# 檢查最新資料 API
curl https://your-domain.vercel.app/api/data/latest

# 檢查首頁是否顯示最新資料
curl https://your-domain.vercel.app/
```

## 安全考量

### 1. CRON_SECRET 保護

- 使用強隨機字串作為 CRON_SECRET
- 定期更換 CRON_SECRET
- 不要在程式碼中硬編碼

### 2. 來源驗證（可選）

可以在 `app/api/jobs/daily-ingest/route.ts` 中加入額外的安全檢查：

```typescript
// 檢查 User-Agent
const userAgent = request.headers.get('user-agent');
if (!userAgent?.includes('vercel-cron')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// 檢查來源 IP（Vercel Cron 的 IP 範圍）
const forwardedFor = request.headers.get('x-forwarded-for');
// 實作 IP 白名單檢查...
```

## 故障排除

### 1. 常見問題

**問題**：Cron Job 沒有執行
- 檢查 `vercel.json` 格式是否正確
- 確認專案已部署到 Vercel
- 檢查 Vercel 函數日誌

**問題**：401 Unauthorized
- 檢查 `CRON_SECRET` 環境變數是否設定
- 確認 Authorization header 格式正確

**問題**：資料沒有更新
- 檢查 Supabase 連線設定
- 查看 API 執行日誌
- 確認資料庫權限設定

### 2. 除錯步驟

1. 檢查環境變數設定
2. 手動觸發 API 測試
3. 查看函數執行日誌
4. 檢查資料庫連線
5. 驗證資料格式

## 資料流程

```
Vercel Cron (UTC 19:05)
    ↓
/api/jobs/daily-ingest
    ↓
fetchAmisByDateRange() - 抓取 AMIS 資料
    ↓
upsertMarketPrices() - 寫入市場價格
    ↓
rebuildDailyAggregates() - 重建日報表
    ↓
logUpdate() - 記錄更新日誌
    ↓
/api/data/latest - 提供最新資料給前端
```

## 相關檔案

- `vercel.json` - Cron 排程設定
- `app/api/jobs/daily-ingest/route.ts` - 每日批次 API
- `app/api/data/latest/route.ts` - 最新資料 API
- `lib/amis.ts` - AMIS 資料抓取
- `lib/agg.ts` - 資料聚合處理
- `lib/db.ts` - 資料庫連線
- `lib/datasource.ts` - 資料來源切換
