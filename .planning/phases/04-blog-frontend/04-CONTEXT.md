# Phase 4: Blog Frontend - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Public visitors can browse published blog posts, read individual posts, and filter by category — with correct social sharing metadata. Admin authoring is Phase 3. Comments, RSS, search, and author profile pages are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Post listing layout — /blog
- **Editorial layout**: most recent published post displayed as a large full-width hero card, remaining posts in a 3-column card grid below
- Featured hero shows: cover image (large), category badge, title, full excerpt, published date, reading time
- Grid cards show: cover image (thumbnail), category badge, title, excerpt (truncated), published date, reading time
- **No author attribution in the listing** — date + reading time is sufficient
- **No cover image fallback**: branded placeholder card using brand colors/gradient (not a broken image slot)
- **No pagination** — show all published posts on a single page (re-evaluate if post count grows beyond ~50)

### Post listing metadata per card
- Cover image (hero: full-width image; grid: aspect-ratio thumbnail)
- Category badge (linked to /blog/category/[slug])
- Published date (formatted: "Jun 3, 2026")
- Reading time ("4 min read" — computed at render from body HTML length)

### Category navigation on /blog
- **Filter bar** positioned below the featured hero post: horizontal pill/tab row
- Pills: "All" (links to /blog) + one pill per category that has at least one published post
- Clicking a category navigates to /blog/category/[slug] — no client-side filtering
- Only categories with published posts appear in the filter bar (prevents dead links)

### /blog/category/[slug] page
- Same editorial layout as /blog but filtered to that category's published posts
- Page header: category name as heading ("Green Tech") + "Back to all posts" link above the hero
- Featured hero is the most recent published post in that category
- If category has no published posts, it is never linked — no empty state page needed
- 404 if slug does not match any category in the DB

### Post detail — /blog/[slug]
- **Cover image**: full-bleed hero spanning full viewport width, positioned below the site header
- Below the hero: title, then byline — "By [Author Name] · Jun 3, 2026 · 4 min read"
- **Prose content**: ~80ch max-width, centered below the byline
- Body HTML rendered directly (sanitized at write time in Phase 3 — no re-sanitization needed on render)
- Bottom of post: "Back to Blog" link — no prev/next navigation in v1
- Draft posts return 404 — guard in Astro frontmatter via status check

### OG meta on post detail pages
- Pass post's `coverImageUrl` as `ogImage` to the existing `default.astro` layout
- Pass post's `excerpt` as `description`
- `meta.astro` already handles og:title, og:description, og:image, twitter:card — no new infrastructure needed
- Title format: "[Post Title] | Green Lion Innovations"

### Claude's Discretion
- Exact hero image height (CSS: `aspect-ratio: 16/9` or `max-height: 60vh` or similar)
- Typography scale for post prose (font-size, line-height, heading hierarchy)
- Filter bar pill active state styling (which pill is "selected" on category pages)
- Empty featured-post fallback when /blog has zero published posts (friendly empty state)
- Loading/placeholder behavior for branded no-cover-image cards

</decisions>

<specifics>
## Specific Ideas

- Filter bar pills should feel like navigation tabs, not interactive filters — clicking navigates to a new URL, not client-side state
- The "All" pill should appear selected (active state) when on /blog; the matching category pill selected when on /blog/category/[slug]
- Author attribution on post detail ("By [Name]") uses the `authorId` → user name resolved from DB (decided Phase 1 schema)
- Reading time computed from body HTML at render time — strip HTML tags, count words, divide by 200 wpm (Phase 1 decision)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/layouts/default.astro`: Wraps all public pages. Accepts `title` and `description` props; passes them to `meta.astro`. Need to also pass `ogImage` for post detail pages.
- `src/components/layout/meta.astro`: Already handles og:image, twitter:image, og:description via props — BFNT-04 is mostly solved; just pass post cover URL and excerpt.
- `src/components/catalog/product-card.astro`: Visual reference for blog post card — border, hover shadow (primary color), CSS variables, scoped styles, `aspect-ratio` image, truncated text with `-webkit-line-clamp`.
- `src/components/catalog/category-card.astro`: Reference for category pill/badge style.
- `src/pages/catalog.astro`: Reference for SSR data-fetch pattern — Drizzle query in frontmatter, no client-side fetching.

### Established Patterns
- Public page data: Drizzle query in Astro frontmatter (`const posts = await db.select()...`) — no React islands, no TanStack Query on public pages
- Layout: `<Layout title="..." description="...">` wrapping page content
- Styling: scoped `<style>` blocks using CSS custom properties (`var(--primary)`, `var(--border)`, `var(--muted-foreground)`, `var(--card)`, `var(--radius-lg)`)
- Images: `loading="lazy"` on all non-critical images
- SSR 404: `return Astro.redirect('/404')` or `return new Response(null, { status: 404 })` in frontmatter

### Integration Points
- `src/pages/blog/index.astro` — new file, fetches all published posts + all categories with post counts
- `src/pages/blog/[slug].astro` — new dynamic route, fetches post by slug, 404 if draft
- `src/pages/blog/category/[slug].astro` — new dynamic route, fetches category + its published posts, 404 if category not found
- `src/lib/db/schema.ts` — `blogPosts` and `blogCategories` tables already defined (Phase 1)
- `src/layouts/default.astro` — may need `ogImage` prop threaded through to `meta.astro` for post detail pages
- Site header navigation — may need "Blog" nav link added (coordinate with existing header component)

</code_context>

<deferred>
## Deferred Ideas

- Prev/Next post navigation at bottom of post detail — noted, deferred to v2
- RSS feed — already in v2 requirements (BLOG-V2-01)
- Related posts widget — already in v2 requirements (BLOG-V2-04)
- Full-text search — already in v2 requirements (BLOG-V2-02)
- Author profile pages — not requested

</deferred>

---

*Phase: 04-blog-frontend*
*Context gathered: 2026-03-06*
