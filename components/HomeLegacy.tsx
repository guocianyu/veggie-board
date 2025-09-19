'use client';

import React, { useState, useMemo } from 'react';
import { PriceItem } from '@/types';
import { filterByGroup, sortByDirection } from '@/lib/category';
import { getCategory, estimateRetailPrice } from '@/lib/retail';
import { usePriceMode } from '@/lib/price-mode';
import { formatPrice, formatPercentage } from '@/lib/format';
import { Card } from '@/components/ds/Card';
import { CodeBadge } from '@/components/ds/CodeBadge';

interface HomeLegacyProps {
  items: PriceItem[];
}

type GroupFilter = 'all' | 'veg' | 'fruit';

export default function HomeLegacy({ items }: HomeLegacyProps) {
  const { mode } = usePriceMode();
  const [group, setGroup] = useState<GroupFilter>('all');
  const [vegPage, setVegPage] = useState(1);
  const [fruitPage, setFruitPage] = useState(1);

  // 價格計算函數
  const priceOf = (item: PriceItem): number => {
    return mode === 'wholesale'
      ? item.wavg
      : estimateRetailPrice({ cropCode: item.cropCode, cropName: item.cropName }, item.wavg);
  };

  // 處理漲跌幅資料
  const { gainers, losers } = useMemo(() => {
    // 先過濾掉花卉
    const nonFlowerItems = items.filter(item => getCategory(item.cropName) !== 'flower');
    const filtered = filterByGroup(nonFlowerItems, group);
    
    // 漲幅榜：按漲跌幅降序排列，取前10
    const gainers = filtered
      .filter(item => item.dod > 0)
      .sort((a, b) => b.dod - a.dod)
      .slice(0, 10);
    
    // 跌幅榜：按漲跌幅升序排列，取前10
    const losers = filtered
      .filter(item => item.dod < 0)
      .sort((a, b) => a.dod - b.dod)
      .slice(0, 10);
    
    return { gainers, losers };
  }, [items, group]);

  // 處理最便宜清單
  const { vegCheapest, fruitCheapest } = useMemo(() => {
    const MIN_VOL = 500;
    
    // 過濾：成交量 >= MIN_VOL 且價格 > 0，且排除花卉
    const base = items.filter(item => 
      (item.vol ?? 0) >= MIN_VOL && 
      priceOf(item) > 0 &&
      getCategory(item.cropName) !== 'flower'
    );

    // 蔬菜：按價格排序，取前50筆
    const vegCheapest = base
      .filter(item => filterByGroup([item], 'veg').length > 0)
      .sort((a, b) => priceOf(a) - priceOf(b))
      .slice(0, 50);

    // 水果：按價格排序，取前50筆
    const fruitCheapest = base
      .filter(item => filterByGroup([item], 'fruit').length > 0)
      .sort((a, b) => priceOf(a) - priceOf(b))
      .slice(0, 50);

    return { vegCheapest, fruitCheapest };
  }, [items, mode]);

  // 格式化漲跌幅顯示
  const formatDod = (dod: number) => {
    const formatted = formatPercentage(Math.abs(dod), { showSign: false });
    const sign = dod >= 0 ? '+' : '-';
    return { text: `${sign}${formatted}`, isPositive: dod >= 0 };
  };

  // 格式化貨幣
  const formatCurrency = (value: number): string => {
    const formatted = new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      maximumFractionDigits: 0
    }).format(value);
    return `${formatted} 元/公斤`;
  };

  // 補齊代碼
  const padCode = (code: string): string => {
    return (code || '').padStart(6, '0');
  };

  return (
    <div>
      {/* 主要內容區域 */}
      <div className="py-8 px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 2xl:px-40">
        {/* 頁首區塊 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            今日菜價動態
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-4">
            一眼看懂今天哪些菜漲了、哪些菜跌了
          </p>
          
          {/* 更新時間 */}
          <div className="text-right text-sm text-gray-500">
            最近更新: {new Date().toLocaleDateString('zh-TW')} {new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })} (每日更新自動一次)
          </div>
        </div>

        {/* 類別篩選器 */}
        <div className="flex justify-center mb-8">
          <div className="flex rounded-full bg-gray-300 p-1">
            {[
              { value: 'all', label: '全部' },
              { value: 'veg', label: '蔬菜' },
              { value: 'fruit', label: '水果' },
            ].map((option) => (
              <button
                key={option.value}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  group === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setGroup(option.value as GroupFilter)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 今日漲跌雙欄 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {/* 左欄：今日漲幅 TOP 10 */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                今日漲幅 TOP 10
              </h3>
              <p className="text-sm text-gray-600">
                以漲幅百分比排序
              </p>
            </div>
            <div className="space-y-2">
              {gainers.map((item, index) => {
                const { text: dodText, isPositive } = formatDod(item.dod);
                return (
                  <div key={item.cropCode} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <CodeBadge code={item.cropCode} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.cropName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPrice(item.wavg)}元/公斤
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        {dodText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 右欄：今日跌幅 TOP 10 */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                今日跌幅 TOP 10
              </h3>
              <p className="text-sm text-gray-600">
                以跌幅百分比排序
              </p>
            </div>
            <div className="space-y-2">
              {losers.map((item, index) => {
                const { text: dodText, isPositive } = formatDod(item.dod);
                return (
                  <div key={item.cropCode} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <CodeBadge code={item.cropCode} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.cropName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPrice(item.wavg)}元/公斤
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        {dodText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 最便宜菜單 */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            最便宜菜單
          </h2>
          <p className="text-lg text-gray-600">
            先比價再決定今晚要煮什麼
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* 左欄：最便宜蔬菜 TOP 50 */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                最便宜蔬菜 TOP {Math.min(vegCheapest.length, 50)}
              </h3>
              <p className="text-sm text-gray-600">
                以我會買到的價格排序
              </p>
            </div>
            <div className="space-y-1">
              {vegCheapest.slice((vegPage - 1) * 10, vegPage * 10).map((item, index) => (
                <div key={item.cropCode} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-3">
                    <CodeBadge code={item.cropCode} />
                    <div className="text-sm font-medium text-gray-900">
                      {item.cropName}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(priceOf(item))}
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      估算
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* 分頁 */}
            <div className="flex justify-center mt-4 space-x-1">
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setVegPage(page)}
                  className={`w-6 h-6 rounded-full text-xs transition-colors ${
                    page === vegPage
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </Card>

          {/* 右欄：最便宜水果 TOP 50 */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                最便宜水果 TOP {Math.min(fruitCheapest.length, 50)}
              </h3>
              <p className="text-sm text-gray-600">
                以我會買到的價格排序
              </p>
            </div>
            <div className="space-y-1">
              {fruitCheapest.slice((fruitPage - 1) * 10, fruitPage * 10).map((item, index) => (
                <div key={item.cropCode} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-3">
                    <CodeBadge code={item.cropCode} />
                    <div className="text-sm font-medium text-gray-900">
                      {item.cropName}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(priceOf(item))}
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      估算
                    </span>
                  </div>
                </div>
              ))}
              {fruitCheapest.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  目前沒有符合條件的水果喔。
                </div>
              )}
            </div>
            {/* 分頁 */}
            <div className="flex justify-center mt-4 space-x-1">
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setFruitPage(page)}
                  className={`w-6 h-6 rounded-full text-xs transition-colors ${
                    page === fruitPage
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* 備註說明 */}
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <span className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-xs text-white">i</span>
            <span>
              只看今天全台批發市場賣得夠多的品項(總成交量 ≥ 500公斤), 把你大概會買到的價錢從便宜排到貴。
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
