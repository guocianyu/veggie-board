# External Integrations

**Analysis Date:** 2026-09-02

## APIs & External Services

**Government Open Data:**
- Taiwan Ministry of Agriculture (MOA) AMIS Open Data API - primary live source of wholesale vegetable/fruit market prices
  - Endpoint: `https://data.moa.gov.tw/api/v1/AgriProductsTransType/`
  - Client/implementation: `lib/amis.ts` (`fetchAmisByDateRange`) — plain `fetch()`, no SDK
  - Auth: none (public open data API)
  - Date format quirk: API expects/returns ROC (Minguo) calendar dates (`民國年.MM.DD`); conversion helpers `formatDateForAPI`/`formatDateFromAPI` live in `lib/amis.ts`
  - Timeout: 30s via `AbortSignal.timeout(30000)`
  - Failure handling: catches errors and returns an empty array rather than throwing, so downstream code degrades to "no data" rather than crashing
  - Consumed by: `lib/datasource.ts` (`getLatest`, `getHistory`) and the cron ingest route `app/api/jobs/daily-ingest/route.ts`

## Data Storage

**Databases:**
- Supabase (Postgres + Realtime), used both as a database and a realtime presence service
  - Client: `@supabase/supabase-js` (`^2.57.2`)
  - Connection env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon/public key only — no service-role key referenced anywhere in the code)
  - Singleton client construction: `lib/supabaseBrowser.ts` (stores instance on `globalThis.__veggieboard_supabase__` to avoid duplicate clients; sets custom `storageKey: 'veggieboard.auth.token'`)
  - Re-exported/used by: `lib/db.ts` (data-access helpers), `lib/supabaseClient.ts` (deprecated compatibility shim that just re-exports `supabaseBrowser`)
  - Mock fallback: `lib/supabaseMock.ts`, activated via `NEXT_PUBLIC_USE_MOCK=1` (dynamically imported client-side only in `lib/db.ts`)
  - Schema provisioning SQL (run manually in Supabase SQL editor, not via migrations tool):
    - `supabase-schema.sql` - creates `daily_aggregates`, `update_ledger`, `vegetables` tables + indexes + seed rows
    - `setup-database.sql` - overlapping/alternate schema setup script (root)
    - `supabase-rls.sql` - enables Row Level Security and adds public-read-only policies on `daily_aggregates`, `update_ledger`, `vegetables` (no write policies defined — writes intended to go through the anon key are effectively blocked, consistent with the app not writing to these tables from the code paths inspected)
  - Actual usage note: `app/api/jobs/daily-ingest/route.ts` (the cron ingest job) currently fetches from the AMIS API but does **not** persist rows to Supabase — it comments that data is fetched live per-request instead (`lib/datasource.ts` calls AMIS directly when `DATA_SOURCE=api`). The `daily_aggregates`/`update_ledger` tables and `lib/db.ts` helpers (`logUpdate`, `getLatestDailyAggregates`, `getLatestUpdateTime`) exist but appear to be a secondary/legacy data path not wired into the primary live-API flow.

**File Storage:**
- None detected — no Supabase Storage, S3, or similar usage found.

**Caching:**
- None detected — API route `app/api/data/latest/route.ts` explicitly sets `Cache-Control: no-store` and disables Next.js route caching (`export const dynamic = "force-dynamic"`).

## Authentication & Identity

**Auth Provider:**
- None — no user authentication/login system detected. Supabase Auth client config exists only incidentally (custom `storageKey` set in `lib/supabaseBrowser.ts`) but no sign-in flows, protected routes, or session/user tables were found.

## Monitoring & Observability

**Error Tracking:**
- None detected — no Sentry, LogRocket, or similar APM/error-tracking package in `package.json`.

**Logs:**
- Console-based structured logging with bracketed tags throughout (`[AMIS]`, `[DB]`, `[Datasource]`, `[Online]`, `[Presence]`, `[API]`, `[CRON]`), e.g. `lib/amis.ts`, `lib/db.ts`, `app/api/jobs/daily-ingest/route.ts`. Relies entirely on Vercel's function log capture; no external log aggregation service.

## CI/CD & Deployment

**Hosting:**
- Vercel (Next.js app + serverless API routes + Cron)

**CI Pipeline:**
- GitHub Actions: `.github/workflows/deploy.yml`
  - Triggers: push/PR to `main`
  - Steps: checkout → Node 20 setup (npm cache) → `npm ci` → `npm run build` → deploy via `amondnet/vercel-action@v25 --prod`
  - Required GitHub Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Manual deploy helper script also present: `scripts/deploy-vercel.sh`

**Scheduled Jobs (Vercel Cron):**
- `vercel.json` defines one cron: `GET /api/jobs/daily-ingest` at `5 19 * * *` (UTC) — 03:05 Asia/Taipei daily
- Route handles both `GET` (Vercel Cron, identified via `x-vercel-cron` header) and `POST` (manual trigger via `Authorization: Bearer <CRON_SECRET>`), implemented in `app/api/jobs/daily-ingest/route.ts`
- Manual trigger tooling: `npm run sync:now` → `scripts/sync-now.js`, requires `CRON_SECRET` and reachable `BASE_URL`/`VERCEL_URL`

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (client-exposed)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (client-exposed)
- `NEXT_PUBLIC_SUPABASE_TABLE` — optional, default `daily_aggregates`
- `DATA_SOURCE` — `mock` | `api` | `db` (default `mock`); production should use `api` per `README.md`
- `RETAIL_COEF_LEAFY` / `RETAIL_COEF_FRUIT` / `RETAIL_COEF_ROOT` / `RETAIL_COEF_OTHER` — retail markup coefficients, defaults 1.5/1.7/1.3/1.4
- `CRON_SECRET` — Bearer token securing manual invocation of the ingest cron endpoint
- `SUPABASE_URL` — server-side-only var checked in `lib/db.ts`/`app/api/_lib/online.ts` for mock-mode detection (note: distinct from `NEXT_PUBLIC_SUPABASE_URL`; likely unused/unset in real deployments — see CONCERNS)
- `VERCEL_URL`, `BASE_URL`, `NEXT_PUBLIC_BASE_URL` — used to resolve absolute URLs for server-side `fetch()` calls to the app's own API/mock JSON files

**Secrets location:**
- Local development: `.env.local` (gitignored; not committed — file exists on this machine but its contents were not read as part of this analysis)
- Production: Vercel project environment variables (referenced implicitly; not inspectable from this repo)
- CI: GitHub repository secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/jobs/daily-ingest` acts as a webhook-style manually-triggerable endpoint (Bearer-token authenticated), in addition to being invoked by Vercel Cron via `GET`. See `app/api/jobs/daily-ingest/route.ts`.

**Outgoing:**
- None — no outbound webhook dispatch (e.g. Slack/Discord notifications on job failure) detected.

## Internal/Mock APIs (not third-party, but notable "integration points")

- `app/api/data/latest/route.ts` — main data API consumed by the frontend; applies a soft/hard online-user cap (`lib/limits.ts`: `SOFT_CAP=45`, `HARD_CAP=60`, `API_BUFFER=5`) using Supabase Realtime Presence via `getOnlineCount()` in `app/api/_lib/online.ts` (falls back to an in-memory simulated counter when Supabase isn't configured)
- `app/api/session/availability/route.ts` — waiting-room / queue status endpoint; currently fully mocked (`Math.random()`-based fake online counts and 5% simulated "maintenance mode" errors), not backed by any real service
- `lib/presence.ts` — client-side Supabase Realtime Presence channel (`presence:vb-online`) join/leave/count logic, parallel implementation to the server-side one in `app/api/_lib/online.ts`

---

*Integration audit: 2026-09-02*
