import { Suspense } from 'react';
import { getLatest } from '@/lib/datasource';
import { formatYMDHM } from '@/lib/time';
import RankRows from '@/components/RankRows';

// 載入中元件
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="h-8 bg-gray-300 rounded-lg w-64 mx-auto mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-300 rounded w-48 mx-auto animate-pulse"></div>
      </div>
      
      <div className="flex justify-center">
        <div className="flex rounded-3xl bg-gray-100 p-1">
          <div className="w-20 h-10 bg-gray-200 rounded-3xl animate-pulse"></div>
          <div className="w-20 h-10 bg-gray-200 rounded-3xl animate-pulse ml-2"></div>
          <div className="w-20 h-10 bg-gray-200 rounded-3xl animate-pulse ml-2"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
          <div className="flex space-x-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-48 h-24 bg-gray-300 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
          <div className="flex space-x-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-48 h-24 bg-gray-300 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 主要首頁元件
export default async function HomePage() {
  const data = await getLatest();
  const items = data.items;
  
  // 時間標籤
  const updatedLabel = formatYMDHM(data?.updatedAt);

  return (
    <div className="min-h-screen bg-bg">
      <div className="container mx-auto px-6 py-8">
        {/* 右上角資料更新時間 */}
        <div className="relative">
          <div className="absolute right-0 top-0 pointer-events-none">
            <div className="corner-updated-wrap" aria-live="polite">
              <span className="corner-updated-pill text-xs text-muted" title={`台北時間 ${updatedLabel}`}>
                <i className="dot-live" aria-hidden="true"></i>
                最近更新：{updatedLabel} (每日更新自動一次)
              </span>
            </div>
          </div>
        </div>
        {/* 頁面標題與副標 */}
        <header className="hero-wrap mb-6 md:mb-8 mt-8 md:mt-12">
          <h1 className="type-h1 stack-title" style={{ marginTop: '8px' }}>今日漲跌排行</h1>
          <p className="type-subtle stack-subtitle">
            每天自動彙整台灣蔬果行情，像股票一樣看漲跌趨勢
          </p>
        </header>

        <Suspense fallback={<LoadingSkeleton />}>
          <RankRows items={items} />
        </Suspense>
      </div>
    </div>
  );
}