# Technology Stack

**Analysis Date:** 2026-09-02

## Languages

**Primary:**
- TypeScript ^5 - All application code (`app/`, `lib/`, `components/`, `types/`, `config/`)

**Secondary:**
- JavaScript (Node, CommonJS) - Operational/test scripts only: `scripts/sync-now.js`, `scripts/deploy-vercel.sh`, `scripts/test-final.js`, `scripts/test-limit-precise.js`, `scripts/test-limit-simple.js`, `scripts/test-limit.js`
- SQL - Database provisioning scripts at repo root: `setup-database.sql`, `supabase-schema.sql`, `supabase-rls.sql`

## Runtime

**Environment:**
- Node.js 20.x — pinned via `engines.node` in `package.json`; also set explicitly in CI (`.github/workflows/deploy.yml`, `node-version: '20'`)

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`, npm CI used in `.github/workflows/deploy.yml` via `npm ci`)

## Frameworks

**Core:**
- Next.js 14.0.0 (App Router) - Full-stack React framework; entry at `app/layout.tsx`, `app/page.tsx`; API routes under `app/api/**/route.ts`
- React ^18 / React DOM ^18 - UI rendering layer, used throughout `components/`
- Tailwind CSS ^3.3.0 - Utility-first styling; config at `tailwind.config.ts`, global styles at `app/globals.css`

**Data/Validation:**
- Zod ^3.22.4 - Runtime environment variable validation, see `lib/env.ts`

**Charting:**
- Recharts ^2.8.0 - Price history charts (consumed by chart components in `components/`)

**Testing:**
- None detected — no Jest/Vitest/Playwright config or dependency present. `scripts/test-*.js` are standalone Node scripts run manually, not part of a test framework/runner.

**Build/Dev:**
- Next.js CLI - `next dev`, `next build`, `next start`, `next lint` (see `package.json` scripts)
- PostCSS ^8 + Autoprefixer ^10.0.1 - CSS processing, `postcss.config.js`
- ESLint ^8 + `eslint-config-next` 14.0.0 - Linting, run via `npm run lint`

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.57.2 - Database client + Realtime Presence (online user counting); used in `lib/supabaseBrowser.ts`, `lib/db.ts`, `lib/presence.ts`, `app/api/_lib/online.ts`
- `zod` ^3.22.4 - Env var schema validation in `lib/env.ts`

**UI Utility:**
- `class-variance-authority` ^0.7.1 - Component variant styling
- `clsx` ^2.0.0 and `tailwind-merge` ^2.6.0 - Conditional/merged className composition, see `lib/cn.ts` and `lib/utils.ts`

**Infrastructure:**
- None beyond Supabase client above — no separate ORM, cache client, or queue library present.

## Configuration

**Environment:**
- `.env.local` (gitignored, present locally — not read/quoted here) holds runtime secrets; `.env.local.example` documents required shape:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_TABLE` (optional, default `daily_aggregates`)
- Additional env vars referenced in code (not in the example file, should be documented/added):
  - `DATA_SOURCE` (`mock` | `api` | `db`, default `mock`) - `lib/env.ts`
  - `RETAIL_COEF_LEAFY`, `RETAIL_COEF_FRUIT`, `RETAIL_COEF_ROOT`, `RETAIL_COEF_OTHER` - retail price multiplier coefficients, `lib/env.ts`
  - `NEXT_PUBLIC_USE_MOCK` (`1` to force mock client) - `lib/db.ts`
  - `CRON_SECRET` - Bearer token for manually-triggered ingest job, `app/api/jobs/daily-ingest/route.ts`, `scripts/sync-now.js`
  - `VERCEL_URL`, `BASE_URL` - base URL resolution for server-side fetches, `lib/datasource.ts`, `scripts/sync-now.js`
  - `NEXT_PUBLIC_BASE_URL` - base URL for mock data fetches, `lib/datasource.ts`
  - `SUPABASE_URL` - checked (non `NEXT_PUBLIC_`) in `lib/db.ts` and `app/api/_lib/online.ts` to detect mock mode; note this differs from the client-facing `NEXT_PUBLIC_SUPABASE_URL`, a likely inconsistency (see CONCERNS)
- Documentation of setup: `ENV_SETUP.md` (Traditional Chinese, describes real vs. mock mode)
- Secrets referenced in CI only (GitHub Actions secrets, not local files): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

**Build:**
- `next.config.js` - minimal, App Router stable (no experimental flags)
- `tsconfig.json` - `target: es5`, `strict: true`, path alias `@/*` → project root, `moduleResolution: bundler`
- `tailwind.config.ts` - custom brand colors (`brandGreen`, `brandOrange`), custom font (`Noto Sans TC`), custom border radii, container breakpoints, custom box shadows
- `postcss.config.js` - Tailwind + Autoprefixer plugins
- `vercel.json` - defines a Vercel Cron job: `{ "path": "/api/jobs/daily-ingest", "schedule": "5 19 * * *" }` (19:05 UTC daily = 03:05 Asia/Taipei)

## Platform Requirements

**Development:**
- Node.js 20.x, npm
- Optional `.env.local` with Supabase credentials; falls back to mock data if absent (`DATA_SOURCE=mock` default, or `NEXT_PUBLIC_USE_MOCK=1`)

**Production:**
- Deployment target: Vercel (see `vercel.json`, `scripts/deploy-vercel.sh`, `.github/workflows/deploy.yml`)
- CI/CD: GitHub Actions workflow (`deploy.yml`) builds with `npm ci && npm run build` and deploys via `amondnet/vercel-action@v25` on push/PR to `main`
- Scheduled job: Vercel Cron hits `/api/jobs/daily-ingest` daily; can also be triggered manually with `npm run sync:now` (requires `CRON_SECRET` and reachable `BASE_URL`)

---

*Stack analysis: 2026-09-02*
