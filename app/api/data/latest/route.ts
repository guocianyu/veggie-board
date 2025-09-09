/**
 * 最新資料 API
 * 提供前端頁面 SSR/CSR 使用的最新蔬果價格資料
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestDailyAggregates, getLatestUpdateTime } from '@/lib/db';
import { getOnlineCount } from '../../_lib/online';
import { HARD_CAP, API_BUFFER, RETRY_AFTER } from '@/lib/limits';

export const dynamic = 'force-dynamic' // Next 14

export async function GET(request: NextRequest) {
  try {
    // 檢查線上人數，實施 API 保護
    const onlineCount = await getOnlineCount();
    const apiLimit = HARD_CAP + API_BUFFER;
    
    if (onlineCount > apiLimit) {
      console.warn(`[API] 線上人數過多 (${onlineCount}/${apiLimit})，拒絕請求`);
      return NextResponse.json(
        { error: 'busy', message: '目前使用人數較多，請稍後再試' },
        { 
          status: 503,
          headers: {
            'Retry-After': RETRY_AFTER.toString(),
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    console.log('[API] 開始查詢最新資料');
    
    // 1. 取得最新的日報表資料
    const aggregates = await getLatestDailyAggregates();
    
    if (aggregates.length === 0) {
      console.warn('[API] 沒有找到日報表資料');
      return NextResponse.json(
        { error: 'No data available' },
        { status: 404 }
      );
    }
    
    // 2. 取得最新更新時間
    const latestUpdateTime = await getLatestUpdateTime();
    
    // 3. 轉換為前端需要的格式
    const tradeDate = aggregates[0].tradeDate;
    const items = aggregates.map(agg => ({
      cropCode: agg.cropCode,
      cropName: agg.cropName,
      wavg: agg.wavg,
      vol: agg.vol,
      dod: agg.dod
    }));
    
    const response = {
      updatedAt: latestUpdateTime || new Date().toISOString(),
      tradeDate,
      scope: 'TW',
      items,
      onlineCount // 回傳目前線上人數供前端參考
    };
    
    console.log(`[API] 成功回傳 ${items.length} 筆最新資料，交易日: ${tradeDate}，線上人數: ${onlineCount}`);
    
    // 4. 暫時關閉快取，便於驗證
    return NextResponse.json(response, { 
      headers: { 'Cache-Control': 'no-store' }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    console.error('[API] 查詢最新資料失敗:', error);
    
    return NextResponse.json(
      { error: `資料查詢失敗: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
