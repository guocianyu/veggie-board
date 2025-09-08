import { z } from 'zod';

// 環境變數驗證 schema
const envSchema = z.object({
  // 資料來源設定
  DATA_SOURCE: z.enum(['mock', 'db']).default('mock'),
  
  // 零售係數設定
  RETAIL_COEF_LEAFY: z.string().transform(Number).pipe(z.number().positive()).default('1.5'),
  RETAIL_COEF_FRUIT: z.string().transform(Number).pipe(z.number().positive()).default('1.7'),
  RETAIL_COEF_ROOT: z.string().transform(Number).pipe(z.number().positive()).default('1.3'),
  RETAIL_COEF_OTHER: z.string().transform(Number).pipe(z.number().positive()).default('1.4'),
});

// 驗證並解析環境變數
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ 環境變數驗證失敗:', error);
    throw new Error('環境變數設定錯誤，請檢查 .env.local 檔案');
  }
}

// 匯出驗證後的環境變數
export const env = validateEnv();

// 型別安全的環境變數
export type Env = z.infer<typeof envSchema>;

// 零售係數物件
export const retailCoefficients = {
  leafy: env.RETAIL_COEF_LEAFY,
  fruit: env.RETAIL_COEF_FRUIT,
  root: env.RETAIL_COEF_ROOT,
  other: env.RETAIL_COEF_OTHER,
} as const;

// 資料來源檢查
export const isMockMode = env.DATA_SOURCE === 'mock';
export const isDbMode = env.DATA_SOURCE === 'db';

// 環境變數驗證輔助函式
export function validateRequiredEnv(key: keyof Env): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`缺少必要的環境變數: ${key}`);
  }
  return value;
}

// 安全取得環境變數（帶預設值）
export function getEnvWithDefault<T>(key: string, defaultValue: T): T {
  const value = process.env[key];
  return value !== undefined ? (value as T) : defaultValue;
}

// 開發模式檢查
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
