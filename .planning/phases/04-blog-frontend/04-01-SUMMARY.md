---
phase: 04-blog-frontend
plan: "01"
subsystem: ui
tags: [astro, blog, reading-time, components, nav, ogimage]

requires:
  - phase: 03-blog-admin
    provides: BlogPost and BlogCategory types from Drizzle schema; published blog content managed via admin

provides:
  - Pure readingTime(html) utility returning "N min read" at 200 wpm
  - BlogPostCard Astro component (hero + grid variants, branded placeholder, category badge)
  - BlogCategoryPill Astro component (linked pill with active/hover state)
  - ogImage prop threaded from default.astro layout to meta.astro
  - Blog nav link in NAV_LINKS between Case Studies and About

affects:
  - 04-02 (blog list page uses BlogPostCard and BlogCategoryPill)
  - 04-03 (blog post detail page uses BlogPostCard hero, ogImage prop from default.astro)
  - 04-04 (category pages use BlogCategoryPill filter bar)

tech-stack:
  added: []
  patterns:
    - "article element wrapping blog cards to avoid nested anchor tags (category badge + post title both <a>)"
    - "class:list for variant-conditional CSS classes in Astro components"
    - "Scoped CSS using color-mix() with CSS variables for hover states and branded gradients"

key-files:
  created:
    - src/lib/reading-time.ts
    - src/components/blog/blog-post-card.astro
    - src/components/blog/blog-category-pill.astro
  modified:
    - src/layouts/default.astro
    - src/lib/config.ts

key-decisions:
  - "BlogPostCard uses <article> + separate <a> for title and category badge — avoids invalid nested anchor HTML"
  - "Variant prop (hero/grid) controls aspect ratio via CSS class targeting (.blog-card--hero, .blog-card--grid)"
  - "ogImage forwarding is backward-compatible — pages not passing ogImage use Meta's own SITE.ogImage default"

patterns-established:
  - "Blog components live in src/components/blog/ — all blog UI primitives grouped together"
  - "Branded placeholder pattern: linear-gradient using color-mix(primary 20%, card) to (primary 40%, secondary)"

requirements-completed:
  - BFNT-01
  - BFNT-03
  - BFNT-04

duration: 2min
completed: 2026-03-07
---

# Phase 4 Plan 01: Blog Frontend Foundation Summary

**Reading-time utility, BlogPostCard/BlogCategoryPill Astro components, ogImage layout prop, and Blog nav link — zero new dependencies**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T05:25:36Z
- **Completed:** 2026-03-07T05:27:30Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Created `readingTime(html)` pure utility: strips HTML tags, counts words at 200 wpm, returns "N min read" (min 1)
- Created `BlogPostCard` with hero/grid variants, branded gradient placeholder for missing cover images, no nested anchors
- Created `BlogCategoryPill` pill link with active state and hover transitions using CSS variables
- Threaded `ogImage` prop through `default.astro` to `meta.astro` (backward-compatible, optional prop)
- Added `{ link: "blog", title: "Blog" }` to NAV_LINKS between Case Studies and About

## Task Commits

Each task was committed atomically:

1. **Task 1: Create reading-time utility** - `0b6dca6` (feat)
2. **Task 2: Create blog-post-card and blog-category-pill components** - `955e74c` (feat)
3. **Task 3: Thread ogImage through default layout and add Blog to nav** - `d914fe9` (feat)

## Files Created/Modified

- `src/lib/reading-time.ts` — Pure readingTime(html: string): string, 200 wpm, minimum 1 min
- `src/components/blog/blog-post-card.astro` — Hero/grid variants, cover image + branded placeholder, category badge, date/read-time meta
- `src/components/blog/blog-category-pill.astro` — Linked pill with active state; 9999px border-radius pill shape
- `src/layouts/default.astro` — Added ogImage?: string to Props, forwarded to Meta
- `src/lib/config.ts` — Inserted Blog link in NAV_LINKS

## Decisions Made

- Used `<article>` element for BlogPostCard to allow both the post title `<a>` and category badge `<a>` without nesting anchors (invalid HTML)
- Variant-conditional styling done via `.blog-card--hero` / `.blog-card--grid` classes and `class:list` — no JavaScript needed
- ogImage forwarding is optional (undefined propagates safely to Meta which has its own SITE.ogImage default)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All blog UI primitives are ready: BlogPostCard, BlogCategoryPill, readingTime, ogImage prop
- Wave 2 plans (blog list, post detail, category pages) can reference stable component contracts
- Blog link appears in site navigation

---
*Phase: 04-blog-frontend*
*Completed: 2026-03-07*
