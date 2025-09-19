'use client';

import { useState, useEffect, useCallback } from 'react';
import db from '@/lib/db';
import { joinPresence, leavePresence, getOnlineCount } from '@/lib/presence';
import { SOFT_CAP, HARD_CAP, RETRY_INTERVAL, CHECK_INTERVAL } from '@/lib/limits';
import Waitroom from './Waitroom';

interface GatekeeperProps {
  children: React.ReactNode;
}

export default function Gatekeeper({ children }: GatekeeperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showWaitroom, setShowWaitroom] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // 使用統一的 Supabase 客戶端

  // 檢查人數並決定是否顯示等候頁
  const checkCapacity = useCallback(async () => {
    try {
      // 如果 Supabase 未初始化，直接放行
      if (!db) {
        console.log('[Gatekeeper] Supabase 未初始化，直接放行');
        setShowWaitroom(false);
        setOnlineCount(0);
        setIsLoading(false);
        return;
      }

      const count = await joinPresence(db);
      setOnlineCount(count);

      if (count >= HARD_CAP) {
        // 超過硬上限，不加入並顯示等候頁
        setShowWaitroom(true);
        console.log(`[Gatekeeper] 超過硬上限 (${count}/${HARD_CAP})，顯示等候頁`);
      } else if (count >= SOFT_CAP) {
        // 達到軟上限，加入但顯示等候頁
        setShowWaitroom(true);
        console.log(`[Gatekeeper] 達到軟上限 (${count}/${SOFT_CAP})，顯示等候頁`);
      } else {
        // 正常情況，放行
        setShowWaitroom(false);
        console.log(`[Gatekeeper] 人數正常 (${count}/${SOFT_CAP})，放行`);
      }
    } catch (error) {
      console.error('[Gatekeeper] 檢查人數失敗:', error);
      // 發生錯誤時放行，避免完全無法使用
      setShowWaitroom(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 重試邏輯
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await checkCapacity();
    } finally {
      setIsRetrying(false);
    }
  }, [checkCapacity]);

  // 定期檢查人數（當在等候頁時）
  useEffect(() => {
    if (!showWaitroom) return;

    const interval = setInterval(() => {
      const currentCount = getOnlineCount();
      setOnlineCount(currentCount);
      
      if (currentCount < SOFT_CAP) {
        setShowWaitroom(false);
        console.log(`[Gatekeeper] 人數降至軟上限以下 (${currentCount}/${SOFT_CAP})，放行`);
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [showWaitroom]);

  // 自動重試（30秒後）
  useEffect(() => {
    if (!showWaitroom) return;

    const timer = setTimeout(() => {
      handleRetry();
    }, RETRY_INTERVAL);

    return () => clearTimeout(timer);
  }, [showWaitroom, handleRetry]);

  // 組件掛載時檢查
  useEffect(() => {
    checkCapacity();

    // 組件卸載時離開頻道
    return () => {
      leavePresence();
    };
  }, [checkCapacity]);

  // 載入中
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">檢查中...</p>
        </div>
      </div>
    );
  }

  // 顯示等候頁
  if (showWaitroom) {
    return (
      <Waitroom
        onlineCount={onlineCount}
        onRetry={handleRetry}
      />
    );
  }

  // 正常顯示內容
  return <>{children}</>;
}
