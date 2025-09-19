# 菜價看板 | VeggieBoard

A real-time vegetable and fruit wholesale price monitoring and retail estimation platform that helps users understand market trends and make informed purchasing decisions.

一個即時蔬果批發價格監控與零售估算平台，幫助用戶掌握市場趨勢並做出明智的採購決策。

![VeggieBoard Screenshot](https://via.placeholder.com/800x400/4CAF50/FFFFFF?text=VeggieBoard+Live+Data)

## ✨ Key Features | 主要功能

### 📊 Real-time Price Monitoring | 即時價格監控
- **Live Data**: Direct integration with Taiwan's Ministry of Agriculture AMIS Open Data API
- **Price Rankings**: Today's top 10 price increases and decreases
- **Volume Statistics**: Display trading volume for each item
- **即時資料**: 直接整合台灣農業部 AMIS Open Data API
- **漲跌排行**: 今日漲幅/跌幅 TOP 10 排行榜
- **成交量統計**: 顯示各品項的成交量資訊

### 💰 Smart Retail Estimation | 智能零售估算
- **Auto Calculation**: Intelligent retail price calculation based on wholesale prices
- **Category Coefficients**: Automatic adjustment based on produce categories
- **Price Modes**: Toggle between wholesale and retail estimated prices
- **自動估算**: 基於批發價格智能計算零售價格
- **分類係數**: 依蔬果類別自動調整估算係數
- **價格模式**: 可切換批發價/零售估算價顯示

### 🥬 Cheapest Produce Lists | 最便宜菜單
- **Vegetable Rankings**: Top 50 cheapest vegetables with pagination
- **Fruit Rankings**: Top 50 cheapest fruits with pagination
- **Real-time Updates**: Dynamic sorting based on latest data
- **蔬菜排行**: 最便宜蔬菜 TOP 50，支援分頁瀏覽
- **水果排行**: 最便宜水果 TOP 50，支援分頁瀏覽
- **即時更新**: 基於最新資料動態排序

### 🎨 User Experience | 用戶體驗
- **Responsive Design**: Support for desktop and mobile devices
- **Live Loading**: Loading states and error handling
- **Pagination**: Intuitive pagination controls, 10 items per page
- **響應式設計**: 支援桌面和行動裝置
- **即時載入**: 顯示載入狀態和錯誤處理
- **分頁導航**: 直觀的分頁控制，每頁顯示 10 筆資料

## 🚀 Quick Start | 快速開始

### Prerequisites | 環境需求
- Node.js 20+
- npm or yarn

### Installation Steps | 安裝步驟

1. **Clone the repository | 克隆專案**
   ```bash
   git clone https://github.com/guocianyu/veggie-board.git
   cd veggie-board
   ```

2. **Install dependencies | 安裝依賴**
   ```bash
   npm install
   ```

3. **Set up environment variables | 設定環境變數**
   ```bash
   echo "DATA_SOURCE=api" > .env.local
   ```

4. **Start development server | 啟動開發伺服器**
   ```bash
   npm run dev
   ```

5. **Open browser | 開啟瀏覽器**
   Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack | 技術架構

- **Frontend Framework**: Next.js 14 (App Router)
- **Development Language**: TypeScript
- **Styling System**: Tailwind CSS
- **Chart Library**: Recharts
- **Data Source**: Taiwan Ministry of Agriculture AMIS Open Data API
- **Deployment Platform**: Vercel

## 📁 Project Structure | 專案結構

```
veggie-board/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage | 首頁
│   ├── api/               # API Routes | API 路由
│   │   └── data/latest/   # Latest Data API | 最新資料 API
│   └── layout.tsx         # Root Layout | 根佈局
├── components/            # React Components | React 元件
│   ├── HomeLegacy.tsx     # Main Page Component | 主要頁面元件
│   ├── ui/               # Base UI Components | 基礎 UI 元件
│   └── ds/               # Design System Components | 設計系統元件
├── lib/                  # Utility Functions | 工具函式
│   ├── datasource.ts     # Data Source Management | 資料源管理
│   ├── retail.ts         # Retail Estimation Logic | 零售估算邏輯
│   ├── category.ts       # Classification Logic | 分類邏輯
│   └── format.ts         # Formatting Utilities | 格式化工具
└── types/                # TypeScript Type Definitions | TypeScript 型別定義
```

## 🔧 Data Source Configuration | 資料源設定

### API Mode (Recommended) | API 模式（推薦）
```bash
DATA_SOURCE=api
```
- Direct integration with Taiwan Ministry of Agriculture AMIS API
- Support for 595+ produce items
- 直接整合台灣農業部 AMIS API
- 支援 595+ 種蔬果品項

### Mock Mode | Mock 模式
```bash
DATA_SOURCE=mock
```
- Use local mock data
- Suitable for development and testing
- 使用本地 Mock 資料
- 適合開發和測試

## 💡 Retail Estimation Coefficients | 零售估算係數

| Category | Coefficient | Description | 類別 | 係數 | 說明 |
|----------|-------------|-------------|------|------|------|
| Leafy Vegetables | 1.5 | Cabbage, Chinese cabbage, spinach, etc. | 葉菜類 | 1.5 | 高麗菜、青江菜、菠菜等 |
| Fruits | 1.7 | Tomatoes, bananas, apples, etc. | 果菜類 | 1.7 | 番茄、香蕉、蘋果等 |
| Root Vegetables | 1.3 | Potatoes, onions, carrots, etc. | 根莖類 | 1.3 | 馬鈴薯、洋蔥、紅蘿蔔等 |
| Others | 1.4 | Corn, beans, mushrooms, etc. | 其他類 | 1.4 | 玉米、豆類、菇類等 |

## 🚀 Deployment | 部署

### Vercel (Recommended) | Vercel（推薦）
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable `DATA_SOURCE=api`
4. Automatic deployment complete
- 推送程式碼到 GitHub
- 在 Vercel 匯入專案
- 設定環境變數 `DATA_SOURCE=api`
- 自動部署完成

### Local Build | 本地建置
```bash
npm run build
npm start
```

## 📈 Feature Highlights | 功能特色

- ✅ **Live Data**: Real-time data from AMIS API
- ✅ **Smart Estimation**: Automatic retail price calculation
- ✅ **Category Filtering**: Smart produce categorization
- ✅ **Pagination**: Support for 50 items with pagination
- ✅ **Responsive Design**: Support for various devices
- ✅ **Error Handling**: Graceful loading and error states
- ✅ **Real-time Updates**: Display latest trading day data
- ✅ **即時資料**: 從 AMIS API 獲取最新批發價格
- ✅ **智能估算**: 自動計算零售價格
- ✅ **分類過濾**: 智能蔬果分類
- ✅ **分頁瀏覽**: 支援 50 筆資料分頁顯示
- ✅ **響應式設計**: 支援各種裝置
- ✅ **錯誤處理**: 優雅的載入和錯誤狀態
- ✅ **即時更新**: 顯示最新交易日資料

## 🛠️ Development Guide | 開發指南

### Adding Features | 新增功能
1. Create new components in `/components/`
2. Add utility functions in `/lib/`
3. Update type definitions in `/types/`
- 在 `/components/` 建立新元件
- 在 `/lib/` 新增工具函式
- 更新 `/types/` 中的型別定義

### Custom Styling | 自定義樣式
- Use Tailwind CSS classes
- Follow design system guidelines
- Reference components in `/components/ds/`
- 使用 Tailwind CSS 類別
- 遵循設計系統規範
- 參考 `/components/ds/` 中的設計元件

## 📊 Data Statistics | 資料統計

- **Data Source**: Taiwan Ministry of Agriculture AMIS Open Data
- **Update Frequency**: Daily automatic updates
- **Item Count**: 595+ produce items
- **Market Coverage**: All Taiwan wholesale markets
- **Data Format**: JSON API
- **資料來源**: [台灣農業部 AMIS Open Data](https://data.moa.gov.tw/api.aspx)
- **更新頻率**: 每日自動更新
- **品項數量**: 595+ 種蔬果
- **市場範圍**: 全台批發市場
- **資料格式**: JSON API

## 🤝 Contributing | 貢獻

We welcome contributions! Please feel free to submit issues and pull requests.

歡迎貢獻！歡迎提交 Issue 和 Pull Request！

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 License | 授權

MIT License - see [LICENSE](LICENSE) file for details

MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

## 📞 Contact | 聯絡我們

- **Author**: Guo, Cian Yu
- **Project Homepage**: [GitHub Repository](https://github.com/guocianyu/veggie-board)
- **Issue Reports**: [GitHub Issues](https://github.com/guocianyu/veggie-board/issues)
- **作者**: Guo, Cian Yu
- **專案首頁**: [GitHub Repository](https://github.com/guocianyu/veggie-board)
- **問題回報**: [GitHub Issues](https://github.com/guocianyu/veggie-board/issues)

---

**© 2025 菜價看板 | VeggieBoard ・ Created by Guo, Cian Yu ・ All rights reserved.**