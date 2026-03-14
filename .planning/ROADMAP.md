# Roadmap: Green Lion Innovations — PDF Catalog + Blog System

## Overview

Two content features are added to a working Astro 5 + React 19 company website: a versioned PDF product catalog viewer and a database-backed markdown blog with admin authoring. Phase 1 lays the schema and upload infrastructure both features depend on. Phase 2 delivers the complete catalog feature (admin + public). Phases 3 and 4 deliver the blog in two layers: admin authoring, then public frontend. Every phase delivers an independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - DB schema migrations and UploadThing PDF upload extension (completed 2026-03-06)
- [x] **Phase 2: PDF Catalog** - Admin catalog management and public `/catalog` viewer (completed 2026-03-06)
- [x] **Phase 3: Blog Admin** - Admin CRUD for blog posts and categories with Tiptap WYSIWYG editor (completed 2026-03-07)
- [x] **Phase 4: Blog Frontend** - Public `/blog` listing, post detail, and category filter routes (completed 2026-03-07)

## Phase Details

### Phase 1: Foundation
**Goal**: The shared infrastructure both features depend on is in place and verified in production
**Depends on**: Nothing (first phase)
**Requirements**: None — this phase is pure infrastructure; no v1 requirements map here
**Success Criteria** (what must be TRUE):
  1. `productCatalogs`, `blogCategories`, and `blogPosts` tables exist in the Neon database after running Drizzle migrations
  2. An admin user can upload a PDF file via the UploadThing upload button without a file-size or type rejection error
  3. The Netlify build pipeline runs the Drizzle migration step so schema changes reach production automatically
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Add `productCatalogs`, `blogCategories`, `blogPosts` schema tables, generate migration, create netlify.toml
- [ ] 01-02-PLAN.md — Extend UploadThing router with `pdfUploader` route (32 MB, approved-user auth) and update `imageUploader` auth

### Phase 2: PDF Catalog
**Goal**: Admin can manage versioned PDF catalogs and visitors can view the active catalog on the site
**Depends on**: Phase 1
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04, CAT-05
**Success Criteria** (what must be TRUE):
  1. Admin can upload a PDF from the dashboard, give it a display name, and see it appear in the catalog list
  2. Admin can mark one catalog version as active and the toggle is enforced (only one active at a time)
  3. Admin can delete a catalog version from the list
  4. Visiting `/catalog` displays the active PDF embedded in the page using the browser's native viewer
  5. Visiting `/catalog` on a mobile browser (where inline PDF rendering fails) shows a visible download button as fallback
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Catalog REST API (GET/POST index, PUT/DELETE [id]), useUploadThing export
- [ ] 02-02-PLAN.md — Admin React island (table, upload dialog, delete dialog, active toggle, Astro shell)
- [ ] 02-03-PLAN.md — Public /catalog page (iframe embed, always-visible download button, empty state)

### Phase 3: Blog Admin
**Goal**: Admin can author, edit, publish, and delete blog posts with categories using a Tiptap WYSIWYG editor
**Depends on**: Phase 1
**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05
**Success Criteria** (what must be TRUE):
  1. Admin can create a new blog post with title, rich-text HTML body, excerpt, cover image, and an assigned category — including creating a category inline during authoring
  2. Admin can edit any field of an existing post, including replacing the cover image
  3. Admin can toggle a post between draft and published status without deleting it
  4. Admin can permanently delete a blog post
  5. Draft posts are not accessible on any public route (slug pages return 404 for drafts)
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — REST API for blog categories (GET/POST/DELETE) and blog posts (GET/POST/PUT/DELETE) with slug auto-generation, sanitize-html XSS sanitization, pagination (25/page), and auth guards
- [ ] 03-02-PLAN.md — Install Tiptap packages; full-page editor island with toolbar, BubbleMenu, FileHandler image upload, inline category combobox, hooks, and Astro shells for /admin/blog/new and /admin/blog/[id]/edit
- [ ] 03-03-PLAN.md — Blog posts list page island: paginated table with inline status toggle, delete dialog, /admin/blog/index.astro shell, and Blog nav item in admin sidebar

### Phase 4: Blog Frontend
**Goal**: Visitors can browse published blog posts, read individual posts, and filter by category — with correct social sharing metadata
**Depends on**: Phase 3
**Requirements**: BFNT-01, BFNT-02, BFNT-03, BFNT-04
**Success Criteria** (what must be TRUE):
  1. Visiting `/blog` shows a list of all published posts with title, excerpt, cover image, date, and category
  2. Visiting `/blog/[slug]` for a published post renders the full post with HTML body (sanitized at write time)
  3. Visiting `/blog/[slug]` for a draft post returns a 404 (not a rendered page)
  4. Visiting `/blog/category/[slug]` shows only published posts belonging to that category
  5. Sharing a post URL on social platforms shows the post's title, excerpt, and cover image in the link preview
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Shared foundation: reading-time utility, blog-post-card and blog-category-pill components, ogImage threading through default.astro, Blog nav link in config
- [ ] 04-02-PLAN.md — Three public pages: /blog (hero + grid + filter bar), /blog/category/[slug] (filtered listing), /blog/[slug] (post detail with draft guard and OG meta)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete   | 2026-03-06 |
| 2. PDF Catalog | 3/3 | Complete   | 2026-03-06 |
| 3. Blog Admin | 3/3 | Complete   | 2026-03-07 |
| 4. Blog Frontend | 2/2 | Complete   | 2026-03-07 |
| 5. Product CSV Import/Export | 2/2 | Complete   | 2026-03-11 |

### Phase 5: Product CSV Import/Export

**Goal:** Admin can bulk-import products from a CSV file and export the current product catalog to CSV from the existing products admin page
**Requirements**: CSV-IMPORT, CSV-EXPORT, CSV-ROUNDTRIP, CSV-IMPORT-UX, CSV-EXPORT-UX
**Depends on:** Phase 4
**Plans:** 2/2 plans complete

Plans:
- [x] 05-01-PLAN.md — CSV utility module + import POST endpoint + export GET endpoint (papaparse, upsert by SKU, tier replace, category auto-create)
- [x] 05-02-PLAN.md — CsvImportDialog component, api.ts helpers, hooks.ts mutation, products-page toolbar buttons, human verification checkpoint

### Phase 6: Add product attribute management UI to admin products page

**Goal:** Admin can assign, configure, and remove customization attributes on individual products via a new Attributes tab in the existing edit dialog
**Requirements**: None (emergent UX feature, no formal requirement IDs)
**Depends on:** Phase 5
**Plans:** 3/3 plans complete

Plans:
- [ ] 06-01-PLAN.md — Product attributes REST API (GET/POST/PUT/DELETE) + types.ts and api.ts extensions
- [ ] 06-02-PLAN.md — TanStack Query hooks + AssignAttributeDialog + ConfigureAttributeDialog + ProductAttributesTab component
- [ ] 06-03-PLAN.md — Wire Attributes tab into ProductFormDialog via shadcn Tabs + human verification checkpoint
