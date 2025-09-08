/**
 * 數字格式化工具函式
 * 支援國際化預留，目前以台灣格式為主
 */

// 貨幣格式化選項
export interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
}

// 百分比格式化選項
export interface PercentageFormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSign?: boolean;
}

// 數量格式化選項
export interface NumberFormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  unit?: string;
}

/**
 * 格式化貨幣
 * @param amount 金額
 * @param options 格式化選項
 * @returns 格式化後的貨幣字串
 */
export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const {
    currency = 'TWD',
    locale = 'zh-TW',
    minimumFractionDigits = 0,
    maximumFractionDigits = 1,
    showSymbol = true
  } = options;

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const formatted = formatter.format(amount);
  
  // 如果不需要顯示符號，移除貨幣符號
  if (!showSymbol) {
    return formatted.replace(/[^\d.,]/g, '');
  }
  
  return formatted;
}

/**
 * 格式化百分比
 * @param value 數值（0-1 或 0-100）
 * @param options 格式化選項
 * @returns 格式化後的百分比字串
 */
export function formatPercentage(
  value: number,
  options: PercentageFormatOptions = {}
): string {
  const {
    locale = 'zh-TW',
    minimumFractionDigits = 1,
    maximumFractionDigits = 1,
    showSign = true
  } = options;

  // 如果值大於 1，假設是百分比形式（如 15.5 表示 15.5%）
  const percentage = value > 1 ? value : value * 100;

  const formatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const formatted = formatter.format(percentage / 100);
  
  // 如果需要顯示正負號
  if (showSign && percentage > 0) {
    return `+${formatted}`;
  }
  
  return formatted;
}

/**
 * 格式化數字
 * @param value 數值
 * @param options 格式化選項
 * @returns 格式化後的數字字串
 */
export function formatNumber(
  value: number,
  options: NumberFormatOptions = {}
): string {
  const {
    locale = 'zh-TW',
    minimumFractionDigits = 0,
    maximumFractionDigits = 1,
    useGrouping = true,
    unit = ''
  } = options;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  });

  const formatted = formatter.format(value);
  
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * 格式化價格（專門用於菜價）
 * @param price 價格
 * @param unit 單位，預設為「元/公斤」
 * @returns 格式化後的價格字串
 */
export function formatPrice(price: number, unit: string = '元/公斤'): string {
  return `${formatNumber(price, { maximumFractionDigits: 1 })} ${unit}`;
}

/**
 * 格式化成交量
 * @param volume 成交量
 * @returns 格式化後的成交量字串
 */
export function formatVolume(volume: number): string {
  if (volume >= 10000) {
    return `${formatNumber(volume / 10000, { maximumFractionDigits: 1 })}萬`;
  }
  
  return formatNumber(volume, { useGrouping: true });
}

/**
 * 格式化日期
 * @param date 日期字串或 Date 物件
 * @param options 格式化選項
 * @returns 格式化後的日期字串
 */
export function formatDate(
  date: string | Date,
  options: {
    locale?: string;
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short';
    day?: 'numeric' | '2-digit';
    weekday?: 'long' | 'short' | 'narrow';
  } = {}
): string {
  const {
    locale = 'zh-TW',
    year = 'numeric',
    month = '2-digit',
    day = '2-digit',
    weekday
  } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatter = new Intl.DateTimeFormat(locale, {
    year,
    month,
    day,
    weekday,
  });

  return formatter.format(dateObj);
}

/**
 * 格式化相對時間
 * @param date 日期字串或 Date 物件
 * @param options 格式化選項
 * @returns 格式化後的相對時間字串
 */
export function formatRelativeTime(
  date: string | Date,
  options: {
    locale?: string;
    numeric?: 'always' | 'auto';
  } = {}
): string {
  const { locale = 'zh-TW', numeric = 'auto' } = options;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric });
  
  if (diffInSeconds < 60) {
    return formatter.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return formatter.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return formatter.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else {
    return formatter.format(-Math.floor(diffInSeconds / 86400), 'day');
  }
}

/**
 * 格式化檔案大小
 * @param bytes 位元組數
 * @param options 格式化選項
 * @returns 格式化後的檔案大小字串
 */
export function formatFileSize(
  bytes: number,
  options: {
    locale?: string;
    maximumFractionDigits?: number;
  } = {}
): string {
  const { locale = 'zh-TW', maximumFractionDigits = 1 } = options;
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits,
  });
  
  return `${formatter.format(size)} ${units[unitIndex]}`;
}

/**
 * 格式化電話號碼
 * @param phone 電話號碼
 * @param locale 地區代碼
 * @returns 格式化後的電話號碼字串
 */
export function formatPhone(phone: string, locale: string = 'zh-TW'): string {
  // 移除所有非數字字元
  const cleaned = phone.replace(/\D/g, '');
  
  if (locale === 'zh-TW') {
    // 台灣手機號碼格式
    if (cleaned.length === 10 && cleaned.startsWith('09')) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    // 台灣市話格式
    if (cleaned.length === 9 || cleaned.length === 10) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    }
  }
  
  return phone;
}

/**
 * 截斷文字
 * @param text 原始文字
 * @param maxLength 最大長度
 * @param suffix 後綴，預設為「...」
 * @returns 截斷後的文字
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 格式化價格變化（帶顏色指示）
 * @param change 變化值
 * @param isPositive 是否為正數（用於顏色判斷）
 * @returns 格式化後的變化字串
 */
export function formatPriceChange(change: number, isPositive: boolean = true): string {
  const sign = change > 0 ? '+' : '';
  const formatted = `${sign}${formatPercentage(change, { showSign: false })}`;
  
  return formatted;
}

/**
 * 取得價格變化的 CSS 類別
 * @param change 變化值
 * @param colorPreference 顏色偏好
 * @returns CSS 類別名稱
 */
export function getPriceChangeClass(
  change: number,
  colorPreference: 'red-up' | 'green-up' = 'red-up'
): string {
  if (change === 0) return 'price-neutral';
  
  const isPositive = change > 0;
  
  if (colorPreference === 'red-up') {
    return isPositive ? 'price-up' : 'price-down';
  } else {
    return isPositive ? 'price-down' : 'price-up';
  }
}
