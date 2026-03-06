# Phase 2: PDF Catalog - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can manage versioned PDF catalogs (upload, set active, delete) via the admin dashboard. Visitors can view the active catalog at `/catalog` via an iframe embed with a mobile download fallback. No catalog types, no gating, no search — single catalog slot with version history.

</domain>

<decisions>
## Implementation Decisions

### Upload experience
- Trigger: "Add Version" button on the catalog admin page opens a dialog
- Dialog fields: display name + PDF file only (notes field exists in schema but not exposed in UI)
- Upload progress: progress bar shown inside the dialog while the PDF uploads via UploadThing
- After upload: new version stays inactive — admin must explicitly set it active separately

### Catalog list display
- Table columns: Name, Active status, Upload date, Actions
- Active version visual: green "Active" badge in the status column; inactive rows show a muted "Inactive" badge
- Actions per row: "Preview" (opens PDF URL in new tab), "Set Active" (only on inactive rows), "Delete"
- Delete active version: blocked with an error — admin must deactivate first ("Set another version active before deleting")

### Active toggle interaction
- Set active: explicit "Set Active" button per row, shown only on inactive rows
- No confirmation dialog — instant activation with a success toast
- Preview: "Preview" button/link opens the UploadThing PDF URL in a new browser tab (lets admin verify before activating)

### Public /catalog page
- Layout: full viewport height below the site header — iframe fills the space (max reading area)
- Above the iframe: slim header bar with "Product Catalog" title + download button (always visible, not just mobile fallback)
- Mobile fallback: the download button in the header serves as the primary fallback when iframe PDF rendering fails
- No active catalog: show a friendly "Catalog coming soon" message (no 404, no redirect)

### Claude's Discretion
- Exact iframe height calculation (CSS: `calc(100vh - header height)` or similar)
- Styling of the "Catalog coming soon" empty state
- Toast wording for activation/deletion success messages
- Delete confirmation dialog copy

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/dialog.tsx` — Dialog primitive for the upload dialog (same as product-form-dialog)
- `src/components/ui/table.tsx` — Table primitive for the catalog versions list
- `src/components/ui/badge.tsx` — Badge for Active/Inactive status display
- `src/components/ui/button.tsx` — All action buttons (Set Active, Preview, Delete, Add Version)
- `src/components/ui/progress.tsx` — Progress bar for upload progress in dialog
- `useUploadThing` hook (from `@uploadthing/react`) — already used in product form for image uploads; `pdfUploader` route is ready
- `src/lib/db/schema.ts` — `productCatalogs` table with all needed columns already defined (Phase 1)
- `src/server/uploadthing.ts` — `pdfUploader` route already added (Phase 1)

### Established Patterns
- Admin feature structure: `api.ts` + `hooks.ts` + `types.ts` + `{feature}-page.tsx` + `{feature}-table.tsx` + `{feature}-form-dialog.tsx` in `src/components/admin/{feature}/`
- Thin Astro shell at `src/pages/admin/catalogs.astro` → React island with `client:load`
- REST API: `src/pages/api/admin/catalogs/index.ts` (GET list, POST create) + `[id].ts` (PUT set-active, DELETE)
- Auth guard: middleware handles `/api/admin/*` automatically; add local `locals.user` check as defense-in-depth
- TanStack Query (`useQuery` + `useMutation`) for all data fetching and mutations
- `toast.success` / `toast.error` from sonner for mutation feedback
- Delete confirmation via a separate delete dialog component (see `delete-product-dialog.tsx`)

### Integration Points
- `src/lib/db/schema.ts` — `productCatalogs` table ready; single-active enforced via DB transaction in PUT handler
- `src/server/uploadthing.ts` — `pdfUploader` ready for use
- `src/pages/admin/` — add `catalogs.astro` shell
- `src/pages/api/admin/catalogs/` — new REST endpoints
- `src/pages/catalog.astro` — new public page using `src/layouts/default.astro`
- STATE.md blocker: UploadThing CDN `X-Frame-Options` headers for PDFs are unconfirmed — download button must be built from the start (not retrofitted); researcher should verify iframe embedding behavior

</code_context>

<specifics>
## Specific Ideas

- The "Preview" action should open the UploadThing URL directly in a new tab (`target="_blank"`) — no custom viewer
- The download button in the catalog page header is always visible (not conditional on user agent) — it doubles as the mobile fallback
- "Set Active" button appears only on inactive rows — the active row shows no activation button (prevents re-triggering a no-op)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-pdf-catalog*
*Context gathered: 2026-03-06*
