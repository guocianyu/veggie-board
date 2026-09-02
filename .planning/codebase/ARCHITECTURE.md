# Architecture

**Analysis Date:** 2026-09-02

## Pattern Overview

**Overall:** Next.js 14 App Router monolith, client-heavy rendering, with a thin serverless API layer that proxies/aggregates a government open-data API on request. No persistent application database is actually wired up despite Supabase being present in the stack.

**Key Characteristics:**
- Single Next.js app (no monorepo, no separate backend service). Deployed to Vercel.
- The homepage (`app/page.tsx`) is a **Client Component** that fetches data client-side from its own API route (`/api/data/latest`) on mount — not using React Server Components for data fetching.
- The API route (`app/api/data/latest/route.ts`) does **not** read from a database; on every request it re-fetches and re-aggregates data live from Taiwan's AMIS government API (`lib/amis.ts` → `lib/datasource.ts`). `export const dynamic = "force-dynamic"` and `Cache-Control: no-store` disable caching, so every page load triggers a live upstream fetch.
- Supabase (`@supabase/supabase-js`) is configured as a client (`lib/supabaseBrowser.ts`) and referenced by a "Gatekeeper" concurrency-limiting feature, but that feature is **commented out** in `app/layout.tsx` (`{/* <Gatekeeper> */}`) and is currently dead code in the live UI. `lib/db.ts`, `lib/agg.ts` contain Supabase read/write helpers and TODO-stubbed persistence logic that is not actually invoked by the live data path.
- A Vercel Cron job (`vercel.json` → `/api/jobs/daily-ingest`) exists to pre-fetch AMIS data daily, but its handler currently only fetches and logs the data — it does not write to any database (see comments in `app/api/jobs/daily-ingest/route.ts`: "無需存儲到數據庫...資料會在前端請求時即時從農業部 API 獲取").
- Two parallel "sets" of UI/board components exist: the wired-up `HomeLegacy` (used by `app/page.tsx`) and an unused set (`RankBoard.tsx`, `RankRows.tsx`, `CheapestBoard.tsx`, `PriceTrendChart.tsx`, `PriceDetailChart.tsx`, `RetailToggle.tsx`) that are not imported anywhere in the active render tree (see STRUCTURE.md "Special Directories" / dead code note).

## Layers

**Presentation (App Router pages):**
- Purpose: Route-level pages and layout shell.
- Location: `app/`
- Contains: `app/layout.tsx` (root layout, providers, Navbar/Footer), `app/page.tsx` (home page, client-side data fetch), `app/error.tsx` (route error boundary), `app/wait/page.tsx` (standalone waiting-room page), `app/test/page.tsx` (manual Supabase connectivity smoke test, not linked from nav).
- Depends on: `components/`, `lib/`, `types/`.
- Used by: Next.js router / browser.

**API Routes (serverless functions):**
- Purpose: Backend-for-frontend endpoints run as Vercel serverless/edge functions.
- Location: `app/api/`
- Contains:
  - `app/api/data/latest/route.ts` — main data endpoint consumed by the homepage; applies online-count throttling, calls `getLatest()`, filters out flower category.
  - `app/api/jobs/daily-ingest/route.ts` — Vercel Cron (`vercel.json`, schedule `5 19 * * *`) + manually-triggerable (`Authorization: Bearer $CRON_SECRET`) ingestion job; currently fetch-only, no persistence.
  - `app/api/session/availability/route.ts` — mock waiting-room status endpoint (`Math.random()`-based, not connected to real presence data); used by `app/wait/page.tsx`.
  - `app/api/_lib/online.ts` — shared "online user count" helper used by `data/latest`; falls back to an in-memory pseudo-random counter when Supabase env vars are absent/mock.
- Depends on: `lib/amis.ts`, `lib/datasource.ts`, `lib/limits.ts`, `lib/retail.ts`, `lib/db.ts`.
- Used by: client components via `fetch()`.

**Domain / Business Logic (`lib/`):**
- Purpose: Data fetching, aggregation, categorization, retail-price estimation, formatting, env config.
- Location: `lib/`
- Key modules:
  - `lib/amis.ts` — raw HTTP client for Taiwan MOA AMIS API (`https://data.moa.gov.tw/api/v1/AgriProductsTransType/`); converts ROC↔AD dates, parses rows into `AmisRow[]`. Swallows errors and returns `[]` rather than throwing.
  - `lib/datasource.ts` — the central data-access facade. `getLatest()` and `getHistory()` branch on `isMockMode` (mock JSON files under `public/mock/`) vs. live mode (calls `fetchAmisByDateRange` + in-memory aggregation). **Note:** `dod` (day-over-day change) in the live path is currently `Math.random()`-based ("簡化的日漲跌幅計算"), not a real calculation — see CONCERNS.
  - `lib/retail.ts` — crop categorization (`getCategory`, backed by `aliases/category-map.json` plus keyword-based fallback heuristics) and retail-price estimation (`estimateRetailPrice` = wholesale × category coefficient, coefficients sourced from `lib/env.ts`).
  - `lib/category.ts` — veg/fruit grouping (`getGroup`, `filterByGroup`) layered on top of `getCategory`.
  - `lib/agg.ts` — Supabase-oriented aggregation helpers (`upsertMarketPrices`, `rebuildDailyAggregates`) — **stubbed with TODOs and mock data**, not called by the live request path.
  - `lib/db.ts` — Supabase-backed helpers for `update_ledger` / `daily_aggregates` tables, with mock-data fallbacks when Supabase env vars are absent. Not on the hot path for `/api/data/latest`.
  - `lib/env.ts` — Zod-validated environment config (`DATA_SOURCE`, retail coefficients).
  - `lib/limits.ts` — concurrency-control constants (`SOFT_CAP=45`, `HARD_CAP=60`, intervals).
  - `lib/presence.ts` — Supabase Realtime Presence channel join/leave, used only by the disabled `Gatekeeper`.
  - `lib/format.ts`, `lib/time.ts`, `lib/cn.ts`, `lib/utils.ts` — formatting/classnames/time utilities.
  - `lib/ui-prefs.ts` — localStorage-backed UI preference hook (color scheme, theme, refresh interval); not wired into any component currently reading from it beyond its own module.
  - `lib/price-mode.tsx` — React context (`PriceModeProvider`/`usePriceMode`) for wholesale vs. "estimated retail" toggle, persisted to `localStorage`.
- Depends on: `types/`, `aliases/category-map.json`, external AMIS API, Supabase.
- Used by: `app/api/**/route.ts`, `components/*`.

**Presentation Components (`components/`):**
- Purpose: React UI building blocks.
- Location: `components/`
- Active/wired components: `HomeLegacy.tsx` (the entire homepage UI — gainers/losers, cheapest lists, pagination — rendered by `app/page.tsx`), `Gatekeeper.tsx` + `Waitroom.tsx` (concurrency gate, currently disabled), `FloatingPriceMode.tsx` (floating wholesale/retail toggle, rendered in root layout), `ui/Navbar.tsx`, `ui/Footer.tsx`.
- Unused/orphaned components (present but not imported by any active route): `RankBoard.tsx`, `RankRows.tsx`, `CheapestBoard.tsx`, `PriceTrendChart.tsx`, `PriceDetailChart.tsx`, `RetailToggle.tsx`. `RankRows.tsx` imports `CheapestBoard.tsx` but `RankRows` itself is never imported.
- Design-system primitives: `components/ds/*` (`Card`, `Badge`, `Button`, `CodeBadge`, `ListRow`, `PillDelta`, `Segmented`, `Tooltip`, `Provider.tsx` for `DSProvider`/`useDS` theming context).
- Depends on: `lib/`, `types/`, `design-system/tokens.ts` (design tokens), Tailwind classes.
- Used by: `app/layout.tsx`, `app/page.tsx`, `app/wait/page.tsx`.

**Types:**
- Location: `types/index.ts` — single shared type module (`PriceItem`, `LatestPayload`, `HistorySeries`, `CropCategory`, `WaitingRoomStatus`, etc.). Imported via the `@/types` path alias throughout `lib/` and `components/`.

**Config/Data assets:**
- `config/ui.ts` — feature flag `HOME_UI_VERSION` (`'legacy' | 'new'`), currently hardcoded to `'legacy'`; `app/page.tsx` reads it but always renders `HomeLegacy` regardless of value (both branches of the ternary render `HomeLegacy`).
- `aliases/category-map.json` — static crop-name → category lookup table used by `lib/retail.ts` and `lib/category.ts`.
- `design-system/tokens.ts` — design tokens (colors/spacing) referenced by Tailwind config.
- `public/mock/latest.json`, `public/mock/history/*.json` — static mock data payloads served when `DATA_SOURCE=mock`.

## Data Flow

**Homepage price display (live/API mode — the default in production):**

1. Browser loads `/` → `app/layout.tsx` renders `Navbar`, `app/page.tsx` (client component) mounts.
2. `app/page.tsx`'s `useEffect` calls `fetch('/api/data/latest')`.
3. `app/api/data/latest/route.ts` (serverless function) runs:
   a. Calls `getOnlineCount()` (`app/api/_lib/online.ts`) — checks against `HARD_CAP + API_BUFFER` (`lib/limits.ts`); returns HTTP 503 if over capacity.
   b. Calls `getLatest()` (`lib/datasource.ts`), which calls `fetchAmisByDateRange()` (`lib/amis.ts`) against the live Taiwan MOA AMIS endpoint for the last 3 days, then aggregates rows per crop (weighted average price, summed volume, **randomized** day-over-day delta) via `aggregateAmisData()`.
   c. Filters out `flower`-category items using `getCategory()` (`lib/retail.ts`).
   d. Returns JSON `{ updatedAt, tradeDate, scope, items, onlineCount }` with `Cache-Control: no-store`.
4. `app/page.tsx` sets state from the response; on any fetch/parse error it falls back to static `lib/mockData.ts` and shows a dismissible error banner.
5. `HomeLegacy.tsx` receives `items` as props and, client-side, computes:
   - Gainers/losers (top 10 by `dod`, sign-filtered).
   - "Cheapest" veg/fruit lists (volume ≥ 500kg filter, sorted by displayed price).
   - Displayed price = `wavg` (wholesale mode) or `estimateRetailPrice()` (retail mode) depending on `usePriceMode()` context (`lib/price-mode.tsx`), default mode is `'retail'`.
6. `FloatingPriceMode.tsx` (rendered globally in `app/layout.tsx`) lets the user toggle wholesale vs. retail mode; state is shared via React Context and persisted to `localStorage`.

**Mock mode (`DATA_SOURCE=mock`):**
1. `lib/env.ts` parses `DATA_SOURCE` from env (default `'mock'` in schema, but README instructs setting `DATA_SOURCE=api` for local dev).
2. `getLatest()`/`getHistory()` in `lib/datasource.ts` fetch static JSON from `public/mock/latest.json` / `public/mock/history/{cropCode}.json` instead of calling AMIS.

**Daily cron ingestion (currently a no-op beyond logging):**
1. Vercel Cron triggers `GET /api/jobs/daily-ingest` at `5 19 * * *` (`vercel.json`), or it can be POSTed manually with `Authorization: Bearer $CRON_SECRET`.
2. Handler computes a 3-day Taiwan-timezone date window, calls `fetchAmisByDateRange()`, logs counts, and returns a JSON summary — no database write occurs (see inline comments in the route).

**State Management:**
- No global state library (no Redux/Zustand). State is local `useState`/`useEffect` in page/components plus two React Contexts: `PriceModeProvider` (`lib/price-mode.tsx`, wholesale/retail toggle) and `DSProvider` (`components/ds/Provider.tsx`, design-system radius/density — not currently consumed by any component that changes those values).
- Persistence is via `localStorage` only (`vb_price_mode` key, `veggie-board-ui-prefs` key from `lib/ui-prefs.ts`). No server-side session state; no cookies observed.

## Key Abstractions

**PriceItem (`types/index.ts`):**
- Purpose: The canonical shape for one crop's aggregated daily price row (`cropCode`, `cropName`, `wavg`, `vol`, `dod`, timestamps).
- Examples: produced by `lib/datasource.ts::aggregateAmisData()`, consumed by `components/HomeLegacy.tsx`.
- Pattern: Plain TypeScript type, no runtime validation on the API boundary (Zod is used only for env vars in `lib/env.ts`, not for API payloads).

**Datasource facade (`lib/datasource.ts`):**
- Purpose: Single entry point (`getLatest`, `getHistory`, `getAvailableCrops`, `searchCrops`, `getDataSourceStatus`) abstracting over mock-JSON vs. live-AMIS data sources, keyed off `isMockMode` from `lib/env.ts`.
- Pattern: Facade/strategy switch (`if (isMockMode) {...} else {...}`) duplicated in every exported function rather than a shared strategy object — extending to a third mode (e.g., real DB) means touching every function.

**Category system (`lib/retail.ts` + `aliases/category-map.json`):**
- Purpose: Maps a Chinese crop name to `CropCategory` (`leafy | fruit | root | other | flower`), used both for retail-price coefficient selection and for filtering flowers out of all displayed lists.
- Pattern: Static lookup table first, falls back to Chinese-substring keyword heuristics (e.g. any name containing `花` that isn't an allow-listed exception is classified `flower`). This heuristic runs on every render for every item (not memoized at the module level beyond the JSON require).

**Price mode context (`lib/price-mode.tsx`):**
- Purpose: App-wide toggle between showing raw wholesale price (`wavg`) vs. an estimated retail price (`estimateRetailPrice`), the latter being the product's core "don't get overcharged" value proposition.
- Pattern: React Context + `localStorage` persistence, default `'retail'`.

## Entry Points

**`app/layout.tsx` (root layout):**
- Location: `app/layout.tsx`
- Triggers: Every route render (Next.js App Router root layout).
- Responsibilities: Sets page metadata/SEO (OpenGraph, Twitter cards, robots), wraps the tree in `DSProvider` and `PriceModeProvider`, renders `Navbar`, `Footer`, and the floating `FloatingPriceMode` control. `Gatekeeper` wrapping is present but commented out.

**`app/page.tsx` (home route, `/`):**
- Location: `app/page.tsx`
- Triggers: Root URL load.
- Responsibilities: Client-side fetch of `/api/data/latest`, loading/error UI, fallback to mock data on failure, delegates rendering to `HomeLegacy`.

**`app/api/data/latest/route.ts` (GET):**
- Location: `app/api/data/latest/route.ts`
- Triggers: `fetch()` from `app/page.tsx`; any external caller.
- Responsibilities: Online-count throttling, live AMIS fetch + aggregation via `lib/datasource.ts`, flower filtering, JSON response.

**`app/api/jobs/daily-ingest/route.ts` (GET/POST):**
- Location: `app/api/jobs/daily-ingest/route.ts`
- Triggers: Vercel Cron (daily, `vercel.json`) or manual `POST` with `Authorization: Bearer $CRON_SECRET`.
- Responsibilities: Pre-warm/log AMIS data fetch for a rolling 3-day window (Taiwan timezone). Does not persist data (see CONCERNS).

**`app/api/session/availability/route.ts` (GET/POST):**
- Location: `app/api/session/availability/route.ts`
- Triggers: Polled every 5s by `app/wait/page.tsx`.
- Responsibilities: Returns a randomly-generated mock waiting-room status; not connected to the real `lib/presence.ts`/`lib/limits.ts` concurrency system used by `Gatekeeper`.

## Error Handling

**Strategy:** Defensive, fail-open. Nearly every async boundary (AMIS fetch, Supabase calls, presence checks) is wrapped in try/catch that logs via `console.error`/`console.warn` and returns an empty/default value rather than throwing, so a downstream failure degrades functionality instead of crashing the request.

**Patterns:**
- API routes catch all errors and return `NextResponse.json({ error, message }, { status })` (`app/api/data/latest/route.ts`, `app/api/jobs/daily-ingest/route.ts`).
- `lib/amis.ts::fetchAmisByDateRange` catches fetch/parse errors and returns `[]` instead of propagating — callers must handle "zero rows" as an error signal.
- Client-side, `app/page.tsx` catches fetch/parsing errors, sets a visible sticky yellow error banner, and falls back to `lib/mockData.ts` so the UI is never empty.
- Route-level error boundary: `app/error.tsx` (Next.js `error.tsx` convention) catches render-time exceptions and shows a "重試" (retry) button calling Next's `reset()`.
- Capacity-limit errors are surfaced as HTTP 503 with a `Retry-After` header (`app/api/data/latest/route.ts`, using `RETRY_AFTER` from `lib/limits.ts`).

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.warn`/`console.error` throughout `lib/` and `app/api/`, tagged with bracketed module prefixes (e.g. `[API]`, `[AMIS]`, `[Datasource]`, `[CRON]`, `[Gatekeeper]`, `[Presence]`, `[DB]`, `[AGG]`). No structured logging library or external log aggregation service is configured.

**Validation:** `zod` is used only for environment variable parsing (`lib/env.ts`). No runtime schema validation of the AMIS API response shape or of the `/api/data/latest` response on the client — malformed upstream data is handled ad hoc with `Array.isArray()`/field-presence checks inside `lib/amis.ts`.

**Authentication:** No end-user authentication exists. The only auth-like mechanism is a shared-secret Bearer token (`CRON_SECRET` env var) gating manual POST access to `app/api/jobs/daily-ingest/route.ts`; Vercel Cron requests are recognized via the `x-vercel-cron` header.

**Rate limiting / capacity control:** Two independent, inconsistent concurrency-limiting subsystems exist:
1. `lib/limits.ts` + `lib/presence.ts` + `Gatekeeper.tsx` (Supabase Realtime Presence-based, `SOFT_CAP=45`/`HARD_CAP=60`) — wired into `app/api/_lib/online.ts` (used by `/api/data/latest`) but the client-side `Gatekeeper` UI gate is disabled in `app/layout.tsx`.
2. `app/api/session/availability/route.ts` (fully mocked `Math.random()`-based capacity of 80-110/100) — used only by the standalone, seemingly unlinked `/wait` page.

---

*Architecture analysis: 2026-09-02*
