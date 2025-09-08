/**
 * 資料聚合與處理
 * 將 AMIS 原始資料聚合為日報表
 */

import { AmisRow } from './amis';
import { db } from './db';

export interface DailyAggregate {
  tradeDate: string;
  cropCode: string;
  cropName: string;
  wavg: number;  // 加權平均價
  vol: number;   // 總交易量
  dod: number;   // 日漲跌幅 (%)
  updatedAt: string;
}

/**
 * 將 AMIS 原始資料寫入資料庫
 */
export async function upsertMarketPrices(rows: AmisRow[]): Promise<void> {
  try {
    console.log(`[AGG] 開始寫入 ${rows.length} 筆市場價格資料`);
    
    // TODO: 實作 Supabase 寫入邏輯
    // 這裡先模擬寫入過程
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('[AGG] 市場價格資料寫入完成');
  } catch (error) {
    console.error('[AGG] 寫入市場價格失敗:', error);
    throw new Error(`市場價格寫入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 重建指定日期的日報表聚合資料
 */
export async function rebuildDailyAggregates(targetDates: string[]): Promise<{ updated: number }> {
  try {
    console.log(`[AGG] 開始重建日報表聚合: ${targetDates.join(', ')}`);
    
    let totalUpdated = 0;
    
    for (const tradeDate of targetDates) {
      // TODO: 實作真實的聚合邏輯
      // 1. 從 market_prices 表查詢該日期的所有資料
      // 2. 按 cropCode 分組計算 wavg, vol, dod
      // 3. 寫入 daily_aggregates 表
      
      // 模擬聚合過程
      const mockAggregates: DailyAggregate[] = [
        {
          tradeDate,
          cropCode: 'C001',
          cropName: '高麗菜',
          wavg: 25.5,
          vol: 1250,
          dod: 8.2,
          updatedAt: new Date().toISOString()
        },
        {
          tradeDate,
          cropCode: 'C002',
          cropName: '青江菜',
          wavg: 18.3,
          vol: 890,
          dod: -3.1,
          updatedAt: new Date().toISOString()
        },
        {
          tradeDate,
          cropCode: 'C003',
          cropName: '番茄',
          wavg: 45.2,
          vol: 650,
          dod: 12.5,
          updatedAt: new Date().toISOString()
        },
        {
          tradeDate,
          cropCode: 'C004',
          cropName: '香蕉',
          wavg: 32.8,
          vol: 2100,
          dod: -5.8,
          updatedAt: new Date().toISOString()
        },
        {
          tradeDate,
          cropCode: 'C005',
          cropName: '馬鈴薯',
          wavg: 28.6,
          vol: 980,
          dod: 2.1,
          updatedAt: new Date().toISOString()
        },
        {
          tradeDate,
          cropCode: 'C006',
          cropName: '洋蔥',
          wavg: 22.4,
          vol: 1150,
          dod: -1.3,
          updatedAt: new Date().toISOString()
        },
        {
          tradeDate,
          cropCode: 'C007',
          cropName: '蘋果',
          wavg: 65.8,
          vol: 420,
          dod: 15.2,
          updatedAt: new Date().toISOString()
        },
        {
          tradeDate,
          cropCode: 'C008',
          cropName: '小白菜',
          wavg: 16.7,
          vol: 750,
          dod: -7.4,
          updatedAt: new Date().toISOString()
        },
        {
          tradeDate,
          cropCode: 'C009',
          cropName: '玉米',
          wavg: 35.2,
          vol: 1380,
          dod: 4.6,
          updatedAt: new Date().toISOString()
        },
        {
          tradeDate,
          cropCode: 'C010',
          cropName: '菠菜',
          wavg: 28.9,
          vol: 520,
          dod: -2.8,
          updatedAt: new Date().toISOString()
        }
      ];
      
      // TODO: 寫入 daily_aggregates 表
      console.log(`[AGG] 模擬寫入 ${tradeDate} 的 ${mockAggregates.length} 筆聚合資料`);
      totalUpdated += mockAggregates.length;
    }
    
    console.log(`[AGG] 日報表聚合完成，共更新 ${totalUpdated} 筆資料`);
    return { updated: totalUpdated };
    
  } catch (error) {
    console.error('[AGG] 重建日報表聚合失敗:', error);
    throw new Error(`日報表聚合失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 計算加權平均價格
 */
export function calculateWeightedAverage(prices: number[], volumes: number[]): number {
  if (prices.length !== volumes.length || prices.length === 0) {
    return 0;
  }
  
  const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
  if (totalVolume === 0) return 0;
  
  const weightedSum = prices.reduce((sum, price, index) => {
    return sum + (price * volumes[index]);
  }, 0);
  
  return Math.round((weightedSum / totalVolume) * 10) / 10;
}

/**
 * 計算日漲跌幅
 */
export function calculateDayOverDay(currentPrice: number, previousPrice: number): number {
  if (previousPrice === 0) return 0;
  return Math.round(((currentPrice - previousPrice) / previousPrice) * 100 * 10) / 10;
}
