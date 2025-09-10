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
      const { data, error } = await supabase.from('daily_aggregates').select('*').limit(10)
      if (!mounted) return
      if (error) setError(error.message)
      setRows(data ?? [])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <main className="p-6">Loading…</main>
  if (error) return <main className="p-6 text-red-600">Error: {error}</main>

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Supabase Rows (first 10)</h1>
      <pre className="text-sm overflow-auto rounded border p-4 bg-gray-50">
        {JSON.stringify(rows, null, 2)}
      </pre>
    </main>
  )
}