'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ds/Card';
import { Button } from '@/components/ds/Button';
import { Badge } from '@/components/ds/Badge';
import { WaitingRoomStatus } from '@/types';

export default function WaitPage() {
  const [status, setStatus] = useState<WaitingRoomStatus>({
    active: 0,
    max: 100,
    canEnter: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 輪詢 API
  const checkAvailability = async () => {
    try {
      const response = await fetch('/api/session/availability');
      if (!response.ok) {
        throw new Error('無法取得等候室狀態');
      }
      
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 初始載入和定期輪詢
  useEffect(() => {
    checkAvailability();
    
    const interval = setInterval(checkAvailability, 5000); // 每 5 秒輪詢一次
    
    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    if (status.canEnter) {
      // 這裡可以實作實際的進入邏輯
      window.location.href = '/';
    }
  };

  const getStatusMessage = () => {
    if (loading) return '正在檢查等候室狀態...';
    if (error) return `錯誤：${error}`;
    if (status.canEnter) return '可以進入！';
    return '目前人數已達上限，您正在等候...';
  };

  const getStatusColor = () => {
    if (loading) return 'warning';
    if (error) return 'error';
    if (status.canEnter) return 'active';
    return 'inactive';
  };

  const getEstimatedWait = () => {
    if (status.canEnter || status.active < status.max) return 0;
    
    // 簡單的等候時間估算（每分鐘 2 人離開）
    const overflow = status.active - status.max;
    return Math.ceil(overflow / 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink">等候室</h2>
              <Badge tone={getStatusColor() as any}>
                {status.canEnter ? '可進入' : '等候中'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              {/* 狀態圖示 */}
              <div className="w-20 h-20 mx-auto">
                {loading ? (
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="loading-spinner"></div>
                  </div>
                ) : status.canEnter ? (
                  <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-full h-full bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 狀態訊息 */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {getStatusMessage()}
                </h2>
                
                {!loading && !error && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>目前人數：{status.active} / {status.max}</p>
                    {status.active >= status.max && (
                      <p>等候人數：{status.active - status.max}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 進度條 */}
              {!loading && !error && (
                <div className="w-full">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>容量使用率</span>
                    <span>{Math.round((status.active / status.max) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        status.active >= status.max
                          ? 'bg-red-500'
                          : status.active >= status.max * 0.8
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((status.active / status.max) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* 等候時間估算 */}
              {!loading && !error && !status.canEnter && status.active >= status.max && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>預估等候時間：</strong>
                    {getEstimatedWait() > 0 ? `約 ${getEstimatedWait()} 分鐘` : '即將開放'}
                  </p>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="space-y-3">
                {status.canEnter ? (
                  <Button
                    onClick={handleEnter}
                    className="w-full"
                    size="lg"
                  >
                    進入菜價看板
                  </Button>
                ) : (
                  <Button
                    onClick={checkAvailability}
                    tone="ghost"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? '檢查中...' : '重新檢查'}
                  </Button>
                )}
                
                <Button
                  onClick={() => window.location.reload()}
                  tone="ghost"
                  className="w-full"
                >
                  重新整理頁面
                </Button>
              </div>

              {/* 說明文字 */}
              <div className="text-xs text-gray-500 space-y-2">
                <p>
                  <strong>重要提醒：</strong>
                </p>
                <ul className="text-left space-y-1">
                  <li>• 關閉此分頁不會占用名額</li>
                  <li>• 空位釋放將自動放行</li>
                  <li>• 系統會每 5 秒自動檢查一次</li>
                  <li>• 請保持頁面開啟以接收通知</li>
                </ul>
              </div>

              {/* 錯誤訊息 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>連線錯誤：</strong>
                    {error}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    請檢查網路連線或稍後再試
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
