# Phase 2: PDF Catalog - Research

**Researched:** 2026-03-06
**Domain:** UploadThing PDF upload, Drizzle transactions, iframe PDF embedding, admin CRUD pattern
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Upload experience**
- Trigger: "Add Version" button on the catalog admin page opens a dialog
- Dialog fields: display name + PDF file only (notes field exists in schema but not exposed in UI)
- Upload progress: progress bar shown inside the dialog while the PDF uploads via UploadThing
- After upload: new version stays inactive — admin must explicitly set it active separately

**Catalog list display**
- Table columns: Name, Active status, Upload date, Actions
- Active version visual: green "Active" badge in the status column; inactive rows show a muted "Inactive" badge
- Actions per row: "Preview" (opens PDF URL in new tab), "Set Active" (only on inactive rows), "Delete"
- Delete active version: blocked with an error — admin must deactivate first ("Set another version active before deleting")

**Active toggle interaction**
- Set active: explicit "Set Active" button per row, shown only on inactive rows
- No confirmation dialog — instant activation with a success toast
- Preview: "Preview" button/link opens the UploadThing PDF URL in a new browser tab

**Public /catalog page**
- Layout: full viewport height below the site header — iframe fills the space
- Above the iframe: slim header bar with "Product Catalog" title + download button (always visible)
- Mobile fallback: the download button in the header serves as the primary fallback
- No active catalog: show a friendly "Catalog coming soon" message (no 404, no redirect)

### Claude's Discretion
- Exact iframe height calculation (CSS: `calc(100vh - header height)` or similar)
- Styling of the "Catalog coming soon" empty state
- Toast wording for activation/deletion success messages
- Delete confirmation dialog copy

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAT-01 | Admin can upload a PDF file via the admin dashboard and save it to the catalog list with a display name | `useUploadThing` hook with `pdfUploader` endpoint; POST `/api/admin/catalogs` inserts to `productCatalogs` table |
| CAT-02 | Admin can mark one catalog version as the active catalog (only one active at a time; enforced transactionally) | Drizzle `db.transaction()` — UPDATE all rows to `isActive=false`, then UPDATE target row to `isActive=true`; PUT `/api/admin/catalogs/[id]` |
| CAT-03 | Admin can delete a catalog version from the list | DELETE `/api/admin/catalogs/[id]`; guard: block if `isActive=true`, return 409 with friendly message |
| CAT-04 | Public `/catalog` route embeds the active PDF in an iframe using the browser's native PDF viewer | Server-side fetch of active catalog in `catalog.astro`; `<iframe src={pdfUrl}>` — X-Frame-Options UNCONFIRMED on UploadThing CDN (see Pitfall 1) |
| CAT-05 | Public `/catalog` route displays a download button as a fallback when the browser cannot render the embedded PDF | Always-visible download button (decided per CONTEXT.md); `<a href={pdfUrl} download>` serves as universal fallback |
</phase_requirements>

---

## Summary

Phase 2 is almost entirely a wiring exercise — the schema, the UploadThing `pdfUploader` route, and all UI primitives are already in place from Phase 1. The work is: build the admin CRUD feature in the established pattern (`api.ts` + `hooks.ts` + `types.ts` + page + table + dialog), then build a minimal public `/catalog` page using an iframe.

The only genuine technical risk is the **UploadThing CDN X-Frame-Options header** behavior for PDFs. Web search and UploadThing documentation did not provide a definitive answer on whether `utfs.io` URLs for PDFs carry `X-Frame-Options: DENY` or `Content-Disposition: attachment`. Similar file storage services (Vercel Blob, PocketBase) have been reported to set both headers, which would block inline iframe viewing. Because CONTEXT.md already decided to ship the download button as always-visible (not a retrofit), the risk to CAT-05 is eliminated. CAT-04 is implemented with the iframe regardless — if embedding is blocked by headers, the download button remains the functional path for users. The `/catalog` page should be verified against a real uploaded PDF URL before shipping.

**Primary recommendation:** Follow the established products admin pattern exactly. The `useUploadThing` hook (sourced from `generateReactHelpers`) is the correct tool for custom upload dialogs with progress tracking. The single-active enforcement uses a two-step Drizzle transaction. The public page is pure Astro with server-side DB fetch — no React island needed.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@uploadthing/react` | ^7.3.3 (installed) | `useUploadThing` hook for custom upload dialog with progress | Already used for image uploads; `pdfUploader` route ready |
| `drizzle-orm` | ^0.45.1 (installed) | `db.transaction()` for atomic single-active enforcement | Already used throughout project |
| `@tanstack/react-query` | installed | `useQuery` + `useMutation` for catalog CRUD | Established pattern in all admin features |
| `sonner` | installed | `toast.success` / `toast.error` | Established pattern in all admin features |
| shadcn/ui | installed | `Dialog`, `Table`, `Badge`, `Button`, `Progress`, `AlertDialog` | All primitives already in `src/components/ui/` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | installed | Icons: Plus, Trash2, Eye, CheckCircle, Download | Consistent with existing admin UI |
| `drizzle-zod` | ^0.8.3 (installed) | `insertProductCatalogSchema` for server-side validation | Schema already exported from `src/lib/db/schema.ts` |

### No New Dependencies

This phase requires zero new package installations. Everything is already installed.

**Installation:**
```bash
# No new packages — all dependencies already installed
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/admin/catalogs/     # NEW — mirrors products/ pattern exactly
│   ├── api.ts                     # fetchCatalogs, createCatalog, setActiveCatalog, deleteCatalog
│   ├── hooks.ts                   # useCatalogs, useCatalogMutations
│   ├── types.ts                   # Catalog, CatalogFormData interfaces
│   ├── catalogs-page.tsx          # Top-level React island
│   ├── catalogs-table.tsx         # Table with badge, actions per row
│   ├── catalog-upload-dialog.tsx  # Upload dialog with progress bar
│   └── delete-catalog-dialog.tsx  # AlertDialog confirmation
├── pages/
│   ├── admin/
│   │   └── catalogs.astro         # NEW — thin Astro shell, client:load island
│   ├── api/admin/catalogs/
│   │   ├── index.ts               # NEW — GET list, POST create
│   │   └── [id].ts                # NEW — PUT set-active, DELETE
│   └── catalog.astro              # NEW — public page, server-side DB fetch
```

### Pattern 1: useUploadThing with Progress Bar

The project currently exports `UploadButton` and `UploadDropzone` from `src/lib/uploadthing.ts` but NOT `useUploadThing`. To use the hook in the catalog upload dialog, export it from `src/lib/uploadthing.ts` using `generateReactHelpers`.

**What:** Custom upload hook from `generateReactHelpers` — provides `startUpload`, `isUploading`, and `onUploadProgress` callback for building custom upload dialogs.

**When to use:** Whenever the UploadDropzone or UploadButton UI doesn't match the design (e.g., inside a Dialog with a custom progress bar).

```typescript
// Source: node_modules/@uploadthing/react/dist/use-uploadthing-CkqJn3G-.d.ts
// Add to: src/lib/uploadthing.ts

import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";
import type { UploadRouter } from "@/server/uploadthing";

export const UploadButton = generateUploadButton<UploadRouter>();
export const UploadDropzone = generateUploadDropzone<UploadRouter>();
export const { useUploadThing } = generateReactHelpers<UploadRouter>();
```

**Progress tracking in dialog:**
```typescript
// onUploadProgress receives a plain number (0–100)
// Source: UseUploadthingProps type — onUploadProgress?: ((p: number) => void)
const [progress, setProgress] = React.useState(0);
const { startUpload, isUploading } = useUploadThing("pdfUploader", {
  onUploadProgress: (p) => setProgress(p),
  onClientUploadComplete: (res) => {
    if (res?.[0]?.ufsUrl) {
      // res[0].ufsUrl is the permanent CDN URL
      handleUploadComplete(res[0].ufsUrl);
    }
  },
  onUploadError: (error) => toast.error(error.message),
});
```

Then wire `<Progress value={progress} />` (shadcn `progress.tsx` component) to display during upload.

### Pattern 2: Drizzle Transaction for Single-Active Enforcement

**What:** Two-step atomic update inside `db.transaction()` — deactivate all rows, then activate the target.

**When to use:** In the PUT `/api/admin/catalogs/[id]` handler when the request body signals a set-active action.

```typescript
// Source: https://orm.drizzle.team/docs/transactions
// drizzle-orm ^0.45.1 — db.transaction() is stable API
await db.transaction(async (tx) => {
  // Step 1: deactivate all catalog versions
  await tx
    .update(productCatalogs)
    .set({ isActive: false, updatedAt: new Date() });

  // Step 2: activate the target
  await tx
    .update(productCatalogs)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(productCatalogs.id, id));
});
```

Note: Neon serverless supports `db.transaction()` — confirmed by Drizzle docs listing Neon as a supported adapter.

### Pattern 3: API Route Structure for Catalog CRUD

Mirrors the existing products pattern: `index.ts` for collection operations, `[id].ts` for individual resource operations.

```typescript
// src/pages/api/admin/catalogs/index.ts
// GET — fetch all catalog versions, ordered by createdAt desc
// POST — insert new catalog record (pdfUrl comes from UploadThing, passed in body)

// src/pages/api/admin/catalogs/[id].ts
// PUT — set active (transaction); action discriminated by body { action: "set-active" }
// DELETE — delete (block if isActive=true, return 409)
```

Auth guard pattern (from existing routes):
```typescript
if (!locals.user || !locals.session) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Pattern 4: Public /catalog Page (Pure Astro, No Island)

The public catalog page fetches the active catalog server-side at request time. No React island is needed — the page is static markup with the PDF URL interpolated at render time.

```astro
---
// src/pages/catalog.astro
import Layout from "@/layouts/default.astro";
import { db } from "@/lib/db";
import { productCatalogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const [activeCatalog] = await db
  .select()
  .from(productCatalogs)
  .where(eq(productCatalogs.isActive, true))
  .limit(1);
---

<Layout title="Product Catalog">
  {activeCatalog ? (
    <div class="catalog-wrapper">
      <div class="catalog-header">
        <h1>Product Catalog</h1>
        <a href={activeCatalog.pdfUrl} download class="download-btn">
          Download PDF
        </a>
      </div>
      <iframe
        src={activeCatalog.pdfUrl}
        class="catalog-frame"
        title="Product Catalog"
      />
    </div>
  ) : (
    <div class="catalog-empty">
      <p>Catalog coming soon.</p>
    </div>
  )}
</Layout>
```

CSS for iframe height (at Claude's discretion per CONTEXT.md):
```css
.catalog-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height, 4rem));
}
.catalog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.catalog-frame {
  flex: 1;
  width: 100%;
  border: none;
}
```

### Pattern 5: Catalog Upload Flow (Two-Phase)

Upload is two separate operations — UploadThing delivers the CDN URL, then a POST to the API saves it to the database. This matches how image uploads work in the product form.

```
1. User opens "Add Version" dialog, enters display name, selects PDF file
2. useUploadThing("pdfUploader").startUpload([file]) — uploads to UploadThing CDN
3. onUploadProgress fires with 0–100 percentage — drives <Progress> component
4. onClientUploadComplete fires with res[0].ufsUrl — the permanent PDF URL
5. POST /api/admin/catalogs with { displayName, pdfUrl, uploadedBy } — saves to DB
6. Dialog closes, TanStack Query invalidates "admin-catalogs" query key
7. Table re-fetches showing new inactive version
```

### Anti-Patterns to Avoid

- **Saving pdfUrl before upload completes:** Never POST to the API with an empty or placeholder URL. Wait for `onClientUploadComplete` before calling `createCatalog`.
- **Toggling active without a transaction:** Two separate UPDATE calls without a transaction can leave two rows active if the server crashes between them. Always use `db.transaction()`.
- **Deleting active catalog without a guard:** The DELETE handler must check `isActive` and return a 409 error, not silently delete. The UI shows an error toast from the mutation's `onError`.
- **Using `UploadDropzone` inside a Dialog:** The dropzone component is not designed for compact dialog layouts. Use `useUploadThing` + `<input type="file">` for dialog-based uploads.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upload progress tracking | Custom XHR with `onprogress` | `useUploadThing` with `onUploadProgress` | UploadThing handles presigned URLs, multipart, retries |
| Active-exclusive enforcement | Application-level deactivation loop | `db.transaction()` — two UPDATEs | Race condition if two admins click simultaneously |
| Delete confirmation modal | Custom state-managed modal | `AlertDialog` from shadcn/ui | Matches existing `delete-product-dialog.tsx` pattern exactly |
| PDF rendering | react-pdf or PDF.js | Native `<iframe>` with download fallback | Requirements doc explicitly rules out custom viewer (adds ~500kB, Vite/Astro friction documented) |
| Progress bar component | Custom CSS width animation | `<Progress>` from `@/components/ui/progress` | Already installed, matches design system |

**Key insight:** The native browser `<iframe>` is the right PDF viewer for this project. The decision is locked in REQUIREMENTS.md under Out of Scope: "Custom PDF.js viewer — Native `<iframe>` covers the requirement."

---

## Common Pitfalls

### Pitfall 1: UploadThing CDN X-Frame-Options for PDFs (UNRESOLVED — VERIFY BEFORE SHIPPING)

**What goes wrong:** The UploadThing CDN (`utfs.io`) may serve PDFs with `X-Frame-Options: DENY` or `Content-Disposition: attachment` response headers. Either header would prevent the iframe from rendering the PDF inline, silently displaying a blank iframe instead.

**Why it happens:** CDNs that serve user-uploaded files often set `X-Frame-Options: DENY` as a default security measure to prevent clickjacking. `Content-Disposition: attachment` forces a download rather than inline display. Both behaviors have been reported for similar services (Vercel Blob, PocketBase, Django admin). UploadThing documentation does not document these headers. Confidence: LOW (no official source found).

**How to avoid:** This has already been mitigated by the design decision: the download button is always visible (not conditional on UA detection). If the iframe is blank, users see the download button immediately. No user is blocked.

**Warning signs:** After shipping, if `/catalog` shows a white iframe — check browser DevTools Network tab on the PDF URL for `X-Frame-Options` or `Content-Disposition: attachment` response headers.

**Verification step (must happen before final QA):** Upload a real PDF via the admin page, then open the `/catalog` page and inspect the iframe. If it renders, iframe embedding works. If blank — the download button is the live fallback path, document the header behavior in STATE.md.

**Alternative if headers are confirmed blocking:** Use `<object data={pdfUrl} type="application/pdf">` — some browsers treat `<object>` differently than `<iframe>` for X-Frame-Options. Still subject to same Content-Disposition issue. No silver bullet — download link is the real fallback.

### Pitfall 2: useUploadThing Not Yet Exported from src/lib/uploadthing.ts

**What goes wrong:** The current `src/lib/uploadthing.ts` only exports `UploadButton` and `UploadDropzone`. The `useUploadThing` hook requires `generateReactHelpers` to be called with the typed router — it cannot be imported directly.

**Why it happens:** The original setup only added the two pre-built components. `generateReactHelpers` wasn't needed until a custom upload UI was required.

**How to avoid:** Add `export const { useUploadThing } = generateReactHelpers<UploadRouter>();` to `src/lib/uploadthing.ts` before building the catalog upload dialog. Then import from `@/lib/uploadthing` in the dialog component.

**Warning signs:** TypeScript error `Module has no exported member 'useUploadThing'` when writing the dialog.

### Pitfall 3: POST Body Must Include pdfUrl (Not File)

**What goes wrong:** The API route `/api/admin/catalogs` receives a JSON body with `{ displayName, pdfUrl, uploadedBy }` — NOT the PDF file itself. File upload is handled entirely by UploadThing client-to-CDN. The API only records the resulting URL.

**Why it happens:** Confusion between "upload to UploadThing" (done by `useUploadThing`) and "save record to database" (done by the API route). Both are triggered by the dialog, sequentially.

**How to avoid:** The `onClientUploadComplete` callback receives the CDN URL — only after this callback fires should the API POST be called. Keep the two operations clearly separated in the dialog's submit handler.

### Pitfall 4: Deleting a Non-Existent Catalog Leaves Ghost UI State

**What goes wrong:** If two admin sessions are open simultaneously and one deletes a catalog version while the other's UI still shows it, a DELETE request will get a 404. Without proper error handling in the mutation, the UI silently "succeeds" while the table row remains.

**How to avoid:** In `useCatalogMutations`, the `deleteCatalog` mutation's `onError` should call `toast.error()`. The `onSuccess` should `invalidateQueries` to force a re-fetch. Both are established patterns from `useProductMutations`.

### Pitfall 5: Public /catalog Page Must Be Server-Rendered (not prerendered)

**What goes wrong:** If `catalog.astro` is prerendered as a static page (the default in some Astro configurations), the active catalog PDF URL will be baked in at build time and won't update when admin changes the active version.

**Why it happens:** Astro's hybrid rendering can prerender pages that have no dynamic data usage — but the catalog page reads from the database, which changes at runtime.

**How to avoid:** The project uses `@astrojs/node` in standalone SSR mode — the entire application is server-rendered by default. No special `export const prerender = false` is needed. Verify by checking that `astro.config.mjs` has `output: 'server'` or equivalent.

---

## Code Examples

Verified patterns from official sources and local codebase inspection:

### Catalog List GET Handler
```typescript
// src/pages/api/admin/catalogs/index.ts
import { db } from "@/lib/db";
import { productCatalogs } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const catalogs = await db
    .select()
    .from(productCatalogs)
    .orderBy(desc(productCatalogs.createdAt));
  return new Response(JSON.stringify(catalogs), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

### Set-Active PUT Handler (with Transaction)
```typescript
// src/pages/api/admin/catalogs/[id].ts — PUT handler
// Source: https://orm.drizzle.team/docs/transactions (verified)
import { db } from "@/lib/db";
import { productCatalogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "ID required" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  await db.transaction(async (tx) => {
    await tx.update(productCatalogs).set({ isActive: false, updatedAt: new Date() });
    await tx.update(productCatalogs).set({ isActive: true, updatedAt: new Date() }).where(eq(productCatalogs.id, id));
  });
  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
};
```

### Delete Guard (Block Active Catalog)
```typescript
// DELETE handler — inside [id].ts
const [existing] = await db
  .select({ id: productCatalogs.id, isActive: productCatalogs.isActive })
  .from(productCatalogs)
  .where(eq(productCatalogs.id, id));

if (!existing) {
  return new Response(JSON.stringify({ error: "Not found" }), { status: 404, ... });
}
if (existing.isActive) {
  return new Response(
    JSON.stringify({ error: "Set another version active before deleting" }),
    { status: 409, headers: { "Content-Type": "application/json" } }
  );
}
await db.delete(productCatalogs).where(eq(productCatalogs.id, id));
```

### TanStack Query Hooks Pattern
```typescript
// src/components/admin/catalogs/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCatalogs, createCatalog, setActiveCatalog, deleteCatalog } from "./api";

export function useCatalogs() {
  return useQuery({
    queryKey: ["admin-catalogs"],
    queryFn: fetchCatalogs,
  });
}

export function useCatalogMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-catalogs"] });

  const createCatalogMut = useMutation({ mutationFn: createCatalog, onSuccess: invalidate });
  const setActiveMut = useMutation({ mutationFn: setActiveCatalog, onSuccess: invalidate });
  const deleteMut = useMutation({ mutationFn: deleteCatalog, onSuccess: invalidate });

  return { createCatalogMut, setActiveMut, deleteMut };
}
```

### Upload Dialog Progress Bar Pattern
```typescript
// src/components/admin/catalogs/catalog-upload-dialog.tsx (key excerpt)
// Source: UseUploadthingProps type in @uploadthing/react (verified from node_modules)
import { useUploadThing } from "@/lib/uploadthing"; // requires generateReactHelpers export
import { Progress } from "@/components/ui/progress";

const [progress, setProgress] = React.useState(0);
const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);

const { startUpload, isUploading } = useUploadThing("pdfUploader", {
  onUploadProgress: (p) => setProgress(p),        // p is 0–100 number
  onClientUploadComplete: (res) => {
    if (res?.[0]?.ufsUrl) setPdfUrl(res[0].ufsUrl);
  },
  onUploadError: (e) => toast.error(e.message),
});

// In JSX:
// {isUploading && <Progress value={progress} className="mt-2" />}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `fileUrl` (UploadThing v6) | `ufsUrl` (UploadThing v7) | UploadThing v7 | Code in Phase 1 already uses `ufsUrl` — no change needed |
| `skipPolling` prop | `awaitServerData` in route config | UploadThing v7 | `skipPolling` is deprecated; existing routes don't use it; no action needed |
| `UploadDropzone` in dialogs | `useUploadThing` + `<input type="file">` | Current best practice | Dropzone is meant for full-page zones; hook gives full control for modal UIs |

**Deprecated/outdated:**
- `skipPolling` on `useUploadThing`: Replaced by `awaitServerData` server-side config. Already marked `@deprecated` in installed package types. Don't use it.

---

## Open Questions

1. **UploadThing CDN X-Frame-Options for PDF URLs**
   - What we know: Other file storage services (Vercel Blob, PocketBase) have been reported to set `X-Frame-Options: DENY` and `Content-Disposition: attachment` on uploaded files, blocking iframe rendering
   - What's unclear: Whether UploadThing's `utfs.io` CDN sets these headers for PDF files — official docs are silent on this; no community reports found specifically about UploadThing PDFs in iframes
   - Recommendation: Build the page as designed (iframe + always-visible download button). After shipping, test with a real uploaded PDF and check response headers. If iframe is blocked, document in STATE.md — the download button is the functional fallback and no code change is needed.

2. **Header height for iframe calc**
   - What we know: The default layout uses `Header` from `src/components/layout/header.astro`; actual pixel height is unknown
   - What's unclear: Whether header height is defined as a CSS variable or must be measured
   - Recommendation: Use `calc(100vh - 4rem)` as initial estimate (Claude's discretion per CONTEXT.md); adjust if header is taller. Alternatively, use CSS `flex: 1` in a `height: 100vh` flex column to avoid magic numbers.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no pytest.ini, jest.config.*, vitest.config.*, or test/ directories found |
| Config file | None — Wave 0 must scaffold test infrastructure or accept manual-only validation |
| Quick run command | `pnpm build` (build-time type check as proxy) |
| Full suite command | `pnpm build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAT-01 | Admin uploads PDF and sees it in catalog list | manual | n/a — requires browser + UploadThing CDN | n/a |
| CAT-02 | Only one catalog is active at a time | manual | n/a — requires live DB | n/a |
| CAT-03 | Admin can delete inactive catalog; blocked on active | manual | n/a | n/a |
| CAT-04 | `/catalog` embeds active PDF in iframe | manual | n/a — requires browser to render PDF | n/a |
| CAT-05 | Download button visible on catalog page | manual | n/a | n/a |

All catalog requirements involve browser rendering, real file uploads, and live database state — none are suitable for unit testing with the current stack. TypeScript type checking (`pnpm build`) is the only meaningful automated validation available.

### Sampling Rate
- **Per task commit:** `pnpm build` — catches type errors in new API routes and components
- **Per wave merge:** `pnpm build`
- **Phase gate:** Manual browser walkthrough of all 5 success criteria before `/gsd:verify-work`

### Wave 0 Gaps
No test framework exists. No unit test files needed for this phase — all requirements are integration-level and require a live browser + CDN. Wave 0 should only include:
- [ ] `pnpm build` passing with no type errors as the baseline check

---

## Sources

### Primary (HIGH confidence)
- `node_modules/@uploadthing/react/dist/use-uploadthing-CkqJn3G-.d.ts` — `UseUploadthingProps` type, `onUploadProgress: (p: number) => void`, `generateReactHelpers` API, `isUploading` boolean, `startUpload` function
- `node_modules/uploadthing/package.json` — version 7.7.4 confirmed installed
- `node_modules/@uploadthing/react/package.json` — version 7.3.3 confirmed installed
- `src/server/uploadthing.ts` — `pdfUploader` route confirmed ready, uses `file.ufsUrl`
- `src/lib/db/schema.ts` — `productCatalogs` table confirmed: `id`, `displayName`, `pdfUrl`, `isActive`, `notes`, `uploadedBy`, `createdAt`, `updatedAt`; `insertProductCatalogSchema` exported; `ProductCatalog` type exported
- `src/components/admin/products/` — established CRUD pattern (api.ts, hooks.ts, types.ts, page, table, dialog) confirmed by file inspection
- `src/pages/api/admin/products/index.ts` + `[id].ts` — confirmed auth guard pattern (`locals.user && locals.session`)
- https://orm.drizzle.team/docs/transactions — `db.transaction(async (tx) => { ... })` API with PostgreSQL/Neon support confirmed

### Secondary (MEDIUM confidence)
- https://docs.uploadthing.com/api-reference/react — `onUploadProgress` confirmed as callback, `uploadProgressGranularity` options confirmed (via WebFetch, page returned summary)

### Tertiary (LOW confidence)
- X-Frame-Options behavior on UploadThing CDN — NOT verified. Web search found similar reports on Vercel Blob (GitHub issue #591) and PocketBase (#294, #677) but NO UploadThing-specific reports. Treat as unresolved risk.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed installed at exact versions from package.json; type signatures verified from node_modules
- Architecture: HIGH — pattern verified by reading existing products admin feature end-to-end
- Drizzle transaction pattern: HIGH — official docs verified, API syntax confirmed
- UploadThing hook API: HIGH — TypeScript types read directly from installed node_modules
- X-Frame-Options/iframe behavior: LOW — unconfirmed for UploadThing; mitigated by always-visible download button
- Pitfalls: HIGH for items 2–5 (verified from codebase); LOW for item 1 (unconfirmed CDN behavior)

**Research date:** 2026-03-06
**Valid until:** 2026-09-06 (stable stack; UploadThing v7 API stable)
