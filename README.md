# 菜價看板 | VeggieBoard

一個即時蔬果批發價格監控與零售估算平台，幫助用戶掌握市場趨勢並做出明智的採購決策。

## 功能特色

### 🥬 即時價格監控
- 即時顯示蔬果批發價格
- 漲跌排行與成交量統計
- 30天價格趨勢圖表

### 💰 零售價格估算
- 基於批發價格的智能零售估算
- 依蔬果類別自動調整係數
- 葉菜類、果菜類、根莖類、其他類、花卉類分類
- 花卉類自動過濾，不顯示在介面中

### 📊 互動式圖表
- 價格區間帶顯示（最高-最低價）
- 平均價與中位價趨勢線
- 零售估算線（可切換顯示）
- 成交量柱狀圖

### 🎨 個人化設定
- 顏色偏好切換（紅漲綠跌 / 綠漲紅跌）
- 響應式設計，支援各種裝置
- 無障礙設計，支援鍵盤操作

### 🚪 等候室系統
- 人數限制管理
- 即時狀態更新
- 預估等候時間

### 🌸 智能分類系統
- 自動識別並過濾花卉類商品
- 精確的水果/蔬菜分類
- 支援作物名稱變體識別
- 基於關鍵字和對照表的雙重分類機制

### 🔄 自動化部署
- GitHub Actions 自動部署到 Vercel
- 支援多環境部署（開發/預覽/生產）
- 自動化測試和建置流程
- 環境變數安全管理

## 技術架構

- **前端框架**: Next.js 14 (App Router)
- **開發語言**: TypeScript
- **樣式系統**: Tailwind CSS
- **圖表庫**: Recharts
- **狀態管理**: React Hooks + localStorage
- **資料驗證**: Zod
- **資料源**: 農業部 AMIS Open Data API
- **部署平台**: Vercel + GitHub Actions

## 快速開始

### 環境需求
- Node.js 20+ 
- npm 或 yarn

### 安裝步驟

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **設定環境變數**
   ```bash
   cp .env.example .env.local
   ```
   
   編輯 `.env.local` 檔案：
   ```env
   DATA_SOURCE=mock
   RETAIL_COEF_LEAFY=1.5
   RETAIL_COEF_FRUIT=1.7
   RETAIL_COEF_ROOT=1.3
   RETAIL_COEF_OTHER=1.4
   ```

3. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

4. **開啟瀏覽器**
   訪問 [http://localhost:3000](http://localhost:3000)

## 專案結構

```
veggie-board/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首頁（原 protected 頁面）
│   ├── wait/              # 等候室頁面
│   ├── test/              # 測試頁面
│   ├── api/               # API 路由
│   │   ├── data/latest/   # 最新資料 API
│   │   └── jobs/daily-ingest/ # 每日資料同步
│   ├── globals.css        # 全域樣式
│   └── layout.tsx         # 根佈局
├── components/            # React 元件
│   ├── ui/               # 基礎 UI 元件
│   ├── ds/               # 設計系統元件
│   ├── CheapestBoard.tsx # 最便宜看板
│   ├── RankBoard.tsx     # 排行看板
│   ├── RankRows.tsx      # 排行列表
│   ├── PriceTrendChart.tsx
│   ├── PriceDetailChart.tsx
│   ├── RetailToggle.tsx
│   ├── Gatekeeper.tsx    # 等候室守門員
│   └── FloatingPriceMode.tsx
├── lib/                  # 工具函式
│   ├── env.ts           # 環境變數驗證
│   ├── datasource.ts    # 資料源切換
│   ├── retail.ts        # 零售估算邏輯
│   ├── category.ts      # 分類邏輯
│   ├── amis.ts          # AMIS API 整合
│   ├── format.ts        # 格式化工具
│   ├── ui-prefs.ts      # UI 偏好管理
│   └── utils.ts         # 通用工具
├── types/               # TypeScript 型別定義
├── aliases/             # 資料對照表
│   └── category-map.json # 分類對照表
├── public/mock/         # Mock 資料
├── scripts/             # 部署和測試腳本
├── .github/workflows/   # GitHub Actions
└── style-guide.md       # 樣式指南
```

## 資料源設定

### Mock 模式（預設）
- 使用 `/public/mock/` 下的 JSON 檔案
- 適合開發和測試
- 包含範例資料

### API 模式
- 設定 `DATA_SOURCE=api`
- 直接從農業部 AMIS Open Data API 獲取即時資料
- 支援自動資料同步和更新

### 資料庫模式
- 設定 `DATA_SOURCE=db`
- 使用 Supabase 資料庫儲存歷史資料
- 支援 CRON 排程自動同步

## 零售估算係數

| 類別 | 係數 | 說明 |
|------|------|------|
| 葉菜類 | 1.5 | 高麗菜、青江菜、菠菜等 |
| 果菜類 | 1.7 | 番茄、香蕉、蘋果等 |
| 根莖類 | 1.3 | 馬鈴薯、洋蔥、紅蘿蔔等 |
| 其他類 | 1.4 | 玉米、豆類、菇類等 |
| 花卉類 | 1.0 | 火鶴花、繡球花等（自動過濾） |

## 開發指南

### 新增蔬果品項
1. 在 `/aliases/category-map.json` 新增品項對照
2. 在 `/public/mock/latest.json` 新增價格資料
3. 在 `/public/mock/history/` 新增歷史資料

### 自定義樣式
- 參考 `/style-guide.md`
- 使用 Tailwind CSS 類別
- 遵循設計系統規範

### 新增功能
- 在 `/components/` 建立新元件
- 在 `/lib/` 新增工具函式
- 更新型別定義在 `/types/`

## 部署

### Vercel（推薦）
1. 推送程式碼到 GitHub
2. 在 Vercel 匯入專案
3. 設定環境變數
4. 自動部署

### 其他平台
```bash
npm run build
npm start
```

## 驗收清單

- [x] 首頁渲染 Top 漲/跌、量排行、我的關注卡片
- [x] 零售估算價已顯示，旁有「估算」Badge（有 title/aria）
- [x] 詳頁圖表可切換顯示「零售估算線」（虛線）
- [x] 單位皆為「元/公斤」
- [x] 等候室頁面會輪詢 availability 並顯示狀態
- [x] `DATA_SOURCE=mock|api|db` 切換時 UI 不報錯
- [x] 花卉類商品自動過濾，不顯示在介面中
- [x] 水果/蔬菜分類準確，支援變體名稱識別
- [x] 路由衝突修復，應用程式正常啟動
- [x] 環境變數驗證優化，提供預設值
- [x] GitHub Actions 自動部署設定完成

## 版本更新

### v0.1.0 (最新)
- ✅ 修復路由衝突問題，應用程式正常啟動
- ✅ 新增花卉類商品自動過濾功能
- ✅ 改進水果/蔬菜分類準確性
- ✅ 優化環境變數驗證，提供預設值
- ✅ 新增 GitHub Actions 自動部署
- ✅ 支援 AMIS API 即時資料獲取
- ✅ 改進專案結構和文檔

### 已知問題
- 資料庫模式需要 Supabase 設定才能完全運作
- 部分進口商品分類可能需要手動調整

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 部署說明

### 環境變數設定

在 `.env.local` 檔案中設定以下環境變數：

```bash
# 資料來源設定
DATA_SOURCE=db  # 或 mock

# 零售價格係數
RETAIL_COEF_LEAFY=1.5
RETAIL_COEF_FRUIT=1.7
RETAIL_COEF_ROOT=1.3
RETAIL_COEF_OTHER=1.4

# Supabase 設定（如果使用資料庫）
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE=your_service_role_key

# CRON 排程密鑰
CRON_SECRET=your_cron_secret
```

### GitHub 自動部署

1. **設定 GitHub Secrets**：
   - 前往 GitHub 倉庫的 Settings > Secrets and variables > Actions
   - 新增以下 secrets：
     - `VERCEL_TOKEN`: 你的 Vercel Personal Token
     - `VERCEL_ORG_ID`: 你的 Vercel Organization ID
     - `VERCEL_PROJECT_ID`: 你的 Vercel Project ID

2. **自動部署**：
   - 推送程式碼到 `main` 分支會自動觸發部署
   - 部署狀態可在 GitHub Actions 頁面查看

### Vercel 手動部署

1. **安裝 Vercel CLI**：
```bash
npm i -g vercel
```

2. **使用部署腳本**：
```bash
# 設定環境變數
export VERCEL_TOKEN=your_vercel_token
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE=your_service_role_key
export CRON_SECRET=your_cron_secret

# 執行部署
./scripts/deploy-vercel.sh
```

3. **手動部署**：
```bash
# 建置專案
npm run build

# 部署到 Vercel
vercel --prod
```

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 開啟 http://localhost:3000
```

## 聯絡我們

- 專案首頁: [GitHub Repository](https://github.com/guocianyu/veggie-board)
- 問題回報: [GitHub Issues](https://github.com/guocianyu/veggie-board/issues)
- 電子郵件: contact@veggieboard.com
