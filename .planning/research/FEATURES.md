# Feature Research

**Domain:** PDF catalog viewer + blog system on an existing Astro 5 company website
**Researched:** 2026-03-05
**Confidence:** HIGH — requirements are explicit in PROJECT.md; codebase patterns are fully understood from direct inspection

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

#### PDF Catalog Viewer

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Embedded PDF render at `/catalog` | Visitors expect to view the catalog in-browser, not download | LOW | Browser `<iframe>` with `<object>` fallback covers 99% of cases; no JS library needed for basic embed |
| Download link alongside viewer | Users want the PDF for offline reference or printing | LOW | Simple anchor tag pointing to the UploadThing CDN URL; already available from the upload |
| Mobile-usable presentation | Catalog must be accessible on phones/tablets | LOW | Native browser PDF viewers on mobile are functional; an `<iframe>` embed degrades gracefully; no special handling needed |
| Active catalog is what public sees | Only one catalog is current at a time; uploading a new one replaces the visible one | MEDIUM | Needs an `isActive` boolean or similar mechanism; the `termsConditions` table pattern (single row per document type) is the simplest model |

#### Blog System

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Post list at `/blog` | Entry point for the blog; required for discoverability | LOW | Server-rendered Astro page; DB query in frontmatter following existing public page pattern |
| Individual post at `/blog/[slug]` | Canonical URL per post; required for sharing and SEO | LOW | Astro dynamic route; slug derived from title at creation |
| Draft/published status | Admin must be able to save in-progress work without it going public | LOW | Boolean `published` column or `status` enum; WHERE filter on public queries |
| Cover image per post | Blog posts without images look incomplete in list views | LOW | UploadThing upload (same `imageUploader` endpoint already present); stored as URL string in DB |
| Title and excerpt fields | Title is required; excerpt drives list-view card copy and meta description | LOW | Simple text fields in schema |
| Rich text / markdown body | Posts need more than plain text — headings, bold, lists, links | MEDIUM | Markdown stored as text, rendered server-side; see Differentiators section for editor choice discussion |
| Category pages at `/blog/category/[slug]` | Users expect to filter posts by topic | LOW | Astro dynamic route; same DB query with WHERE on category |
| Admin CRUD for posts | Create, edit, delete posts from the admin dashboard | MEDIUM | Follows existing admin page pattern: thin Astro shell → React island → TanStack Query + REST API |
| Admin CRUD for blog categories | Categories must be manageable without code changes | LOW | Simple table; follows same pattern as existing product categories |
| Slug auto-generation | URL-safe slug derived from title at creation | LOW | `title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')` at API layer |

---

### Differentiators (Competitive Advantage)

Features that set the product apart from a bare-minimum implementation. Not required for v1, but valued.

#### PDF Catalog Viewer

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multiple catalog versions with one marked active | Admin can keep version history and switch active catalog without re-uploading | MEDIUM | Needs `catalogs` table with `isActive` boolean and SET-one-active logic in the API; PROJECT.md explicitly requests this |
| Version label / name per upload | "Spring 2026 Catalog" rather than a UUID filename | LOW | Single `name` text field in the catalogs table; shown in admin list |
| Upload date visible in admin | Admin sees when each version was uploaded for version management | LOW | `createdAt` timestamp already auto-set by Drizzle `defaultNow()` pattern |
| CTA adjacent to catalog | A quote request button or contact link next to the PDF converts viewers | LOW | Static Astro markup around the iframe; no new infrastructure |

#### Blog System

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Post published date (visible to readers) | Establishes content recency; standard on every blog | LOW | `publishedAt` timestamp column; nullable; set when status changes to published |
| Tags (many-to-many, in addition to categories) | Tags let a post cross multiple topics without multiple categories | MEDIUM | Requires a `blog_post_tags` junction table; adds schema complexity |
| Open Graph meta per post | Cover image + title appear correctly when posts are shared to social | LOW | Already how public pages work in this stack; just needs the right `<meta>` tags in the Astro page |
| Estimated read time | "5 min read" next to post title improves click-through | LOW | Computed at render time from word count; no DB column needed |
| Author attribution | "Written by [Admin Name]" links the post to the admin user who created it | LOW | `authorId` foreign key to the `user` table; author name shown on public post |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly NOT build in v1. Each has a reason and a better alternative.

#### PDF Catalog Viewer

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Custom PDF.js viewer with page controls | Looks polished; avoids iOS Safari iframe quirks | Significant JS bundle weight (PDF.js is ~1 MB compressed); mobile Safari actually handles PDFs well via native viewer; adds a new dependency with no clear user-facing benefit for a single-catalog use case | Native browser `<iframe>`/`<object>` embed. Works on all platforms. Zero JS. If iOS is a real concern, a prominent download link solves it. |
| PDF text extraction / search indexing | "So you can search the catalog" | Would require server-side PDF parsing (pdf-parse or similar); creates a maintenance surface; the product catalog browsing already exists at `/products` | The structured product catalog at `/products` already provides searchable, filterable product browsing. The PDF is for print/download use, not as a search target. |
| Catalog request / gating (require email to download) | Lead capture on catalog downloads | Adds a form, email send, and gated URL flow; the site already has a quote request and contact form serving this purpose | Direct the user to the existing quote request flow instead. |

#### Blog System

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| WYSIWYG rich text editor (TipTap, Quill, Slate) | "Easier for non-technical admins" | Any block/WYSIWYG editor in a React island is a significant dependency (TipTap alone is ~50 kB gzipped); produces HTML or JSON that must be sanitized before rendering; PROJECT.md explicitly decided against this | Markdown textarea in the admin form. The existing admin audience is already technical (invite-only, approval-gated). `marked` or `remark` at render time is lightweight and safe. |
| Comment system | Standard blog feature | Requires spam protection (reCAPTCHA or moderation queue), comment storage, reply threading, and email notifications for each new comment — easily as complex as the blog itself | PROJECT.md explicitly out-of-scopes this. If engagement is needed, a CTA linking to the contact form serves the same intent. |
| RSS feed | "Blogs have RSS" | Low user impact for a B2B company site; the standards surface area (Atom vs RSS 2.0, date formatting, encoding) is non-trivial | Defer to v2 if any user explicitly requests it. The blog is primarily for SEO and brand content, not subscription readership. |
| Full-text post search | Discoverability | Requires either a DB full-text index (feasible with Postgres `tsvector`) or a search service (Algolia, etc.); the blog at v1 will have few enough posts that category navigation and the post list are sufficient | Category pages provide adequate filtering for v1. Add search when post count makes it necessary. |
| Scheduled publishing (publish at future date) | Admin convenience | Requires a background job or cron-style mechanism; Netlify SSR has no built-in scheduler; no scheduled job infrastructure exists in this stack | The admin can set `published = false` (draft), then return to publish manually when ready. |
| Post revision history | Recovering from mistakes | Requires storing versions of post content; multiple rows per post; complex diff UI | Single-draft model with a plain "last updated" timestamp is sufficient. The admin is a small trusted group. |
| Image gallery / media library | Central image management | Significantly increases admin UI scope; UploadThing doesn't provide a file listing API by default | Upload per-resource at point of use (same pattern as product images and case study images throughout the existing admin). |

---

## Feature Dependencies

```
[PDF Catalog — Public Route /catalog]
    └──requires──> [Active catalog record in DB]
                       └──requires──> [PDF uploaded via UploadThing]
                                          └──requires──> [pdfUploader endpoint added to uploadRouter]

[Catalog version management (active/inactive)]
    └──requires──> [catalogs table in Drizzle schema]
                       └──requires──> [Drizzle migration generated and pushed]

[Blog post list /blog]
    └──requires──> [blog_posts table with published status]

[Blog post detail /blog/[slug]]
    └──requires──> [blog_posts table]
                       └──requires──> [Slug generated at creation]

[Blog category pages /blog/category/[slug]]
    └──requires──> [blog_categories table]
                       └──requires──> [blog_posts.categoryId FK]

[Blog post body rendering (Markdown → HTML)]
    └──requires──> [markdown parser at render time (remark or marked)]

[Admin blog post CRUD]
    └──requires──> [/api/admin/blog/* REST endpoints]
                       └──requires──> [blog_posts + blog_categories schema + migration]

[Admin blog category CRUD]
    └──requires──> [/api/admin/blog/categories/* REST endpoints]
                       └──requires──> [blog_categories table]

[Cover image on blog post]
    └──requires──> [Existing imageUploader UploadThing endpoint — already present]

[Post published date visible to readers]
    └──enhances──> [blog_posts table]
                       └──needs──> [publishedAt nullable timestamp column]

[Author attribution]
    └──enhances──> [blog_posts table]
                       └──needs──> [authorId FK to user table]
```

### Dependency Notes

- **pdfUploader endpoint required before catalog upload UI:** The `uploadRouter` in `src/server/uploadthing.ts` currently only has `imageUploader`. A `pdfUploader` endpoint must be added (adding `pdf` mime type, larger size limit ~20MB) before any admin PDF upload UI can function.
- **`catalogs` table required before public `/catalog` route:** The public page needs a record to query. DB schema + migration come first.
- **`blog_categories` required before `blog_posts`:** The posts table will have a nullable `categoryId` FK; categories table must exist first to satisfy the FK reference.
- **Markdown parser needed before post detail renders:** The body is stored as raw markdown text. The public post detail page needs a server-side markdown-to-HTML transform at render time. `remark` with `remark-html` is the lightest option that integrates cleanly with Astro's server-side rendering model.
- **Slug at creation, immutable after:** Slugs must be generated when the post is first created and should not change if the title is later edited. The slug column needs a unique constraint.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to fulfill the stated requirements.

**Catalog:**
- [ ] `pdfUploader` endpoint added to UploadThing router — enables all catalog uploads
- [ ] `catalogs` DB table with `id`, `name`, `pdfUrl`, `isActive`, `createdAt` — enables version tracking
- [ ] Admin page at `/admin/catalog` — upload PDF, list versions, mark one active, delete old versions
- [ ] `/api/admin/catalog` REST endpoints (GET list, POST create, PATCH `:id` for activate/rename, DELETE `:id`)
- [ ] Public page at `/catalog` — query active catalog, render `<iframe>` embed + download link

**Blog:**
- [ ] `blog_categories` table and `blog_posts` table in Drizzle schema — foundation
- [ ] Drizzle migration for both tables
- [ ] Markdown parser dependency (remark or marked) — body rendering
- [ ] Admin page at `/admin/blog` — list all posts with status badge, create/edit/delete, publish toggle
- [ ] Admin page at `/admin/blog/categories` — manage categories (or inline on the blog admin page)
- [ ] `/api/admin/blog/posts` and `/api/admin/blog/categories` REST endpoints
- [ ] Public `/blog` — list published posts with cover image, title, excerpt, category, date
- [ ] Public `/blog/[slug]` — full post with rendered markdown body, cover image, meta tags
- [ ] Public `/blog/category/[slug]` — filtered post list by category

### Add After Validation (v1.x)

Features to add once core is working and in production.

- [ ] Author attribution on posts — add `authorId` FK to `blog_posts`; show admin name on public detail page. Trigger: when there are multiple admins authoring posts.
- [ ] Open Graph meta tags for blog posts — `<meta og:image>` from cover image, `<meta og:description>` from excerpt. Trigger: immediately on launch, actually — add to initial post detail page.
- [ ] Estimated read time display — computed from word count at render. Trigger: when posts get long enough that readers want a signal.
- [ ] Catalog version name/label — `name` field on the catalogs table to distinguish versions. Already included in schema recommendation but could be stripped to a plain replace-in-place model if admin is the only user.

### Future Consideration (v2+)

Features to defer until product-market fit is established or explicit requests come in.

- [ ] RSS feed — defer until a subscriber audience actually exists
- [ ] Blog full-text search — defer until post count makes category navigation insufficient (rough threshold: 50+ posts)
- [ ] Post tags (many-to-many) — defer until categories prove insufficient for navigation
- [ ] Scheduled publishing — defer; requires job scheduling infrastructure not present in this stack
- [ ] Comment system — PROJECT.md explicitly out-of-scope
- [ ] PDF text extraction / catalog search — the structured `/products` catalog already covers this need

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| PDF upload + active-catalog mechanism | HIGH | MEDIUM | P1 |
| Public `/catalog` iframe embed | HIGH | LOW | P1 |
| Blog schema + migration | HIGH | LOW | P1 |
| Admin blog CRUD (posts + categories) | HIGH | MEDIUM | P1 |
| Public blog list + detail + category pages | HIGH | LOW | P1 |
| Draft/published toggle | HIGH | LOW | P1 |
| Markdown rendering | HIGH | LOW | P1 |
| Cover image on posts | MEDIUM | LOW | P1 |
| Catalog version list in admin | MEDIUM | LOW | P1 |
| Catalog download link | MEDIUM | LOW | P1 |
| Open Graph meta on post pages | MEDIUM | LOW | P1 (add to post detail page) |
| Author attribution | LOW | LOW | P2 |
| Estimated read time | LOW | LOW | P2 |
| Post tags | LOW | MEDIUM | P3 |
| RSS feed | LOW | MEDIUM | P3 |
| WYSIWYG editor | LOW | HIGH | Anti-feature |
| Custom PDF.js viewer | LOW | HIGH | Anti-feature |
| Comment system | LOW | HIGH | Anti-feature |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

This is a company website adding internal content features (not a SaaS product competing in a market). The "competitors" here are the conventions established by similar B2B company blogs and catalog distribution patterns.

| Feature | Common B2B Pattern | Minimum Viable | Our Approach |
|---------|-------------------|----------------|--------------|
| PDF distribution | Gated download (email required) | Direct embed + download link | Direct embed + download link — lead capture already served by quote/contact forms |
| Blog editor | WYSIWYG (WordPress-style) | Markdown textarea | Markdown textarea — admin is technical; avoids large dependency |
| Blog categories | Hierarchical categories + tags | Flat categories only | Flat categories only in v1; matches existing product categories pattern |
| Blog SEO | Dedicated SEO plugin with sitemap + OG | OG meta in page head | OG meta in Astro page head — simple, sufficient |
| Catalog versioning | Replace current file | Version list with active flag | Version list with active flag — explicitly requested in PROJECT.md |
| Post list pagination | Required for 50+ posts | Not needed at launch | Not needed at launch; add when post count warrants it |

---

## Sources

- `.planning/PROJECT.md` — explicit requirements, out-of-scope decisions, and key decisions already made
- `.planning/codebase/ARCHITECTURE.md` — admin pattern, data flow, and component conventions
- `src/lib/db/schema.ts` — existing table patterns (especially `termsConditions` as PDF URL precedent, `categories` as category precedent, `tradeshowReps.slug` as slug-with-unique-constraint precedent)
- `src/server/uploadthing.ts` — current upload router; confirms `imageUploader` only, PDF extension needed
- `src/components/admin/image-upload.tsx` — UploadThing integration pattern for file upload in admin forms
- `src/components/admin/content/case-study-form-dialog.tsx` — representative admin form dialog pattern
- `src/pages/api/admin/products/index.ts` — representative admin REST API pattern

---

*Feature research for: Green Lion Innovations — PDF Catalog Viewer + Blog System*
*Researched: 2026-03-05*
