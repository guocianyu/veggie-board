# Codebase Structure

**Analysis Date:** 2026-09-02

## Directory Layout

```
veggie-board/
├── app/                        # Next.js App Router: pages, layout, API routes
│   ├── api/
│   │   ├── _lib/online.ts      # Shared "online user count" helper (private, underscore = not a route)
│   │   ├── data/latest/route.ts        # GET: main price-data endpoint used by homepage
│   │   ├── jobs/daily-ingest/route.ts  # GET/POST: Vercel Cron ingestion job (fetch-only, no DB write)
│   │   └── session/availability/route.ts # GET/POST: mocked waiting-room status endpoint
│   ├── test/page.tsx           # Manual Supabase connectivity smoke-test page (not linked from nav)
│   ├── wait/page.tsx           # Standalone waiting-room UI (polls session/availability)
│   ├── error.tsx               # Next.js route-level error boundary
│   ├── globals.css             # Tailwind base styles
│   ├── layout.tsx              # Root layout: providers, Navbar, Footer, FloatingPriceMode
│   └── page.tsx                # Home route "/" — fetches live data client-side, renders HomeLegacy
├── components/                 # React components
│   ├── ds/                     # Design-system primitives (Card, Badge, Button, Tooltip, Provider, etc.)
│   ├── ui/                     # App chrome (Navbar, Footer)
│   ├── HomeLegacy.tsx          # ACTIVE: entire homepage UI, rendered by app/page.tsx
│   ├── Gatekeeper.tsx          # Concurrency gate (Supabase Presence-based) — currently disabled in layout.tsx
│   ├── Waitroom.tsx            # Waiting-room UI shown by Gatekeeper when over capacity
│   ├── FloatingPriceMode.tsx   # ACTIVE: floating wholesale/retail price toggle (rendered globally)
│   ├── RankBoard.tsx           # UNUSED: not imported by any route
│   ├── RankRows.tsx            # UNUSED: not imported by any route (imports CheapestBoard)
│   ├── CheapestBoard.tsx       # UNUSED except by unused RankRows.tsx
│   ├── PriceTrendChart.tsx     # UNUSED: Recharts-based trend chart, not imported anywhere
│   ├── PriceDetailChart.tsx    # UNUSED: Recharts-based detail chart, not imported anywhere
│   └── RetailToggle.tsx        # UNUSED: superseded by FloatingPriceMode.tsx
├── lib/                        # Business logic, data access, utilities (see below)
├── types/index.ts              # Single shared TypeScript type module (@/types)
├── aliases/category-map.json   # Static crop-name → category lookup table
├── config/ui.ts                # HOME_UI_VERSION feature flag (currently has no effect, see ARCHITECTURE.md)
├── design-system/tokens.ts     # Design tokens referenced by tailwind.config.ts
├── src/config/                 # Empty directory (no files) — dead/leftover scaffold
├── public/
│   └── mock/                   # Static JSON fixtures used when DATA_SOURCE=mock
│       ├── latest.json
│       └── history/{cropCode}.json
├── scripts/                    # Standalone Node.js scripts (not part of the Next.js build)
│   ├── deploy-vercel.sh
│   ├── sync-now.js             # Invoked via `npm run sync:now`
│   └── test-*.js               # Ad hoc manual test scripts for rate-limit logic
├── docs/CRON.md                # Notes on the cron ingestion job
├── .github/workflows/deploy.yml # CI: build + deploy to Vercel on push/PR to main
├── setup-database.sql          # Supabase table setup (manual, not run by app code)
├── supabase-schema.sql         # Supabase schema definition
├── supabase-rls.sql            # Supabase row-level-security policies
├── next.config.js, tsconfig.json, tailwind.config.ts, postcss.config.js  # Standard Next.js tooling config
└── vercel.json                 # Vercel cron schedule config
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js 14 App Router — every folder under here that contains a `page.tsx` becomes a route; every folder under `app/api/` with a `route.ts` becomes an API endpoint.
- Contains: Page components (`page.tsx`), layout (`layout.tsx`), error boundary (`error.tsx`), serverless route handlers (`route.ts`).
- Key files: `app/layout.tsx`, `app/page.tsx`, `app/api/data/latest/route.ts`.

**`app/api/_lib/`:**
- Purpose: Shared helper code for API routes that must NOT itself become a route. The leading underscore is a Next.js convention to opt a folder out of routing.
- Contains: `online.ts` (online-user-count helper).

**`components/`:**
- Purpose: All React UI. Split into general page-level components (root of `components/`), reusable design-system primitives (`components/ds/`), and app-chrome components (`components/ui/`).
- Key files: `components/HomeLegacy.tsx` (main page content — the file to edit for homepage UI changes), `components/ds/Card.tsx`, `components/ds/Provider.tsx`.

**`lib/`:**
- Purpose: All non-UI logic — data fetching/aggregation, category/pricing business rules, env config, formatting, small React contexts/hooks that aren't tied to one component.
- Contains: `datasource.ts` (data-access facade), `amis.ts` (external API client), `retail.ts`/`category.ts` (business rules), `env.ts` (Zod env schema), `limits.ts` (rate-limit constants), `presence.ts`/`db.ts`/`agg.ts`/`supabase*.ts` (Supabase integration, largely unused on the live path), `format.ts`/`time.ts`/`cn.ts`/`utils.ts` (generic helpers), `price-mode.tsx`/`ui-prefs.ts` (client-side state/context), `mockData.ts` (in-memory fallback fixture used by `app/page.tsx` on fetch failure).

**`types/`:**
- Purpose: Centralized TypeScript type definitions shared across the whole app.
- Contains: `types/index.ts` only. All types are imported via `@/types`.

**`aliases/`:**
- Purpose: Static reference data, not code.
- Contains: `category-map.json` — a `{ "cropName": "category" }` map consumed by `lib/retail.ts` and `lib/category.ts`.

**`config/`:**
- Purpose: App-level feature flags/constants (distinct from `lib/env.ts`, which is env-var-driven config).
- Contains: `ui.ts` (`HOME_UI_VERSION`).

**`design-system/`:**
- Purpose: Design tokens (colors, spacing) that feed `tailwind.config.ts`.
- Contains: `tokens.ts`.

**`src/`:**
- Purpose: Legacy/leftover scaffold directory. `src/config/` exists but is empty (no files). Not used by the build — `tsconfig.json`'s `@/*` alias resolves to the project root, not `src/`.
- Generated: No. Committed: Yes (empty dir, likely safe to remove).

**`public/mock/`:**
- Purpose: Static fixture data served directly by Next.js's static file server, consumed by `lib/datasource.ts` when `DATA_SOURCE=mock`.
- Contains: `latest.json`, `history/{cropCode}.json` per-crop history fixtures.

**`scripts/`:**
- Purpose: One-off Node scripts run outside the Next.js runtime (via `node scripts/xxx.js` or `npm run sync:now`), used for manual testing of the rate-limit/presence logic and deployment.
- Contains: `sync-now.js`, `test-limit*.js`, `test-final.js`, `deploy-vercel.sh`.

**`docs/`:**
- Purpose: Project documentation supplementary to the root `README.md`.
- Contains: `CRON.md` (notes on the daily-ingest cron job).

**SQL files (root):**
- Purpose: Manually-run Supabase database setup scripts (schema, RLS policies). Not executed by application code or CI — must be run by hand against the Supabase project.
- Contains: `setup-database.sql`, `supabase-schema.sql`, `supabase-rls.sql`.

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout — providers, global chrome.
- `app/page.tsx`: Home page `/` — the main user-facing entry point.
- `app/api/data/latest/route.ts`: Primary data API consumed by the homepage.
- `app/api/jobs/daily-ingest/route.ts`: Vercel Cron entry point (`vercel.json`).

**Configuration:**
- `lib/env.ts`: Zod-validated environment variables (`DATA_SOURCE`, retail coefficients).
- `config/ui.ts`: UI version feature flag.
- `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.js`: Standard tooling config.
- `vercel.json`: Cron schedule.
- `.env.local` / `.env.local.example`: Local environment variables (contents not read/quoted here — see `ENV_SETUP.md` for setup instructions).

**Core Logic:**
- `lib/datasource.ts`: Data-access facade (mock vs. live AMIS).
- `lib/amis.ts`: External AMIS API client.
- `lib/retail.ts`, `lib/category.ts`: Crop categorization and retail-price estimation — the core "don't get overcharged" business logic.

**Testing:**
- No formal test framework/config detected (no `jest.config.*`, `vitest.config.*`, `*.test.*`, or `*.spec.*` files found in the repo).
- `scripts/test-limit.js`, `scripts/test-limit-precise.js`, `scripts/test-limit-simple.js`, `scripts/test-final.js`: Ad hoc manual Node scripts for exercising the rate-limit/presence logic; not run automatically by any test runner or CI step. See TESTING.md for full detail (quality-focus mapping).

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g. `HomeLegacy.tsx`, `PriceDetailChart.tsx`).
- Non-component TypeScript modules: `camelCase.ts` (e.g. `datasource.ts`, `retail.ts`, `env.ts`).
- Next.js special files use framework-mandated lowercase names: `page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`.
- SQL files: `kebab-case.sql` (e.g. `supabase-schema.sql`, `supabase-rls.sql`).

**Directories:**
- Route segments under `app/` are lowercase, matching the URL path (`app/wait/` → `/wait`, `app/api/data/latest/` → `/api/data/latest`).
- Private/non-route helper folders under `app/api/` are prefixed with an underscore (`_lib/`) per Next.js convention.
- Component sub-categories use lowercase folder names: `components/ds/`, `components/ui/`.

## Where to Add New Code

**New Feature (new homepage section, new business logic):**
- Primary UI: Add to or extend `components/HomeLegacy.tsx` (the currently-rendered homepage), not the orphaned `RankBoard`/`CheapestBoard`/`RankRows` set — those are dead code unless explicitly revived and wired into `app/page.tsx`.
- Business logic: New pure functions belong in `lib/` (follow the pattern of `lib/retail.ts` / `lib/category.ts` — small, testable, no React dependency).
- Types: Add/extend types in `types/index.ts`.

**New API Route:**
- Create `app/api/<segment>/route.ts` exporting `GET`/`POST` handlers per Next.js App Router convention (mirror `app/api/data/latest/route.ts` for the error-handling and `NextResponse.json` pattern).
- Shared, non-routable API helpers go in `app/api/_lib/`.

**New Component:**
- Page-specific/feature components: `components/` root.
- Reusable, style-agnostic primitives: `components/ds/` (follow existing primitives like `components/ds/Card.tsx`, `components/ds/Badge.tsx` for prop/variant conventions using `class-variance-authority`).
- Global app chrome (nav, footer): `components/ui/`.

**Utilities:**
- Shared helpers: `lib/utils.ts`, `lib/format.ts`, `lib/cn.ts` (className merging, wraps `clsx`/`tailwind-merge`).

**Database/Supabase work:**
- If reviving real persistence, `lib/db.ts` and `lib/agg.ts` already define the intended table shapes (`MarketPrice`, `DailyAggregate`, `UpdateLedger`) and TODO markers for where real Supabase calls should replace the current mock/stub implementations.
- Schema changes belong in `supabase-schema.sql` / `supabase-rls.sql` / `setup-database.sql` (run manually against Supabase; not part of any migration tooling).

## Special Directories

**`src/config/`:**
- Purpose: Empty, unused. Likely a leftover from an earlier refactor.
- Generated: No. Committed: Yes.

**`public/mock/`:**
- Purpose: Fixture data for `DATA_SOURCE=mock` local development.
- Generated: No (hand-authored). Committed: Yes.

**`.next/`:**
- Purpose: Next.js build output.
- Generated: Yes. Committed: No (present locally but should be git-ignored — verify `.gitignore`).

**Dead/orphaned components (`components/RankBoard.tsx`, `RankRows.tsx`, `CheapestBoard.tsx`, `PriceTrendChart.tsx`, `PriceDetailChart.tsx`, `RetailToggle.tsx`):**
- Purpose: Appear to be an earlier iteration of the ranking/chart UI, superseded by `HomeLegacy.tsx` and `FloatingPriceMode.tsx` but not deleted.
- Generated: No. Committed: Yes. Not imported by any active route — verify before extending; prefer deleting or reviving deliberately rather than editing in place.

---

*Structure analysis: 2026-09-02*
