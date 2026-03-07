---
phase: 03-blog-admin
plan: "01"
subsystem: api
tags: [drizzle, postgres, sanitize-html, slugify, rest-api, blog]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: DB schema (blogPosts, blogCategories tables), better-auth session locals
provides:
  - REST API endpoints for blog posts CRUD (paginated GET, POST, GET by id, PUT, DELETE)
  - REST API endpoints for blog categories (GET all, POST create, DELETE)
  - Client-side TypeScript types for all blog data shapes
  - Client-side fetch wrappers for all blog API operations
affects: [03-02, 03-03]

# Tech tracking
tech-stack:
  added: [slugify@1.6.6, sanitize-html@2.17.1, "@types/sanitize-html@2.16.1"]
  patterns:
    - Astro APIRoute pattern with locals.user + locals.session auth guard returning 401
    - Postgres unique constraint code 23505 caught for 409 conflict responses
    - sanitize-html with extended allowedTags (img, h1-h4) applied to body before DB write
    - slugify(title, { lower, strict, trim }) for auto-slug generation on POST only (not regenerated on PUT)
    - publishedAt set once on first draft→published status transition; never cleared on unpublish

key-files:
  created:
    - src/components/admin/blog/types.ts
    - src/components/admin/blog/api.ts
    - src/pages/api/admin/blog-categories/index.ts
    - src/pages/api/admin/blog-categories/[id].ts
    - src/pages/api/admin/blog-posts/index.ts
    - src/pages/api/admin/blog-posts/[id].ts
  modified:
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "sanitize-html config defined inline per file (not shared module) to keep API routes self-contained"
  - "Slug not regenerated on PUT — editing a post title doesn't break existing URLs"
  - "publishedAt set once on first draft→published transition; transitions back to draft do not clear the timestamp"
  - "Postgres error code 23505 caught explicitly; returns 409 rather than 500 for slug/name conflicts"

patterns-established:
  - "Auth guard: check locals.user + locals.session at top of every APIRoute handler, return 401 JSON"
  - "Error wrapping: try/catch with console.error + 500 JSON response"
  - "Returning pattern: db.insert/update().returning() to return the mutated row directly"

requirements-completed: [BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05]

# Metrics
duration: 2min
completed: 2026-03-07
---

# Phase 03 Plan 01: Blog Admin API Layer Summary

**Six REST API files implementing full blog CRUD with auto-slug, sanitized HTML body, publishedAt tracking, and 409 slug conflict handling**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T01:27:50Z
- **Completed:** 2026-03-07T01:30:39Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Installed slugify, sanitize-html, and @types/sanitize-html; all packages in package.json dependencies
- Created 4 Astro API route files covering all blog post and category CRUD operations with auth guards and error handling
- Created types.ts and api.ts client layer providing TypeScript types and fetch wrappers consumed by future admin UI islands

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages + types.ts + api.ts** - `cece6a1` (feat)
2. **Task 2: Blog categories API endpoints** - `baa2910` (feat)
3. **Task 3: Blog posts API endpoints** - `a2ee805` (feat)

## Files Created/Modified

- `src/components/admin/blog/types.ts` - BlogCategory, BlogPost, BlogPostWithCategory, BlogPostsResponse, BlogPostFormData, BlogCategoryFormData interfaces
- `src/components/admin/blog/api.ts` - fetchBlogPosts, fetchBlogPost, createBlogPost, updateBlogPost, deleteBlogPost, fetchBlogCategories, createBlogCategory fetch wrappers
- `src/pages/api/admin/blog-categories/index.ts` - GET all categories (asc by name), POST create with auto-slug
- `src/pages/api/admin/blog-categories/[id].ts` - DELETE single category (404 guard, FK set null on posts)
- `src/pages/api/admin/blog-posts/index.ts` - GET paginated list with leftJoin categoryName, POST create with auto-slug + sanitized body
- `src/pages/api/admin/blog-posts/[id].ts` - GET single post, PUT partial update with sanitize + publishedAt logic, DELETE
- `package.json` - added slugify, sanitize-html, @types/sanitize-html
- `pnpm-lock.yaml` - updated lockfile

## Decisions Made

- sanitize-html config defined inline per file rather than in a shared module; keeps each API route self-contained and avoids an extra import chain
- Slug not regenerated on PUT to preserve existing URLs when post title is edited
- publishedAt set on first draft→published transition only; reverting to draft does not clear it (preserves publication history)
- Postgres error code 23505 caught explicitly to return 409 rather than 500 for duplicate slug/name conflicts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 API route files and both client-side files are ready for 03-02 (blog editor UI island)
- Types in types.ts are imported directly by the React form and table components
- No blockers

---
*Phase: 03-blog-admin*
*Completed: 2026-03-07*

## Self-Check: PASSED

- All 6 new source files confirmed present on disk
- SUMMARY.md confirmed present
- All 3 task commits confirmed in git log (cece6a1, baa2910, a2ee805)
- slugify, sanitize-html, @types/sanitize-html confirmed in package.json
