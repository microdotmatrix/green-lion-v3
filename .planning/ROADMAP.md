# Roadmap: Green Lion Innovations — PDF Catalog + Blog System

## Overview

Two content features are added to a working Astro 5 + React 19 company website: a versioned PDF product catalog viewer and a database-backed markdown blog with admin authoring. Phase 1 lays the schema and upload infrastructure both features depend on. Phase 2 delivers the complete catalog feature (admin + public). Phases 3 and 4 deliver the blog in two layers: admin authoring, then public frontend. Every phase delivers an independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - DB schema migrations and UploadThing PDF upload extension
- [ ] **Phase 2: PDF Catalog** - Admin catalog management and public `/catalog` viewer
- [ ] **Phase 3: Blog Admin** - Admin CRUD for blog posts and categories with markdown editor
- [ ] **Phase 4: Blog Frontend** - Public `/blog` listing, post detail, and category filter routes

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
- [ ] 01-01-PLAN.md — Add `productCatalogs`, `blogCategories`, `blogPosts` schema tables, generate migration, create netlify.toml
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
**Plans**: TBD

Plans:
- [ ] 02-01: REST API for catalog versions (`GET/POST /api/admin/catalogs/index.ts`, `GET/PUT/DELETE /api/admin/catalogs/[id].ts`) with active-flag transaction and approved-user guard
- [ ] 02-02: Admin React island — catalogs table, upload dialog, delete dialog, active toggle
- [ ] 02-03: Public `/catalog` Astro page — active-catalog query, iframe embed, mobile download fallback

### Phase 3: Blog Admin
**Goal**: Admin can author, edit, publish, and delete blog posts with categories using a markdown editor
**Depends on**: Phase 1
**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05
**Success Criteria** (what must be TRUE):
  1. Admin can create a new blog post with title, markdown body, excerpt, cover image, and an assigned category — including creating a category inline during authoring
  2. Admin can edit any field of an existing post, including replacing the cover image
  3. Admin can toggle a post between draft and published status without deleting it
  4. Admin can permanently delete a blog post
  5. Draft posts are not accessible on any public route (slug pages return 404 for drafts)
**Plans**: TBD

Plans:
- [ ] 03-01: REST API for blog categories (`GET/POST index.ts`, `GET/PUT/DELETE [id].ts`) and blog posts (`GET/POST index.ts`, `GET/PUT/DELETE [id].ts`) with slug uniqueness, approved-user guards, and pagination support
- [ ] 03-02: Install blog dependencies (`@uiw/react-md-editor`, `react-markdown`, `remark-gfm`, `rehype-highlight`, `rehype-slug`, `rehype-sanitize`, `slugify`, `reading-time`) and scaffold markdown render utility
- [ ] 03-03: Admin React island — blog posts table, post form dialog with markdown editor and inline category creation, delete dialog

### Phase 4: Blog Frontend
**Goal**: Visitors can browse published blog posts, read individual posts, and filter by category — with correct social sharing metadata
**Depends on**: Phase 3
**Requirements**: BFNT-01, BFNT-02, BFNT-03, BFNT-04
**Success Criteria** (what must be TRUE):
  1. Visiting `/blog` shows a list of all published posts with title, excerpt, cover image, date, and category
  2. Visiting `/blog/[slug]` for a published post renders the full post with markdown body converted to HTML
  3. Visiting `/blog/[slug]` for a draft post returns a 404 (not a rendered page)
  4. Visiting `/blog/category/[slug]` shows only published posts belonging to that category
  5. Sharing a post URL on social platforms shows the post's title, excerpt, and cover image in the link preview
**Plans**: TBD

Plans:
- [ ] 04-01: Public Astro pages — `/blog/index.astro` (published post list), `/blog/[slug].astro` (post detail with draft guard and OG meta), `/blog/category/[slug].astro` (category filter)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Not started | - |
| 2. PDF Catalog | 0/3 | Not started | - |
| 3. Blog Admin | 0/3 | Not started | - |
| 4. Blog Frontend | 0/1 | Not started | - |
