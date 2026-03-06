# Project Research Summary

**Project:** Green Lion Innovations v3 — PDF Catalog Viewer + Blog System
**Domain:** Content features (PDF distribution + markdown blog) added to an existing Astro 5 SSR company website
**Researched:** 2026-03-05
**Confidence:** HIGH

## Executive Summary

This project adds two distinct content features to an already-functional Astro 5 + React 19 islands application: a versioned PDF product catalog viewer and a database-backed markdown blog with admin authoring. Both features are well-understood problems with clear, low-risk implementation paths that align precisely with the existing codebase patterns — no new architectural paradigms are required. The key insight from all four research areas is that every new piece fits into the two-layer pattern already governing the app: thin Astro SSR pages for public content and React islands communicating via TanStack Query with protected REST API routes for admin mutations.

The recommended stack is deliberately minimal. PDF display is handled by a native browser `<iframe>` (validating the pattern already used for the terms and conditions document), storage by extending the existing UploadThing router with a `pdfUploader` route, and blog data by adding three Drizzle tables to the existing PostgreSQL schema. The markdown editor (`@uiw/react-md-editor`) and renderer (`react-markdown` + plugins) are the only new runtime dependencies; everything else — auth, file upload, database access, admin UI scaffolding — reuses what is already installed and running.

The primary risks are operational rather than architectural. Seven specific pitfalls were identified, all preventable during initial implementation: UploadThing PDF file size limits that silently fail for large catalogs, iframe embedding blocked by CDN headers, a race condition in the "set active catalog" toggle, XSS from insufficiently sanitized markdown output, draft posts leaking via direct URL access, slug collision errors surfacing as raw database 500s, and a systemic missing `locals.user.approved` auth check inherited from existing route templates. Each has a concrete fix; none requires rework if addressed during initial implementation.

---

## Key Findings

### Recommended Stack

The existing stack requires only targeted additions. PDF viewing needs zero new client-side libraries — `<iframe>` with the UploadThing CDN URL is sufficient and is already validated by the `termsConditions` page pattern. The UploadThing router requires a single additive `pdfUploader` route (a ~15-line change). Blog storage follows the identical Drizzle + Neon pattern used by every other content entity; no separate CMS or file-system markdown approach is appropriate given the admin-CRUD architecture.

For the blog write path, `@uiw/react-md-editor` (4.6 kB gzipped) is the correct choice — a split-pane markdown editor that satisfies React 19, avoids the WYSIWYG complexity explicitly ruled out by PROJECT.md, and keeps the admin bundle lean. For the read path, `react-markdown` v10 with `remark-gfm` and `rehype-highlight` handles server-side rendering in Astro frontmatter with no client JS required.

**Core technologies:**
- Native `<iframe>` — PDF catalog display — zero bundle cost; browser handles viewer UI; same pattern as existing terms conditions page
- UploadThing `pdf` file type extension — PDF upload — 3-line addition to existing router; no new service or credentials
- Drizzle ORM + Neon PostgreSQL (existing) — blog + catalog data storage — consistent with all other content types; no new migration tooling
- `@uiw/react-md-editor` 4.0.11 — admin markdown editor — lightweight, React 19-compatible, split-pane preview
- `react-markdown` 10.1.0 + `remark-gfm` + `rehype-highlight` + `rehype-slug` — public markdown rendering — server-side in Astro; zero client JS for post pages
- `slugify` 1.6.6 — URL-safe slug generation — handles unicode, deterministic
- `reading-time` 1.5.0 — estimated read time — computed at render; no DB column needed

### Expected Features

The FEATURES.md research draws a clear MVP boundary. The full feature set for v1 is achievable without scope creep if the explicitly identified anti-features (WYSIWYG editor, custom PDF.js viewer, comment system, RSS feed) are held out.

**Must have (table stakes — v1 launch):**
- PDF embed at `/catalog` with download link and mobile fallback — visitors expect in-browser viewing
- Single active catalog with version history and admin toggle — explicitly required by PROJECT.md
- Blog post list at `/blog`, detail at `/blog/[slug]`, category filter at `/blog/category/[slug]`
- Draft/published status with admin toggle — admin needs to stage content without publishing
- Cover image, title, excerpt, markdown body per post
- Admin CRUD for posts and categories — full lifecycle management
- Slug auto-generation at creation with unique constraint
- Open Graph meta tags on post detail pages — needed from day one for social sharing

**Should have (competitive — v1.x):**
- Author attribution on posts — add `authorId` FK; show name on public detail
- Estimated read time display — computed from word count; no schema change
- Catalog version label/name — "Spring 2026 Catalog" vs UUID filename

**Defer (v2+):**
- RSS feed — B2B audience unlikely to use subscription readership
- Blog full-text search — category navigation sufficient until 50+ posts
- Post tags (many-to-many) — flat categories adequate for v1
- Scheduled publishing — requires job infrastructure not present in stack
- Comment system — explicitly out of scope in PROJECT.md

### Architecture Approach

Both features use the same two-layer architecture already governing the entire application. The public layer consists of Astro SSR pages that query the database directly in frontmatter and render static HTML with zero client-side JavaScript. The admin layer consists of thin Astro page shells that extract `locals.user` and pass it to React islands loaded with `client:load`, which use TanStack Query to communicate with REST API routes under `src/pages/api/admin/`. No new patterns are introduced; every new component has a directly analogous existing counterpart to follow.

**Major components:**
1. `src/lib/db/schema.ts` additions — `productCatalogs`, `blogCategories`, `blogPosts` tables; foundation for everything else
2. `pdfUploader` route in `src/server/uploadthing.ts` — enables PDF uploads from admin; additive to existing router
3. Admin catalog components (`catalogs-page.tsx`, `catalogs-table.tsx`, `catalog-upload-dialog.tsx`) + REST API at `/api/admin/catalogs/` — version management and active-flag control
4. Admin blog components (`blog-posts-page.tsx`, `blog-posts-table.tsx`, `blog-post-form-dialog.tsx`) + REST API at `/api/admin/blog-posts/` and `/api/admin/blog-categories/` — full CRUD authoring
5. Public Astro pages: `src/pages/catalog.astro`, `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/blog/category/[slug].astro` — SSR views with frontmatter DB queries and zero client JS

### Critical Pitfalls

1. **UploadThing PDF default 4MB maxFileSize** — explicitly set `maxFileSize: "32MB"` in the `pdfUploader` route; 4MB silently rejects real catalog files and the error is easy to miss in the upload UI.

2. **Missing `locals.user.approved` check on new admin API routes** — every new route under `src/pages/api/admin/` must include `if (!locals.user.approved) return 403` in addition to the session check; 25 of 31 existing routes omit this and the new routes will be scaffolded from those templates.

3. **Active catalog race condition** — the "set active" PUT handler must use a Drizzle transaction (deactivate all rows, then activate target) rather than two sequential UPDATEs; Netlify Functions can process concurrent invocations that create two simultaneous active catalogs.

4. **Markdown XSS from raw HTML passthrough** — include `rehype-sanitize` in the markdown render pipeline; most markdown parsers (including `react-markdown` configured with `rehype-raw`) allow embedded HTML by default, creating an XSS vector even for admin-authored content.

5. **Draft posts accessible via direct URL** — the `/blog/[slug]` Astro page must explicitly filter `status = 'published'` in its own frontmatter query; filtering only in the list endpoint is a common oversight that leaks draft content to anyone who guesses the slug.

6. **UploadThing CDN X-Frame-Options blocking iframe embed** — verify `X-Frame-Options` and `Content-Security-Policy: frame-ancestors` headers on an actual UploadThing PDF URL before shipping the catalog page; build a fallback "open in new tab" link for when embedding is blocked.

7. **Blog slug collision returning raw 500** — the POST endpoint for blog posts must handle the unique constraint violation and return a 409 with a human-readable error message; at minimum, allow the admin to override the auto-generated slug on the creation form.

---

## Implications for Roadmap

Based on the dependency graph in ARCHITECTURE.md and the pitfall-to-phase mapping in PITFALLS.md, a three-phase structure is recommended.

### Phase 1: Foundation — Schema, Migrations, and UploadThing Extension

**Rationale:** Every subsequent piece of work depends on the database tables existing and the PDF upload endpoint being functional. This phase has no UI and no public-facing deliverables but unblocks all later work. It is the shortest phase and should be done first and completely before any other work begins.

**Delivers:**
- `productCatalogs`, `blogCategories`, `blogPosts` tables in `src/lib/db/schema.ts`
- Drizzle migration generated and pushed to Neon (production schema updated)
- `pdfUploader` route added to `src/server/uploadthing.ts` with `maxFileSize: "32MB"` and correct auth middleware
- `UPLOADTHING_TOKEN` added to Astro env schema in `astro.config.mjs` (currently missing per CONCERNS.md)

**Addresses:** All feature dependencies listed in FEATURES.md; prerequisite for Phases 2 and 3

**Avoids:**
- Silent PDF upload failures (Pitfall 2 — wrong maxFileSize)
- UPLOADTHING_TOKEN missing in production (PITFALLS.md integration gotcha)
- Partial unique index consideration for `isActive` (set up schema constraints before first migration)

**Research flag:** SKIP — schema additions follow well-documented existing patterns; no research needed.

---

### Phase 2: PDF Catalog Feature — Admin + Public Viewer

**Rationale:** The catalog feature is self-contained after Phase 1 and has fewer components than the blog. Completing it first gives a working, demonstrable feature while blog scaffolding is underway. The catalog also has the most operationally risky pitfall (iframe embedding headers, mobile PDF support) that should be validated early before the team invests in the full blog.

**Delivers:**
- REST API: `GET/POST /api/admin/catalogs/index.ts`, `GET/PUT/DELETE /api/admin/catalogs/[id].ts`
- Admin React components: `catalogs-page.tsx`, `catalogs-table.tsx`, `catalog-upload-dialog.tsx`, `delete-catalog-dialog.tsx`
- Admin Astro shell: `src/pages/admin/catalogs.astro` + `admin-catalogs-page.tsx` island entry
- Public page: `src/pages/catalog.astro` — queries active catalog, renders `<iframe>` with mobile fallback download link

**Addresses:**
- PDF upload + active-catalog mechanism (P1)
- Catalog version list in admin (P1)
- Public `/catalog` iframe embed + download link (P1)
- Multiple catalog versions with one marked active (differentiator)

**Avoids:**
- Active catalog race condition: implement "set active" as a Drizzle transaction (Pitfall 3)
- Missing `approved` check: add `if (!locals.user.approved) return 403` to every catalog API handler (Pitfall 5)
- Iframe embed blocking: verify UploadThing CDN headers and implement fallback before QA (Pitfall 7)
- Mobile PDF display: test on iOS Safari; show download CTA when `navigator.pdfViewerEnabled` is false (Pitfall 1)
- No confirmation dialog before activating a catalog version (UX pitfall)

**Research flag:** SKIP — all patterns are directly derivable from existing codebase; CDN header verification is operational, not architectural.

---

### Phase 3: Blog Feature — Admin Authoring + Public Routes

**Rationale:** The blog depends on Phase 1 (schema + migration). It is larger than the catalog feature in both component count and API surface, so it follows Phase 2 rather than running in parallel. The blog also has the most security-sensitive pitfalls (XSS, draft leakage, slug collisions) that benefit from the team having warmed up on the simpler catalog feature first.

**Delivers:**
- Install new dependencies: `@uiw/react-md-editor`, `react-markdown`, `remark-gfm`, `rehype-highlight`, `rehype-slug`, `rehype-sanitize`, `slugify`, `reading-time`
- REST API: blog categories (`GET/POST index.ts`, `GET/PUT/DELETE [id].ts`) and blog posts (`GET/POST index.ts`, `GET/PUT/DELETE [id].ts`)
- Admin React components: `blog-posts-page.tsx`, `blog-posts-table.tsx`, `blog-post-form-dialog.tsx` (with `@uiw/react-md-editor`), `delete-post-dialog.tsx`
- Admin Astro shell: `src/pages/admin/blog.astro` + `admin-blog-page.tsx`
- Public Astro pages: `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/blog/category/[slug].astro`
- Markdown render utility with `rehype-sanitize` in pipeline
- Open Graph meta tags on `/blog/[slug]` (P1 — add to initial implementation)

**Addresses:**
- Blog schema + migration (P1)
- Admin blog CRUD for posts and categories (P1)
- Public blog list, detail, category pages (P1)
- Draft/published toggle (P1)
- Markdown rendering (P1)
- Cover image on posts (P1)

**Avoids:**
- Markdown XSS: use `rehype-sanitize` in render pipeline; test with `<script>alert(1)</script>` in body (Pitfall 6)
- Draft post URL leak: add `eq(blogPosts.status, "published")` explicitly to `/blog/[slug]` frontmatter query (Pitfall: draft leak)
- Slug collision 500: implement slug uniqueness check and return 409 with descriptive error (Pitfall 4)
- Missing `approved` check: add to every new blog API handler (Pitfall 5)
- N+1 queries in blog list: use a single JOIN to fetch category data alongside posts (performance trap)
- No pagination: add `limit`/`offset` to the admin blog list API from day one even if UI does not paginate initially (performance trap)

**Research flag:** SKIP for core implementation. Flag for consideration: if per-post OG images require dynamic image generation (e.g., `@vercel/og`), that warrants a focused research spike. For static cover image OG meta, no research is needed.

---

### Phase Ordering Rationale

- **Schema first (Phase 1):** ARCHITECTURE.md is explicit that the DB tables are the dependency root. Nothing else can be built or tested without them. The migration must be pushed to production before any feature branch can be verified end-to-end.
- **Catalog before blog (Phase 2 before 3):** The catalog has fewer components (4 admin sub-components vs 4+ for blog, but simpler form), fewer pitfalls in the implementation, and its primary risk (CDN iframe headers) is an external observable fact that should be validated before committing to the iframe architecture in the blog's cover image pattern. Additionally, Phase 3 benefits from Phase 2 experience with the `pdfUploader`/UploadThing integration.
- **Blog in one phase (Phase 3):** Categories and posts are tightly coupled (posts have a `categoryId` FK), and the admin form dialog requires categories to populate the select field. Splitting them across phases would leave the admin blog form non-functional between phases.

### Research Flags

Phases likely needing deeper research during planning:
- **None identified.** All features map directly to well-documented existing codebase patterns. The only external uncertainty — UploadThing CDN iframe headers — is resolved by a one-time operational check, not research.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Drizzle schema/migration patterns are fully established; UploadThing router extension is documented.
- **Phase 2 (Catalog):** Mirrors existing admin CRUD domains (products, services, tradeshows) with one additional concern (active-flag transaction) that has a known solution.
- **Phase 3 (Blog):** Uses well-documented react-markdown ecosystem; admin form dialog follows `case-study-form-dialog.tsx` pattern; public routes mirror `src/pages/products/`.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Technologies verified via `npm info`; all peer deps confirmed compatible with React 19; UploadThing `pdf` type confirmed in official docs; `<iframe>` pattern validated by existing `termsConditions` page |
| Features | HIGH | Requirements are explicit in PROJECT.md; feature boundaries derived from direct codebase inspection; anti-features have clear documented rationale |
| Architecture | HIGH | Derived from direct analysis of 13 existing admin pages, all following identical patterns; component boundaries and data flow confirmed against actual source files |
| Pitfalls | HIGH | Codebase-specific: findings tied to actual CONCERNS.md entries (auth bug, race condition, env var gaps); external sources (UploadThing docs, MDN, caniuse) confirm mobile PDF and CDN header concerns |

**Overall confidence:** HIGH

### Gaps to Address

- **UploadThing CDN header behavior for PDFs:** Whether `utfs.io`/`ufs.io` sends `X-Frame-Options: SAMEORIGIN` for PDF files is not confirmed from documentation. Requires an operational check (fetch a real uploaded PDF URL and inspect headers) before finalizing the catalog public page implementation. Resolution: build the fallback download link from the start rather than retrofitting it.

- **`@uiw/react-md-editor` React 19 runtime behavior:** The peer dep (`react >=16.8.0`) satisfies React 19, but no known production reports of React 19-specific issues were found in either direction. Resolution: verify with `pnpm install` (will warn on genuine peer dep conflicts) and validate in the dev server before committing to this dependency for the blog form dialog.

- **Drizzle migration in Netlify build pipeline:** The existing Netlify deploy configuration was not inspected for whether `drizzle-kit migrate` runs as part of the build command. Resolution: confirm `netlify.toml` or the Netlify dashboard build command includes the migration step before Phase 1 is considered complete.

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — technology versions, peer deps, alternatives analysis
- `.planning/research/FEATURES.md` — feature requirements, MVP definition, dependency graph
- `.planning/research/ARCHITECTURE.md` — component map, data flows, schema design, build order
- `.planning/research/PITFALLS.md` — pitfall inventory with prevention and recovery strategies
- `.planning/PROJECT.md` — explicit requirements, out-of-scope decisions, key constraints
- `.planning/codebase/CONCERNS.md` — documented existing bugs (auth, race conditions, env vars)
- `.planning/codebase/ARCHITECTURE.md` — codebase-level architecture overview
- `src/lib/db/schema.ts` — existing table patterns (confirmed via direct inspection)
- `src/server/uploadthing.ts` — current upload router state
- UploadThing file routes docs — `pdf` shorthand type, `contentDisposition`, file size defaults

### Secondary (MEDIUM confidence)
- react-markdown changelog — v10 Feb 2025 release, React >=18 peer dep
- uiw/react-md-editor GitHub releases — v4.0.11 latest
- react-pdf Astro discussions — Vite worker friction (cited as reason NOT to use)
- MDN `navigator.pdfViewerEnabled` — mobile inline PDF support

### Tertiary (LOW confidence)
- UploadThing CDN `X-Frame-Options` behavior for PDFs — not explicitly documented; needs operational verification before catalog public page ships

---
*Research completed: 2026-03-05*
*Ready for roadmap: yes*
