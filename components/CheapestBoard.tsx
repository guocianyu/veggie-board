'use client';

import React, { useMemo, useState } from 'react';
import type { PriceItem } from '@/types';
import { getGroup } from '@/lib/category';
import { estimateRetailPrice } from '@/lib/retail';
import { usePriceMode } from '@/lib/price-mode';
import { Card, CardHeader, CardContent } from '@/components/ds/Card';
import { ListRow } from '@/components/ds/ListRow';
import { CodeBadge } from '@/components/ds/CodeBadge';

const TOP_CHEAP = 50;
const PAGE_SIZE = 10;
const MIN_VOL = 500;

export default function CheapestBoard({ items }: { items: PriceItem[] }) {
  const { mode } = usePriceMode();
  const [pageVeg, setPageVeg] = useState(1);
  const [pageFruit, setPageFruit] = useState(1);

  // 價格計算函數
  const priceOf = (item: PriceItem): number => {
    return mode === 'wholesale'
      ? item.wavg
      : estimateRetailPrice({ cropCode: item.cropCode, cropName: item.cropName }, item.wavg);
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
    return (code || '').padStart(5, '0');
  };

  // 計算最便宜清單
  const { vegAll, fruitAll, vegPages, fruitPages } = useMemo(() => {
    // 過濾：成交量 >= MIN_VOL 且價格 > 0
    const base = items.filter(item => 
      (item.vol ?? 0) >= MIN_VOL && priceOf(item) > 0
    );

    // 蔬菜：按價格排序，取前 50 筆
    const vegAll = base
      .filter(item => getGroup(item.cropName) === 'veg')
      .sort((a, b) => priceOf(a) - priceOf(b))
      .slice(0, TOP_CHEAP);

    // 水果：按價格排序，取前 50 筆
    const fruitAll = base
      .filter(item => getGroup(item.cropName) === 'fruit')
      .sort((a, b) => priceOf(a) - priceOf(b))
      .slice(0, TOP_CHEAP);

    // 計算總頁數
    const vegPages = Math.max(1, Math.ceil(vegAll.length / PAGE_SIZE));
    const fruitPages = Math.max(1, Math.ceil(fruitAll.length / PAGE_SIZE));

    return { vegAll, fruitAll, vegPages, fruitPages };
  }, [items, mode]); // 只依賴 items 和 mode，不依賴頁面狀態

  // 取得當前頁面的資料
  const slicePage = (arr: PriceItem[], page: number) => {
    return arr.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  };

  const vegPage = slicePage(vegAll, pageVeg);
  const fruitPage = slicePage(fruitAll, pageFruit);

  // 動態標題和說明
  const titleByMode = mode === 'wholesale' 
    ? '先比價再決定今晚要煮什麼' 
    : '先比價再決定今晚要煮什麼';
  
  const explanation = mode === 'wholesale'
    ? `只看今天全台批發市場賣得夠多的品項（總成交量 ≥ ${MIN_VOL} 公斤），用批發價從便宜排到貴。`
    : `只看今天全台批發市場賣得夠多的品項（總成交量 ≥ ${MIN_VOL} 公斤），把你大概會買到的價錢從便宜排到貴。`;

  // 清單項目元件
  const Row = ({ item }: { item: PriceItem }) => {
    const price = priceOf(item);
    
    return (
      <li className="py-4 px-6 border-b border-black/10">
        <div
          role="listitem"
          aria-disabled="true"
          className="flex items-center gap-4 rounded-xl cursor-default select-text focus-visible:outline-none"
          aria-label={`${item.cropName}，當前價格 ${formatCurrency(price)} 元/公斤`}
        >
          {/* 左：代碼徽章 */}
          <CodeBadge code={item.cropCode} />
          {/* 中：名稱 */}
          <div className="flex-1 min-w-0 font-medium text-ink truncate">
            {item.cropName}
          </div>
          {/* 右：價格與估算標籤 */}
          <div className="flex items-center gap-2">
            <div className="text-right tabular-nums text-ink font-medium">
              {formatCurrency(price)}
            </div>
            {mode === 'retail' && (
              <span className="inline-flex items-center font-medium bg-black/5 text-ink px-2 py-1 text-xs rounded-lg">
                估算
              </span>
            )}
          </div>
        </div>
      </li>
    );
  };

  // 分頁元件
  const Pager = ({ 
    pages, 
    page, 
    setPage, 
    label 
  }: { 
    pages: number; 
    page: number; 
    setPage: (n: number) => void; 
    label: string; 
  }) => (
    <nav className="mt-3 flex flex-wrap items-center gap-1" aria-label={`${label} 分頁`}>
      {Array.from({ length: pages }).map((_, i) => {
        const pageNum = i + 1;
        const isActive = pageNum === page;
        
        return (
          <button
            key={pageNum}
            className={`px-2 py-1 rounded-full text-xs font-normal transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-brandOrange ${
              isActive 
                ? 'bg-transparent border border-black text-ink' 
                : 'bg-black/3 text-muted hover:bg-black/8 hover:text-ink'
            }`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => setPage(pageNum)}
          >
            {pageNum}
          </button>
        );
      })}
    </nav>
  );

  return (
    <section className="mt-0" aria-label="最便宜蔬果清單">
      <header className="hero-wrap mb-6 md:mb-8">
        <h2 className="type-h1 stack-title text-center">最便宜菜單</h2>
        <p className="type-subtle stack-subtitle text-center">{titleByMode}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 最便宜蔬菜 */}
        <div>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-ink mb-1">
                最便宜蔬菜 TOP {Math.min(vegAll.length, TOP_CHEAP)}
              </h3>
              <p className="text-sm text-muted">
                {mode === 'wholesale' ? '以批發價排序' : '以我會買到的價格排序'}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {vegPage.length > 0 ? (
                <ul className="static-list divide-y divide-black/10">
                  {vegPage.map(item => (
                    <Row key={item.cropCode} item={item} />
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-muted text-sm">
                  目前沒有符合條件的蔬菜品項。
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-center mt-3">
            <Pager 
              pages={vegPages} 
              page={pageVeg} 
              setPage={setPageVeg} 
              label="最便宜蔬菜" 
            />
          </div>
        </div>

        {/* 最便宜水果 */}
        <div>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-ink mb-1">
                最便宜水果 TOP {Math.min(fruitAll.length, TOP_CHEAP)}
              </h3>
              <p className="text-sm text-muted">
                {mode === 'wholesale' ? '以批發價排序' : '以我會買到的價格排序'}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {fruitPage.length > 0 ? (
                <ul className="static-list divide-y divide-black/10">
                  {fruitPage.map(item => (
                    <Row key={item.cropCode} item={item} />
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-muted text-sm">
                  目前沒有符合條件的水果品項。
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-center mt-3">
            <Pager 
              pages={fruitPages} 
              page={pageFruit} 
              setPage={setPageFruit} 
              label="最便宜水果" 
            />
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-2xl text-sm text-muted text-center">
        <p className="mt-3 text-sm text-muted">{explanation}</p>
      </div>
    </section>
  );
}