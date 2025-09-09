/**
 * 每日資料擷取 API
 * 支援 Vercel Cron（GET）與手動觸發（POST + Bearer）
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAmisByDateRange } from '@/lib/amis';
import { upsertMarketPrices, rebuildDailyAggregates } from '@/lib/agg';
import { logUpdate } from '@/lib/db';

export async function GET(req: Request) { return handle(req) }
export async function POST(req: Request) { return handle(req) }

async function handle(req: Request) {
  const startTime = Date.now();
  
  try {
    // 1. 驗證授權：Vercel Cron 或手動觸發
    const isCron = req.headers.get('x-vercel-cron') != null
    const auth = req.headers.get('authorization') || ''
    const hasSecret = auth === `Bearer ${process.env.CRON_SECRET}`
    
    if (!isCron && !hasSecret) {
      console.error('[CRON] 未授權的請求');
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    // 2. 計算目標日期（台灣今天 + 前2天）
    const now = new Date();
    const taiwanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    
    const targetDates = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(taiwanTime);
      date.setDate(date.getDate() - i);
      targetDates.push(date.toISOString().split('T')[0]);
    }
    
    console.log(`[CRON] 開始每日資料擷取，目標日期: ${targetDates.join(', ')}`);
    
    // 3. 抓取 AMIS 資料
    const amisData = await fetchAmisByDateRange(targetDates[2], targetDates[0]);
    console.log(`[CRON] 成功抓取 ${amisData.length} 筆 AMIS 資料`);
    
    // 4. 寫入市場價格資料
    await upsertMarketPrices(amisData);
    console.log('[CRON] 市場價格資料寫入完成');
    
    // 5. 重建日報表聚合
    const aggregateResult = await rebuildDailyAggregates(targetDates);
    console.log(`[CRON] 日報表聚合完成，更新 ${aggregateResult.updated} 筆資料`);
    
    // 6. 記錄成功日誌
    const tookMs = Date.now() - startTime;
    await logUpdate('daily-ingest', 'success', '每日資料擷取成功', {
      dates: targetDates,
      amisRows: amisData.length,
      aggregated: aggregateResult.updated,
      tookMs
    });
    
    // 7. 回傳結果
    const response = {
      ok: true,
      dates: targetDates,
      inserted: amisData.length,
      aggregated: aggregateResult.updated,
      ranAt: new Date().toISOString(),
      tookMs
    };
    
    console.log(`[CRON] 每日資料擷取完成:`, response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    const tookMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    
    console.error('[CRON] 每日資料擷取失敗:', error);
    
    // 記錄錯誤日誌
    await logUpdate('daily-ingest', 'error', `每日資料擷取失敗: ${errorMessage}`, {
      tookMs,
      error: errorMessage
    });
    
    return NextResponse.json(
      { 
        ok: false, 
        error: errorMessage,
        ranAt: new Date().toISOString(),
        tookMs 
      },
      { status: 500 }
    );
  }
}
