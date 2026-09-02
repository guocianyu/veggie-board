# Testing Patterns

**Analysis Date:** 2026-09-02

## Test Framework

**Runner:**
- None. No test runner (Jest, Vitest, Mocha, etc.) is installed — `package.json` has no `test` script and no test-framework dependency in `dependencies` or `devDependencies`. No `jest.config.*` or `vitest.config.*` file exists in the repo.
- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files exist anywhere in the project.

**Assertion Library:**
- Not applicable — no assertion library is installed.

**Run Commands:**
```bash
# There is no automated test command.
npm run lint      # next lint — the only quality-gate script defined in package.json
npm run build     # next build — used as the de facto correctness check (TypeScript strict mode + Next.js build)
```

The CI pipeline (`.github/workflows/deploy.yml`) only runs `npm ci` and `npm run build` before deploying to Vercel — it does not run any test step. `npm run build` succeeding (which includes TypeScript type-checking because `tsconfig.json` has `"strict": true` and Next.js type-checks during build) is currently the only automated correctness signal in the project.

## Test File Organization

**Location:**
- Not applicable — no unit/integration test files exist.
- The closest analog is a set of manual, script-based verification tools under `scripts/`:
  - `scripts/test-limit.js`
  - `scripts/test-limit-simple.js`
  - `scripts/test-limit-precise.js`
  - `scripts/test-final.js`

**Naming:**
- These scripts use a `test-*.js` naming convention but are plain Node.js scripts, not test-runner test files. They are invoked directly with `node scripts/test-final.js`, not through `npm test`.

**Structure:**
```
scripts/
├── deploy-vercel.sh          # deployment helper
├── sync-now.js                # manual data-sync trigger
├── test-limit.js              # rate-limit load test (30s duration, 65 concurrent users)
├── test-limit-simple.js       # simplified rate-limit load test
├── test-limit-precise.js      # precision variant of rate-limit test
└── test-final.js              # "final acceptance" test — runs rate-limit + retry-after checks
```

## Test Structure

**Suite Organization:**
There is no `describe`/`it`/`test` suite structure anywhere in the codebase. The manual scripts are self-contained async functions run top-to-bottom against a live server, e.g. (`scripts/test-limit.js`):
```javascript
const BASE_URL = 'http://localhost:3000';
const CONCURRENT_USERS = 65; // exceeds hard cap of 60

function simulateUser(userId) {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/api/data/latest`, (res) => {
      // collect response, resolve with { userId, statusCode, duration, ... }
    });
    req.on('error', (err) => resolve({ userId, statusCode: 0, error: err.message }));
    req.setTimeout(10000, () => { /* handle timeout */ });
  });
}
```
`scripts/test-final.js` fires 100 concurrent requests via `Promise.all`, then aggregates `statusCode` counts and prints pass/fail lines to the console using emoji markers (`✅`/`❌`).

**Patterns:**
- Setup: none (no fixtures/mocks are set up — scripts hit a real running `next dev` server on `localhost:3000` over real HTTP).
- Teardown: none.
- Assertion pattern: manual — scripts compute aggregate statistics (counts of `200` vs `503` responses, presence of `Retry-After` header) and `console.log` a `✅`/`❌` verdict rather than throwing/asserting. There is no exit-code-based pass/fail signal; a human must read the console output to confirm results. This means these scripts cannot be wired into CI as-is (no non-zero exit on failure).

## Mocking

**Framework:** None (no `jest.mock`, `vi.mock`, `sinon`, or similar).

**Patterns:**
Rather than mocking at the test-framework level, the codebase implements **runtime data mocking** baked directly into application code, controlled by environment variables:
- `lib/supabaseMock.ts` — a hand-written mock Supabase client, dynamically `import()`ed in `lib/db.ts` when `NEXT_PUBLIC_USE_MOCK=1` is set client-side.
- `lib/mockData.ts` and `lib/db.ts`'s `generateMockDailyAggregates()` — hardcoded arrays of realistic Taiwanese produce data (crop names, prices, volumes) returned when `DATA_SOURCE=mock` (see `lib/env.ts`) or when no Supabase config is present (`hasSupabaseConfig` check in `lib/db.ts`).
- `lib/datasource.ts` acts as the seam: `getLatest()` branches between mock and real API/DB sources based on `env.DATA_SOURCE` (`mock` | `api` | `db`), so the "mocking" boundary is an application-level data-source switch, not a test-time mock.

**What to Mock:**
- When adding new data-fetching code, follow the existing pattern: add a mock-data branch controlled by `lib/env.ts`'s `isMockMode`/`DATA_SOURCE` rather than introducing a test-mocking library.

**What NOT to Mock:**
- Not applicable — there is no test suite drawing this distinction.

## Fixtures and Factories

**Test Data:**
Static, hand-authored fixture-like data is embedded directly in source files rather than in a dedicated fixtures directory:
```typescript
// lib/db.ts — generateMockDailyAggregates()
const mockData: DailyAggregate[] = [
  { id: '1', tradeDate: today, cropCode: 'C001', cropName: '高麗菜', wavg: 25.5, vol: 1500, dod: 5.2, ... },
  // ...95 hardcoded rows covering 葉菜類/根莖類/瓜果類/水果類 categories
];
```
`lib/mockData.ts` serves a similar purpose for other parts of the app. `aliases/category-map.json` and `public/mock/` provide additional static reference/mock data consumed at runtime.

**Location:**
- `lib/mockData.ts`, inline arrays in `lib/db.ts`, `public/mock/` (static JSON served as mock API responses), `aliases/category-map.json`.
- No `__fixtures__` or `test/fixtures` directory exists.

## Coverage

**Requirements:** None enforced. No coverage tool (`nyc`, `c8`, `--coverage` flags) is configured.

**View Coverage:**
```bash
# Not applicable — no coverage tooling is set up.
```

## Test Types

**Unit Tests:**
- None exist. Pure functions well-suited to unit testing (e.g. `calculateWeightedAverage`, `calculateDayOverDay` in `lib/agg.ts`; the `format*` helpers in `lib/format.ts`) currently have zero test coverage.

**Integration Tests:**
- None exist in an automated form. The manual scripts in `scripts/` (`test-limit*.js`, `test-final.js`) function as ad hoc integration/load tests against the rate-limiting feature (`lib/limits.ts`, `lib/presence.ts`, `components/Gatekeeper.tsx`, `app/api/data/latest/route.ts`, `app/api/_lib/online.ts`), but require a manually started local server (`npm run dev`) and manual interpretation of console output. Results of one such manual run are documented in `LIMIT_ACCEPTANCE_REPORT.md` (a written report, not a re-runnable/CI-checked artifact).

**E2E Tests:**
- Not used. No Playwright/Cypress/Puppeteer dependency exists.

## Common Patterns

**Async Testing:**
No formal async test pattern exists. The closest equivalent, from `scripts/test-final.js`, fires many concurrent requests and awaits them all:
```javascript
async function testAPILimiting() {
  const promises = [];
  for (let i = 1; i <= 100; i++) {
    promises.push(makeRequest(i));
  }
  const results = await Promise.all(promises);
  const successful = results.filter(r => r.statusCode === 200).length;
  const limited = results.filter(r => r.statusCode === 503).length;
  // console.log a verdict; no assertion library used
}
```

**Error Testing:**
No formal error-path testing exists. Error handling correctness (e.g. that `lib/db.ts` functions return safe fallbacks instead of throwing, or that API routes return proper status codes) is currently verified only by manual inspection/code review, not automated tests.

## Recommendations for New Work

Because there is no test infrastructure at all, any phase that introduces testing should:
1. Add a test runner as a devDependency (Vitest is the lowest-friction choice for a Next.js 14 + TypeScript project; Jest is the more "traditional" `eslint-config-next`-aligned choice) and a `test` script in `package.json`.
2. Start with pure-function unit tests for `lib/agg.ts` (`calculateWeightedAverage`, `calculateDayOverDay`) and `lib/format.ts` (all `format*` functions) — these have no external dependencies and are the highest-value, lowest-effort targets.
3. Convert the manual `scripts/test-limit*.js` load tests into assertion-based integration tests (or keep them as manual scripts but add a scripted, non-zero-exit-code check) if rate-limiting behavior needs regression protection.
4. Add a test step to `.github/workflows/deploy.yml` before the `Build application` step once a runner exists, so CI gates deploys on passing tests.

---

*Testing analysis: 2026-09-02*
