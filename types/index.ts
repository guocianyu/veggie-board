// 價格項目型別
export type PriceItem = {
  cropCode: string;
  cropName: string;
  wavg: number; // 批發均價
  vol: number;  // 成交量
  dod: number;  // 日漲跌幅 (%)
};

// 最新資料載荷型別
export type LatestPayload = {
  updatedAt: string;    // 更新時間 (ISO string)
  tradeDate: string;    // 交易日期 (YYYY-MM-DD)
  scope: 'TW';          // 資料範圍
  items: PriceItem[];   // 價格項目列表
};

// 歷史資料點型別
export type HistoryPoint = {
  date: string;         // 日期 (YYYY-MM-DD)
  low: number;          // 最低價
  mid: number;          // 中位價
  high: number;         // 最高價
  avg: number;          // 平均價
  vol: number;          // 成交量
};

// 歷史資料系列型別
export type HistorySeries = {
  cropCode: string;     // 作物代碼
  cropName: string;     // 作物名稱
  points: HistoryPoint[]; // 歷史資料點
};

// 蔬果類別型別
export type CropCategory = 'leafy' | 'fruit' | 'root' | 'other';

// 零售係數型別
export type RetailCoefficients = {
  leafy: number;
  fruit: number;
  root: number;
  other: number;
};

// 排序選項型別
export type SortOption = 'dod_asc' | 'dod_desc' | 'vol_desc' | 'wavg_desc';

// 顏色偏好型別
export type ColorPreference = 'red-up' | 'green-up';

// 圖表資料點型別（用於 Recharts）
export type ChartDataPoint = {
  date: string;
  low: number;
  mid: number;
  high: number;
  avg: number;
  vol: number;
  retail?: number; // 零售估算價（可選）
};

// API 回應型別
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// 等候室狀態型別
export type WaitingRoomStatus = {
  active: number;       // 目前活躍人數
  max: number;          // 最大容量
  canEnter: boolean;    // 是否可以進入
  estimatedWait?: number; // 預估等候時間（分鐘）
};

// 我的關注項目型別
export type WatchlistItem = {
  cropCode: string;
  cropName: string;
  addedAt: string;      // 加入時間
};

// 頁面元資料型別
export type PageMetadata = {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
};

// 錯誤型別
export type AppError = {
  code: string;
  message: string;
  details?: Record<string, any>;
};

// 載入狀態型別
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 篩選選項型別
export type FilterOptions = {
  category?: CropCategory;
  minPrice?: number;
  maxPrice?: number;
  minVolume?: number;
  sortBy?: SortOption;
};

// 統計資料型別
export type PriceStats = {
  totalItems: number;
  avgPrice: number;
  totalVolume: number;
  priceChange: number;
  topGainer: PriceItem | null;
  topLoser: PriceItem | null;
};
