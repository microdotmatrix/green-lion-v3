# Phase 4: Blog Frontend - Research

**Researched:** 2026-03-06
**Domain:** Astro 5 SSR page patterns, Drizzle query composition, HTML prose rendering, OG meta tags
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Post listing layout — /blog**
- Editorial layout: most recent published post as large full-width hero card, remaining in 3-column card grid below
- Featured hero shows: cover image (large), category badge, title, full excerpt, published date, reading time
- Grid cards show: cover image (thumbnail), category badge, title, excerpt (truncated), published date, reading time
- No author attribution in the listing — date + reading time is sufficient
- No cover image fallback: branded placeholder card using brand colors/gradient (not a broken image slot)
- No pagination — show all published posts on a single page

**Post listing metadata per card**
- Cover image (hero: full-width image; grid: aspect-ratio thumbnail)
- Category badge (linked to /blog/category/[slug])
- Published date (formatted: "Jun 3, 2026")
- Reading time ("4 min read" — computed at render from body HTML length)

**Category navigation on /blog**
- Filter bar positioned below the featured hero post: horizontal pill/tab row
- Pills: "All" (links to /blog) + one pill per category with at least one published post
- Clicking a category navigates to /blog/category/[slug] — no client-side filtering
- Only categories with published posts appear in the filter bar

**/blog/category/[slug] page**
- Same editorial layout as /blog filtered to that category's published posts
- Page header: category name as heading + "Back to all posts" link above the hero
- Featured hero is the most recent published post in that category
- 404 if slug does not match any category in the DB

**Post detail — /blog/[slug]**
- Cover image: full-bleed hero spanning full viewport width, positioned below the site header
- Below the hero: title, then byline — "By [Author Name] · Jun 3, 2026 · 4 min read"
- Prose content: ~80ch max-width, centered below the byline
- Body HTML rendered directly (sanitized at write time in Phase 3 — no re-sanitization needed on render)
- Bottom of post: "Back to Blog" link — no prev/next navigation in v1
- Draft posts return 404 — guard in Astro frontmatter via status check

**OG meta on post detail pages**
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

### Deferred Ideas (OUT OF SCOPE)
- Prev/Next post navigation at bottom of post detail — noted, deferred to v2
- RSS feed — already in v2 requirements (BLOG-V2-01)
- Related posts widget — already in v2 requirements (BLOG-V2-04)
- Full-text search — already in v2 requirements (BLOG-V2-02)
- Author profile pages — not requested
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BFNT-01 | Public `/blog` route lists all published posts (title, excerpt, cover image, date, category) | Drizzle query with join + status=published filter in frontmatter; hero+grid layout as pure Astro components |
| BFNT-02 | Public `/blog/[slug]` route renders a full individual post with rendered HTML body (published only — drafts 404) | Dynamic route with `Astro.params.slug`, status guard via `return new Response(null, {status:404})`, `set:html` directive for body |
| BFNT-03 | Public `/blog/category/[slug]` route lists published posts filtered by category | Dynamic route querying by `blogCategories.slug`, 404 if category missing, same editorial layout with category header |
| BFNT-04 | Individual post pages include Open Graph meta tags (title, description from excerpt, cover image) | Thread `ogImage` prop through `default.astro` → `meta.astro`; meta.astro already has og:image/twitter:image plumbing |
</phase_requirements>

---

## Summary

Phase 4 is entirely Astro server-component work — no new React islands, no new npm packages, and no new API routes. All data is fetched in Astro frontmatter using the established Drizzle-in-frontmatter pattern from `catalog.astro` and all styling follows the scoped `<style>` block conventions from `product-card.astro` and `category-card.astro`.

The three new pages (`/blog`, `/blog/[slug]`, `/blog/category/[slug]`) each follow the same structural recipe: Drizzle query in frontmatter, status/existence guard that returns a 404 response if needed, then template markup in a scoped `<Layout>` wrapper. The most complex piece is the reading-time utility (strip HTML tags, count words, divide by 200) which is a 5-line pure function — no library needed.

The only integration work is threading `ogImage` through `default.astro` (add the prop to the Props interface and forward it to `<Meta>`) and adding "Blog" to `NAV_LINKS` in `src/lib/config.ts`. Both are one-line changes. Everything else is new file creation only.

**Primary recommendation:** Pure Astro page/component authoring using the existing stack. Zero new dependencies. Three new `.astro` pages, two or three new `.astro` component files for blog-post-card and category-pill, one shared utility function for reading time, and two one-line edits to existing files.

---

## Standard Stack

### Core (all already installed — zero new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.x | Page routing, SSR rendering, frontmatter data fetch | Already in use; all public pages are pure Astro |
| drizzle-orm | ^0.45.x | DB queries in frontmatter | Established pattern from `catalog.astro` |
| @astrojs/node | current | SSR adapter — enables `Astro.params`, 404 responses | Already configured |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS 4 | via @tailwindcss/vite | Layout utilities (gap, grid cols, max-width breakpoints) | Supplement scoped styles where Tailwind classes read cleaner |
| CSS custom properties | project-wide | `var(--primary)`, `var(--card)`, `var(--border)`, `var(--muted-foreground)`, `var(--radius-lg)` | All visual styling — no external class dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline reading-time function | `reading-time` npm package | Package adds a dependency for a 5-line pure function; not worth it |
| Drizzle with relations query | Separate queries + JS join | Drizzle `.leftJoin()` is cleaner and already used in admin API routes |
| `set:html` directive for body | React `dangerouslySetInnerHTML` | `set:html` is the native Astro equivalent; no React island needed for rendering |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── pages/blog/
│   ├── index.astro              # /blog — hero + grid + category filter bar
│   ├── [slug].astro             # /blog/[slug] — post detail, 404 for drafts
│   └── category/
│       └── [slug].astro         # /blog/category/[slug] — filtered listing, 404 if no category
│
├── components/blog/
│   ├── blog-post-card.astro     # Reusable card (handles hero + grid variants via prop)
│   ├── blog-category-pill.astro # Single pill/tab for the filter bar
│   └── blog-post-prose.astro    # (optional) Prose wrapper with typography scoped styles
│
└── lib/
    └── reading-time.ts          # Pure function: (html: string) => string — "4 min read"
```

### Pattern 1: Data Fetch in Astro Frontmatter

All blog data fetched server-side in frontmatter. No client-side fetching, no TanStack Query on public pages.

```typescript
// src/pages/blog/index.astro
---
import { db } from "@/lib/db";
import { blogPosts, blogCategories } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Layout from "@/layouts/default.astro";

// Fetch all published posts with category name
const posts = await db
  .select({
    id: blogPosts.id,
    title: blogPosts.title,
    slug: blogPosts.slug,
    excerpt: blogPosts.excerpt,
    coverImageUrl: blogPosts.coverImageUrl,
    publishedAt: blogPosts.publishedAt,
    body: blogPosts.body,  // needed for reading time calculation
    categoryId: blogPosts.categoryId,
    categoryName: blogCategories.name,
    categorySlug: blogCategories.slug,
  })
  .from(blogPosts)
  .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
  .where(eq(blogPosts.status, "published"))
  .orderBy(desc(blogPosts.publishedAt));

// Fetch categories that have at least one published post (for filter bar)
const categoriesWithPosts = await db
  .selectDistinct({
    id: blogCategories.id,
    name: blogCategories.name,
    slug: blogCategories.slug,
  })
  .from(blogCategories)
  .innerJoin(blogPosts, and(
    eq(blogPosts.categoryId, blogCategories.id),
    eq(blogPosts.status, "published")
  ));

const [heroPost, ...gridPosts] = posts;
---
```

### Pattern 2: SSR 404 Guard in Dynamic Routes

Used in both `/blog/[slug]` and `/blog/category/[slug]`. Match the project's established pattern from STATE.md.

```typescript
// src/pages/blog/[slug].astro
---
import { db } from "@/lib/db";
import { blogPosts, blogCategories, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Layout from "@/layouts/default.astro";
import { readingTime } from "@/lib/reading-time";

const { slug } = Astro.params;

const [post] = await db
  .select({
    id: blogPosts.id,
    title: blogPosts.title,
    slug: blogPosts.slug,
    body: blogPosts.body,
    excerpt: blogPosts.excerpt,
    coverImageUrl: blogPosts.coverImageUrl,
    publishedAt: blogPosts.publishedAt,
    status: blogPosts.status,
    categoryName: blogCategories.name,
    categorySlug: blogCategories.slug,
    authorName: user.name,
  })
  .from(blogPosts)
  .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
  .leftJoin(user, eq(blogPosts.authorId, user.id))
  .where(eq(blogPosts.slug, slug!))
  .limit(1);

// 404 for missing posts OR draft posts
if (!post || post.status !== "published") {
  return new Response(null, { status: 404 });
}

const readTime = readingTime(post.body);
---
<Layout title={post.title} description={post.excerpt} ogImage={post.coverImageUrl ?? undefined}>
  ...
</Layout>
```

### Pattern 3: OG Meta Threading — Default Layout

`meta.astro` already has `ogImage?: string` in its Props interface and handles `og:image`/`twitter:image`. The only change needed is adding `ogImage` to `default.astro`'s Props interface and forwarding it.

```typescript
// src/layouts/default.astro — MODIFIED (Props interface only)
interface Props {
  title: string;
  description?: string;
  ogImage?: string;       // ADD THIS
}

const { title, description = SITE.desc, ogImage } = Astro.props;

// In the template: forward to <Meta>
<Meta title={`${title} | ${SITE.title}`} description={description} ogImage={ogImage} />
```

This is a backward-compatible change — existing pages that don't pass `ogImage` get the site default (`SITE.ogImage = "green-lion.jpg"`).

### Pattern 4: Reading Time Utility

Pure function, no external dependency, computed at render time in frontmatter.

```typescript
// src/lib/reading-time.ts
// Strip HTML tags, count words, compute minutes at 200 wpm
export function readingTime(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}
```

### Pattern 5: Body HTML Rendering with `set:html`

Astro's `set:html` directive renders sanitized HTML directly, equivalent to React's `dangerouslySetInnerHTML` but without needing a React island. The body was sanitized server-side during Phase 3 POST/PUT — no re-sanitization needed here.

```astro
<!-- Renders the stored HTML string directly -->
<div class="prose" set:html={post.body} />
```

**Critical:** Only use `set:html` for content that was already sanitized before DB storage. The Phase 3 API routes call `sanitize-html` before every write — this is confirmed in the existing `src/pages/api/admin/blog-posts/index.ts`.

### Pattern 6: Category Filter Bar — Navigation, Not Client-Side Filter

The filter bar is rendered server-side. Active state is determined by comparing `Astro.url.pathname` to the pill's href. No JavaScript or React island needed.

```astro
---
// In /blog/index.astro — "All" is active on /blog
const currentPath = Astro.url.pathname;
---
<nav class="category-filter">
  <a href="/blog" class:list={["pill", { active: currentPath === "/blog" }]}>All</a>
  {categoriesWithPosts.map(cat => (
    <a
      href={`/blog/category/${cat.slug}`}
      class:list={["pill", { active: currentPath === `/blog/category/${cat.slug}` }]}
    >
      {cat.name}
    </a>
  ))}
</nav>
```

### Pattern 7: Published Date Formatting

Use `Intl.DateTimeFormat` — built into all modern browsers and Node.js. No date library needed.

```typescript
// In frontmatter or inline:
function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric"
  }).format(new Date(date));
}
// "Jun 3, 2026"
```

### Pattern 8: No-Cover Branded Placeholder

Locked decision: no broken image slot — show a branded gradient card instead. Implemented as a CSS fallback block in the blog post card component.

```astro
<!-- In blog-post-card.astro -->
{post.coverImageUrl ? (
  <img src={post.coverImageUrl} alt={post.title} loading="lazy" class="card-image" />
) : (
  <div class="card-image-placeholder">
    <!-- Branded gradient using var(--primary) -->
  </div>
)}
```

CSS gradient example using project color variables:
```css
.card-image-placeholder {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary) 20%, var(--card)),
    color-mix(in srgb, var(--primary) 40%, var(--secondary))
  );
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Anti-Patterns to Avoid

- **React island for blog pages:** All public blog pages are pure Astro SSR — no client-side data fetching. Proven pattern from `catalog.astro`.
- **Re-sanitizing body on render:** Body is sanitized at write time (Phase 3). Running `sanitize-html` again at render adds latency and is redundant.
- **Fetching posts inside a React component:** The established pattern is Drizzle in frontmatter. Never reach for `fetch('/api/...')` on public pages.
- **Using `Astro.redirect('/404')` for draft detection:** Use `return new Response(null, { status: 404 })` directly — cleaner, semantically correct, same as Astro docs recommend.
- **Rendering raw body with `innerHTML` in a script tag:** Use `set:html` — it's Astro's built-in, scoped mechanism.
- **Filtering categories client-side:** The category filter bar navigates to new URLs. Do not add JS event listeners or React state for filtering — it must be server-rendered per the locked decision.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML tag stripping for reading time | Complex regex / cheerio | Simple inline regex `/<[^>]*>/g` | The use case is word counting only, not DOM parsing; full parser is overkill |
| Date formatting | Custom date formatter | `Intl.DateTimeFormat` | Native, zero-cost, handles locale correctly |
| Server-side HTML rendering | React island with `dangerouslySetInnerHTML` | `set:html` directive | Native Astro; no hydration cost, no JS bundle |
| 404 response | `Astro.redirect('/404')` | `return new Response(null, { status: 404 })` | Redirect 404 changes URL; proper 404 status code preserves URL |

**Key insight:** This phase is a "blessed" Astro SSR use case. No new libraries. Every problem has a built-in Astro or native JS solution.

---

## Common Pitfalls

### Pitfall 1: Draft Posts Rendered Without Guard
**What goes wrong:** Visiting `/blog/draft-post-slug` renders the post even though it's a draft.
**Why it happens:** Query fetches by slug only — doesn't filter on `status`.
**How to avoid:** After fetching by slug, check `if (!post || post.status !== "published") return new Response(null, { status: 404 })`. Order matters: check existence first, then status.
**Warning signs:** Draft posts visible at their public URL without authentication.

### Pitfall 2: Category Page 404 Skipped When Category Exists but Has No Posts
**What goes wrong:** A category with all drafts gets a page (empty listing) instead of a 404.
**Why it happens:** Query finds the category in `blogCategories` table, but no published posts — page renders empty.
**How to avoid:** The locked decision says "If category has no published posts, it is never linked — no empty state page needed." Return 404 if the category slug exists but no published posts belong to it. Alternatively, return 404 only if the category slug itself does not exist in the DB; leave an empty state for existing categories with no published posts — but this contradicts the decision. Safe approach: 404 if `posts.length === 0` after filtering for published.
**Warning signs:** Empty listing page accessible at `/blog/category/some-slug`.

### Pitfall 3: `ogImage` Not Forwarded Through Layout
**What goes wrong:** Post detail pages show the default site OG image instead of the post cover image.
**Why it happens:** `default.astro` Props interface doesn't include `ogImage`, so the value is dropped before reaching `meta.astro`.
**How to avoid:** Add `ogImage?: string` to `default.astro` Props interface and pass it to `<Meta ogImage={ogImage} />`. This is the only file that needs modification.
**Warning signs:** Social sharing card shows generic site image regardless of which post is shared.

### Pitfall 4: Category Filter Bar Shows Categories with No Published Posts
**What goes wrong:** A category pill leads to a 404 page because the category has no published posts.
**Why it happens:** Query fetches all categories rather than only those with published posts.
**How to avoid:** Use `innerJoin` (not `leftJoin`) between `blogCategories` and `blogPosts` filtered by `status = 'published'`. An `innerJoin` naturally excludes categories with no matching published posts.
**Warning signs:** Category pill in filter bar leads to an empty or 404 page.

### Pitfall 5: `set:html` on Unescaped Content
**What goes wrong:** If body content was ever stored without sanitization, `set:html` renders it as-is — potential XSS.
**Why it happens:** A Phase 3 API route without the `sanitize-html` call.
**How to avoid:** Confirm the existing `src/pages/api/admin/blog-posts/index.ts` (and `[id].ts`) both call `sanitizeHtml(rawBody, sanitizeConfig)` before every DB write. Both already do — confirmed in code review.
**Warning signs:** Would require a compromised or incorrectly-written Phase 3 API route.

### Pitfall 6: Author Name Missing (null authorId)
**What goes wrong:** Byline renders "By · Jun 3, 2026" with empty author name because `authorId` is nullable.
**Why it happens:** `authorId` in `blogPosts` schema is nullable (`references(() => user.id, { onDelete: "set null" })`).
**How to avoid:** Guard the author display: `{post.authorName ? `By ${post.authorName} · ` : ""}`. The byline still shows date + reading time.
**Warning signs:** Empty "By" prefix in byline on posts where the author user was deleted.

### Pitfall 7: `selectDistinct` vs Category Deduplication
**What goes wrong:** Categories appear multiple times in the filter bar (once per published post).
**Why it happens:** Using `.select()` instead of `.selectDistinct()` when joining blogCategories to blogPosts.
**How to avoid:** Use `db.selectDistinct({ id, name, slug })` from `blogCategories` with `innerJoin` on published posts. The `DISTINCT` ensures each category appears once.
**Warning signs:** Duplicate pills in the category filter bar.

---

## Code Examples

Verified patterns from project codebase and Astro 5 docs:

### /blog Index — Full Frontmatter Query Shape

```typescript
// Source: established pattern from src/pages/catalog.astro + schema.ts
import { db } from "@/lib/db";
import { blogPosts, blogCategories } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

const posts = await db
  .select({
    id: blogPosts.id,
    title: blogPosts.title,
    slug: blogPosts.slug,
    excerpt: blogPosts.excerpt,
    coverImageUrl: blogPosts.coverImageUrl,
    publishedAt: blogPosts.publishedAt,
    body: blogPosts.body,
    categoryName: blogCategories.name,
    categorySlug: blogCategories.slug,
  })
  .from(blogPosts)
  .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
  .where(eq(blogPosts.status, "published"))
  .orderBy(desc(blogPosts.publishedAt));

const categoriesWithPosts = await db
  .selectDistinct({
    id: blogCategories.id,
    name: blogCategories.name,
    slug: blogCategories.slug,
  })
  .from(blogCategories)
  .innerJoin(blogPosts, and(
    eq(blogPosts.categoryId, blogCategories.id),
    eq(blogPosts.status, "published")
  ));

const [heroPost, ...gridPosts] = posts;
```

### /blog/[slug] — Post Detail with 404 Guard

```typescript
// Source: Astro 5 SSR dynamic routes + STATE.md established pattern
const { slug } = Astro.params;

const [post] = await db
  .select({ ...all fields including status, body, authorName from user join... })
  .from(blogPosts)
  .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
  .leftJoin(user, eq(blogPosts.authorId, user.id))
  .where(eq(blogPosts.slug, slug!))
  .limit(1);

if (!post || post.status !== "published") {
  return new Response(null, { status: 404 });
}
```

### /blog/category/[slug] — Category Page with 404 Guard

```typescript
// Source: pattern extension from /blog/[slug] guard
const { slug } = Astro.params;

// Fetch category first
const [category] = await db
  .select()
  .from(blogCategories)
  .where(eq(blogCategories.slug, slug!))
  .limit(1);

if (!category) {
  return new Response(null, { status: 404 });
}

// Fetch published posts for this category
const posts = await db
  .select({ ...fields... })
  .from(blogPosts)
  .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
  .where(and(
    eq(blogPosts.status, "published"),
    eq(blogPosts.categoryId, category.id)
  ))
  .orderBy(desc(blogPosts.publishedAt));

// If category exists but has no published posts — return 404
if (posts.length === 0) {
  return new Response(null, { status: 404 });
}
```

### Reading Time Utility

```typescript
// Source: standard word-count approach — no library needed
// src/lib/reading-time.ts
export function readingTime(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}
```

### Date Formatting (inline in frontmatter)

```typescript
// Source: MDN Intl.DateTimeFormat — native Node.js/browser API
function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
// formatDate("2026-06-03T00:00:00Z") → "Jun 3, 2026"
```

### default.astro Layout — ogImage Prop Addition

```typescript
// src/layouts/default.astro — minimal diff
// BEFORE:
interface Props {
  title: string;
  description?: string;
}
const { title, description = SITE.desc } = Astro.props;
// <Meta title={...} description={description} />

// AFTER:
interface Props {
  title: string;
  description?: string;
  ogImage?: string;        // ADD
}
const { title, description = SITE.desc, ogImage } = Astro.props;
// <Meta title={...} description={description} ogImage={ogImage} />
```

`meta.astro` already accepts and uses `ogImage?: string` — confirmed in code review. The prop flows through to `og:image` and `twitter:image` tags.

### Blog Post Card Component — Variant Pattern

```astro
---
// src/components/blog/blog-post-card.astro
interface Props {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: Date | string | null;
  categoryName: string | null;
  categorySlug: string | null;
  readTime: string;
  variant?: "hero" | "grid";  // hero = full-width; grid = thumbnail card
}
const { variant = "grid", ...rest } = Astro.props;
---
<article class:list={["blog-card", `blog-card--${variant}`]}>
  ...
</article>
```

Using a single component with a `variant` prop avoids duplicating the hero/card logic in two files.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Astro.redirect('/404')` for SSR 404s | `return new Response(null, { status: 404 })` | Astro 2+ | Direct response preserves the original URL; redirect changes URL to /404 |
| `innerHTML` in a script block | `set:html` Astro directive | Astro 1.0 | `set:html` is scoped to the element, not a global DOM mutation |
| External reading-time packages | Inline word-count function | N/A | Package is unmaintained or overkill for this use case |

**Deprecated/outdated for this project:**
- `Astro.redirect('/404')` — works but is semantically wrong (returns 302 then 404 vs direct 404); use `new Response(null, { status: 404 })`.
- React islands for static listing pages — the admin uses React islands because of interactivity; public blog pages are read-only and should be pure Astro.

---

## Integration Checklist

These are the two surgical edits to existing files (everything else is new file creation):

1. **`src/layouts/default.astro`** — Add `ogImage?: string` to Props interface; pass to `<Meta>`
2. **`src/lib/config.ts`** — Add `{ link: "blog", title: "Blog" }` to `NAV_LINKS` array

Both are 1-2 line changes. All other work is new files in `src/pages/blog/` and `src/components/blog/`.

---

## Open Questions

1. **Blog nav link position in NAV_LINKS**
   - What we know: Current `NAV_LINKS` = Products, Services, Case Studies, About, Contact
   - What's unclear: Should "Blog" appear before or after "Case Studies"? After "About"?
   - Recommendation: Place it after "Case Studies" and before "About" — it's content, not a utility link: `[Products, Services, Case Studies, Blog, About, Contact]`

2. **Category page 404 behavior: empty category vs missing category**
   - What we know: Locked decision says "If category has no published posts, it is never linked" — no empty state needed
   - What's unclear: If a user manually navigates to `/blog/category/old-slug` where the category exists but has zero published posts, should they get a 404 or an empty state?
   - Recommendation: Return 404 if `posts.length === 0` — consistent with the locked decision, no empty state to design

3. **Hero layout when only one published post exists**
   - What we know: Editorial layout = hero (first post) + grid (remaining). With 1 post, `gridPosts` is empty.
   - What's unclear: Does the hero still render full-width, or does the layout collapse?
   - Recommendation: Hero renders alone (full-width) with no grid below it — `gridPosts.length > 0` gates the grid section

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no vitest.config.*, jest.config.*, or test/ directories in project source |
| Config file | None — Wave 0 gap if tests are desired |
| Quick run command | N/A (no test framework) |
| Full suite command | N/A (no test framework) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BFNT-01 | `/blog` shows all published posts with correct fields | manual-only | N/A — no test framework | ❌ |
| BFNT-02 | `/blog/[slug]` renders published post; draft returns 404 | manual-only | N/A | ❌ |
| BFNT-03 | `/blog/category/[slug]` shows filtered posts; 404 for missing category | manual-only | N/A | ❌ |
| BFNT-04 | Post detail page `<meta property="og:image">` matches post coverImageUrl | manual-only (browser DevTools or curl head) | N/A | ❌ |

**Note:** Consistent with previous phases — the project has no test infrastructure. All validation is manual (browser + curl/DevTools). The reading-time utility function is a pure function testable without any framework if vitest is added in a future phase.

### Wave 0 Gaps
- None — this phase requires no test setup. All behaviors are verifiable by navigating to the routes in a browser and inspecting page source for OG tags.

*(If the team adds vitest in a future phase, `readingTime()` in `src/lib/reading-time.ts` is an ideal first unit test candidate.)*

---

## Sources

### Primary (HIGH confidence)
- `src/pages/catalog.astro` — Drizzle-in-frontmatter SSR pattern; confirmed working in this project
- `src/lib/db/schema.ts` — `blogPosts`, `blogCategories`, `user` tables; all fields verified; `authorId` nullable confirmed
- `src/components/layout/meta.astro` — `ogImage?: string` prop already in Props interface; og:image and twitter:image already wired
- `src/layouts/default.astro` — Props interface confirmed; `ogImage` NOT YET in interface (needs threading)
- `src/lib/config.ts` — `NAV_LINKS` array confirmed; "Blog" link not yet present
- `src/components/catalog/product-card.astro` — scoped style pattern, aspect-ratio image, -webkit-line-clamp, CSS variable usage
- `src/components/catalog/category-card.astro` — hover effects, placeholder pattern, aspect-ratio 16/10 reference
- `src/components/elements/nav-link.astro` — active state pattern using `Astro.url.pathname.includes(link)`
- `src/pages/api/admin/blog-posts/index.ts` — confirms `sanitize-html` called before every DB write; `set:html` safety confirmed
- `.planning/phases/03-blog-admin/03-RESEARCH.md` — confirms body stored as sanitized HTML (not markdown); Tiptap decision

### Secondary (MEDIUM confidence)
- [Astro SSR Dynamic Routes docs](https://docs.astro.build/en/guides/routing/#dynamic-routes) — `Astro.params`, `return new Response(null, { status: 404 })` pattern
- [Astro `set:html` directive docs](https://docs.astro.build/en/reference/directives-reference/#sethtml) — confirmed native Astro mechanism for rendering HTML strings

### Tertiary (LOW confidence)
- None — all key claims verified against project source or Astro docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all tools verified in existing project code
- Architecture: HIGH — directly extends established `catalog.astro` and `product-card.astro` patterns; no new patterns introduced
- OG meta: HIGH — `meta.astro` Props and template verified line-by-line; only change is `default.astro` interface
- Reading-time utility: HIGH — standard word-count approach; no external library; self-contained pure function
- Pitfalls: HIGH — draft-guard and category-filter pitfalls derived directly from schema inspection and locked decisions

**Research date:** 2026-03-06
**Valid until:** 2026-05-06 (Astro 5 stable; Drizzle stable; no moving targets in this phase)
