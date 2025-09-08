'use client';

import { useState } from 'react';
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { HistoryPoint } from '@/types';
import { formatPrice, formatPercentage } from '@/lib/format';
import { estimateRetailPrice, getCategory } from '@/lib/retail';
import { useChartSettings } from '@/lib/ui-prefs';

interface PriceDetailChartProps {
  data: HistoryPoint[];
  cropName: string;
  showRetailEstimate?: boolean;
}

export default function PriceDetailChart({ 
  data, 
  cropName, 
  showRetailEstimate = false 
}: PriceDetailChartProps) {
  const { showRetailEstimate: globalShowRetail, toggleRetailEstimate } = useChartSettings();
  const [showVolume, setShowVolume] = useState(true);
  
  const shouldShowRetail = showRetailEstimate || globalShowRetail;
  const category = getCategory(cropName);
  
  // 準備圖表資料
  const chartData = data.map(point => ({
    ...point,
    retail: shouldShowRetail ? estimateRetailPrice({ cropCode: '', cropName }, point.avg) : undefined,
    dateFormatted: new Date(point.date).toLocaleDateString('zh-TW', { 
      month: 'short', 
      day: 'numeric' 
    }),
  }));
  
  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-3">
            {new Date(data.date).toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between w-32">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">最高價</span>
              </div>
              <span className="font-mono text-sm font-medium">
                {formatPrice(data.high)}
              </span>
            </div>
            
            <div className="flex items-center justify-between w-32">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">平均價</span>
              </div>
              <span className="font-mono text-sm font-medium">
                {formatPrice(data.avg)}
              </span>
            </div>
            
            <div className="flex items-center justify-between w-32">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">最低價</span>
              </div>
              <span className="font-mono text-sm font-medium">
                {formatPrice(data.low)}
              </span>
            </div>
            
            {shouldShowRetail && data.retail && (
              <div className="flex items-center justify-between w-32">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">零售估算</span>
                </div>
                <span className="font-mono text-sm font-medium">
                  {formatPrice(data.retail)}
                </span>
              </div>
            )}
            
            {showVolume && (
              <div className="flex items-center justify-between w-32 pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">成交量</span>
                </div>
                <span className="font-mono text-sm font-medium">
                  {data.vol.toLocaleString()}kg
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-4">
      {/* 控制面板 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {cropName} 價格趨勢
          </h3>
          <div className="text-sm text-gray-500">
            {data.length} 天資料
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* 零售估算切換 */}
          <button
            onClick={toggleRetailEstimate}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              shouldShowRetail
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${shouldShowRetail ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
              <span>零售估算</span>
            </div>
          </button>
          
          {/* 成交量切換 */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              showVolume
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${showVolume ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
              <span>成交量</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* 圖表 */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="dateFormatted"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="price"
              orientation="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* 價格區間帶 */}
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="high"
              fill="#1976D2"
              fillOpacity={0.1}
              stroke="none"
              name="價格區間"
            />
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="low"
              fill="#fff"
              stroke="none"
            />
            
            {/* 中位價線 */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="mid"
              stroke="#1976D2"
              strokeWidth={2}
              dot={false}
              name="中位價"
            />
            
            {/* 平均價線 */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="avg"
              stroke="#4CAF50"
              strokeWidth={3}
              dot={{ r: 2 }}
              name="平均價"
            />
            
            {/* 零售估算線 */}
            {shouldShowRetail && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="retail"
                stroke="#FF9800"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="零售估算"
              />
            )}
            
            {/* 成交量柱狀圖 */}
            {showVolume && (
              <Bar
                yAxisId="volume"
                dataKey="vol"
                fill="#9C27B0"
                fillOpacity={0.6}
                name="成交量"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* 圖例說明 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 價格區間：最高價與最低價之間的範圍</p>
        <p>• 中位價：當日價格中位數</p>
        <p>• 平均價：當日加權平均價格</p>
        {shouldShowRetail && (
          <p>• 零售估算：基於 {category} 類別係數計算的估算零售價格</p>
        )}
        {showVolume && (
          <p>• 成交量：當日交易總量（右側 Y 軸）</p>
        )}
      </div>
    </div>
  );
}
