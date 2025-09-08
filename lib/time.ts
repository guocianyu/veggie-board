export function updatedAtLabel(iso?: string, opts?: { compact?: boolean }) {
  const tz = 'Asia/Taipei'
  const now = new Date()
  const d = iso ? new Date(iso) : now

  // helpers
  const ymd = (dt: Date) =>
    dt.toLocaleString('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }) // YYYY-MM-DD
  const hm = (dt: Date) =>
    dt.toLocaleString('zh-TW', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })  // 24h HH:mm

  const today = ymd(now)
  const that  = ymd(d)

  // 差幾天（以台北日曆天）
  const dayMs = 24 * 60 * 60 * 1000
  const toMid = (dt: Date) => new Date(ymd(dt) + 'T00:00:00Z') // 粗略即可
  const behindDays = Math.round((toMid(now).getTime() - toMid(d).getTime()) / dayMs)

  const time = hm(d)

  if (opts?.compact) {
    // 只顯示幾點幾分
    return time
  }

  if (that === today) return `今天 ${time}`
  if (behindDays === 1) return `昨天 ${time}`

  // 其它日期：MM/DD HH:mm
  const md = d.toLocaleString('zh-TW', { timeZone: tz, month: 'numeric', day: 'numeric' })
  return `${md} ${time}`
}

export function formatYMDHM(iso?: string) {
  const tz = 'Asia/Taipei';
  const d = iso ? new Date(iso) : new Date();
  // 以 zh-TW + 24h 輸出：YYYY/MM/DD HH:mm
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}
