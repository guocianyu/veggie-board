import { NextResponse } from 'next/server';
import { WaitingRoomStatus } from '@/types';

export async function GET() {
  try {
    // 模擬等候室狀態
    // 在實際應用中，這裡會查詢真實的資料庫或快取
    const mockStatus: WaitingRoomStatus = {
      active: Math.floor(Math.random() * 30) + 80, // 80-110 之間隨機
      max: 100,
      canEnter: false,
    };

    // 如果人數未達上限，可以進入
    mockStatus.canEnter = mockStatus.active < mockStatus.max;

    // 如果人數超過上限，計算預估等候時間
    if (mockStatus.active >= mockStatus.max) {
      const overflow = mockStatus.active - mockStatus.max;
      mockStatus.estimatedWait = Math.ceil(overflow / 2); // 每分鐘 2 人離開
    }

    // 模擬偶爾的系統維護或錯誤
    if (Math.random() < 0.05) { // 5% 機率
      return NextResponse.json(
        { 
          success: false, 
          error: '系統維護中，請稍後再試',
          code: 'MAINTENANCE'
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mockStatus,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('等候室狀態查詢錯誤:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: '伺服器內部錯誤',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// 模擬 POST 請求（實際進入等候室）
export async function POST() {
  try {
    // 在實際應用中，這裡會處理用戶進入等候室的邏輯
    // 例如：檢查用戶資格、分配等候號碼、記錄進入時間等
    
    const mockResponse = {
      success: true,
      data: {
        sessionId: `session_${Date.now()}`,
        queuePosition: Math.floor(Math.random() * 20) + 1,
        estimatedWait: Math.floor(Math.random() * 30) + 5,
        enteredAt: new Date().toISOString(),
      },
      message: '已成功加入等候室'
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('加入等候室錯誤:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: '無法加入等候室，請稍後再試',
        code: 'JOIN_FAILED'
      },
      { status: 500 }
    );
  }
}
