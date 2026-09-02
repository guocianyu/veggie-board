# Codebase Concerns

**Analysis Date:** 2026-09-02

## Tech Debt

**Daily-Aggregation / Ingest pipeline is entirely stubbed:**
- Issue: `upsertMarketPrices()` and `rebuildDailyAggregates()` in `lib/agg.ts` contain `TODO` comments (`lib/agg.ts:26`, `lib/agg.ts:47`, `lib/agg.ts:146`) and never write to Supabase. `rebuildDailyAggregates()` returns the same 10 hardcoded crop rows regardless of the `targetDates` argument passed in.
- Files: `lib/agg.ts`
- Impact: The daily-ingest cron job (`app/api/jobs/daily-ingest/route.ts`, scheduled via `vercel.json` at `5 19 * * *`) fetches live AMIS data and then discards it — comment at `app/api/jobs/daily-ingest/route.ts:52` literally says "無需存儲到數據庫" (no need to store to DB). The cron run is pure overhead: it calls the government AMIS API and logs the result but produces no lasting effect.
- Fix approach: Implement real Supabase upserts in `lib/agg.ts` (or delete the cron job/ingest route entirely if the "fetch live on every request" architecture is intentional).

**`lib/db.ts` reads/writes columns that don't exist in the schema:**
- Issue: `logUpdate()` and `getLatestDailyAggregates()` in `lib/db.ts` use camelCase columns (`jobType`, `createdAt`, `tradeDate`, `cropCode`), but `supabase-schema.sql` and `setup-database.sql` define the tables with snake_case columns (`job_type`, `created_at`, `trade_date`, `crop_code`).
- Files: `lib/db.ts:63-189`, `supabase-schema.sql`, `setup-database.sql`
- Impact: Any real Supabase call from these functions will fail (PostgREST is case-sensitive) — errors are caught and swallowed (`console.error` only), so the failure is silent and returns `null`/`[]`/no-op instead of surfacing.
- Fix approach: Pick one naming convention and align the SQL schema, RLS policies, and TypeScript access code. Add a mapping layer if camelCase must be preserved in the app layer.

**`DATA_SOURCE=db` mode is declared but never implemented:**
- Issue: `lib/env.ts` defines `DATA_SOURCE` as `"mock" | "api" | "db"`, but `lib/datasource.ts` only branches on `isMockMode` — everything else (including `"db"`) falls through to the same "call AMIS directly" code path. `isApiMode` is exported but unused for branching.
- Files: `lib/env.ts:73-74`, `lib/datasource.ts:32-119`
- Impact: Misleading configuration surface; a developer setting `DATA_SOURCE=db` expecting Supabase-backed reads will silently get live-AMIS behavior instead.
- Fix approach: Either implement the `db` code path (reading from `daily_aggregates` via `lib/db.ts`) or remove `db` from the enum/docs until it exists.

**Two independent, uncoordinated "capacity gating" systems:**
- Issue: `components/Gatekeeper.tsx` + `lib/presence.ts` implement real-time gating using Supabase Presence and `SOFT_CAP`/`HARD_CAP` from `lib/limits.ts`. Separately, `app/wait/page.tsx` polls `/api/session/availability`, whose handler (`app/api/session/availability/route.ts`) returns entirely `Math.random()`-generated numbers with a fabricated 5% "maintenance" failure rate and has no relationship to the real presence count.
- Files: `components/Gatekeeper.tsx`, `lib/presence.ts`, `app/wait/page.tsx`, `app/api/session/availability/route.ts`
- Impact: Two different "who's online / can I enter" answers exist in the same app; the `/wait` page is disconnected from the actual gate that `Gatekeeper` enforces on `/`. A user could sit on `/wait` waiting for a random number to drop while the real gate (`Gatekeeper`) would have let them through immediately, or vice versa.
- Fix approach: Consolidate on one online-count source (presence-based) and have `/api/session/availability` read the real count via `getOnlineCount()`/presence rather than `Math.random()`.

**Duplicated / drifted online-count implementations:**
- Issue: `lib/presence.ts` (client-oriented, used by `Gatekeeper`) and `app/api/_lib/online.ts` (server-oriented, used by `/api/data/latest`) both implement Supabase Presence subscription plus near-identical "mock mode" fallback logic, with different random-number heuristics.
- Files: `lib/presence.ts`, `app/api/_lib/online.ts`
- Impact: Behavior differences between client and server counts; maintenance burden of keeping two implementations of the same concept in sync.
- Fix approach: Extract one shared presence-count utility usable from both server route handlers and client components.

**Dead/no-op UI version switch:**
- Issue: `app/page.tsx:81` has `{ver === 'legacy' ? <HomeLegacy items={data} /> : <HomeLegacy items={data} />}` — both branches render the same component, making `HOME_UI_VERSION` (`config/ui.ts`) a dead configuration flag.
- Files: `app/page.tsx:57-82`, `config/ui.ts`
- Impact: Confusing to future maintainers; implies an alternate "new" home UI exists when it does not.
- Fix approach: Remove the ternary and `HOME_UI_VERSION` flag, or actually implement the alternate branch.

**Deprecated Supabase client left in the codebase:**
- Issue: `lib/supabaseClient.ts` is explicitly commented as deprecated ("這個檔案已棄用") but still re-exports a client for backward compatibility.
- Files: `lib/supabaseClient.ts`
- Impact: Risk of new code importing the deprecated client and creating a second Supabase instance/session-storage key inconsistency.
- Fix approach: Grep for remaining imports of `lib/supabaseClient.ts` and migrate them to `lib/db.ts`, then delete the file.

**No automated test suite:**
- Issue: `package.json` has no test runner (no `jest`, `vitest`, `@testing-library/*`) and no `test` script. The only "test" files are ad hoc Node scripts in `scripts/test-*.js` (`test-final.js`, `test-limit.js`, `test-limit-precise.js`, `test-limit-simple.js`) that appear to be manual/one-off debugging scripts, not part of CI.
- Files: `package.json`, `scripts/test-*.js`, `.github/workflows/deploy.yml` (build-only, no test step)
- Impact: No regression safety net; the data-aggregation bugs and fake-data issues described in this document could easily have been caught by unit tests but were not.
- Fix approach: Add Vitest/Jest and cover `lib/agg.ts`, `lib/retail.ts`, `lib/category.ts`, and `lib/datasource.ts` aggregation logic first, since these directly affect price accuracy.

**Debug/test page shipped to production:**
- Issue: `app/test/page.tsx` is a client page that queries the `vegetables` table on mount and logs raw results to the browser console. It has no auth guard and is reachable at `/test` on the deployed site.
- Files: `app/test/page.tsx`
- Impact: Exposes internal debug tooling and table structure to any visitor; unnecessary attack surface.
- Fix approach: Delete the route or gate it behind `NODE_ENV === 'development'` / an env flag.

## Known Bugs

**Day-over-day price change (`dod`) is randomly generated, not calculated:**
- Symptoms: The percentage "up/down" indicator shown for every crop is computed with `Math.random()` instead of a real day-over-day comparison.
- Files: `lib/datasource.ts:260` (`aggregateAmisData`) and `lib/datasource.ts:348` (`aggregateDailyData`) — `const dod = Math.round((Math.random() - 0.5) * 20 * 10) / 10;`
- Trigger: Happens every time `DATA_SOURCE=api` mode calls `getLatest()` or `getHistory()` (i.e., whenever the app is not in mock mode — this is presumably the production configuration given the live-data goal).
- Impact: This is the single most severe correctness issue in the app. The product's stated purpose is to show real market price trends so users aren't overcharged; a random ±10% "trend" number is actively misleading rather than merely missing.
- Fix approach: Compute `dod` from the previous trading day's `wavg` for the same `cropCode` (requires either persisting daily aggregates — see "Daily-Aggregation pipeline is entirely stubbed" above — or fetching an extra day of AMIS data and comparing).

**History chart low/high values are fabricated, not from source data:**
- Symptoms: `HistoryPoint.low` / `HistoryPoint.high` are derived as `wavg * 0.8` and `wavg * 1.2` rather than actual daily min/max prices.
- Files: `lib/datasource.ts:198-200` (comment: "簡化計算" — simplified calculation)
- Trigger: Every call to `getHistory()` in non-mock mode (`components/PriceDetailChart.tsx`, `components/PriceTrendChart.tsx` consume this).
- Impact: Price range charts shown to users are synthetic, not reflective of real market variance.
- Fix approach: Compute true low/high from the raw per-market AMIS rows before aggregating, instead of a fixed ±20% band.

**Silent mock-data fallback with no persistent indicator:**
- Symptoms: When `/api/data/latest` fails for any reason, `app/page.tsx` swaps in `lib/mockData.ts` (hardcoded prices dated `2025-09-12`) and shows a dismissible yellow banner. Once dismissed, there is no ongoing UI signal that the displayed prices are fake/stale.
- Files: `app/page.tsx:32-38`, `lib/mockData.ts`
- Trigger: Any transient network failure, AMIS API outage, or 503 from the capacity gate.
- Impact: Users could act on stale, fixed mock prices (e.g., 高麗菜 at a hardcoded 25.5) believing them to be live, directly undermining the "prevent overcharging" purpose.
- Fix approach: Persist the error/fallback state (not dismissible, or re-shown on next poll) and/or visually badge all displayed data as "模擬資料" while in fallback mode.

**`getOnlineCount()` (server) opens a new Realtime channel per request and never closes it:**
- Symptoms: Every call to `/api/data/latest` invokes `getOnlineCount()` in `app/api/_lib/online.ts`, which (when Supabase is configured) calls `db.channel('presence:vb-online')`, `channel.subscribe()`, waits 1000ms, reads presence state, and returns — the channel is never unsubscribed.
- Files: `app/api/_lib/online.ts:49-61`
- Trigger: Every non-mock invocation of the `/api/data/latest` route handler.
- Impact: (1) Adds a mandatory ~1 second of latency to the primary data API on every request; (2) leaks a subscribed Realtime channel per invocation, which can accumulate connections against the Supabase project's Realtime connection limits if the serverless function instance is reused (warm start).
- Fix approach: Reuse a single long-lived channel/subscription per server instance (module-level singleton, as `lib/presence.ts` already does for the client) instead of subscribing fresh per request, and always unsubscribe.

## Security Considerations

**No route protection on debug/test surfaces:**
- Risk: `app/test/page.tsx` exposes raw Supabase table contents (`vegetables`) to any visitor without authentication.
- Files: `app/test/page.tsx`
- Current mitigation: None.
- Recommendations: Remove the route from production builds or gate behind an internal-only flag.

**`update_ledger` table is publicly readable:**
- Risk: `supabase-rls.sql` grants `SELECT USING (true)` on `update_ledger`, which stores internal job status/messages/metadata (potentially including error details/stack info via the `metadata JSONB` column).
- Files: `supabase-rls.sql`
- Current mitigation: Table is read-only for anon role (no public INSERT/UPDATE/DELETE policy is defined, so writes require the service role key).
- Recommendations: Restrict `update_ledger` reads to the service role only, since it's operational/internal data with no end-user value; keep public read only on `daily_aggregates`/`vegetables`.

**Cron endpoint auth relies solely on a single shared secret plus a spoofable header:**
- Risk: `app/api/jobs/daily-ingest/route.ts` treats any request bearing an `x-vercel-cron` header as authorized (`isCron = req.headers.get("x-vercel-cron") != null`) without verifying it actually originates from Vercel's cron infrastructure, in addition to the `Bearer ${CRON_SECRET}` path.
- Files: `app/api/jobs/daily-ingest/route.ts:21-25`
- Current mitigation: `CRON_SECRET` bearer-token path exists for manual triggers (`scripts/sync-now.js`).
- Recommendations: Given the route currently has no side effects (see Tech Debt above), risk is low today, but once real DB writes are implemented this should be hardened — e.g., verify Vercel's cron signature/IP allowlist in addition to the header presence check.

**No security headers configured:**
- Risk: `next.config.js` sets no `headers()` (no CSP, `X-Frame-Options`, `Referrer-Policy`, etc.).
- Files: `next.config.js`
- Current mitigation: None beyond Next.js/Vercel defaults.
- Recommendations: Add a baseline security headers block, especially since the site embeds third-party chart rendering (`recharts`) and Supabase JS SDK.

## Performance Bottlenecks

**Every page load hits the live government AMIS API with no caching:**
- Problem: In non-mock mode, `getLatest()`/`getHistory()` in `lib/datasource.ts` call `fetchAmisByDateRange()` directly against `https://data.moa.gov.tw/...` on every single request (the response also explicitly disables caching: `Cache-Control: no-store` in `app/api/data/latest/route.ts:64-66`).
- Files: `lib/datasource.ts:66-118`, `lib/amis.ts:22-113`, `app/api/data/latest/route.ts`
- Cause: The daily-ingest/cron + Supabase persistence layer that should decouple the site from the upstream API's availability/rate limits was never completed (see "Daily-Aggregation pipeline is entirely stubbed").
- Improvement path: Persist AMIS data via the cron job into `daily_aggregates`, and have `/api/data/latest` read from Supabase (fast, cached) instead of calling the government API synchronously per request.

**Artificial ~1s latency added to `/api/data/latest` via presence check:**
- Problem: See "Known Bugs" above — `getOnlineCount()` sleeps 1000ms per request when Supabase Presence is configured.
- Files: `app/api/_lib/online.ts:54-55`
- Cause: `await new Promise(resolve => setTimeout(resolve, 1000))` used to "wait for presence sync" on every request instead of maintaining a warm subscription.
- Improvement path: Move to a persistent, periodically-refreshed presence count computed out-of-band from the request path.

**Low capacity caps for a public site:**
- Problem: `lib/limits.ts` sets `SOFT_CAP = 45` and `HARD_CAP = 60` concurrent users before the waiting room kicks in.
- Files: `lib/limits.ts`
- Cause: Likely tied to a free-tier Supabase Realtime connection limit, but this isn't documented anywhere in code.
- Improvement path: Document why these numbers were chosen (e.g., Supabase plan connection limit) so future maintainers don't treat them as arbitrary, and consider decoupling "site capacity" from "Supabase Realtime connection budget" (e.g., via a lighter-weight counter such as Redis/Upstash) if user growth is expected.

## Fragile Areas

**`lib/agg.ts` aggregation/persistence layer:**
- Files: `lib/agg.ts`
- Why fragile: Entirely stub/mock code pretending to succeed (returns `{ updated: totalUpdated }` computed from hardcoded arrays regardless of real work done); any code that trusts its return value will be misled about actual state.
- Safe modification: Do not build new features on top of `rebuildDailyAggregates()`/`upsertMarketPrices()` assuming they persist data — verify first, since currently they do not.
- Test coverage: None.

**`lib/datasource.ts` non-mock branch:**
- Files: `lib/datasource.ts:64-118`, `164-213`
- Why fragile: Combines a live external API call, ad hoc in-memory aggregation, and randomized fields (`dod`) in one function; errors from AMIS are swallowed into an "empty result" response rather than distinguished from "no data today."
- Safe modification: When fixing the `dod`/low-high fabrication issues, keep the AMIS-fetch and aggregation logic in separate, independently testable functions (some already are: `aggregateAmisData`, `aggregateDailyData`, `getLatestTradeDate`).
- Test coverage: None.

**`lib/category.ts` / `lib/retail.ts` crop classification via string matching:**
- Files: `lib/category.ts:12-69`, `lib/retail.ts` category logic (referenced via `getCategory`)
- Why fragile: Category assignment depends on Chinese-substring heuristics (e.g., any name containing "花" is classified as `flower` unless explicitly excluded) layered on top of a static `aliases/category-map.json` lookup. New crop names from AMIS not covered by either the map or the substring rules will silently fall through to `other`, and names with unanticipated characters (e.g., "花椰菜" exceptions are hardcoded one-by-one at `lib/category.ts:27-33`) require manual updates whenever AMIS introduces a new crop name variant.
- Safe modification: When AMIS returns unrecognized crop names, add them to `aliases/category-map.json` rather than extending the string-matching exception list further.
- Test coverage: None — no test verifies category assignment for the actual set of crop names AMIS returns.

## Scaling Limits

**Supabase Realtime Presence as a request gate:**
- Current capacity: `HARD_CAP = 60` concurrent presence entries (`lib/limits.ts`).
- Limit: Tied to Supabase project's Realtime concurrent connection quota (not documented in-repo); combined with the per-request channel leak in `app/api/_lib/online.ts`, real capacity could be reached well before 60 legitimate users due to unclosed channels accumulating.
- Scaling path: Fix the channel leak first (see Known Bugs), then re-evaluate whether presence-based gating is the right mechanism at higher user counts versus a simple counter service.

## Dependencies at Risk

**Direct dependency on a single government API with no fallback/retry beyond "return empty":**
- Risk: `fetchAmisByDateRange()` in `lib/amis.ts` has a 30-second timeout and, on any failure (network error, API downtime, schema change in `data.moa.gov.tw`'s response), returns `[]` — the app then shows a hard "no data" 404 (`app/api/data/latest/route.ts:39-42`) or falls back to hardcoded stale mock data (`app/page.tsx`).
- Impact: The entire product's core value proposition (live prices) is a single point of failure on one upstream government endpoint with no retry/backoff and no cached last-known-good data to serve during an outage.
- Migration plan: Persist the last successful `daily_aggregates` snapshot (once the ingest pipeline is fixed) so a temporary AMIS outage degrades to "yesterday's real prices" instead of "no data" or "fabricated mock data."

## Missing Critical Features

**Retail price is a fixed multiplier estimate, not real retail data:**
- Problem: `estimateRetailPrice()` in `lib/retail.ts:78-99` multiplies the wholesale `wavg` by a static coefficient per category (`RETAIL_COEF_LEAFY=1.5`, `RETAIL_COEF_FRUIT=1.7`, `RETAIL_COEF_ROOT=1.3`, `RETAIL_COEF_OTHER=1.4`, configured via env vars in `lib/env.ts`). This is presented to users as the expected retail price to compare against what vendors charge.
- Blocks: Because it's a single fixed multiplier applied uniformly across an entire category (e.g., every "leafy" vegetable gets exactly 1.5x wholesale), the estimate can't reflect real per-crop retail markup variance, seasonal effects, or regional differences — reducing its usefulness for the stated anti-overcharging purpose. There's a `validateRetailPrice()` helper (`lib/retail.ts:162-176`) that checks a ±20% tolerance band, but nothing in the codebase calls it against real observed retail prices to calibrate the coefficients.
- Priority: High — this estimate is central to the product's value proposition (helping users know if a vendor is overcharging).

## Test Coverage Gaps

**No tests exist anywhere in the codebase:**
- What's not tested: Everything — price aggregation (`lib/agg.ts`, `lib/datasource.ts`), category classification (`lib/category.ts`, `lib/retail.ts`), rate-limiting/gating logic (`lib/presence.ts`, `app/api/_lib/online.ts`, `components/Gatekeeper.tsx`), and all API routes.
- Files: entire `lib/`, `app/api/`, `components/` trees; only ad hoc manual scripts exist (`scripts/test-*.js`), not wired into `npm test` or CI (`.github/workflows/deploy.yml` only builds and deploys, no test step).
- Risk: The known bugs documented above (`Math.random()` `dod`, fabricated low/high, broken column names) are exactly the class of bug unit tests would catch immediately.
- Priority: High — start with `lib/agg.ts`, `lib/datasource.ts` aggregation functions, and `lib/retail.ts`/`lib/category.ts` classification, since these directly determine the accuracy of prices shown to users.

---

*Concerns audit: 2026-09-02*
