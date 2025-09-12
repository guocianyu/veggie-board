// app/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Row = Record<string, any>

export default function Page() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // 檢查環境變數是否為佔位符
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!url || !key || url.includes('your_supabase_url_here') || key.includes('your_supabase_anon_key_here')) {
          // 使用模擬資料
          const mockData = [
            { id: '1', cropName: '高麗菜', wavg: 25.5, vol: 1500, dod: 5.2, tradeDate: '2024-01-15' },
            { id: '2', cropName: '小白菜', wavg: 18.3, vol: 800, dod: -2.1, tradeDate: '2024-01-15' },
            { id: '3', cropName: '菠菜', wavg: 32.7, vol: 600, dod: 8.5, tradeDate: '2024-01-15' },
            { id: '4', cropName: '青江菜', wavg: 22.1, vol: 900, dod: -1.3, tradeDate: '2024-01-15' },
            { id: '5', cropName: '空心菜', wavg: 28.9, vol: 700, dod: 3.7, tradeDate: '2024-01-15' }
          ]
          if (!mounted) return
          setRows(mockData)
          setLoading(false)
          return
        }
        
        const tableName = process.env.NEXT_PUBLIC_SUPABASE_TABLE || 'daily_aggregates'
        const { data, error } = await supabase.from(tableName).select('*').limit(10)
        if (!mounted) return
        if (error) setError(error.message)
        setRows(data ?? [])
        setLoading(false)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <main className="p-6">Loading…</main>
  if (error) return <main className="p-6 text-red-600">Error: {error}</main>

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Supabase 測試頁面</h1>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          {process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your_supabase_url_here') 
            ? '⚠️ 目前顯示模擬資料，請在 .env.local 中設定真實的 Supabase 憑證' 
            : '✅ 使用 Supabase 資料庫'}
        </p>
      </div>
      <pre className="text-sm overflow-auto rounded border p-4 bg-gray-50">
        {JSON.stringify(rows, null, 2)}
      </pre>
    </main>
  )
}