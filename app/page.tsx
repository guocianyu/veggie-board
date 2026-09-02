'use client'

import { PriceItem } from '@/types'
import { HOME_UI_VERSION } from '@/config/ui'
import HomeLegacy from '@/components/HomeLegacy'
import { useState, useEffect, useCallback } from 'react'

export default function Page() {
  const [data, setData] = useState<PriceItem[]>([])
  const [coverage, setCoverage] = useState<'national' | 'north'>('north')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [tradeDate, setTradeDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [slowLoad, setSlowLoad] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLiveData = useCallback(async () => {
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
      setCoverage(result.coverage === 'national' ? 'national' : 'north')
      setUpdatedAt(result.updatedAt || null)
      setTradeDate(result.tradeDate || null)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch live data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLiveData()
  }, [fetchLiveData])

  // 載入超過 5 秒時顯示提示，讓使用者知道不是壞掉
  useEffect(() => {
    if (!loading) {
      setSlowLoad(false)
      return
    }
    const timer = setTimeout(() => setSlowLoad(true), 5000)
    return () => clearTimeout(timer)
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入最新菜價資料中...</p>
          {slowLoad && (
            <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
              正在向農業部取得最新資料，政府資料源較慢，最多可能需要一分鐘，請稍候
            </p>
          )}
        </div>
      </div>
    )
  }

  // 載入失敗時不顯示任何價格，避免使用者拿到錯誤的參考價
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">無法載入菜價資料</h1>
          <p className="text-sm text-gray-600 mb-6">
            目前無法取得最新菜價（{error}）。為了避免顯示錯誤的價格，暫時不顯示任何資料，請稍後再試。
          </p>
          <button
            onClick={fetchLiveData}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  // 一律使用 legacy UI
  const ver = HOME_UI_VERSION
  return ver === 'legacy' ? (
    <HomeLegacy items={data} coverage={coverage} updatedAt={updatedAt} tradeDate={tradeDate} />
  ) : (
    <HomeLegacy items={data} coverage={coverage} updatedAt={updatedAt} tradeDate={tradeDate} />
  )
}
