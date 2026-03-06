# Requirements: Green Lion Innovations — Site Features v1

**Defined:** 2026-03-06
**Core Value:** Visitors can discover Green Lion's products and services, request quotes, and access company content — all without leaving the site.

## v1 Requirements

### PDF Catalog

- [ ] **CAT-01**: Admin can upload a PDF file via the admin dashboard and save it to the catalog list with a display name
- [ ] **CAT-02**: Admin can mark one catalog version as the active catalog (only one active at a time; enforced transactionally)
- [ ] **CAT-03**: Admin can delete a catalog version from the list
- [ ] **CAT-04**: Public `/catalog` route embeds the active PDF in an iframe using the browser's native PDF viewer
- [ ] **CAT-05**: Public `/catalog` route displays a download button as a fallback when the browser cannot render the embedded PDF (mobile browsers)

### Blog Posts

- [ ] **BLOG-01**: Admin can create a blog post with title, markdown body, excerpt, cover image, and category
- [ ] **BLOG-02**: Admin can edit an existing blog post (any field, including replacing the cover image)
- [ ] **BLOG-03**: Admin can delete a blog post permanently
- [ ] **BLOG-04**: Admin can toggle a post between draft and published status without deleting it
- [ ] **BLOG-05**: Admin can create a new blog category inline while authoring or editing a post (no separate admin page required)

### Blog Frontend

- [ ] **BFNT-01**: Public `/blog` route lists all published posts (title, excerpt, cover image, date, category)
- [ ] **BFNT-02**: Public `/blog/[slug]` route renders a full individual post with rendered markdown body (published posts only — drafts return 404)
- [ ] **BFNT-03**: Public `/blog/category/[slug]` route lists published posts filtered by category
- [ ] **BFNT-04**: Individual post pages include Open Graph meta tags (title, description from excerpt, cover image)

## v2 Requirements

### Blog Enhancements

- **BLOG-V2-01**: RSS feed at `/blog/rss.xml` for subscriber syndication
- **BLOG-V2-02**: Full-text search across published blog posts
- **BLOG-V2-03**: Post scheduling — set a future publish date
- **BLOG-V2-04**: Related posts widget on post detail pages

### Catalog Enhancements

- **CAT-V2-01**: Multiple catalog types (e.g., product catalog, price list) with separate viewer routes
- **CAT-V2-02**: Catalog request form (email gating before PDF is shown)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Comment system | Not requested; adds moderation complexity |
| WYSIWYG editor | Markdown fits the stack; WYSIWYG adds 50kB+ bundle and HTML sanitization complexity |
| Custom PDF.js viewer | Native `<iframe>` covers the requirement; react-pdf adds ~500kB and has documented Vite/Astro friction |
| OAuth / social login | Not part of this project; existing email+password auth is sufficient |
| Blog post view counters | Not requested; defer to future analytics integration |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAT-01 | Phase 2 | Pending |
| CAT-02 | Phase 2 | Pending |
| CAT-03 | Phase 2 | Pending |
| CAT-04 | Phase 2 | Pending |
| CAT-05 | Phase 2 | Pending |
| BLOG-01 | Phase 3 | Pending |
| BLOG-02 | Phase 3 | Pending |
| BLOG-03 | Phase 3 | Pending |
| BLOG-04 | Phase 3 | Pending |
| BLOG-05 | Phase 3 | Pending |
| BFNT-01 | Phase 4 | Pending |
| BFNT-02 | Phase 4 | Pending |
| BFNT-03 | Phase 4 | Pending |
| BFNT-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-06 after roadmap creation — all 14 requirements mapped*
