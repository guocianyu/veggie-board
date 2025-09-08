import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getHistory } from '@/lib/datasource';
import { estimateRetailPrice, getCategory } from '@/lib/retail';
import { formatPrice, formatPercentage } from '@/lib/format';
import { Card, CardHeader, CardContent } from '@/components/ds/Card';
import { Badge } from '@/components/ds/Badge';
import PriceDetailChart from '@/components/PriceDetailChart';
import RetailToggle from '@/components/RetailToggle';

interface PageProps {
  params: {
    crop: string;
  };
}

// 載入中元件
function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 標題區域 */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
        
        {/* 圖表區域 */}
        <Card>
          <CardHeader title="價格趨勢圖" />
          <CardContent>
            <div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 空狀態元件
function EmptyState({ cropCode }: { cropCode: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          暫無資料
        </h2>
        <p className="text-gray-600 mb-6">
          找不到作物代碼 <code className="bg-gray-100 px-2 py-1 rounded">{cropCode}</code> 的歷史資料。
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            可能的原因：
          </p>
          <ul className="text-sm text-gray-500 text-left max-w-md mx-auto space-y-1">
            <li>• 作物代碼不存在</li>
            <li>• 資料尚未載入</li>
            <li>• 目前使用資料庫模式但尚未實作</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 主要詳頁元件
export default async function CropDetailPage({ params }: PageProps) {
  const { crop: cropCode } = params;
  
  // 取得歷史資料
  const historyData = await getHistory(cropCode);
  
  if (!historyData) {
    return <EmptyState cropCode={cropCode} />;
  }
  
  const { cropName, points } = historyData;
  const latestPoint = points[points.length - 1];
  const category = getCategory(cropName);
  const retailPrice = estimateRetailPrice({ cropCode, cropName }, latestPoint.avg);
  
  // 計算統計資料
  const avgPrice = points.reduce((sum, point) => sum + point.avg, 0) / points.length;
  const maxPrice = Math.max(...points.map(point => point.high));
  const minPrice = Math.min(...points.map(point => point.low));
  const priceChange = latestPoint.avg - (points[points.length - 2]?.avg || latestPoint.avg);
  const priceChangePercent = (priceChange / (points[points.length - 2]?.avg || latestPoint.avg)) * 100;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* 頁面標題 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {cropName}
              </h1>
              <div className="flex items-center space-x-4">
                <Badge tone={category === 'leafy' ? 'green' : category === 'fruit' ? 'orange' : 'neutral'}>
                  {category === 'leafy' ? '葉菜類' : category === 'fruit' ? '水果類' : category === 'root' ? '根莖類' : '其他'}
                </Badge>
                <span className="text-sm text-gray-500">
                  作物代碼：{cropCode}
                </span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col md:items-end space-y-2">
              <div className="text-right">
                <div className="text-sm text-gray-600">最新批發均價</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(latestPoint.avg)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">零售估算價</div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-primary-600">
                    {formatPrice(retailPrice)}
                  </span>
                  <Badge tone="neutral" size="sm">
                    估算
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(avgPrice)}
                  </div>
                  <div className="text-sm text-gray-600">平均價格</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatPrice(maxPrice)}
                  </div>
                  <div className="text-sm text-gray-600">最高價格</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(minPrice)}
                  </div>
                  <div className="text-sm text-gray-600">最低價格</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    priceChange >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {priceChange >= 0 ? '+' : ''}{formatPercentage(priceChangePercent)}
                  </div>
                  <div className="text-sm text-gray-600">日變化</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 價格趨勢圖 */}
          <Suspense fallback={<LoadingSkeleton />}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-ink">價格趨勢圖</h2>
                  <RetailToggle />
                </div>
              </CardHeader>
              <CardContent>
                <PriceDetailChart 
                  data={points}
                  cropName={cropName}
                  showRetailEstimate={true}
                />
              </CardContent>
            </Card>
          </Suspense>
          
          {/* 資料說明 */}
          <Card>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">資料說明</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">價格資訊</h4>
                    <ul className="space-y-1">
                      <li>• <strong>最高價</strong>：當日最高成交價格</li>
                      <li>• <strong>最低價</strong>：當日最低成交價格</li>
                      <li>• <strong>平均價</strong>：當日加權平均價格</li>
                      <li>• <strong>中位價</strong>：當日價格中位數</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">零售估算</h4>
                    <ul className="space-y-1">
                      <li>• 基於批發價格 × 類別係數計算</li>
                      <li>• 葉菜類係數：1.5</li>
                      <li>• 果菜類係數：1.7</li>
                      <li>• 根莖類係數：1.3</li>
                      <li>• 其他類係數：1.4</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>免責聲明：</strong>零售估算價格僅供參考，實際零售價格可能因地區、店家、品質等因素而有所差異。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
