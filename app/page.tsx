'use client'

import { PriceItem } from '@/types'
import { HOME_UI_VERSION } from '@/config/ui'
import HomeLegacy from '@/components/HomeLegacy'
import { useState, useEffect } from 'react'

export default function Page() {
  const [data, setData] = useState<PriceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/data/latest')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.error) {
          throw new Error(result.message || result.error)
        }
        
        setData(result.items || [])
        setError(null)
      } catch (err) {
        console.error('Failed to fetch live data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
        
        // Fallback to mock data if live data fails
        const mockData: PriceItem[] = [
          { id: '1', tradeDate: '2025-09-12', cropCode: 'C001', cropName: '高麗菜', wavg: 25.5, vol: 1500, dod: 5.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '2', tradeDate: '2025-09-12', cropCode: 'C002', cropName: '小白菜', wavg: 18.3, vol: 800, dod: -2.1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '3', tradeDate: '2025-09-12', cropCode: 'C003', cropName: '菠菜', wavg: 32.7, vol: 600, dod: 8.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '4', tradeDate: '2025-09-12', cropCode: 'C004', cropName: '青江菜', wavg: 22.1, vol: 900, dod: -1.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '5', tradeDate: '2025-09-12', cropCode: 'C005', cropName: '空心菜', wavg: 28.9, vol: 700, dod: 3.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '6', tradeDate: '2025-09-12', cropCode: 'C006', cropName: '香蕉', wavg: 34.0, vol: 1200, dod: -3.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '7', tradeDate: '2025-09-12', cropCode: 'C007', cropName: '蘋果', wavg: 45.8, vol: 800, dod: 2.1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '8', tradeDate: '2025-09-12', cropCode: 'C008', cropName: '番茄', wavg: 38.2, vol: 1000, dod: -1.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '9', tradeDate: '2025-09-12', cropCode: 'C009', cropName: '馬鈴薯', wavg: 28.5, vol: 900, dod: 4.3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '10', tradeDate: '2025-09-12', cropCode: 'C010', cropName: '洋蔥', wavg: 26.7, vol: 750, dod: -2.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
        setData(mockData)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入最新菜價資料中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">載入資料失敗</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">已載入備用資料</p>
        </div>
      </div>
    )
  }

  // 一律使用 legacy UI
  const ver = HOME_UI_VERSION
  if (ver === 'legacy') return <HomeLegacy items={data} />
  return <HomeLegacy items={data} /> // 強制走舊版；保底避免誤切到新 UI
}