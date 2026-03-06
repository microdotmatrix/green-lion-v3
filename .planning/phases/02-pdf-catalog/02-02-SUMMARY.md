---
phase: 02-pdf-catalog
plan: 02
subsystem: ui
tags: [react, tanstack-query, uploadthing, shadcn, admin]

# Dependency graph
requires:
  - phase: 02-01
    provides: REST API endpoints (GET/POST/PUT/DELETE /api/admin/catalogs) and useUploadThing pdfUploader hook
provides:
  - Admin React island at /admin/catalogs for full catalog version management
  - CatalogsPage component with QueryClientProvider wrapping
  - Two-phase upload flow: UploadThing CDN first, then POST to /api/admin/catalogs with returned ufsUrl
  - Set Active / Delete actions with toast feedback via TanStack Query mutations
affects: [03-blog, public /catalog page context]

# Tech tracking
tech-stack:
  added: []
  patterns: [tanstack-query-island, two-phase-upload, conditional-action-button]

key-files:
  created:
    - src/components/admin/catalogs/types.ts
    - src/components/admin/catalogs/api.ts
    - src/components/admin/catalogs/hooks.ts
    - src/components/admin/catalogs/catalog-upload-dialog.tsx
    - src/components/admin/catalogs/delete-catalog-dialog.tsx
    - src/components/admin/catalogs/catalogs-table.tsx
    - src/components/admin/catalogs/catalogs-page.tsx
    - src/pages/admin/catalogs.astro
  modified: []

key-decisions:
  - "CatalogsPage wraps its own QueryClientProvider since it mounts directly via client:load without AdminSidebar wrapper"
  - "Set Active button conditionally rendered — absent from rows where catalog.isActive is true"
  - "Delete always shows; 409 from API surfaces as toast.error via mutation onError in hooks.ts"
  - "Two-phase upload: startUpload([file]) fires first; createCatalogMut.mutate only fires inside onClientUploadComplete with confirmed ufsUrl"

patterns-established:
  - "tanstack-query-island: top-level island component owns QueryClientProvider; inner component uses hooks"
  - "two-phase-upload: useUploadThing CDN upload completes first, returned URL passed to API POST — never POST with empty pdfUrl"
  - "conditional-action-button: action buttons rendered conditionally per row state (Set Active only on inactive rows)"

requirements-completed: [CAT-01, CAT-02, CAT-03]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 2 Plan 02: Catalog Admin UI Summary

**Seven-file React island for /admin/catalogs: table with Set Active/Delete/Preview, two-phase UploadThing→POST upload dialog, TanStack Query mutations with toast feedback**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T22:45:57Z
- **Completed:** 2026-03-06T22:47:57Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Full catalog admin UI at /admin/catalogs with table showing Name, Status badge, Upload Date, and Actions
- Upload dialog with two-phase flow: UploadThing CDN upload first, then POST to API with confirmed pdfUrl and progress bar
- Set Active button visible only on inactive rows; Delete always visible; 409 API error surfaces as toast.error
- Thin Astro shell at src/pages/admin/catalogs.astro mounting CatalogsPage with client:load

## Task Commits

Each task was committed atomically:

1. **Task 1: Create types.ts and api.ts** - `8864a4d` (feat)
2. **Task 2: Create hooks.ts, all UI components, and the Astro shell** - `fae0270` (feat)

## Files Created/Modified
- `src/components/admin/catalogs/types.ts` - Catalog and CatalogFormData TypeScript interfaces
- `src/components/admin/catalogs/api.ts` - fetchCatalogs, createCatalog, setActiveCatalog, deleteCatalog fetch functions
- `src/components/admin/catalogs/hooks.ts` - useCatalogs and useCatalogMutations TanStack Query hooks with toast feedback
- `src/components/admin/catalogs/catalog-upload-dialog.tsx` - Dialog with two-phase UploadThing→API POST flow and progress bar
- `src/components/admin/catalogs/delete-catalog-dialog.tsx` - AlertDialog confirmation for delete action
- `src/components/admin/catalogs/catalogs-table.tsx` - Table with conditional Set Active button, Delete, Preview link
- `src/components/admin/catalogs/catalogs-page.tsx` - Top-level React island with QueryClientProvider and Toaster
- `src/pages/admin/catalogs.astro` - Thin Astro shell mounting CatalogsPage with client:load

## Decisions Made
- CatalogsPage owns its own QueryClientProvider because it mounts directly via `client:load` without the AdminSidebar (which provides QueryProvider in other admin pages). This keeps the island self-contained.
- The Delete button always renders for all rows; the 409 business-logic constraint (can't delete active catalog) is enforced by the API and surfaces as a toast.error via mutation onError — no client-side guard needed.
- Two-phase upload: startUpload fires first; createCatalogMut.mutate only fires inside onClientUploadComplete with a confirmed non-empty ufsUrl — never POSTs the API with an empty pdfUrl.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- /admin/catalogs is fully functional and ready for integration testing
- Phase 3 (blog) can proceed independently
- The public /catalog page (02-03) is already complete and references the active catalog from the API

## Self-Check: PASSED

All 8 files created and verified. Both task commits (8864a4d, fae0270) confirmed present.

---
*Phase: 02-pdf-catalog*
*Completed: 2026-03-06*
