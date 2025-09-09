'use client';

import { useState, useEffect } from 'react';
import { HARD_CAP, RETRY_INTERVAL } from '@/lib/limits';

interface WaitroomProps {
  onlineCount: number;
  onRetry: () => void;
  onClose?: () => void;
}

export default function Waitroom({ onlineCount, onRetry, onClose }: WaitroomProps) {
  const [countdown, setCountdown] = useState(RETRY_INTERVAL / 1000);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      <div className="max-w-md mx-auto p-8 text-center">
        {/* 圖示 */}
        <div className="w-16 h-16 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* 標題 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          目前人數較多，請稍候
        </h1>

        {/* 人數資訊 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-lg text-gray-700 mb-2">
            目前上線人數 <span className="font-bold text-orange-600">{onlineCount}</span>
          </p>
          <p className="text-sm text-gray-500">
            目前人數 / 上限 {HARD_CAP}
          </p>
        </div>

        {/* 說明文字 */}
        <div className="text-gray-600 mb-6 space-y-2">
          <p>為了提供更好的使用體驗，我們限制了同時上線人數。</p>
          <p className="text-sm text-gray-500">
            同裝置多分頁也會占名額，建議關閉其他分頁。
          </p>
        </div>

        {/* 倒數計時 */}
        {countdown > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">自動重試倒數</p>
            <div className="text-3xl font-mono font-bold text-orange-600">
              {formatTime(countdown)}
            </div>
          </div>
        )}

        {/* 按鈕 */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRetrying ? '重試中...' : '立即重試'}
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              稍後再來
            </button>
          )}
        </div>

        {/* 小提示 */}
        <p className="text-xs text-gray-400 mt-6">
          30 秒後會自動重試，或點擊「立即重試」手動檢查
        </p>
      </div>
    </div>
  );
}
