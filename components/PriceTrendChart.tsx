'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PriceItem } from '@/types';
import { formatPrice } from '@/lib/format';

interface PriceTrendChartProps {
  items: PriceItem[];
}

// 模擬 30 天資料（實際應用中應該從 API 取得）
function generateMockTrendData(items: PriceItem[]) {
  const data = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayData: any = {
      date: date.toISOString().split('T')[0],
    };
    
    // 為每個品項生成模擬趨勢資料
    items.forEach(item => {
      const basePrice = item.wavg;
      const variation = (Math.random() - 0.5) * 0.2; // ±10% 變化
      const seasonalFactor = Math.sin((i / 30) * Math.PI * 2) * 0.1; // 季節性因素
      const price = basePrice * (1 + variation + seasonalFactor);
      
      dayData[item.cropCode] = Math.max(0, price);
    });
    
    data.push(dayData);
  }
  
  return data;
}

export default function PriceTrendChart({ items }: PriceTrendChartProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>(['C001', 'C002']); // 預設顯示高麗菜和青江菜
  
  const trendData = useMemo(() => generateMockTrendData(items), [items]);
  
  const colors = [
    '#4CAF50', // 主色綠
    '#E53935', // 副色紅
    '#1976D2', // 副色藍
    '#FF9800', // 橙色
    '#9C27B0', // 紫色
  ];
  
  const handleItemToggle = (cropCode: string) => {
    setSelectedItems(prev => 
      prev.includes(cropCode)
        ? prev.filter(code => code !== cropCode)
        : [...prev, cropCode]
    );
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {new Date(label).toLocaleDateString('zh-TW')}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-600">
                {items.find(item => item.cropCode === entry.dataKey)?.cropName}:
              </span>
              <span className="font-mono font-medium">
                {formatPrice(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-4">
      {/* 品項選擇器 */}
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 5).map((item, index) => (
          <button
            key={item.cropCode}
            onClick={() => handleItemToggle(item.cropCode)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedItems.includes(item.cropCode)
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span>{item.cropName}</span>
            </div>
          </button>
        ))}
      </div>
      
      {/* 圖表 */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {selectedItems.map((cropCode, index) => {
              const item = items.find(i => i.cropCode === cropCode);
              if (!item) return null;
              
              return (
                <Line
                  key={cropCode}
                  type="monotone"
                  dataKey={cropCode}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name={item.cropName}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* 圖例說明 */}
      <div className="text-xs text-gray-500 text-center">
        <p>顯示最近 30 天的價格趨勢，點擊上方按鈕切換顯示品項</p>
      </div>
    </div>
  );
}
