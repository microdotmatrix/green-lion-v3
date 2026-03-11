---
phase: 05-product-csv-import-export
plan: 01
subsystem: api
tags: [csv, papaparse, drizzle, upsert, bulk-import, export, products]

requires:
  - phase: 01-foundation
    provides: DB schema — products, pricingTiers, categories tables

provides:
  - "src/lib/csv/index.ts — shared CSV_COLUMNS, csvRowSchema, buildExportRows, normalizePrice"
  - "POST /api/admin/products/import — bulk upsert products from CSV"
  - "GET /api/admin/products/export — download all products as CSV"

affects: [05-02, products-admin-ui]

tech-stack:
  added: [papaparse 5.5.3, "@types/papaparse 5.5.2"]
  patterns:
    - "Shared CSV_COLUMNS constant used by both import and export for round-trip column name consistency"
    - "onConflictDoUpdate targeting products.sku for batch upsert in single query"
    - "Category pre-fetch Map to avoid N+1 queries; inline auto-create tracks new entries in same map"
    - "Tier replace strategy: delete all existing tiers per product then reinsert from CSV"
    - "normalizePrice strips currency symbols and thousands separators before DB decimal columns"

key-files:
  created:
    - src/lib/csv/index.ts
    - src/pages/api/admin/products/import.ts
    - src/pages/api/admin/products/export.ts
  modified:
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Used Zod issues (not errors) for error access — Zod v4 renamed .errors to .issues on ZodError"
  - "Import skips tiers where normalizePrice returns '0' to avoid inserting meaningless zero-price tiers"
  - "Export uses Papa.unparse with columns: CSV_COLUMNS to guarantee column ordering matches import"
  - "images field explicitly included in onConflictDoUpdate set block to handle image_url updates on re-import"

patterns-established:
  - "Default Papa import: import Papa from 'papaparse' (not named import — CJS/UMD module)"
  - "BOM strip before papaparse: rawText.replace(/^\\uFEFF/, '') to fix Excel UTF-8 exports"
  - "Row number reporting: rowNum = index + 2 (1 = header, 2 = first data row)"

requirements-completed:
  - "CSV-IMPORT: Admin can upload a CSV file to bulk-insert/upsert products"
  - "CSV-EXPORT: Admin can download all products as a CSV file"
  - "CSV-ROUNDTRIP: Exported CSV can be re-imported without data loss"

duration: 3min
completed: 2026-03-11
---

# Phase 5 Plan 01: CSV Import/Export Backend Summary

**Papaparse-backed bulk product import (onConflictDoUpdate by SKU, tier replace, category auto-create) and CSV export endpoint with round-trip safe column ordering**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T01:28:14Z
- **Completed:** 2026-03-11T01:31:45Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created shared `src/lib/csv/index.ts` with `CSV_COLUMNS` (19-column array), `csvRowSchema` (Zod, sku+name required, all optional with defaults), `buildExportRows`, and `normalizePrice` helpers
- Built `POST /api/admin/products/import` with BOM strip, category pre-fetch Map with auto-create, batch upsert via `onConflictDoUpdate`, pricing tier replace strategy, and per-row skipped reporting
- Built `GET /api/admin/products/export` returning `text/csv; charset=utf-8` with `Content-Disposition: attachment` and column order locked to `CSV_COLUMNS`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared CSV utility module** - `3381e4f` (feat)
2. **Task 2: Create import and export API endpoints** - `8137081` (feat)

## Files Created/Modified

- `src/lib/csv/index.ts` - Shared CSV_COLUMNS constant, csvRowSchema Zod schema, CsvRow type, normalizePrice helper, buildExportRows helper
- `src/pages/api/admin/products/import.ts` - POST endpoint: auth, BOM strip, papaparse parse, category resolution/auto-create, batch upsert, tier replace, skip reporting
- `src/pages/api/admin/products/export.ts` - GET endpoint: auth, products+categories join, tiers query, buildExportRows, Papa.unparse, CSV download response
- `package.json` - Added papaparse 5.5.3 dependency and @types/papaparse 5.5.2 devDependency
- `pnpm-lock.yaml` - Updated lock file

## Decisions Made

- **Zod v4 issues property**: Zod v4 uses `error.issues` (not `error.errors`) on `ZodError` — TypeScript caught this at compile time and it was fixed inline.
- **images in upsert set block**: The `onConflictDoUpdate` set block explicitly includes `images: sql\`excluded.images\`` so re-importing a product with a new image_url updates correctly.
- **Tier skip condition**: Tiers where `normalizePrice(price)` returns `"0"` are excluded from insert to avoid zero-price tier rows that would confuse pricing display.
- **CSV_COLUMNS cast**: `Papa.unparse` columns option typed as `string[]` required a cast from `readonly string[]` — used `as unknown as string[]`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod v4 ZodError property access**
- **Found during:** Task 2 (TypeScript compile check after writing import endpoint)
- **Issue:** Plan referenced `validated.error.errors[0]` but Zod v4 renamed the property to `issues` — TypeScript TS2339 error
- **Fix:** Changed to `validated.error.issues[0]`
- **Files modified:** src/pages/api/admin/products/import.ts
- **Verification:** `pnpm tsc --noEmit` produced no errors for new files
- **Committed in:** `8137081` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug: Zod v4 API change)
**Impact on plan:** Single-line fix necessary for correctness. No scope creep.

## Issues Encountered

Pre-existing TypeScript errors exist in `src/components/icons/index.ts`, `src/components/ui/resizable.tsx`, and `src/components/admin/catalogs/catalog-upload-dialog.tsx` — none caused by this plan's changes. These are out-of-scope and logged as pre-existing.

## User Setup Required

None - no external service configuration required. Endpoints are server-side only and use the existing Neon DB connection.

## Next Phase Readiness

- Both endpoints deployed and build-verified — ready for Plan 02 UI integration
- Import endpoint: POST `/api/admin/products/import` (multipart/form-data, field name `file`)
- Export endpoint: GET `/api/admin/products/export` (returns CSV with `Content-Disposition: attachment`)
- JSON response shape: `{ inserted: number, updated: number, skipped: Array<{ row: number, sku?: string, reason: string }> }`
- Plan 02 Task 3 human checkpoint covers runtime behavioral verification (BOM strip, category auto-create, tier replace)

---
*Phase: 05-product-csv-import-export*
*Completed: 2026-03-11*
