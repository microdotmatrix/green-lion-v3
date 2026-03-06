# Green Lion Innovations — Site Features v1

## What This Is

Green Lion Innovations company website built on Astro 5 with React islands. The site serves as a marketing and lead-generation platform featuring product catalogs, quote requests, contact forms, and trade show lead capture. This project adds two content management features: an embedded PDF catalog viewer and a blog system, both admin-authored.

## Core Value

Visitors can discover Green Lion's products and services, request quotes, and access company content — all without leaving the site.

## Requirements

### Validated

- ✓ Product catalog browsing with categories and pricing — existing
- ✓ Quote request builder with multi-step flow — existing
- ✓ Contact form with admin email notifications — existing
- ✓ Trade show rep and lead capture system — existing
- ✓ Admin dashboard with authentication (invite-only, approval-gated) — existing
- ✓ Admin CRUD for products, categories, services, testimonials, case studies — existing
- ✓ File upload via UploadThing (images, admin-only) — existing
- ✓ Transactional email via Resend — existing
- ✓ Terms & conditions page with PDF embedding — existing

### Active

- [ ] Admin can upload a PDF catalog via the admin dashboard
- [ ] Admin can manage multiple catalog versions, marking one as current/active
- [ ] Public route `/catalog` renders the active catalog PDF embedded in the site
- [ ] Admin can create blog posts with title, rich text body, cover image, excerpt, and category/tags
- [ ] Blog posts support draft and published status (only published posts visible on frontend)
- [ ] Public route `/blog` lists all published posts
- [ ] Public route `/blog/[slug]` renders a full individual post
- [ ] Public routes `/blog/category/[slug]` filter posts by category

### Out of Scope

- RSS feed — not requested, defer to future
- Comment system — not requested, out of scope for v1
- Post search — not requested, defer to future
- OAuth or social login — not part of this project
- Rich text WYSIWYG editor — markdown fits the existing stack; WYSIWYG adds complexity with no clear benefit

## Context

- Existing file upload infrastructure (UploadThing) currently handles images only; PDF support needs to be added to the upload router (`src/server/uploadthing.ts`)
- There is already a `terms_conditions` table in the schema that stores PDF URLs — catalog can follow a similar pattern
- Admin page pattern: thin Astro shell → React island (`client:load`) → TanStack Query + REST API at `/api/admin/*`
- All admin mutations go through REST API routes in `src/pages/api/admin/`; middleware handles auth automatically
- Database schema changes require a Drizzle migration (`db:generate` + `db:push` or `db:migrate`)
- Blog slugs should be URL-safe and derived from the post title at creation time

## Constraints

- **Tech Stack**: Astro 5 + React 19 islands — no full React router; interactive admin UI must use the island pattern
- **Database**: Drizzle ORM + Neon PostgreSQL — all schema changes via Drizzle migrations
- **File Storage**: UploadThing — extend existing router for PDF uploads rather than introducing a new storage provider
- **Auth**: better-auth with invite-only + approval gate — all admin routes automatically protected by middleware
- **Deployment**: Netlify SSR — server-rendered; no static export constraints

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Markdown for blog editor | Fits existing stack; no new dependencies; user expressed no strong preference | — Pending |
| UploadThing for PDF storage | Already integrated; avoids new storage provider; just needs PDF mime type added to router | — Pending |
| Catalog: multiple versions, one active | User requested version history with one marked current | — Pending |
| Blog categories as first-class entities | Enables category pages and future filtering; consistent with existing category pattern | — Pending |

---
*Last updated: 2026-03-05 after initialization*
