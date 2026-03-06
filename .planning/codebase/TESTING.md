# Testing Patterns

**Analysis Date:** 2026-03-05

## Test Framework

**Runner:** None detected

No test runner configuration files exist in this project. There are no `jest.config.*`, `vitest.config.*`, or `playwright.config.*` files, and no test files (`*.test.*` or `*.spec.*`) anywhere in the repository.

**Assertion Library:** None

**Run Commands:**
```bash
# No test commands configured in package.json scripts
pnpm dev       # development server only
pnpm build     # production build
pnpm preview   # preview build
```

## Test File Organization

**Location:** No test files exist

**Naming:** No convention established

**Structure:** No test directory or co-located test files

## Test Structure

No testing patterns to document — the codebase has no test files.

## Mocking

**Framework:** None

## Fixtures and Factories

**Test Data:** None

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No coverage tooling configured
```

## Test Types

**Unit Tests:** Not used

**Integration Tests:** Not used

**E2E Tests:** Not used

## Validation Approach (Production Code)

While there are no automated tests, the codebase uses several runtime validation patterns that serve as a partial substitute for input testing:

**Zod Schema Validation:**
- All API route POST/PUT handlers validate input with Drizzle-Zod generated schemas before any DB writes
- `safeParse` is used (not `parse`) so errors return structured 400 responses rather than throwing:
  ```typescript
  const parsed = insertProductSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid data", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  ```
- Insert schemas are defined in `src/lib/db/schema.ts` via `createInsertSchema(table).omit({...})` from `drizzle-zod`

**Astro Action Input Validation:**
- Actions in `src/actions/index.ts` declare `input: z.object({...})` schemas inline
- Validation is enforced by the Astro Actions framework before the handler runs

**Client-side Validation:**
- Manual validation functions co-located with forms (e.g., `validateCustomerInfo` in `src/components/quote/quote-builder.tsx`)
- Returns `Record<string, string>` error maps; components render errors per-field

**Auth Guards:**
- Every API route handler checks `locals.user` and `locals.session` before executing
- Middleware at `src/middleware.ts` enforces session checks for `/admin` and `/api/admin` paths

## Recommendations for Adding Tests

If tests are introduced, the following approach would align with the existing stack:

**Recommended Framework:** Vitest (compatible with Vite-based projects; minimal config needed)

**Suggested Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
```

**High-Priority Areas to Test First:**
1. `src/lib/utils.ts` — `cn()` and `formatCanonicalURL()` are pure functions, trivially testable
2. `src/components/admin/products/utils.ts` — `formatCurrency()` is pure
3. `src/hooks/use-url-filters.ts` — complex URL sync logic with no tests
4. `src/lib/auth/index.ts` — invite token validation logic (would need DB mock)
5. API route handlers in `src/pages/api/admin/` — input validation and auth guard paths

**Co-location Pattern to Follow:**
Place test files next to the source file they test:
```
src/lib/utils.ts
src/lib/utils.test.ts
```

---

*Testing analysis: 2026-03-05*
