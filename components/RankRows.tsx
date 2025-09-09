'use client';

import React, { useState, useMemo } from 'react';
import { PriceItem } from '@/types';
import { filterByGroup, getGroup } from '@/lib/category';
import { formatPrice, formatPercentage } from '@/lib/format';
import { estimateRetailPrice } from '@/lib/retail';
import { usePriceMode } from '@/lib/price-mode';
import { Segmented } from '@/components/ds/Segmented';
import { Card, CardHeader, CardContent } from '@/components/ds/Card';
import { ListRow } from '@/components/ds/ListRow';
import { CodeBadge } from '@/components/ds/CodeBadge';
import { PillDelta } from '@/components/ds/PillDelta';
import CheapestBoard from '@/components/CheapestBoard';

const TOP_N = 10;

interface RankRowsProps {
  items: PriceItem[];
  defaultGroup?: 'all' | 'veg' | 'fruit';
  topN?: number;
}

type GroupFilter = 'all' | 'veg' | 'fruit';

export default function RankRows({
  items,
  defaultGroup = 'all',
  topN = TOP_N
}: RankRowsProps) {
  const [group, setGroup] = useState<GroupFilter>(defaultGroup);
  const { mode: priceMode } = usePriceMode();

  // Helper functions
  const priceOf = (item: PriceItem): number => {
    return priceMode === 'wholesale'
      ? item.wavg
      : estimateRetailPrice({ cropCode: item.cropCode, cropName: item.cropName }, item.wavg);
  };

  const deltaAbs = (item: PriceItem): number => {
    return Math.abs(priceOf(item) * item.dod / 100);
  };

  // Data processing: filter -> separate gainers/losers
  const { gainers, losers } = useMemo(() => {
    const filtered = filterByGroup(items, group);

    const sortedGainers = filtered
      .filter((item) => item.dod > 0)
      .sort((a, b) => b.dod - a.dod)
      .slice(0, topN);

    const sortedLosers = filtered
      .filter((item) => item.dod < 0)
      .sort((a, b) => a.dod - b.dod)
      .slice(0, topN);

    return { gainers: sortedGainers, losers: sortedLosers };
  }, [items, group, topN]);

  const RankItem = ({ item, isGainer }: { item: PriceItem; isGainer: boolean }) => {
    const currentPrice = priceOf(item);
    const delta = deltaAbs(item);

    return (
      <li className="py-4 px-6 border-b border-black/10">
        <div
          role="listitem"
          aria-disabled="true"
          className="flex items-center gap-4 rounded-xl cursor-default select-text focus-visible:outline-none"
          aria-label={`${item.cropName} ${isGainer ? '上漲' : '下跌'} ${formatPercentage(Math.abs(item.dod))}%，均價 ${formatPrice(currentPrice)} 元/公斤`}
        >
          {/* 左：代碼徽章 */}
          <CodeBadge code={item.cropCode} />
          {/* 中：名稱 */}
          <div className="flex-1 min-w-0 font-medium text-ink truncate">
            {item.cropName}
          </div>
          {/* 右：價格與漲跌膠囊 */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-ink font-medium">
                {formatPrice(currentPrice)}
              </div>
              <div className="text-xs text-muted">
                {isGainer ? '+' : '-'}{formatPrice(delta)}
              </div>
            </div>
            <PillDelta value={item.dod} />
          </div>
        </div>
      </li>
    );
  };

  const hasData = items.length > 0;

  return (
    <div className="space-y-8">
      {/* 類別篩選器 */}
      <div className="flex justify-center">
        <Segmented
          options={[
            { value: 'all', label: '全部' },
            { value: 'veg', label: '蔬菜' },
            { value: 'fruit', label: '水果' },
          ]}
          value={group}
          onChange={(value) => setGroup(value as GroupFilter)}
        />
      </div>

      {!hasData ? (
        <div className="text-center py-12 text-muted">
          目前沒有資料可供顯示。請稍後再試。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ marginBottom: '76px', marginTop: '32px' }}>
          {/* 左欄：漲幅排行 */}
          <section aria-labelledby="gainers-heading">
            <Card>
              <CardHeader>
                <h2 id="gainers-heading" className="text-xl font-bold text-ink mb-1">
                  今日漲幅 TOP {topN}
                </h2>
                <p className="text-sm text-muted">
                  以漲幅百分比排序
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {gainers.length > 0 ? (
                  <ul className="static-list divide-y divide-black/10">
                    {gainers.map((item) => (
                      <RankItem key={item.cropCode} item={item} isGainer={true} />
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-muted text-sm">
                    目前沒有漲幅資料可供顯示。
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 右欄：跌幅排行 */}
          <section aria-labelledby="losers-heading">
            <Card>
              <CardHeader>
                <h2 id="losers-heading" className="text-xl font-bold text-ink mb-1">
                  今日跌幅 TOP {topN}
                </h2>
                <p className="text-sm text-muted">
                  以跌幅百分比排序
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {losers.length > 0 ? (
                  <ul className="static-list divide-y divide-black/10">
                    {losers.map((item) => (
                      <RankItem key={item.cropCode} item={item} isGainer={false} />
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-muted text-sm">
                    目前沒有跌幅資料可供顯示。
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}

      {/* 最便宜菜單 */}
      <CheapestBoard items={items} />
    </div>
  );
}