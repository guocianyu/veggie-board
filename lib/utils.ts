import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合併 CSS 類別名稱
 * 使用 clsx 和 tailwind-merge 來處理類別衝突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 延遲函式
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 防抖函式
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 節流函式
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 生成唯一 ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 檢查是否為空值
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * 深拷貝物件
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * 格式化檔案大小
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 隨機生成顏色
 */
export function getRandomColor(): string {
  const colors = [
    '#4CAF50', '#E53935', '#1976D2', '#FF9800', '#9C27B0',
    '#00BCD4', '#795548', '#607D8B', '#FF5722', '#3F51B5'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 檢查是否為有效的 URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * 檢查是否為有效的電子郵件
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 取得檔案的副檔名
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * 將字串轉換為 kebab-case
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * 將字串轉換為 camelCase
 */
export function camelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

/**
 * 將字串轉換為 PascalCase
 */
export function pascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
    .replace(/\s+/g, '');
}

/**
 * 檢查是否為行動裝置
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * 檢查是否為平板裝置
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * 檢查是否為桌面裝置
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
}

/**
 * 取得裝置類型
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * 安全的 JSON 字串化
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}
