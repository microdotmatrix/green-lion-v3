---
phase: quick-1-featured-hero
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/blog/blog-featured-post.astro
  - src/pages/blog/index.astro
  - src/pages/blog/category/[slug].astro
autonomous: true
requirements: []

must_haves:
  truths:
    - "Blog index shows a full-bleed featured card for the newest post"
    - "Category pages show the same full-bleed featured card for the first post"
    - "Featured card displays: cover image left (~55% width), floating content card right with category badge, title, excerpt, read time, and date"
    - "Content card overlaps the image slightly and has semi-transparent background with border"
    - "Component degrades gracefully when no cover image is present"
    - "Layout is responsive: stacks vertically on mobile"
  artifacts:
    - path: src/components/blog/blog-featured-post.astro
      provides: "Standalone featured/hero post card component"
      exports: [Props interface]
    - path: src/pages/blog/index.astro
      provides: "Blog index using BlogFeaturedPost instead of BlogPostCard variant=hero"
    - path: src/pages/blog/category/[slug].astro
      provides: "Category page using BlogFeaturedPost instead of BlogPostCard variant=hero"
  key_links:
    - from: src/pages/blog/index.astro
      to: src/components/blog/blog-featured-post.astro
      via: "import + heroPost spread"
    - from: src/pages/blog/category/[slug].astro
      to: src/components/blog/blog-featured-post.astro
      via: "import + heroPost spread"
---

<objective>
Create a dedicated `BlogFeaturedPost` Astro component implementing the full-bleed featured/hero card layout, then replace the `variant="hero"` BlogPostCard usage in both blog pages with it.

Purpose: The current hero variant uses a standard image-above-content card layout. The new design requires a side-by-side full-bleed treatment with a floating overlay card — a distinct enough layout to warrant its own component rather than another variant flag on BlogPostCard.

Output: `src/components/blog/blog-featured-post.astro` + updated blog index + updated category page.
</objective>

<execution_context>
@/Users/microdotmatrix/.claude/get-shit-done/workflows/execute-plan.md
@/Users/microdotmatrix/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/blog/blog-post-card.astro
@src/pages/blog/index.astro
@src/pages/blog/category/[slug].astro
@src/styles/global.css

<interfaces>
<!-- Props contract from existing BlogPostCard — new component uses the same prop shape -->

From src/components/blog/blog-post-card.astro:
```typescript
interface Props {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: Date | string | null;
  categoryName: string | null;
  categorySlug: string | null;
  readTime: string;
  // variant prop is NOT passed to BlogFeaturedPost — it has no variants
}
```

Theme CSS variables available:
- `--card`, `--card-foreground`, `--background`, `--foreground`
- `--primary`, `--muted-foreground`, `--border`
- `--radius`, `--radius-lg`, `--radius-md`, `--radius-xl`
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create BlogFeaturedPost component</name>
  <files>src/components/blog/blog-featured-post.astro</files>
  <action>
Create `src/components/blog/blog-featured-post.astro` as a new standalone component.

Props interface: same fields as BlogPostCard minus `variant` (title, slug, excerpt, coverImageUrl, publishedAt, categoryName, categorySlug, readTime). Include the same `formatDate` helper inline.

Layout structure (full-bleed row, no outer content-width constraint):
```
<article class="featured-post">
  <div class="featured-image-wrap">
    <img | placeholder />
  </div>
  <div class="featured-content-card">
    <a class="category-badge" />   <!-- only if categorySlug + categoryName -->
    <a class="post-title" />
    <p class="post-excerpt" />
    <div class="post-meta">        <!-- date · readTime -->
  </div>
</article>
```

CSS implementation notes:
- `.featured-post`: `position: relative`, `display: grid`, `grid-template-columns: 55fr 45fr`, `align-items: center`, `min-height: 420px`, dark background (`var(--foreground)` or a near-black like `oklch(0.12 0.004 285)`) with `border-radius: var(--radius-xl)`, `overflow: hidden`.
- `.featured-image-wrap`: `grid-column: 1 / 3` and `grid-row: 1`, `height: 100%`, cover-fills the full article footprint. The image itself: `width: 100%`, `height: 100%`, `object-fit: cover`, `display: block`. Use a gradient placeholder when no image (`background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 30%, oklch(0.12 0 0)), color-mix(in srgb, var(--primary) 15%, oklch(0.08 0 0)))`).
- `.featured-content-card`: `grid-column: 2 / 3`, `grid-row: 1`, `z-index: 1`, positioned so it overlaps the image. Use `margin: 2rem`, `padding: 2rem 2.5rem`, `background: color-mix(in srgb, var(--card) 92%, transparent)`, `border: 1px solid color-mix(in srgb, var(--border) 60%, transparent)`, `border-radius: var(--radius-xl)`, `backdrop-filter: blur(8px)`, `display: flex`, `flex-direction: column`, `gap: 1rem`.
- `.category-badge`: same styles as in BlogPostCard (primary-tinted background, uppercase, 0.75rem).
- `.post-title`: large, `font-size: clamp(1.5rem, 3vw, 2.25rem)`, `font-weight: 700`, `color: var(--card-foreground)`, no underline, hover to `var(--primary)`.
- `.post-excerpt`: `color: var(--muted-foreground)`, `font-size: 0.9375rem`, `line-height: 1.65`, `-webkit-line-clamp: 4` with box orient.
- `.post-meta`: `margin-top: auto`, `font-size: 0.8125rem`, `color: var(--muted-foreground)`, flex row with `·` separator.
- Responsive: at `max-width: 768px` — change `.featured-post` to `grid-template-columns: 1fr`, set `.featured-image-wrap` to `grid-column: 1`, `grid-row: 1`, `aspect-ratio: 16/9`, `height: auto`. Set `.featured-content-card` to `grid-column: 1`, `grid-row: 2`, `margin: 0`, `border-radius: 0 0 var(--radius-xl) var(--radius-xl)`, `border-top: none`, `backdrop-filter: none`, `background: var(--card)`.
  </action>
  <verify>
    <automated>pnpm astro check 2>&1 | grep -E "error|warning" | head -20 || echo "check complete"</automated>
  </verify>
  <done>File exists at src/components/blog/blog-featured-post.astro with correct Props interface, full-bleed two-column layout, floating content card, responsive collapse to stacked layout.</done>
</task>

<task type="auto">
  <name>Task 2: Wire BlogFeaturedPost into blog index and category pages</name>
  <files>src/pages/blog/index.astro, src/pages/blog/category/[slug].astro</files>
  <action>
In both `src/pages/blog/index.astro` and `src/pages/blog/category/[slug].astro`:

1. Add import: `import BlogFeaturedPost from "@/components/blog/blog-featured-post.astro";`
2. Remove the `variant="hero"` BlogPostCard usage inside `<section class="hero-section">` and replace with:
```astro
<BlogFeaturedPost
  title={heroPost.title}
  slug={heroPost.slug}
  excerpt={heroPost.excerpt}
  coverImageUrl={heroPost.coverImageUrl}
  publishedAt={heroPost.publishedAt}
  categoryName={heroPost.categoryName}
  categorySlug={heroPost.categorySlug}
  readTime={formatReadingTime(heroPost.readTimeMinutes)}
/>
```
3. Keep the `BlogPostCard` import — it is still used for grid cards.
4. In both pages, update the `.hero-section` CSS: remove the `margin-bottom: 3rem` and replace with a layout that accommodates the full-bleed nature of the new component. The featured post should break out of the `content` container width. Wrap the `<section class="hero-section">` in a `<div class="featured-wrap">` that uses negative horizontal margins to achieve full-bleed (`margin-inline: calc(-1 * var(--content-padding, 1.5rem))`). Alternatively, if the existing `.content` container has a max-width, set `.hero-section { margin-inline: -2rem; }` at minimum to give the card room. Add `margin-bottom: 3rem` to `.hero-section` to preserve spacing below.
  </action>
  <verify>
    <automated>pnpm astro check 2>&1 | grep -E "^.*error" | head -20 || echo "no errors"</automated>
  </verify>
  <done>Both pages import BlogFeaturedPost, use it for heroPost, TypeScript check passes with no errors in the modified files.</done>
</task>

</tasks>

<verification>
After both tasks:
- `pnpm astro check` reports no type errors
- `pnpm build` completes without errors
- Blog index at `/blog` renders featured post in full-bleed side-by-side layout
- Category page at `/blog/category/[any-slug]` renders the same layout for its first post
- Grid cards below still use BlogPostCard (unchanged)
</verification>

<success_criteria>
- `src/components/blog/blog-featured-post.astro` exists with Props interface matching BlogPostCard minus variant
- Full-bleed two-column layout: image ~55% left, floating card ~45% right with overlap effect
- Card has semi-transparent background + backdrop-filter + border
- Category badge, title (clamped large), excerpt (4-line clamp), meta (date + read time) all present
- Responsive: stacks image-above-content below 768px
- Neither blog index nor category page passes `variant="hero"` to BlogPostCard any longer
- `pnpm astro check` passes with no new errors
</success_criteria>

<output>
After completion, create `.planning/quick/1-featured-post-card-component-for-blog-he/1-SUMMARY.md` using the summary template.
</output>
