# Coding Conventions

**Analysis Date:** 2026-09-02

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` (e.g. `components/RankBoard.tsx`, `components/Gatekeeper.tsx`, `components/ds/Button.tsx`)
- Library/utility modules: `camelCase.ts` (e.g. `lib/agg.ts`, `lib/format.ts`, `lib/supabaseBrowser.ts`, `lib/cn.ts`)
- Next.js App Router special files use framework-mandated names: `app/page.tsx`, `app/layout.tsx`, `app/error.tsx`, `app/api/*/route.ts`
- Internal/private route helpers live under an underscore-prefixed folder: `app/api/_lib/online.ts` (Next.js convention for non-routable folders)
- SQL files at repo root use kebab-case: `supabase-schema.sql`, `supabase-rls.sql`, `setup-database.sql`
- One-off manual test/verification scripts under `scripts/` use kebab-case: `scripts/test-limit-simple.js`, `scripts/test-final.js`

**Functions:**
- `camelCase`, verb-first: `getLatest`, `upsertMarketPrices`, `calculateWeightedAverage`, `formatPrice`, `getOnlineCount`
- Formatting helpers are prefixed `format*` (`lib/format.ts`: `formatCurrency`, `formatPercentage`, `formatNumber`, `formatPrice`, `formatVolume`, `formatDate`, `formatRelativeTime`, `formatFileSize`, `formatPhone`, `formatPriceChange`)
- Boolean/lookup helpers prefixed `get*`, `is*`, `has*`: `getCategory` (`lib/retail.ts`), `isMockMode`, `isApiMode` (`lib/env.ts`)
- Validation helpers prefixed `validate*`: `validateEnv`, `validateRequiredEnv` (`lib/env.ts`)

**Variables:**
- `camelCase` for local variables and function params.
- `UPPER_SNAKE_CASE` for module-level constants, especially limits/config: `SOFT_CAP`, `HARD_CAP`, `API_BUFFER`, `RETRY_AFTER`, `PRESENCE_CHANNEL` (`lib/limits.ts`); `TOP_N` (`components/RankBoard.tsx`)
- Data-model field names match the DB column naming, which is `camelCase` (not `snake_case`) even though this is a Postgres/Supabase project — see `MarketPrice`, `DailyAggregate` in `lib/db.ts` (`tradeDate`, `cropCode`, `createdAt`).

**Types:**
- `PascalCase` interfaces/types, often suffixed by role: `DailyAggregate`, `MarketPrice`, `UpdateLedger` (`lib/db.ts`), `PriceItem` (`types/index.ts`), `CurrencyFormatOptions`, `PercentageFormatOptions` (`lib/format.ts`)
- Component prop types use `{ComponentName}Props`: `ButtonProps` (`components/ds/Button.tsx`), `RankBoardProps` (`components/RankBoard.tsx`)
- Narrow string-literal unions for UI state/filters: `type GroupFilter = 'all' | 'veg' | 'fruit'`, `type DirectionMode = 'up' | 'down'` (`components/RankBoard.tsx`)

## Code Style

**Formatting:**
- No Prettier config present (`.prettierrc*` not found). Formatting is manual/editor-default: 2-space indentation, single quotes in most `.ts`/`.tsx` files, but some files (e.g. `lib/env.ts`) use double quotes — quote style is inconsistent across the codebase. Match the quote style of the file you are editing.
- Semicolons used consistently.
- Trailing commas used in multi-line object/array literals in most files.

**Linting:**
- ESLint is configured via `next lint` (script in `package.json`) using `eslint-config-next` (`package.json` devDependency `eslint-config-next: 14.0.0`). No `.eslintrc*` file was found in the repo root, so Next.js's default flat/legacy config resolution applies (Next may prompt to create one on first run of `npm run lint`). Do not assume custom lint rules exist — none were found.
- `tsconfig.json` uses `"strict": true`, so all new/edited TypeScript must satisfy strict type checking (no implicit `any`, strict null checks).

## Import Organization

**Order:**
Observed order in most files (not enforced by tooling, but consistently followed):
1. `'use client'` directive (if applicable) as the very first line, followed by a blank line
2. External packages (`react`, `next/server`, `zod`, `class-variance-authority`, `tailwind-merge`)
3. Internal absolute imports via `@/` alias (`@/lib/...`, `@/components/...`, `@/types`)
4. Relative imports for same-directory/nested helpers (e.g. `../../_lib/online` in `app/api/data/latest/route.ts`)

**Path Aliases:**
- `@/*` maps to project root (`tsconfig.json` → `"paths": { "@/*": ["./*"] }`). Use `@/lib/...`, `@/components/...`, `@/types` instead of long relative paths (`../../../lib/x`) for anything outside the immediate directory.

## Error Handling

**Patterns:**
- Server-side async functions (API routes, `lib/db.ts`, `lib/agg.ts`) wrap logic in `try/catch`, log with a bracketed module tag prefix, and either:
  - Rethrow a new `Error` with a user-facing Traditional Chinese message plus the original error message appended, e.g. in `lib/agg.ts`:
    ```ts
    throw new Error(`市場價格寫入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    ```
  - Or swallow the error and return a safe fallback (`null`, `[]`, or a default object) rather than propagating, e.g. `lib/db.ts` `getLatestUpdateTime()` returns `null` on failure instead of throwing.
- API routes (`app/api/data/latest/route.ts`) catch at the top level and return a `NextResponse.json({ error: ... }, { status: 500 })` with the error message interpolated into a Traditional Chinese string. Never let an uncaught exception surface a raw stack trace to the client.
- Config/env validation (`lib/env.ts`) never throws to the caller on failure — `validateEnv()` catches Zod parse errors, logs `❌ 環境變數驗證失敗`, and returns hardcoded defaults so the app still boots. When adding new env vars, follow this "fail soft with logged warning" pattern rather than crashing the process.
- Rate limiting / capacity errors use HTTP 503 with a `Retry-After` header and a JSON body of shape `{ error: string, message?: string }` (see `app/api/data/latest/route.ts`, constants from `lib/limits.ts`).
- Client components (`app/error.tsx`) use the Next.js `error.tsx` boundary convention: log via `console.error(error)` in a `useEffect`, then render a Traditional Chinese fallback UI with a "重試" (retry) button calling `reset()`.

## Logging

**Framework:** Plain `console.log` / `console.warn` / `console.error` — no external logging library.

**Patterns:**
- Every log line is prefixed with a bracketed module tag in caps, e.g. `[AGG]`, `[DB]`, `[API]`. When adding logs to a module, follow this `[TAG] message` convention using a short uppercase abbreviation of the module/file name.
- Log messages are written in Traditional Chinese, matching the product's UI language.
- Emoji is occasionally used for status signaling in scripts and validation logs (`✅`, `❌`, `🎉`, `🧪`) — seen in `scripts/test-final.js` and `lib/env.ts`. This style is acceptable for diagnostic/console-only scripts but not used in production API responses.
- `console.error` is used for actual failures; `console.warn` for recoverable/expected conditions (e.g. rate-limit rejection in `app/api/data/latest/route.ts`); `console.log` for informational progress messages.

## Comments

**When to Comment:**
- File-level block comments at the top of most `lib/*.ts` files describe the module's purpose in Traditional Chinese, e.g.:
  ```ts
  /**
   * 資料聚合與處理
   * 將 AMIS 原始資料聚合為日報表
   */
  ```
- Section comments (`// 篩選器`, `// 排行表`) mark logical blocks inside React components and long functions — follow this to break up large render trees or multi-step functions.
- `// TODO:` markers are used to flag intentionally unfinished/stubbed logic (see `lib/agg.ts` — `upsertMarketPrices` and `rebuildDailyAggregates` are currently stubs with mock data and `TODO: 實作...` comments). Check for `TODO` markers before assuming a function is production-ready.

**JSDoc/TSDoc:**
- Exported functions in `lib/format.ts` use full JSDoc blocks with `@param`/`@returns` tags, in Traditional Chinese. This is the most thorough example of the pattern in the codebase — use it as the template for new formatting/utility functions:
  ```ts
  /**
   * 格式化貨幣
   * @param amount 金額
   * @param options 格式化選項
   * @returns 格式化後的貨幣字串
   */
  export function formatCurrency(...)
  ```
- Not all modules follow full JSDoc (e.g. `lib/limits.ts` uses only inline `//` comments next to constants). JSDoc is expected for public utility functions with multiple parameters/options objects; inline comments suffice for simple constants.

## Function Design

**Size:** Functions are typically short (10-40 lines) and single-purpose. React components can be longer (100-200+ lines) because JSX markup is inlined rather than extracted into subcomponents — see `components/RankBoard.tsx` (~230 lines) which keeps filter UI, table rendering, and empty state in one component function.

**Parameters:** Multi-option functions take an `options` object with defaults destructured at the top of the function body (see every `format*` function in `lib/format.ts`), e.g.:
```ts
export function formatPercentage(value: number, options: PercentageFormatOptions = {}): string {
  const { locale = 'zh-TW', minimumFractionDigits = 1, ... } = options;
  ...
}
```

**Return Values:** Async data-fetching functions return typed Promises and prefer safe fallback values (`[]`, `null`, `0`) over throwing when the failure is recoverable at the call site (see `lib/db.ts`). Pure calculation helpers guard against invalid input by returning `0` rather than `NaN` or throwing (see `calculateWeightedAverage`, `calculateDayOverDay` in `lib/agg.ts`).

## Module Design

**Exports:** Mix of `export default` (single primary export per file — used for React components, e.g. `export default function RankBoard(...)`) and named exports (used for utility/lib modules with multiple related functions, e.g. `lib/format.ts`, `lib/db.ts`). Follow this split: one component per file with a default export; multi-function utility modules with named exports.

**Barrel Files:** Only one barrel-style file exists: `types/index.ts` (shared type definitions imported via `@/types`). There is no barrel file for `components/` or `lib/` — import directly from the specific file (`@/lib/format`, `@/components/ds/Button`), not from a directory index.

**Client vs Server:** Files that use React hooks or browser APIs start with `'use client'` as the first line (e.g. `components/RankBoard.tsx`, `components/ds/Button.tsx`, `app/error.tsx`). API route handlers and most `lib/` data files have no directive and run on the server by default. When adding a new interactive component, add `'use client'` at the top; when adding a new server-only data helper, omit it.

## UI/Styling Conventions

- Tailwind CSS utility classes are used directly in JSX; no CSS modules or styled-components.
- Design-system primitives live in `components/ds/` (`Button.tsx`, `Card.tsx`, `Badge.tsx`, `Segmented.tsx`, etc.) built with `class-variance-authority` (`cva`) for variant props and `cn()` (`lib/cn.ts`, wrapping `tailwind-merge`) for conditional class merging. Prefer composing these primitives over writing raw `<button>`/`<div>` with ad hoc classes for new UI.
- Design tokens are centralized in `design-system/tokens.ts` and Tailwind theme extension in `tailwind.config.ts` (custom colors like `brandOrange`, `brandGreen`, `ink`, `muted`, `bg` are used throughout components instead of raw Tailwind gray/blue palette).
- All user-facing copy is Traditional Chinese (zh-TW). Numeric/date formatting always goes through `lib/format.ts` helpers rather than inline `toFixed()`/`toLocaleString()` calls, to keep locale formatting consistent.
- Accessibility attributes (`role="tablist"`, `role="tab"`, `aria-pressed`, `aria-controls`, `aria-label`) are applied to custom interactive widgets like tab-style filters (`components/RankBoard.tsx`) — follow this pattern for any new custom (non-native) interactive control.

---

*Convention analysis: 2026-09-02*
