/**
 * 等候室狀態 API
 * 回傳真實的線上人數（與 Gatekeeper 同一個 Presence 頻道）
 */
import { NextResponse } from 'next/server';
import { WaitingRoomStatus } from '@/types';
import { getOnlineCount } from '../../_lib/online';
import { SOFT_CAP, HARD_CAP } from '@/lib/limits';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const active = await getOnlineCount();

    const status: WaitingRoomStatus = {
      active,
      max: HARD_CAP,
      // 低於軟上限即可進入（與 Gatekeeper 的放行條件一致）
      canEnter: active < SOFT_CAP,
    };

    return NextResponse.json(status, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('等候室狀態查詢錯誤:', error);

    return NextResponse.json(
      {
        success: false,
        error: '伺服器內部錯誤',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
