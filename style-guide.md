# 菜價看板 | VeggieBoard 樣式指南

## 品牌色彩

### 主色調
- **主色綠**: `#4CAF50` (primary-500)
  - 用於：主要按鈕、連結、品牌標識
  - 變體：50, 100, 200, 300, 400, 500, 600, 700, 800, 900

### 副色調
- **副色紅**: `#E53935` (secondary-red)
  - 用於：價格上漲、警告、錯誤狀態
- **副色藍**: `#1976D2` (secondary-blue)
  - 用於：資訊提示、連結、圖表

### 語意化顏色
- **成功**: `#4CAF50` (success)
- **危險**: `#E53935` (danger)
- **警告**: `#ff9800` (warning)
- **資訊**: `#1976D2` (info)

## 字體系統

### 字體家族
- **主要字體**: Inter (sans-serif)
- **等寬字體**: JetBrains Mono (monospace)

### 字體大小
- **小**: `text-sm` (14px)
- **中**: `text-base` (16px)
- **大**: `text-lg` (18px)
- **特大**: `text-xl` (20px)
- **超大**: `text-2xl` (24px)

### 字體粗細
- **細**: `font-light` (300)
- **正常**: `font-normal` (400)
- **中等**: `font-medium` (500)
- **半粗**: `font-semibold` (600)
- **粗體**: `font-bold` (700)

## 間距系統

### 基礎間距
- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `3rem` (48px)

### 容器間距
- **容器內距**: `1rem` (16px)
- **容器最大寬度**: 1400px
- **響應式斷點**: sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1400px)

## 元件樣式

### 按鈕 (Button)
```css
/* 基礎樣式 */
.btn {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* 主要按鈕 */
.btn-primary {
  @apply btn bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500;
}

/* 次要按鈕 */
.btn-secondary {
  @apply btn bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500;
}

/* 外框按鈕 */
.btn-outline {
  @apply btn border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500;
}
```

### 卡片 (Card)
```css
/* 基礎卡片 */
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

/* 懸停效果 */
.card-hover {
  @apply card transition-shadow hover:shadow-md;
}
```

### 徽章 (Badge)
```css
/* 基礎徽章 */
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

/* 成功徽章 */
.badge-success {
  @apply badge bg-green-100 text-green-800;
}

/* 警告徽章 */
.badge-warning {
  @apply badge bg-yellow-100 text-yellow-800;
}

/* 危險徽章 */
.badge-danger {
  @apply badge bg-red-100 text-red-800;
}

/* 資訊徽章 */
.badge-info {
  @apply badge bg-blue-100 text-blue-800;
}
```

## 價格變化指示器

### 顏色規則
- **紅漲綠跌模式** (預設):
  - 上漲: `text-red-600` (price-up)
  - 下跌: `text-green-600` (price-down)
  - 持平: `text-gray-600` (price-neutral)

- **綠漲紅跌模式**:
  - 上漲: `text-green-600` (price-down)
  - 下跌: `text-red-600` (price-up)
  - 持平: `text-gray-600` (price-neutral)

### 使用方式
```tsx
// 動態類別名稱
const priceClass = getPriceChangeClass(change, colorPreference);

// 格式化價格變化
const changeText = formatPriceChange(change, showSign);
```

## 圖表配色

### 主要圖表顏色
- **平均價線**: `#4CAF50` (primary-500)
- **最高價線**: `#E53935` (secondary-red)
- **最低價線**: `#1976D2` (secondary-blue)
- **成交量柱**: `#9C27B0` (purple-500)
- **零售估算線**: `#FF9800` (orange-500) - 虛線

### 圖表容器
```css
.chart-container {
  @apply w-full h-64 p-4 bg-white rounded-lg border border-gray-200;
}
```

## 動畫效果

### 載入動畫
```css
.loading-spinner {
  @apply animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500;
}
```

### 淡入動畫
```css
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}
```

### 滑入動畫
```css
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
```

## 響應式設計

### 斷點系統
- **手機**: < 640px
- **平板**: 640px - 1023px
- **桌面**: ≥ 1024px

### 響應式文字
```css
.text-responsive {
  @apply text-sm sm:text-base;
}

.text-responsive-lg {
  @apply text-lg sm:text-xl;
}

.text-responsive-xl {
  @apply text-xl sm:text-2xl;
}
```

## 無障礙設計

### 焦點樣式
```css
.focus-visible {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}
```

### 鍵盤導航
- 所有互動元素都支援鍵盤操作
- 使用 `tabindex` 和 `aria-*` 屬性
- 提供適當的 `aria-label` 和 `title` 屬性

## 列印樣式

### 列印優化
```css
@media print {
  .no-print {
    display: none !important;
  }
  
  .print-break {
    page-break-before: always;
  }
}
```

## 深色模式支援

### 預留深色模式
```css
@media (prefers-color-scheme: dark) {
  .dark-mode {
    @apply bg-gray-900 text-gray-100;
  }
}
```

## 使用建議

### 一致性原則
1. 使用預定義的顏色變數，避免硬編碼顏色值
2. 遵循間距系統，保持視覺節奏
3. 使用語意化的類別名稱
4. 確保所有互動元素都有適當的狀態樣式

### 效能考量
1. 使用 Tailwind 的 JIT 模式
2. 避免過度使用動畫效果
3. 優化圖片和圖表載入
4. 使用適當的響應式圖片

### 維護性
1. 使用 CSS 變數定義主題色彩
2. 建立可重用的元件樣式
3. 保持樣式指南的更新
4. 使用 TypeScript 確保型別安全
