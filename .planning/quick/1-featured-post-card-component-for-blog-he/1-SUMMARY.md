---
phase: quick-1-featured-hero
plan: 01
subsystem: ui
tags: [astro, blog, css-grid, featured-post, responsive]

requires:
  - phase: 04-blog-frontend
    provides: BlogPostCard component and blog pages with heroPost pattern

provides:
  - BlogFeaturedPost Astro component with full-bleed two-column grid layout
  - Cover image fills full article footprint with overlay content card
  - Blog index and category pages use BlogFeaturedPost instead of BlogPostCard variant=hero

affects:
  - blog-frontend
  - blog-pages

tech-stack:
  added: []
  patterns:
    - CSS Grid overlap: image-wrap spans full grid area (grid-column 1/3), content card placed in column 2 only (z-index: 1)
    - Full-bleed within constrained container: negative margin-inline on .hero-section to escape .content padding
    - Responsive grid collapse: single column below 768px with image row 1 and card row 2

key-files:
  created:
    - src/components/blog/blog-featured-post.astro
  modified:
    - src/pages/blog/index.astro
    - src/pages/blog/category/[slug].astro

key-decisions:
  - "New standalone component instead of variant flag — layout is structurally different enough (grid overlap vs flex column) to warrant its own file"
  - "Image spans full grid (1/3) in row 1, content card placed only in column 2 using z-index: 1 — achieves overlap without absolute positioning"
  - "margin-inline: calc(-1 * var(--content-padding, 1.5rem)) on .hero-section lets featured card bleed beyond .content padding without modifying the layout component"
  - "loading=eager on featured image — it is the LCP element, should not be lazy-loaded"

patterns-established:
  - "Grid overlap pattern: full-span image layer + positioned content layer in same grid area — use for any hero/feature card needing image-behind-content"

requirements-completed: []

duration: 8min
completed: 2026-03-08
---

# Quick Task 1: Featured Post Card Summary

**Full-bleed featured hero card using CSS Grid overlap — cover image fills the left 55%, semi-transparent content card floats on the right with backdrop-filter blur, stacks vertically on mobile**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-08T14:10:00Z
- **Completed:** 2026-03-08T14:18:00Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 updated)

## Accomplishments

- Created `BlogFeaturedPost.astro` with a two-column CSS grid (55/45): image layer spans the full article footprint via `grid-column: 1/3`, content card is placed in column 2 at `z-index: 1` for the overlap effect
- Content card has `backdrop-filter: blur(8px)`, semi-transparent `color-mix` background, and border — producing the floating overlay look without absolute positioning
- Graceful degradation: renders a primary-tinted gradient placeholder when `coverImageUrl` is null
- Responsive: collapses to stacked image-above-content below 768px with rounded corners only on the bottom of the card
- Both `src/pages/blog/index.astro` and `src/pages/blog/category/[slug].astro` updated to import and use `BlogFeaturedPost` — `variant="hero"` removed from both
- `.hero-section` uses negative `margin-inline` to achieve full-bleed within the `.content` container's padding

## Task Commits

1. **Task 1: Create BlogFeaturedPost component** - `2bf8071` (feat)
2. **Task 2: Wire BlogFeaturedPost into blog index and category pages** - `9dc241e` (feat)

## Files Created/Modified

- `src/components/blog/blog-featured-post.astro` - Standalone featured/hero post card with full-bleed grid layout, floating overlay card, gradient placeholder, responsive collapse
- `src/pages/blog/index.astro` - Replaced `<BlogPostCard variant="hero" />` with `<BlogFeaturedPost />`, added negative margin-inline to hero-section
- `src/pages/blog/category/[slug].astro` - Same replacement as blog index

## Decisions Made

- New standalone component rather than another variant flag on BlogPostCard — the layout is structurally different (grid layer overlap vs flex column) and merits its own file
- CSS Grid overlap technique: image-wrap at `grid-column: 1/3, grid-row: 1` fills the entire footprint; content card at `grid-column: 2/3, grid-row: 1, z-index: 1` sits on top — no absolute positioning needed
- `loading="eager"` on the featured image because it is the LCP element on the blog index page
- `margin-inline: calc(-1 * var(--content-padding, 1.5rem))` on `.hero-section` escapes the `.content` padding with a CSS custom property fallback — no layout component modification required

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- `BlogFeaturedPost` is self-contained and ready for further styling or animation work
- The `variant="hero"` path on `BlogPostCard` still exists but is no longer used by any page — can be removed in a future cleanup pass if desired

---
*Phase: quick-1-featured-hero*
*Completed: 2026-03-08*

## Self-Check: PASSED

- FOUND: src/components/blog/blog-featured-post.astro
- FOUND: src/pages/blog/index.astro
- FOUND: src/pages/blog/category/[slug].astro
- FOUND: commits 2bf8071, 9dc241e
