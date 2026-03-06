---
phase: 02-pdf-catalog
plan: 01
subsystem: api
tags: [drizzle-orm, uploadthing, postgresql, astro-api-routes]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: productCatalogs schema table, UploadThing pdfUploader route, auth locals middleware

provides:
  - useUploadThing hook exported from src/lib/uploadthing.ts with UploadRouter type safety
  - GET /api/admin/catalogs — list all catalog versions ordered by createdAt desc
  - POST /api/admin/catalogs — insert new catalog row, returns 201
  - PUT /api/admin/catalogs/[id] — atomic single-active enforcement via db.transaction()
  - DELETE /api/admin/catalogs/[id] — 409 guard prevents deleting the active row

affects: [02-02, 02-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Drizzle two-step transaction pattern: UPDATE all (no WHERE) then UPDATE target with WHERE"
    - "Auth guard pattern consistent with existing admin routes (locals.user && locals.session)"
    - "Active-record deletion guard: 409 when isActive, 200 when inactive"

key-files:
  created:
    - src/pages/api/admin/catalogs/index.ts
    - src/pages/api/admin/catalogs/[id].ts
  modified:
    - src/lib/uploadthing.ts

key-decisions:
  - "generateReactHelpers used (not individual hook imports) to match @uploadthing/react v7 API"
  - "PUT handler verifies target exists before entering transaction to avoid unnecessary lock"
  - "DELETE returns 409 (Conflict) rather than 403 (Forbidden) to signal business-logic constraint"

patterns-established:
  - "Two-step transaction: deactivate-all then activate-target enforces single-active catalog invariant"
  - "Admin API route auth guard: check locals.user && locals.session, return 401 JSON on failure"

requirements-completed: [CAT-01, CAT-02, CAT-03]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 2 Plan 01: Catalog API + useUploadThing Hook Summary

**Catalog CRUD REST API with atomic single-active enforcement via Drizzle transaction and useUploadThing hook export for the upload dialog**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-06T21:44:13Z
- **Completed:** 2026-03-06T21:46:35Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Exported `useUploadThing` from `src/lib/uploadthing.ts` using `generateReactHelpers<UploadRouter>()`, unblocking the catalog upload dialog in Plan 02
- Created `GET` and `POST` handlers on `/api/admin/catalogs` with auth guards, Zod validation via `insertProductCatalogSchema`, and `createdAt desc` ordering
- Created `PUT` (set-active) and `DELETE` handlers on `/api/admin/catalogs/[id]` — PUT uses `db.transaction()` for atomic two-step deactivate-all / activate-target; DELETE returns 409 when row `isActive` is true

## Task Commits

Each task was committed atomically:

1. **Task 1: Export useUploadThing from src/lib/uploadthing.ts** - `7a12665` (feat)
2. **Task 2: Create catalog REST API routes (index.ts and [id].ts)** - `c9fafe6` (feat)

**Plan metadata:** (see final docs commit)

## Files Created/Modified

- `src/lib/uploadthing.ts` - Added `generateReactHelpers` import and `useUploadThing` export
- `src/pages/api/admin/catalogs/index.ts` - GET (list, desc order) + POST (insert, 201) with auth guard and Zod validation
- `src/pages/api/admin/catalogs/[id].ts` - PUT (db.transaction two-step set-active) + DELETE (409 on active guard) with auth guard

## Decisions Made

- Used `generateReactHelpers` (not a per-hook import) because that is the correct @uploadthing/react v7 API surface — confirmed against installed package types
- PUT handler performs a pre-transaction existence check to return a clear 404 rather than silently no-oping inside the transaction
- DELETE returns 409 (Conflict) rather than 403 to signal a business-logic constraint, consistent with HTTP semantics for state conflicts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The system-level linter reverted `src/lib/uploadthing.ts` after the first Edit call during Task 1 staging. Re-wrote the file with the Write tool and staged immediately — committed successfully on the second attempt. No code changes required; timing/tooling only.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four catalog API handlers are live and type-safe; Plan 02 (upload dialog + admin UI) can import `useUploadThing` from `@/lib/uploadthing` and call all four endpoints
- Plan 03 (public `/catalog` page) can call `GET /api/admin/catalogs` or query the DB directly for the active row
- Concern carried forward: UploadThing CDN `X-Frame-Options` behavior for inline PDF display is unverified — build fallback download link from the start

---
*Phase: 02-pdf-catalog*
*Completed: 2026-03-06*

## Self-Check: PASSED

- FOUND: src/lib/uploadthing.ts
- FOUND: src/pages/api/admin/catalogs/index.ts
- FOUND: src/pages/api/admin/catalogs/[id].ts
- FOUND commit 7a12665: feat(02-01): export useUploadThing from src/lib/uploadthing.ts
- FOUND commit c9fafe6: feat(02-01): add catalog REST API routes (GET/POST index, PUT/DELETE [id])
