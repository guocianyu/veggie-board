import { LatestPayload, HistorySeries, PriceItem } from '@/types';
import { isMockMode } from './env';
import { headers } from 'next/headers';

/**
 * 解析基礎 URL（伺服端）
 */
function resolveBaseUrl() {
  // 在 Vercel 環境中優先使用環境變數
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.BASE_URL) return process.env.BASE_URL
  
  // 嘗試使用 headers（可能在某些環境中不可用）
  try {
    const h = headers()
    const proto = h.get('x-forwarded-proto') || 'https'
    const host  = h.get('x-forwarded-host') || h.get('host')
    if (host) return `${proto}://${host}`
  } catch (error) {
    // headers() 不可用時忽略錯誤
    console.log('[Datasource] headers() 不可用，使用環境變數');
  }
  
  return 'http://localhost:3000'
}

/**
 * 取得最新價格資料
 * @returns Promise<LatestPayload>
 */
export async function getLatest(): Promise<LatestPayload> {
  if (isMockMode) {
    try {
      // 讀取 mock 資料
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/mock/latest.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 驗證資料格式
      if (!data.updatedAt || !data.tradeDate || !Array.isArray(data.items)) {
        throw new Error('Mock 資料格式不正確');
      }
      
      return data as LatestPayload;
    } catch (error) {
      console.error('讀取 mock 資料失敗:', error);
      // 回傳空資料作為 fallback
      return {
        updatedAt: new Date().toISOString(),
        tradeDate: new Date().toISOString().split('T')[0],
        scope: 'TW',
        items: []
      };
    }
  } else {
    // 資料庫模式：從 API 取得最新資料
    try {
      const base = resolveBaseUrl()
      const response = await fetch(`${base}/api/data/latest`, { 
        cache: 'no-store' // 暫時關閉快取，便於驗證
      });
      
      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 驗證資料格式
      if (!data.updatedAt || !data.tradeDate || !Array.isArray(data.items)) {
        throw new Error('API 資料格式不正確');
      }
      
      return data as LatestPayload;
    } catch (error) {
      console.error('從 API 取得資料失敗:', error);
      // 回傳空資料作為 fallback
      return {
        updatedAt: new Date().toISOString(),
        tradeDate: new Date().toISOString().split('T')[0],
        scope: 'TW',
        items: []
      };
    }
  }
}

/**
 * 取得特定作物的歷史價格資料
 * @param cropCode 作物代碼
 * @returns Promise<HistorySeries | null>
 */
export async function getHistory(cropCode: string): Promise<HistorySeries | null> {
  if (isMockMode) {
    try {
      // 讀取 mock 歷史資料
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/mock/history/${cropCode}.json`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // 找不到該作物的歷史資料
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 驗證資料格式
      if (!data.cropCode || !data.cropName || !Array.isArray(data.points)) {
        throw new Error('Mock 歷史資料格式不正確');
      }
      
      return data as HistorySeries;
    } catch (error) {
      console.error(`讀取作物 ${cropCode} 的歷史資料失敗:`, error);
      return null;
    }
  } else {
    // TODO: 實作資料庫查詢歷史資料
    console.log(`🔧 資料庫模式歷史資料查詢尚未實作，無法取得作物 ${cropCode} 的歷史資料`);
    return null;
  }
}

/**
 * 取得所有可用的作物代碼列表
 * @returns Promise<string[]>
 */
export async function getAvailableCrops(): Promise<string[]> {
  if (isMockMode) {
    try {
      const latest = await getLatest();
      return latest.items.map(item => item.cropCode);
    } catch (error) {
      console.error('取得可用作物列表失敗:', error);
      return [];
    }
  } else {
    // 資料庫模式：從 API 取得作物列表
    try {
      const latest = await getLatest();
      return latest.items.map(item => item.cropCode);
    } catch (error) {
      console.error('從 API 取得作物列表失敗:', error);
      return [];
    }
  }
}

/**
 * 搜尋作物（依名稱或代碼）
 * @param query 搜尋關鍵字
 * @returns Promise<PriceItem[]>
 */
export async function searchCrops(query: string): Promise<PriceItem[]> {
  if (!query.trim()) {
    return [];
  }
  
  try {
    const latest = await getLatest();
    const searchTerm = query.toLowerCase().trim();
    
    return latest.items.filter(item => 
      item.cropName.toLowerCase().includes(searchTerm) ||
      item.cropCode.toLowerCase().includes(searchTerm)
    );
  } catch (error) {
    console.error('搜尋作物失敗:', error);
    return [];
  }
}

/**
 * 取得資料來源狀態
 * @returns { source: string; isAvailable: boolean; lastUpdate?: string }
 */
export async function getDataSourceStatus() {
  if (isMockMode) {
    try {
      const latest = await getLatest();
      return {
        source: 'mock',
        isAvailable: true,
        lastUpdate: latest.updatedAt,
        itemCount: latest.items.length
      };
    } catch (error) {
      return {
        source: 'mock',
        isAvailable: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      };
    }
  } else {
    // 資料庫模式：檢查 API 可用性
    try {
      const latest = await getLatest();
      return {
        source: 'database',
        isAvailable: true,
        lastUpdate: latest.updatedAt,
        itemCount: latest.items.length
      };
    } catch (error) {
      return {
        source: 'database',
        isAvailable: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      };
    }
  }
}
