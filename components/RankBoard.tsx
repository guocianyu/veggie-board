'use client';

import React, { useState, useMemo } from 'react';
import { PriceItem } from '@/types';
import { filterByGroup, sortByDirection } from '@/lib/category';
import { formatPrice, formatPercentage } from '@/lib/format';
import { Button } from '@/components/ds/Button';
import { Card } from '@/components/ds/Card';

const TOP_N = 50;

interface RankBoardProps {
  items: PriceItem[];
}

type GroupFilter = 'all' | 'veg' | 'fruit';
type DirectionMode = 'up' | 'down';

export default function RankBoard({ items }: RankBoardProps) {
  const [group, setGroup] = useState<GroupFilter>('all');
  const [mode, setMode] = useState<DirectionMode>('up');

  // 處理資料：過濾 → 排序 → 取前 N 筆
  const processedItems = useMemo(() => {
    const filtered = filterByGroup(items, group);
    const sorted = sortByDirection(filtered, mode);
    return sorted.slice(0, TOP_N);
  }, [items, group, mode]);

  // 格式化漲跌幅顯示
  const formatDod = (dod: number) => {
    const formatted = formatPercentage(Math.abs(dod));
    const sign = dod >= 0 ? '+' : '';
    return { text: `${sign}${formatted}`, isPositive: dod >= 0 };
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink mb-2">
          今日菜價動態
        </h1>
        <p className="text-muted">
          即時掌握蔬果價格變化趨勢
        </p>
      </div>

      {/* 篩選器 */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* 類別切換 */}
          <div>
            <h3 className="text-sm font-medium text-ink mb-3">類別</h3>
            <div 
              className="flex rounded-3xl bg-gray-100 p-1"
              role="tablist"
              aria-label="選擇作物類別"
            >
              {[
                { value: 'all', label: '全部' },
                { value: 'veg', label: '蔬菜' },
                { value: 'fruit', label: '水果' },
              ].map((option) => (
                <button
                  key={option.value}
                  role="tab"
                  aria-pressed={group === option.value}
                  aria-controls="rank-table"
                  className={`
                    flex-1 px-4 py-2 text-sm font-medium rounded-3xl transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-brandOrange focus:ring-offset-2
                    ${group === option.value
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-muted hover:text-ink'
                    }
                  `}
                  onClick={() => setGroup(option.value as GroupFilter)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 方向切換 */}
          <div>
            <h3 className="text-sm font-medium text-ink mb-3">排序</h3>
            <div 
              className="flex rounded-3xl bg-gray-100 p-1"
              role="tablist"
              aria-label="選擇排序方向"
            >
              {[
                { value: 'up', label: '漲幅' },
                { value: 'down', label: '跌幅' },
              ].map((option) => (
                <button
                  key={option.value}
                  role="tab"
                  aria-pressed={mode === option.value}
                  aria-controls="rank-table"
                  className={`
                    flex-1 px-4 py-2 text-sm font-medium rounded-3xl transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-brandOrange focus:ring-offset-2
                    ${mode === option.value
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-muted hover:text-ink'
                    }
                  `}
                  onClick={() => setMode(option.value as DirectionMode)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 排行表 */}
      <Card className="overflow-hidden">
        {processedItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table 
              className="w-full"
              id="rank-table"
              role="table"
              aria-label="菜價動態表"
            >
              <thead>
                <tr className="border-b border-gray-200">
                  <th 
                    scope="col" 
                    className="px-6 py-4 text-left text-sm font-medium text-muted w-16"
                  >
                    名次
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 text-left text-sm font-medium text-muted"
                  >
                    品項
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 text-right text-sm font-medium text-muted w-24"
                  >
                    漲跌幅
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 text-right text-sm font-medium text-muted w-32"
                  >
                    批發均價
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedItems.map((item, index) => {
                  const { text: dodText, isPositive } = formatDod(item.dod);
                  
                  return (
                    <tr 
                      key={item.cropCode}
                      className="cursor-default"
                      aria-label={`第${index + 1}名 ${item.cropName} 漲跌幅${dodText} 批發均價${formatPrice(item.wavg)}`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-muted">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-ink">
                          {item.cropName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <span className="text-sm">
                            {isPositive ? '↑' : '↓'}
                          </span>
                          <span 
                            className={`text-sm font-mono font-medium ${
                              isPositive ? 'text-brandGreen' : 'text-brandOrange'
                            }`}
                          >
                            {dodText}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-mono text-ink">
                          {formatPrice(item.wavg)}
                        </span>
                        <span className="text-xs text-muted ml-1">元/公斤</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">
              暫無資料
            </h3>
            <p className="text-muted">
              目前沒有符合條件的價格資料
            </p>
          </div>
        )}
      </Card>

      {/* 統計資訊 */}
      {processedItems.length > 0 && (
        <div className="text-center text-sm text-muted">
          顯示 {processedItems.length} 筆資料
          {group !== 'all' && `（${group === 'veg' ? '蔬菜' : '水果'}類）`}
        </div>
      )}
    </div>
  );
}
