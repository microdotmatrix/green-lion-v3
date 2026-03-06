# Codebase Concerns

**Analysis Date:** 2026-03-05

## Tech Debt

**Missing Role-Based Access Control:**
- Issue: All authenticated and approved users have equal admin access. There is no role field on the `user` table, no role checks in API routes, and no permission hierarchy.
- Files: `src/layouts/admin.astro` (line 30 TODO comment), `src/lib/db/schema.ts` (user table)
- Impact: Any approved user can perform destructive actions (delete products, delete users, revoke invites). A compromised approved account has full admin capability.
- Fix approach: Add a `role` enum column (`admin`, `editor`, `viewer`) to the `user` table. Add a migration. Gate destructive endpoints behind an `admin` role check. Update all API routes under `src/pages/api/admin/` to check `locals.user.role`.

**Inconsistent Admin Authorization Checks:**
- Issue: Most admin API routes only check `!locals.user || !locals.session` (authentication). Only the invite-related routes additionally check `locals.user.approved`. The `approved` check is absent from 25 of 31 admin API files.
- Files: `src/pages/api/admin/products/`, `src/pages/api/admin/categories/`, `src/pages/api/admin/quotes/`, `src/pages/api/admin/feedback/`, `src/pages/api/admin/services/`, `src/pages/api/admin/users/`, etc.
- Impact: A user who successfully authenticates but has not been approved could access admin APIs directly by bypassing the UI. The Astro middleware may block the page, but API routes are not covered.
- Fix approach: Add `if (!locals.user.approved) { return 403 }` guard to every admin API route, or centralize auth in middleware.

**Quote Number Race Condition:**
- Issue: `generateQuoteNumber()` counts total rows in `quoteRequests` and adds 10001. Two simultaneous requests will read the same count and produce duplicate quote numbers.
- Files: `src/pages/api/quotes/index.ts` (lines 24-29)
- Impact: Quote numbers (`GLI-*`) are displayed to customers and used for reference. Duplicates corrupt records and could cause confusion or data integrity issues. The `quoteNumber` column has a `.unique()` constraint so one insert will fail with a 500 error.
- Fix approach: Use a PostgreSQL sequence (`CREATE SEQUENCE`) or `gen_random_uuid()` formatted as a prefix, or use a database-level auto-increment with a trigger. Alternatively, use a row-level lock or `INSERT ... RETURNING` with a sequence.

**Duplicate Contact Form Logic:**
- Issue: Contact form submission logic exists in two places that are nearly identical: `src/actions/index.ts` (Astro Actions, form-based) and `src/pages/api/contact/index.ts` (REST API endpoint). Both insert to `contactSubmissions` and call `sendAdminNotifications`.
- Files: `src/actions/index.ts`, `src/pages/api/contact/index.ts`
- Impact: Bugs fixed in one place will not be fixed in the other. Email template changes must be duplicated. It is unclear which path the production contact form actually uses.
- Fix approach: Remove one path. If the contact page uses the Astro Action (`src/actions/index.ts`), delete `src/pages/api/contact/index.ts`. Extract shared `sendAdminNotifications` into `src/server/notifications.ts`.

**`products.updatedAt` Not Auto-Updated by ORM:**
- Issue: The `products` table defines `updatedAt: timestamp("updated_at").defaultNow().notNull()` but without `.$onUpdate(() => new Date())`. The update endpoint manually sets `updatedAt: new Date()`, but this pattern is fragile — any future UPDATE that omits it will leave a stale timestamp.
- Files: `src/lib/db/schema.ts` (line 184), `src/pages/api/admin/products/[id].ts` (line 120)
- Impact: Stale `updatedAt` timestamps mislead cache logic and audit trails.
- Fix approach: Add `.$onUpdate(() => new Date())` to `products.updatedAt` in the schema, matching the pattern used by `user`, `session`, `account`, and `contactSubmissions`.

**`UPLOADTHING_TOKEN` Outside Astro Env Schema:**
- Issue: `UPLOADTHING_TOKEN` is accessed via `import.meta.env.UPLOADTHING_TOKEN` in `src/pages/api/uploadthing.ts` but is not declared in the `env.schema` in `astro.config.mjs`. It will silently be `undefined` if missing, causing uploads to fail at runtime without a clear build-time error.
- Files: `src/pages/api/uploadthing.ts` (line 7), `astro.config.mjs`
- Impact: Silent failure of file uploads in production if the env var is not set.
- Fix approach: Add `UPLOADTHING_TOKEN: envField.string({ context: "server", access: "secret" })` to `astro.config.mjs`.

**Enum-like Values Stored as Unconstrained Text:**
- Issue: Several columns store values from a fixed set but use plain `text()` instead of a PostgreSQL enum or a `check` constraint. This allows any string to be inserted at the database level.
- Files: `src/lib/db/schema.ts`
  - `quoteRequests.status`: `'pending' | 'reviewed' | 'quoted' | 'closed'` (line 311)
  - `contactSubmissions.type`: `'general' | 'feedback' | 'quote_inquiry' | 'support'` (line 404)
  - `contactSubmissions.status`: `'open' | 'needs_review' | 'closed'` (line 405)
  - `customizationAttributes.attributeType`: `'text' | 'number' | 'boolean' | 'select' | 'multi_select'` (line 224)
  - `tradeshowLeads.contactMethod` (uses `.$type<>()` which is TS-only, no DB constraint)
- Impact: Invalid status values can enter the DB if client code is modified or APIs are called directly.
- Fix approach: Convert to `pgEnum` in Drizzle schema and add a migration, or add database-level `CHECK` constraints.

**Schema Circular Reference Workarounds with `any`:**
- Issue: The `categories` and `products` tables have circular foreign key references that require `(): any =>` type casts to compile.
- Files: `src/lib/db/schema.ts` (lines 142, 163)
- Impact: Defeats TypeScript type checking on those foreign key references.
- Fix approach: Restructure the schema to break the circular dependency (e.g., move `headerImageProductId` to a separate settings table), or accept it as a known drizzle limitation and document it.

## Known Bugs

**Quote Cart Key Mismatch (Potential):**
- Symptoms: The `product-search.tsx` and `[product].astro` both use the hard-coded string `"quoteCart"` as the localStorage key. The `quote-builder.tsx` exports `CART_KEY = "quoteCart"` from `src/components/quote/types.ts` but the other two files do not import this constant.
- Files: `src/components/catalog/product-search.tsx` (line 160), `src/pages/products/[category]/[product].astro` (line 423), `src/components/quote/types.ts` (line 38)
- Trigger: If the key name is ever changed in `types.ts`, the other two files will silently use a different key, breaking the shared cart.
- Fix approach: Import `CART_KEY` from `src/components/quote/types.ts` in both `product-search.tsx` and the product detail page script.

**In-Memory Stats Cache Not Invalidated on Mutation:**
- Symptoms: The dashboard stats endpoint uses a module-level `cachedStats` variable with a 30-second TTL. The cache is not cleared when products, quotes, or leads are created/updated.
- Files: `src/pages/api/admin/stats.ts` (lines 11-16, 120-123)
- Trigger: Creating a new quote or product will not be reflected in dashboard stats for up to 30 seconds. In a serverless/Netlify deployment, module-level state may not persist at all between cold starts, making the cache ineffective.
- Fix approach: Remove the in-memory cache (it is unreliable serverless) and rely on HTTP `Cache-Control` headers or a proper cache layer. Alternatively, use Netlify's edge cache.

## Security Considerations

**No Rate Limiting on Public Forms:**
- Risk: The contact form API (`src/pages/api/contact/index.ts`) and quote submission API (`src/pages/api/quotes/index.ts`) are unauthenticated and have no rate limiting, CAPTCHA, or spam protection. The auth endpoint (`src/pages/api/auth/[...all].ts`) has rate limiting commented out.
- Files: `src/pages/api/contact/index.ts`, `src/pages/api/quotes/index.ts`, `src/pages/api/auth/[...all].ts` (line 7-8)
- Current mitigation: None detected.
- Recommendations: Add rate limiting at the Netlify edge or via a middleware layer. Consider adding a honeypot field to forms. Enable the commented-out `x-forwarded-for` forwarding for better-auth's built-in rate limiting.

**HTML Email Templates with Partial XSS Protection:**
- Risk: Admin notification emails in `src/pages/api/contact/index.ts` and `src/actions/index.ts` interpolate user-supplied values directly into HTML without escaping. The reply email handler (`src/pages/api/admin/feedback/[id]/reply.ts`) correctly uses `escapeHtml()`, but the contact notification emails do not.
- Files: `src/pages/api/contact/index.ts` (lines 101-134), `src/actions/index.ts` (lines 85-121)
- Current mitigation: Resend likely escapes rendered HTML in its rendering pipeline, but this is not guaranteed.
- Recommendations: Apply the same `escapeHtml()` function from `src/pages/api/admin/feedback/[id]/reply.ts` to all user-supplied values in email templates, or use the `@react-email/components` package already installed.

**`(globalThis as any)` Cast for UploadThing SSR Config:**
- Risk: The UploadThing SSR provider uses `(globalThis as any).__UPLOADTHING ??= routerConfig` which bypasses TypeScript's type system to set a global variable.
- Files: `src/components/providers/upload-ssr.astro` (line 11)
- Current mitigation: This is a documented pattern from the UploadThing library for SSR. Low severity.
- Recommendations: Monitor UploadThing library updates for a typed alternative.

**Admin `approved` Flag as Only Access Gate:**
- Risk: The `approved` boolean is set by any other approved user via `src/pages/api/admin/users/[id].ts`. There is no super-admin concept. One rogue approved user can approve others or revoke approval from legitimate admins (except themselves via the self-revoke guard).
- Files: `src/pages/api/admin/users/[id].ts` (lines 77-85)
- Current mitigation: A self-revoke guard exists for the `approved` field. No guard exists for revoking others.
- Recommendations: Implement role-based access (see RBAC concern above). Only `admin` role users should be able to change the `approved` or `role` fields.

## Performance Bottlenecks

**Product Detail Pages Are Fully Pre-rendered at Build Time:**
- Problem: `src/pages/products/[category]/[product].astro` and `src/pages/products/[category].astro` use `export const prerender = true`. Every product requires a database query during build.
- Files: `src/pages/products/[category]/[product].astro` (line 14), `src/pages/products/[category].astro` (line 16)
- Cause: `getStaticPaths()` runs one query to fetch all products, but then each product page at render time runs two additional queries (pricing tiers, attributes). For N products, this is O(2N) queries at build time.
- Improvement path: Use Drizzle's relation queries in a single `getStaticPaths()` call to batch-fetch all needed data and pass it as props, eliminating per-page queries at build time.

**No Pagination Limit Validation:**
- Problem: Pagination endpoints accept a `limit` query parameter directly from user input with no upper bound. A caller can set `limit=99999` to force a full table scan.
- Files: `src/pages/api/admin/products/index.ts` (line 24), `src/pages/api/admin/quotes/index.ts` (line 17), `src/pages/api/admin/feedback/index.ts` (line 17), `src/pages/api/quotes/index.ts` (line 146)
- Cause: `parseInt(searchParams.get("limit") || "25")` with no `Math.min()` cap.
- Improvement path: Add `const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100)` to all paginated endpoints.

**Tradeshow Rep Detail: N+1 Query Pattern:**
- Problem: The tradeshow rep detail endpoint runs 5 separate sequential queries (rep, categories, products, services, leads) using individual `await db.select()` calls.
- Files: `src/pages/api/admin/tradeshows/[id].ts` (lines 34-85)
- Cause: No query batching for this handler unlike `src/pages/api/admin/stats.ts` which uses `db.batch()`.
- Improvement path: Use `db.batch([...])` to parallelize the 5 queries, matching the pattern in `stats.ts`.

## Fragile Areas

**Quote Cart: localStorage-Based State Across Multiple Entry Points:**
- Files: `src/components/catalog/product-search.tsx`, `src/pages/products/[category]/[product].astro`, `src/components/quote/quote-builder.tsx`, `src/components/layout/header.astro`
- Why fragile: Cart state is managed with raw `localStorage` key `"quoteCart"` in four separate places with slightly different logic. The product detail page (Astro island-less vanilla JS) and the React `product-search.tsx` component both write to the same key with different object shapes (the product page omits `minimumOrderQuantity` and `orderQuantityIncrement`). The quote builder's `enrichCartItems()` compensates for missing fields at read time, which is a silent compatibility shim.
- Safe modification: Any change to the cart item shape must be updated in all four files simultaneously and must be backward-compatible with existing localStorage data.
- Test coverage: No tests.

**Static Product URL Slugs Derived from Category Name:**
- Files: `src/pages/products/[category]/[product].astro` (lines 35-39)
- Why fragile: Category name is slugified at build time to form the URL (`/products/vaporizers/product-sku`). If a category is renamed in the database, all its product URLs change, breaking bookmarks, external links, and SEO. There is no slug field on the `categories` table.
- Safe modification: Do not rename categories in the admin. If renaming is needed, add a `slug` field to `categories` table and use it instead of derived slugs.
- Test coverage: No tests.

**Admin Stats In-Memory Cache in Serverless Environment:**
- Files: `src/pages/api/admin/stats.ts` (lines 11-23)
- Why fragile: The `cachedStats` module-level variable works in long-running Node.js processes but is unreliable in serverless (Netlify Functions) where each invocation may get a fresh module instance. The 30-second TTL may never be hit, making every request a live DB query — or it may persist across users in edge cases.
- Safe modification: Treat the cache as best-effort only. Do not add correctness-critical logic that depends on cache state.

## Scaling Limits

**Neon Serverless HTTP Driver:**
- Current capacity: Each Drizzle query creates a fresh HTTP connection to Neon's serverless endpoint. This is optimized for cold-start latency but has higher per-query overhead than a connection pool.
- Limit: Under sustained concurrent load (e.g., many quote submissions), the lack of connection pooling may cause latency spikes. The `db.batch()` pattern mitigates this where used.
- Scaling path: Use Neon's connection pooling endpoint (PgBouncer-compatible) or switch to `drizzle-orm/neon-serverless` with WebSocket connections for sustained workloads.

## Dependencies at Risk

**`dotenv` in `drizzle.config.ts`:**
- Risk: `drizzle.config.ts` uses `dotenv` to load `.env.local`. This is a dev-only tool-config file. If `dotenv` is removed from dependencies or the `.env.local` file is missing, `drizzle-kit push` and `drizzle-kit migrate` will fail silently with a bad DATABASE_URL.
- Files: `drizzle.config.ts`
- Impact: Database migrations fail locally if `.env.local` is not present.
- Migration plan: Document that `.env.local` is required for migration commands. Alternatively, use the `--env` flag with drizzle-kit.

**`@astrojs/node` Listed as Dependency but Netlify Adapter Is Used:**
- Risk: `@astrojs/node` is listed in `package.json` dependencies but `astro.config.mjs` uses `@astrojs/netlify` as the adapter. The node adapter is not referenced anywhere in config.
- Files: `package.json` (line 21), `astro.config.mjs` (line 7)
- Impact: Unnecessary dependency in the bundle. May confuse future developers about the deployment target.
- Migration plan: Remove `@astrojs/node` from `package.json` dependencies.

## Missing Critical Features

**No Email Verification Enforcement:**
- Problem: The `user.emailVerified` field exists in the schema and is displayed in the admin users table. However, there is no sign-up flow that sends a verification email. Users are approved/denied manually by an admin, but email ownership is never confirmed.
- Blocks: Cannot enforce that invite tokens are used by the correct person's email account (a user could sign up with a different email client and the invite email check only compares strings).
- Files: `src/lib/auth/index.ts`, `src/lib/db/schema.ts` (user table)

**No Quote Notification Email:**
- Problem: When a quote request is submitted via `src/pages/api/quotes/index.ts`, no notification email is sent to admins. The contact form sends admin notifications, but the quote flow does not.
- Blocks: Admins will not know when a new quote arrives unless they check the admin panel.
- Files: `src/pages/api/quotes/index.ts`

**No Audit Log:**
- Problem: No change history or audit trail exists for admin operations (product edits, user approvals, quote status changes). There is no `auditLog` table or logging middleware.
- Blocks: Cannot investigate suspicious changes or track who approved a user.
- Files: `src/lib/db/schema.ts` (no audit table), `src/pages/api/admin/` (no audit writes)

## Test Coverage Gaps

**No Test Suite:**
- What's not tested: The entire application. There is no test runner configured, no test files, and no test scripts in `package.json`.
- Files: All of `src/`
- Risk: Any refactor can introduce silent regressions. Critical paths (quote submission, auth flow, admin API authorization) have zero automated coverage.
- Priority: High

**Quote Submission Flow (Highest Risk):**
- What's not tested: Quote number generation, item total calculation, pagination, auth bypass.
- Files: `src/pages/api/quotes/index.ts`
- Risk: The race condition in `generateQuoteNumber()` and the missing auth check on the public GET endpoint would be caught by integration tests.
- Priority: High

**Admin Authorization Boundaries:**
- What's not tested: Whether unapproved users can access admin API routes directly.
- Files: All files under `src/pages/api/admin/`
- Risk: Authorization logic is duplicated per-route; a missing check passes silently.
- Priority: High

---

*Concerns audit: 2026-03-05*
