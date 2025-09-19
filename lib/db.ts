/**
 * Supabase 資料庫連線
 * 使用單例模式避免重複建立 client
 */

import supabase from './supabaseBrowser'
let db = supabase

// 若要用 mock，請在 .env.local 設定 NEXT_PUBLIC_USE_MOCK=1
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_MOCK === '1') {
  // 動態載入，避免在正式環境一起 bundle
  // @ts-ignore
  import('./supabaseMock').then((m) => {
    db = m.default || m.mockSupabase
  })
}

// 檢查環境變數，如果沒有則使用模擬數據
const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default db

/**
 * 資料庫表格結構定義
 */
export interface MarketPrice {
  id: string;
  market: string;
  cropCode: string;
  cropName: string;
  tradeDate: string;
  price: number;
  volume: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyAggregate {
  id: string;
  tradeDate: string;
  cropCode: string;
  cropName: string;
  wavg: number;
  vol: number;
  dod: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLedger {
  id: string;
  jobType: string;
  status: 'success' | 'error';
  message: string;
  metadata: Record<string, any>;
  createdAt: string;
}

/**
 * 記錄更新日誌
 */
export async function logUpdate(
  jobType: string,
  status: 'success' | 'error',
  message: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    if (!db) {
      console.error('[DB] 資料庫未初始化');
      return;
    }

    const { error } = await db
      .from('update_ledger')
      .insert({
        jobType,
        status,
        message,
        metadata,
        createdAt: new Date().toISOString()
      });

    if (error) {
      console.error('[DB] 記錄更新日誌失敗:', error);
    } else {
      console.log('[DB] 更新日誌記錄成功');
    }
  } catch (error) {
    console.error('[DB] 記錄更新日誌異常:', error);
  }
}

/**
 * 取得最新的更新時間
 */
export async function getLatestUpdateTime(): Promise<string | null> {
  // 如果沒有 Supabase 配置，返回當前時間
  if (!hasSupabaseConfig) {
    console.log('[DB] 沒有 Supabase 配置，使用當前時間');
    return new Date().toISOString();
  }

  // 如果是 mock 環境，返回當前時間
  if (process.env.SUPABASE_URL?.includes('mock.supabase.co')) {
    console.log('[DB] 使用 mock 更新時間');
    return new Date().toISOString();
  }

  try {
    if (!db) {
      console.error('[DB] 資料庫未初始化');
      return null;
    }

    const { data, error } = await db
      .from('update_ledger')
      .select('createdAt')
      .eq('status', 'success')
      .order('createdAt', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[DB] 查詢最新更新時間失敗:', error);
      return null;
    }

    return data?.[0]?.createdAt || null;
  } catch (error) {
    console.error('[DB] 查詢最新更新時間異常:', error);
    return null;
  }
}

/**
 * 取得最新的日報表資料
 */
export async function getLatestDailyAggregates(): Promise<DailyAggregate[]> {
  // 如果沒有 Supabase 配置，返回模擬資料
  if (!hasSupabaseConfig) {
    console.log('[DB] 沒有 Supabase 配置，使用模擬資料模式');
    return generateMockDailyAggregates();
  }

  // 如果是 mock 環境，返回模擬資料
  if (process.env.SUPABASE_URL?.includes('mock.supabase.co')) {
    console.log('[DB] 使用 mock 資料模式');
    return generateMockDailyAggregates();
  }

  try {
    if (!db) {
      console.error('[DB] 資料庫未初始化');
      return [];
    }

    // 先找出最新的交易日
    const { data: latestDate, error: dateError } = await db
      .from('daily_aggregates')
      .select('tradeDate')
      .order('tradeDate', { ascending: false })
      .limit(1);

    if (dateError || !latestDate?.[0]) {
      console.error('[DB] 查詢最新交易日失敗:', dateError);
      return [];
    }

    const tradeDate = latestDate[0].tradeDate;

    // 取得該日期的所有聚合資料
    const { data, error } = await db
      .from('daily_aggregates')
      .select('*')
      .eq('tradeDate', tradeDate)
      .order('cropCode');

    if (error) {
      console.error('[DB] 查詢日報表資料失敗:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[DB] 查詢日報表資料異常:', error);
    return [];
  }
}

/**
 * 生成模擬的日報表資料
 */
function generateMockDailyAggregates(): DailyAggregate[] {
  const today = new Date().toISOString().split('T')[0];
  
  const mockData: DailyAggregate[] = [
    // 葉菜類 (20筆)
    { id: '1', tradeDate: today, cropCode: 'C001', cropName: '高麗菜', wavg: 25.5, vol: 1500, dod: 5.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', tradeDate: today, cropCode: 'C002', cropName: '小白菜', wavg: 18.3, vol: 800, dod: -2.1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '3', tradeDate: today, cropCode: 'C003', cropName: '菠菜', wavg: 32.7, vol: 600, dod: 8.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '4', tradeDate: today, cropCode: 'C004', cropName: '青江菜', wavg: 22.1, vol: 900, dod: -1.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '5', tradeDate: today, cropCode: 'C005', cropName: '空心菜', wavg: 28.9, vol: 700, dod: 3.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '6', tradeDate: today, cropCode: 'C006', cropName: '地瓜葉', wavg: 15.6, vol: 500, dod: -4.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '7', tradeDate: today, cropCode: 'C007', cropName: '韭菜', wavg: 35.2, vol: 600, dod: 6.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '8', tradeDate: today, cropCode: 'C008', cropName: '芹菜', wavg: 29.4, vol: 550, dod: 2.1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '9', tradeDate: today, cropCode: 'C009', cropName: '茼蒿', wavg: 26.8, vol: 500, dod: -0.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10', tradeDate: today, cropCode: 'C010', cropName: '芥藍菜', wavg: 31.5, vol: 750, dod: 4.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '11', tradeDate: today, cropCode: 'C011', cropName: 'A菜', wavg: 20.8, vol: 650, dod: -1.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '12', tradeDate: today, cropCode: 'C012', cropName: '大陸妹', wavg: 16.2, vol: 580, dod: 2.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '13', tradeDate: today, cropCode: 'C013', cropName: '萵苣', wavg: 24.6, vol: 520, dod: -3.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '14', tradeDate: today, cropCode: 'C014', cropName: '油菜', wavg: 19.7, vol: 480, dod: 1.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '15', tradeDate: today, cropCode: 'C015', cropName: '芥菜', wavg: 27.3, vol: 720, dod: 5.6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '16', tradeDate: today, cropCode: 'C016', cropName: '莧菜', wavg: 23.1, vol: 680, dod: -2.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '17', tradeDate: today, cropCode: 'C017', cropName: '皇宮菜', wavg: 30.4, vol: 750, dod: 4.1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '18', tradeDate: today, cropCode: 'C018', cropName: '龍鬚菜', wavg: 26.9, vol: 620, dod: -1.4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '19', tradeDate: today, cropCode: 'C019', cropName: '紅鳳菜', wavg: 28.5, vol: 500, dod: 3.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '20', tradeDate: today, cropCode: 'C020', cropName: '川七', wavg: 33.2, vol: 580, dod: 7.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // 根莖類 (15筆)
    { id: '21', tradeDate: today, cropCode: 'C021', cropName: '蘿蔔', wavg: 12.8, vol: 1200, dod: -2.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '22', tradeDate: today, cropCode: 'C022', cropName: '胡蘿蔔', wavg: 18.6, vol: 900, dod: 1.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '23', tradeDate: today, cropCode: 'C023', cropName: '馬鈴薯', wavg: 22.4, vol: 800, dod: 3.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '24', tradeDate: today, cropCode: 'C024', cropName: '地瓜', wavg: 15.7, vol: 700, dod: -1.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '25', tradeDate: today, cropCode: 'C025', cropName: '芋頭', wavg: 28.9, vol: 600, dod: 4.6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '26', tradeDate: today, cropCode: 'C026', cropName: '山藥', wavg: 45.2, vol: 500, dod: 6.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '27', tradeDate: today, cropCode: 'C027', cropName: '蓮藕', wavg: 38.6, vol: 750, dod: 2.1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '28', tradeDate: today, cropCode: 'C028', cropName: '牛蒡', wavg: 42.3, vol: 600, dod: -0.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '29', tradeDate: today, cropCode: 'C029', cropName: '竹筍', wavg: 35.8, vol: 580, dod: 5.4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '30', tradeDate: today, cropCode: 'C030', cropName: '筊白筍', wavg: 32.1, vol: 560, dod: -2.6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '31', tradeDate: today, cropCode: 'C031', cropName: '蘆筍', wavg: 68.5, vol: 520, dod: 8.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '32', tradeDate: today, cropCode: 'C032', cropName: '玉米', wavg: 25.3, vol: 500, dod: 1.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '33', tradeDate: today, cropCode: 'C033', cropName: '花生', wavg: 38.9, vol: 600, dod: -1.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '34', tradeDate: today, cropCode: 'C034', cropName: '菱角', wavg: 28.7, vol: 550, dod: 3.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '35', tradeDate: today, cropCode: 'C035', cropName: '荸薺', wavg: 31.2, vol: 500, dod: -0.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // 瓜果類 (10筆)
    { id: '36', tradeDate: today, cropCode: 'C036', cropName: '小黃瓜', wavg: 28.6, vol: 600, dod: 2.4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '37', tradeDate: today, cropCode: 'C037', cropName: '大黃瓜', wavg: 22.3, vol: 500, dod: -1.6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '38', tradeDate: today, cropCode: 'C038', cropName: '苦瓜', wavg: 35.8, vol: 500, dod: 4.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '39', tradeDate: today, cropCode: 'C039', cropName: '絲瓜', wavg: 26.4, vol: 600, dod: 1.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '40', tradeDate: today, cropCode: 'C040', cropName: '冬瓜', wavg: 18.7, vol: 550, dod: -2.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '41', tradeDate: today, cropCode: 'C041', cropName: '南瓜', wavg: 24.1, vol: 580, dod: 3.1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '42', tradeDate: today, cropCode: 'C042', cropName: '茄子', wavg: 32.5, vol: 750, dod: 5.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '43', tradeDate: today, cropCode: 'C043', cropName: '番茄', wavg: 28.9, vol: 600, dod: -0.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '44', tradeDate: today, cropCode: 'C044', cropName: '青椒', wavg: 42.6, vol: 500, dod: 6.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '45', tradeDate: today, cropCode: 'C045', cropName: '甜椒', wavg: 58.3, vol: 550, dod: 8.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // 水果類 (50筆)
    { id: '46', tradeDate: today, cropCode: 'F001', cropName: '香蕉', wavg: 28.5, vol: 800, dod: 2.1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '47', tradeDate: today, cropCode: 'F002', cropName: '鳳梨', wavg: 22.3, vol: 600, dod: -1.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '48', tradeDate: today, cropCode: 'F003', cropName: '芒果', wavg: 45.6, vol: 600, dod: 5.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '49', tradeDate: today, cropCode: 'F004', cropName: '木瓜', wavg: 18.7, vol: 550, dod: 1.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '50', tradeDate: today, cropCode: 'F005', cropName: '西瓜', wavg: 15.2, vol: 500, dod: -3.4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '51', tradeDate: today, cropCode: 'F006', cropName: '哈密瓜', wavg: 38.9, vol: 500, dod: 4.6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '52', tradeDate: today, cropCode: 'F007', cropName: '香瓜', wavg: 32.1, vol: 550, dod: 2.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '53', tradeDate: today, cropCode: 'F008', cropName: '葡萄', wavg: 68.5, vol: 500, dod: 7.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '54', tradeDate: today, cropCode: 'F009', cropName: '蘋果', wavg: 45.3, vol: 600, dod: 1.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '55', tradeDate: today, cropCode: 'F010', cropName: '梨子', wavg: 38.7, vol: 580, dod: -2.1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '56', tradeDate: today, cropCode: 'F011', cropName: '橘子', wavg: 25.4, vol: 550, dod: 3.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '57', tradeDate: today, cropCode: 'F012', cropName: '柳丁', wavg: 22.8, vol: 520, dod: -0.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '58', tradeDate: today, cropCode: 'F013', cropName: '檸檬', wavg: 35.6, vol: 500, dod: 4.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '59', tradeDate: today, cropCode: 'F014', cropName: '草莓', wavg: 85.2, vol: 500, dod: 9.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '60', tradeDate: today, cropCode: 'F015', cropName: '蓮霧', wavg: 42.8, vol: 550, dod: 6.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '61', tradeDate: today, cropCode: 'F016', cropName: '芭樂', wavg: 32.5, vol: 500, dod: 2.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '62', tradeDate: today, cropCode: 'F017', cropName: '荔枝', wavg: 48.9, vol: 580, dod: 5.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '63', tradeDate: today, cropCode: 'F018', cropName: '龍眼', wavg: 42.3, vol: 560, dod: 3.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '64', tradeDate: today, cropCode: 'F019', cropName: '奇異果', wavg: 65.8, vol: 500, dod: 4.1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '65', tradeDate: today, cropCode: 'F020', cropName: '火龍果', wavg: 38.6, vol: 550, dod: 1.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '66', tradeDate: today, cropCode: 'F021', cropName: '釋迦', wavg: 52.4, vol: 520, dod: 6.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '67', tradeDate: today, cropCode: 'F022', cropName: '百香果', wavg: 28.7, vol: 580, dod: 2.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '68', tradeDate: today, cropCode: 'F023', cropName: '楊桃', wavg: 35.2, vol: 550, dod: 3.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '69', tradeDate: today, cropCode: 'F024', cropName: '枇杷', wavg: 58.9, vol: 500, dod: 7.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '70', tradeDate: today, cropCode: 'F025', cropName: '李子', wavg: 32.1, vol: 500, dod: 1.6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '71', tradeDate: today, cropCode: 'F026', cropName: '桃子', wavg: 45.8, vol: 580, dod: 4.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '72', tradeDate: today, cropCode: 'F027', cropName: '櫻桃', wavg: 125.6, vol: 500, dod: 8.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '73', tradeDate: today, cropCode: 'F028', cropName: '藍莓', wavg: 95.3, vol: 500, dod: 6.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '74', tradeDate: today, cropCode: 'F029', cropName: '覆盆子', wavg: 88.7, vol: 500, dod: 5.4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '75', tradeDate: today, cropCode: 'F030', cropName: '黑莓', wavg: 78.2, vol: 500, dod: 4.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '76', tradeDate: today, cropCode: 'F031', cropName: '無花果', wavg: 68.5, vol: 500, dod: 3.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '77', tradeDate: today, cropCode: 'F032', cropName: '石榴', wavg: 55.8, vol: 500, dod: 2.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '78', tradeDate: today, cropCode: 'F033', cropName: '柿子', wavg: 42.3, vol: 500, dod: 1.4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '79', tradeDate: today, cropCode: 'F034', cropName: '柚子', wavg: 38.9, vol: 500, dod: 0.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '80', tradeDate: today, cropCode: 'F035', cropName: '文旦', wavg: 35.6, vol: 500, dod: 1.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '81', tradeDate: today, cropCode: 'F036', cropName: '茂谷柑', wavg: 32.8, vol: 500, dod: 0.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '82', tradeDate: today, cropCode: 'F037', cropName: '椪柑', wavg: 28.4, vol: 500, dod: -0.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '83', tradeDate: today, cropCode: 'F038', cropName: '桶柑', wavg: 31.7, vol: 500, dod: 0.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '84', tradeDate: today, cropCode: 'F039', cropName: '金桔', wavg: 45.2, vol: 500, dod: 2.1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '85', tradeDate: today, cropCode: 'F040', cropName: '佛手柑', wavg: 52.6, vol: 500, dod: 3.4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '86', tradeDate: today, cropCode: 'F041', cropName: '葡萄柚', wavg: 28.9, vol: 500, dod: 1.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '87', tradeDate: today, cropCode: 'F042', cropName: '檸檬', wavg: 35.6, vol: 500, dod: 4.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '88', tradeDate: today, cropCode: 'F043', cropName: '萊姆', wavg: 38.2, vol: 500, dod: 2.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '89', tradeDate: today, cropCode: 'F044', cropName: '金棗', wavg: 42.5, vol: 500, dod: 3.6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '90', tradeDate: today, cropCode: 'F045', cropName: '酪梨', wavg: 45.8, vol: 500, dod: 2.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '91', tradeDate: today, cropCode: 'F046', cropName: '奇異果', wavg: 38.5, vol: 500, dod: 1.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '92', tradeDate: today, cropCode: 'F047', cropName: '水蜜桃', wavg: 52.3, vol: 500, dod: 3.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '93', tradeDate: today, cropCode: 'F048', cropName: '杏桃', wavg: 48.7, vol: 500, dod: 2.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '94', tradeDate: today, cropCode: 'F049', cropName: '西洋梨', wavg: 42.1, vol: 500, dod: 1.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '95', tradeDate: today, cropCode: 'F050', cropName: '水梨', wavg: 35.8, vol: 500, dod: 0.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  console.log(`[DB] 生成 ${mockData.length} 筆模擬日報表資料`);
  return mockData;
}
