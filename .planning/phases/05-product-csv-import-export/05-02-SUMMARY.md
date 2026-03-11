---
phase: 05-product-csv-import-export
plan: 02
subsystem: ui
tags: [react, tanstack-query, shadcn-ui, csv, file-upload, dialog, lucide]

# Dependency graph
requires:
  - phase: 05-product-csv-import-export
    plan: 01
    provides: "POST /api/admin/products/import and GET /api/admin/products/export endpoints"
provides:
  - "CsvImportDialog component with idle/loading/results states"
  - "importProducts() and exportProducts() fetch helpers in api.ts"
  - "useImportProducts TanStack Query mutation hook"
  - "Export CSV + Import CSV toolbar buttons in products-page.tsx"
affects: [05-product-csv-import-export]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "File input wrapped in styled label with sr-only input for accessible drop-zone styling"
    - "Mutation onError callback in component (not hook) for toast feedback"
    - "Blob download pattern: createObjectURL → anchor click → revokeObjectURL"

key-files:
  created:
    - src/components/admin/products/csv-import-dialog.tsx
  modified:
    - src/components/admin/products/api.ts
    - src/components/admin/products/hooks.ts
    - src/components/admin/products/products-page.tsx

key-decisions:
  - "File input onChange triggers mutation immediately — no explicit submit button required"
  - "Toast error called in dialog component onError callback (not in hook) to prevent double-toast"
  - "Export handler lives in products-page.tsx (not a hook) — it's simple enough that it doesn't warrant a dedicated mutation"

patterns-established:
  - "CsvImportDialog: internal state pattern (importResults, error) combined with mutation state (isPending, isSuccess) for tri-state rendering"

requirements-completed:
  - "CSV-IMPORT-UX: Admin can trigger CSV import from products page toolbar — file picker opens, import runs immediately, results dialog shows counts and skipped rows"
  - "CSV-EXPORT-UX: Admin can trigger CSV export from products page toolbar — browser download fires immediately"

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 05 Plan 02: CSV Import/Export UI Summary

**Toolbar buttons and CsvImportDialog wired to Plan 01 import/export endpoints, with idle/loading/results states, blob download for export, and TanStack Query cache invalidation on successful import**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T01:34:03Z
- **Completed:** 2026-03-11T01:36:30Z
- **Tasks:** 3 (Tasks 1a, 1b, 2 complete; Task 3 is human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- Created `CsvImportDialog` component with three visual states (idle file picker, loading spinner, results counts + skipped rows scroll list)
- Added `importProducts()` and `exportProducts()` fetch helpers and `ImportResult` interface to `api.ts`
- Added `useImportProducts` mutation hook with `invalidateQueries(["admin-products"])` on success
- Updated products page toolbar: Export CSV (outline + download icon) and Import CSV (outline + upload icon) buttons flank the existing Add Product button

## Task Commits

Each task was committed atomically:

1. **Task 1a: Add API helpers and mutation hook to data layer** - `4fd7b03` (feat)
2. **Task 1b: Create CsvImportDialog component** - `4ac830d` (feat)
3. **Task 2: Wire Export and Import buttons into products-page toolbar** - `c4376cd` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `src/components/admin/products/csv-import-dialog.tsx` - Created: Dialog with file drop zone, loading spinner, and results grid with skipped rows ScrollArea
- `src/components/admin/products/api.ts` - Added `ImportResult` interface, `importProducts()` FormData POST helper, `exportProducts()` blob download helper
- `src/components/admin/products/hooks.ts` - Added `useImportProducts` mutation hook; added `importProducts` to imports
- `src/components/admin/products/products-page.tsx` - Added Download/Upload/Loader2 icons, toast, isImportOpen/isExporting state, handleExport handler, toolbar button group, CsvImportDialog mount

## Decisions Made
- File input onChange triggers mutation immediately — no explicit "Upload" submit button, matching the plan spec of "selecting a .csv file triggers import immediately"
- Toast error is called in the dialog component's `onError` callback (not in the hook's `onError`) to prevent double-toast feedback
- Export handler is a plain async function in the component, not a TanStack mutation — it's a one-way fire-and-forget side effect with no cache invalidation needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in unrelated files (`src/components/ui/resizable.tsx`, `src/components/icons/index.ts`, `src/components/admin/catalogs/catalog-upload-dialog.tsx`) were present before this plan. None introduced by this plan's changes.

## Human Verification

**Task 3 (checkpoint:human-verify):** Approved by user on 2026-03-11
- Export CSV: browser download fires immediately with correct filename pattern
- Import CSV: dialog opens, file selection triggers immediate import, results dialog shows correct counts and skipped rows
- Products table refreshes after successful import

## Self-Check: PASSED

- `4fd7b03` feat(05-02): add importProducts, exportProducts helpers and useImportProducts hook — FOUND
- `4ac830d` feat(05-02): create CsvImportDialog component with idle/loading/results states — FOUND
- `c4376cd` feat(05-02): wire Export CSV and Import CSV buttons into products page toolbar — FOUND
- `src/components/admin/products/csv-import-dialog.tsx` — FOUND
- `src/components/admin/products/api.ts` — FOUND (exportProducts, importProducts, ImportResult)
- `src/components/admin/products/hooks.ts` — FOUND (useImportProducts)
- `src/components/admin/products/products-page.tsx` — FOUND (toolbar buttons, CsvImportDialog mount)

---
*Phase: 05-product-csv-import-export*
*Completed: 2026-03-11*
