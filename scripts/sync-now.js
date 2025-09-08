/**
 * 手動觸發每日同步：POST /api/jobs/daily-ingest
 * 用法：
 *  - 本地：npm run sync:now
 *  - 線上：BASE_URL=https://你的網域 npm run sync:now
 */
const BASE_URL = process.env.BASE_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || 'http://localhost:3000';
const SECRET   = process.env.CRON_SECRET;

if (!SECRET) {
  console.error('❌ 缺少 CRON_SECRET 環境變數');
  process.exit(1);
}

(async () => {
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/jobs/daily-ingest`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SECRET}` }
    });
    const json = await res.json().catch(()=> ({}));
    const took = Date.now() - t0;

    if (!res.ok || json.ok === false) {
      console.error('❌ 同步失敗', { status: res.status, json });
      process.exit(2);
    }
    console.log('✅ 同步成功');
    console.table({
      BASE_URL,
      dates: Array.isArray(json.dates) ? json.dates.join(',') : 'n/a',
      inserted: json.inserted ?? 'n/a',
      updated: json.updated ?? json.aggregated ?? 'n/a',
      ranAt: json.ranAt ?? new Date().toISOString(),
      tookMs: took
    });
    process.exit(0);
  } catch (e) {
    console.error('❌ 請求錯誤', e);
    process.exit(3);
  }
})();
