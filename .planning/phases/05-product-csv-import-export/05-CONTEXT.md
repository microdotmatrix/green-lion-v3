# Phase 5: Product CSV Import/Export - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can bulk-import products from a CSV file and export the current product catalog to CSV. Both actions live on the existing products admin page. No attribute management via CSV, no public-facing feature, no background jobs — synchronous import with immediate results.

</domain>

<decisions>
## Implementation Decisions

### CSV format — data scope
- Columns: `sku`, `name`, `description`, `category`, `min_order_qty`, `order_qty_increment`, `logo_cost`, `packaging_cost`, `image_url`, then pricing tier columns
- Pricing tiers: flattened into fixed columns — `tier1_min_qty`, `tier1_price`, `tier2_min_qty`, `tier2_price`, ... up to **5 tiers** (tier1–tier5)
- Empty tier columns are ignored on import (not required to fill all 5)
- Images: single `image_url` column (first/primary image URL only). Not required on import; on export, first element of the images JSON array
- Attributes: **excluded entirely** — too complex for flat CSV; admin manages attributes via UI

### Import conflict handling
- **SKU conflict**: upsert — rows with an existing SKU update the product's name, description, category, costs, MOQ, and pricing tiers
- **Pricing tier update**: replace strategy — delete all existing tiers for the product, then insert tiers from the CSV row fresh. CSV is the source of truth for that product's pricing
- **Invalid rows**: skip bad rows, import valid ones. Return a results summary: X inserted, Y updated, Z skipped (with per-row error details listing which rows and why)
- Required fields for a valid row: `sku` and `name` at minimum; rows missing these are skipped

### Category resolution
- Category column matches by **name** (case-insensitive)
- If category name doesn't exist in DB: **auto-create** it (name only; no description, no image — same as inline category creation in blog admin)
- If category column is empty: product is imported with `categoryId = null` (uncategorized)
- On export: category column contains the human-readable category **name**, not the ID

### Import/export UX
- **Location**: "Export CSV" and "Import CSV" buttons added to the existing products admin page toolbar/header — no new page
- **Import flow**: admin clicks "Import CSV" → file picker opens → on file selection, import runs immediately → dialog shows results (inserted count, updated count, skipped rows with error details). No preview step before committing
- **Export**: clicking "Export CSV" triggers an immediate browser download of a `.csv` file containing all products — filters/search state on the products page are ignored; always a full catalog export
- File input: plain `<input type="file" accept=".csv">` — UploadThing not used (CSV is not binary/media)

### Claude's Discretion
- CSV parsing library choice (e.g., `papaparse` or Node's built-in streaming — whichever is smaller and SSR-compatible)
- Column header casing convention (snake_case vs camelCase — snake_case preferred for Excel readability)
- Exact import dialog visual (loading state while processing, results table layout)
- Export filename format (e.g., `products-2026-03-10.csv`)
- Handling of trailing whitespace and BOM in uploaded CSV files

</decisions>

<specifics>
## Specific Ideas

- The import result dialog should show a clear summary: "12 products imported, 3 updated, 1 skipped" with a collapsible or scrollable list of skipped rows and their error reasons
- The exported CSV should be directly re-importable (round-trip safe) — export format = import format
- Category auto-creation on import mirrors the inline "Create X" pattern from Blog Admin — fast, no confirmation

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/admin/products/products-page.tsx`: Existing products admin page — add Export and Import buttons to its toolbar/header section
- `src/components/ui/dialog.tsx`: Import dialog (file picker + results display) — same pattern as catalog upload dialog
- `src/components/ui/button.tsx`: Export and Import trigger buttons
- `src/pages/api/admin/products/index.ts`: Existing POST endpoint creates a single product with pricing tiers — import endpoint will follow same DB insertion pattern but in batch
- `src/lib/db/schema.ts`: `products`, `pricingTiers`, `categories` tables all defined; `insertProductSchema` available for row validation

### Established Patterns
- REST API: new endpoints at `src/pages/api/admin/products/import.ts` (POST — multipart/form-data CSV) and `src/pages/api/admin/products/export.ts` (GET — returns CSV text)
- Auth guard: `locals.user` check at top of handler; middleware handles `/api/admin/*` automatically
- TanStack Query `useMutation` for the import POST; export can be a plain `fetch` triggered from a button (no query caching needed)
- `toast.success` / `toast.error` from sonner for quick feedback; full results shown in dialog
- Category auto-creation mirrors the blog category inline-create pattern from Phase 3 (POST to categories API, no separate confirmation)

### Integration Points
- `src/components/admin/products/products-page.tsx` — add Export + Import buttons; import opens a Dialog
- `src/pages/api/admin/products/import.ts` — new POST endpoint (multipart CSV upload, parse, upsert, return results JSON)
- `src/pages/api/admin/products/export.ts` — new GET endpoint (query all products + tiers + categories, stream CSV response)
- `src/lib/db/schema.ts` — no schema changes needed; all required tables already exist
- `src/pages/api/admin/categories/index.ts` — may need a POST call for auto-creating categories during import (or inline DB insert in import handler)

</code_context>

<deferred>
## Deferred Ideas

- Export respecting active filters/search — noted, deferred (full export is sufficient for v1)
- Preview-before-commit import flow — deferred; immediate import with results summary is sufficient
- Background/async import for large catalogs — deferred to v2 if needed
- Attribute import/export — too complex for flat CSV; separate feature if ever needed
- Download blank CSV template (headers only) — simple add-on, could be a follow-up quick task
- **Vitest unit test infrastructure** — deferred; no test infrastructure exists in the project and this is an additive, low-risk feature. When a dedicated testing phase is added, create `vitest.config.ts`, `pnpm add -D vitest`, and unit tests for `src/lib/csv/` utility functions (BOM strip, row validation, category map, tier flatten, normalizePrice). Full behavioral verification for this phase is covered by the Plan 02 Task 3 human checkpoint.

</deferred>

---

*Phase: 05-product-csv-import-export*
*Context gathered: 2026-03-10*
