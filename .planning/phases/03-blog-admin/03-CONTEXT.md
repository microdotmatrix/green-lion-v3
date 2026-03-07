# Phase 3: Blog Admin - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can author, edit, publish, and delete blog posts with categories using a rich text (WYSIWYG) editor. This phase delivers the complete admin authoring surface. Public blog routes are Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Editor placement
- Dedicated full-page editor routes, not a dialog: `/admin/blog/new` and `/admin/blog/[id]/edit`
- Gives full vertical space for the rich text body — a dialog is too cramped for long-form content
- Layout top-to-bottom: Title + Status selector → Category combobox + Excerpt → Tiptap editor (full width) → Cover image → Save/Cancel
- "New Post" navigates to `/admin/blog/new`; "Edit" in the table navigates to `/admin/blog/[id]/edit`

### Rich text editor — WYSIWYG pivot
- **@tiptap/react** WYSIWYG editor, NOT markdown — overrides the pre-phase markdown decision
- Rationale: team has existing experience with Tiptap, React 19 compatible, future AI integrations available
- Post body stored as **HTML** in the database (`blogPosts.body` column)
- No preview tab needed — Tiptap renders inline as the admin types (WYSIWYG)
- Inline images **enabled** via Tiptap Image extension, wired to UploadThing (`imageUploader` route)
- No markdown pipeline needed in Phase 4 — public blog pages render body HTML with `dangerouslySetInnerHTML` (sanitized)
- Previous roadmap Plan 03-02 library list (`@uiw/react-md-editor`, `react-markdown`, `remark-gfm`, etc.) is replaced with Tiptap packages

### Cover image
- Positioned below the Tiptap editor in the form layout
- Uses the existing `ImageUpload` component (`src/components/admin/image-upload.tsx`) — upload via UploadThing or URL

### Slug generation
- Auto-generated from title at creation time via `slugify`
- No slug field shown to admin — not editable, no read-only display
- Consistent with the pre-phase slug decision

### Category inline creation
- Category field in the post form is a **combobox with "Create new" option**
- Admin types a category name → dropdown shows existing matches + `+ Create "X"` option at the bottom
- One click creates the category and immediately selects it — no separate dialog required
- Category slug auto-generated from the name via `slugify`
- No separate `/admin/blog/categories` page — inline creation is sufficient (BLOG-05 spec)
- Category is **optional** — `categoryId` is nullable; uncategorized posts appear on `/blog` but not on `/blog/category/[slug]`

### Post table columns and layout
- Columns: **Title** (clickable link to edit page) | **Category** (badge) | **Status** (Draft/Published badge) | **Date** (created or published) | **Actions** (Edit button, Delete button)
- Pagination: 25 posts per page with next/prev controls

### Draft/publish workflow
- New posts always start as **Draft** — no accidental publishing
- Status toggle available **both** in the table row and in the editor form:
  - In-table: a toggle or button in the Status column for quick publish/unpublish without opening the editor
  - In-form: a status selector (dropdown: Draft / Published) at the top of the editor page
- Saving a post does not auto-publish — status must be explicitly set to Published

### Claude's Discretion
- Exact Tiptap extensions to install (StarterKit, Image, Link, Placeholder are expected; CodeBlock, Table at discretion)
- Sanitization approach for HTML output before storage (DOMPurify or server-side sanitize-html)
- Exact combobox component implementation (Radix Combobox or cmdk — whichever fits the existing shadcn/ui stack)
- Toast wording for create/update/delete/publish success messages
- Delete confirmation dialog copy
- Exact in-table publish toggle visual (toggle switch vs "Publish" / "Unpublish" button)

</decisions>

<specifics>
## Specific Ideas

- Team has prior Tiptap experience on other projects — lean on that familiarity when choosing extensions
- Tiptap AI integrations are a future possibility; don't block them by architectural choices in Phase 3
- The "Create X" combobox pattern should feel instant — POST to `/api/admin/blog-categories` and optimistically select the new category without a page reload

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/admin/image-upload.tsx`: Reuse directly for the cover image field — supports UploadThing upload + URL input, already used in product forms
- `src/components/ui/responsive-modal.tsx`: Used in all existing form dialogs — not needed for the editor page, but reuse for the delete confirmation dialog
- `src/components/ui/badge.tsx`: Status (Draft/Published) and Category badges in the post table
- `src/components/ui/table.tsx`: Post list table — same structure as catalog/product tables
- `src/components/ui/button.tsx`: All action buttons
- `src/components/ui/input.tsx`, `textarea.tsx`: Title, excerpt fields
- `src/components/ui/select.tsx`: Status selector dropdown in the editor form
- TanStack Query (`useQuery` + `useMutation`): All data fetching and mutations — established pattern
- `toast.success` / `toast.error` from sonner: Mutation feedback

### Established Patterns
- Admin feature structure: `src/components/admin/{feature}/` with `{feature}-page.tsx`, `{feature}-table.tsx`, hooks file, types file, delete dialog
- Thin Astro shell → React island (`client:load`) — follow for `/admin/blog/index.astro` (table) and `/admin/blog/new.astro` + `/admin/blog/[id]/edit.astro` (editor pages)
- REST API: `src/pages/api/admin/{feature}/index.ts` (GET list, POST create) + `[id].ts` (GET, PUT, DELETE)
- Auth guard: middleware auto-handles `/api/admin/*`; add `locals.user` check in handlers as defense-in-depth
- Delete confirmation: separate `delete-{feature}-dialog.tsx` component pattern (see `delete-catalog-dialog.tsx`)
- Two-phase upload in catalog: confirm UploadThing URL in `onClientUploadComplete` before POSTing to API — apply same pattern for inline Tiptap image uploads

### Integration Points
- `src/lib/db/schema.ts` — `blogPosts` and `blogCategories` tables already defined (Phase 1); `body` column is `text` and stores HTML
- `src/pages/admin/blog/` — new directory with `index.astro` (table), `new.astro` (create), `[id]/edit.astro` (edit)
- `src/pages/api/admin/blog-posts/` — new REST endpoints (index.ts + [id].ts)
- `src/pages/api/admin/blog-categories/` — new REST endpoints (index.ts + [id].ts)
- Admin sidebar navigation — add "Blog" link pointing to `/admin/blog`

</code_context>

<deferred>
## Deferred Ideas

- Tiptap AI integrations (e.g., AI writing assist) — future phase when the AI use case is defined
- Standalone blog category admin page (rename, delete) — noted but explicitly out of BLOG-05 scope; add to v2 backlog
- Slug manual override — auto-generation is sufficient for v1

</deferred>

---

*Phase: 03-blog-admin*
*Context gathered: 2026-03-06*
