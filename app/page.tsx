'use client'

import { PriceItem } from '@/types'
import { HOME_UI_VERSION } from '@/config/ui'
import HomeLegacy from '@/components/HomeLegacy'
import { mockData } from '@/lib/mockData'
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

  // 一律使用 legacy UI
  const ver = HOME_UI_VERSION
  return (
    <>
      {/* 錯誤提示條 */}
      {error && (
        <div className="sticky top-0 z-50 bg-yellow-100 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="text-yellow-600 text-lg">⚠️</div>
              <p className="text-sm font-medium text-yellow-800">
                載入資料失敗，目前顯示模擬資料 (錯誤原因: {error})
              </p>
              <button
                onClick={() => setError(null)}
                className="text-yellow-600 hover:text-yellow-800 text-lg font-bold ml-4"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      
      {ver === 'legacy' ? <HomeLegacy items={data} /> : <HomeLegacy items={data} />}
    </>
  )
}