---
phase: 04-blog-frontend
plan: "02"
subsystem: ui
tags: [astro, blog, drizzle, ssr, ogimage, 404-guard]

requires:
  - phase: 04-blog-frontend
    plan: "01"
    provides: BlogPostCard, BlogCategoryPill, readingTime utility, ogImage Layout prop

provides:
  - /blog listing page: hero card + category filter bar + 3-column grid + empty state
  - /blog/category/[slug] filtered listing with 404 guard for missing/empty categories
  - /blog/[slug] post detail with draft 404 guard, ogImage meta, and prose typography

affects:
  - None — these are terminal public-facing pages; no downstream plans depend on them

tech-stack:
  added: []
  patterns:
    - "Drizzle left join blogCategories in page frontmatter for category name/slug on posts"
    - "selectDistinct + innerJoin pattern for categoriesWithPosts (only categories with published posts)"
    - "SSR 404 guard: !post || post.status !== 'published' — both conditions required"
    - ":global() selectors in Astro scoped styles for rendering set:html prose content"

key-files:
  created:
    - src/pages/blog/index.astro
    - src/pages/blog/category/[slug].astro
    - src/pages/blog/[slug].astro
  modified: []

key-decisions:
  - "categoriesWithPosts uses selectDistinct + innerJoin rather than a subquery — keeps filter bar showing only categories with at least one published post"
  - "posts.length === 0 empty state on index.astro prevents broken layout when no posts are published"
  - "category/[slug] returns 404 when category exists but has no published posts — avoids empty listing pages"
  - "post-prose styles use :global() selectors because set:html content is injected outside Astro's scoped style boundary"

patterns-established:
  - "Blog pages: pure Astro SSR — no React islands, no client-side fetching"
  - "Draft guard pattern: check both !record and record.status !== 'published' before rendering"

requirements-completed:
  - BFNT-01
  - BFNT-02
  - BFNT-03
  - BFNT-04

duration: 2min
completed: 2026-03-07
---

# Phase 4 Plan 02: Blog Public Pages Summary

**Three SSR blog pages — /blog listing with hero+grid+filter, /blog/[slug] detail with draft 404 guard and OG meta, /blog/category/[slug] filtered listing — all via Drizzle in Astro frontmatter, zero new dependencies**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T05:29:33Z
- **Completed:** 2026-03-07T05:31:27Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `/blog` index: most recent published post as hero card, remaining posts in 3-column grid, category filter bar showing only categories with published posts, friendly empty state for zero posts
- Created `/blog/category/[slug]`: 404 for missing category or category with no published posts, same hero+grid layout as index, back link + category heading
- Created `/blog/[slug]`: draft/missing posts return HTTP 404, full HTML body via `set:html`, og:image meta from coverImageUrl, byline with author + date + read time, back to blog footer link

## Task Commits

Each task was committed atomically:

1. **Task 1: Build /blog index and /blog/category/[slug] listing pages** - `0b4e59d` (feat)
2. **Task 2: Build /blog/[slug] post detail page with draft guard and OG meta** - `f563230` (feat)

## Files Created/Modified

- `src/pages/blog/index.astro` — Hero card + category filter bar + 3-column grid + empty state; Drizzle query for published posts with left-join to blogCategories; selectDistinct for categories with posts
- `src/pages/blog/category/[slug].astro` — 404 for missing/empty category; same layout as index with page header (back link + h1); categoriesWithPosts filter bar
- `src/pages/blog/[slug].astro` — Draft guard (both !post and status check); set:html body rendering; ogImage forwarded to Layout; :global() prose typography styles

## Decisions Made

- The `categoriesWithPosts` query uses `selectDistinct` + `innerJoin` so only categories that have at least one published post appear in the filter bar — this was specified in the plan and implemented as-is
- The `/blog/category/[slug]` page returns 404 when a valid category has no published posts, preventing empty listing pages
- `:global()` selectors are required for `.post-prose` child elements because Astro's scoped styles do not apply inside `set:html` injected content

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four BFNT requirements are now complete: BFNT-01 through BFNT-04
- Public blog is fully functional: listing, detail, category pages all SSR with Drizzle queries
- Phase 4 blog frontend is complete — no further plans in this phase

---
*Phase: 04-blog-frontend*
*Completed: 2026-03-07*
