# Stack Research

**Domain:** PDF catalog viewer + markdown blog on existing Astro 5 + React 19 islands app
**Researched:** 2026-03-05
**Confidence:** HIGH (PDF embedding), HIGH (markdown rendering), MEDIUM (markdown editing — React 19 peer dep broad but untested in this exact stack)

---

## Recommended Stack

### PDF Catalog Viewer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Native `<iframe>` embed | browser built-in | Render the active catalog PDF on `/catalog` | Zero dependencies, zero bundle cost, zero SSR/worker complexity. Astro renders this server-side as static HTML. The viewer UI (zoom, print, navigation) is provided by the browser's own PDF renderer — exactly the same quality as what the `terms_conditions` page already uses. UploadThing CDN serves the file directly; no CORS issues. |
| UploadThing `pdf` file type | `uploadthing` 7.7 (already installed) | Accept PDF uploads in the admin file router | The existing router only allows `image` type. Adding a `pdfUploader` route that specifies `{ pdf: { maxFileSize: "32MB", maxFileCount: 1 } }` is a 3-line change. No new service, no new credentials. |

**Why not react-pdf (wojtekmaj):** The project does not need text selection, annotation, or per-page custom UI on the catalog page. `react-pdf` v10 is ESM-only, requires a PDF.js worker configuration that has known friction with Vite's `import.meta.url` in Astro's `client:only` islands, and adds ~500 kB to the client bundle for a use case fully solved by a 2-line `<iframe>`. The existing `terms_conditions` implementation already validates this pattern works in production.

**Why not pdfjs-dist directly:** Even more configuration overhead than `react-pdf` with no added benefit for this use case.

### Blog System — Data Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Drizzle ORM + Neon PostgreSQL | `drizzle-orm` 0.45 / `@neondatabase/serverless` 1.0 (already installed) | `blog_posts` and `blog_categories` tables | Consistent with every other content entity in this project. No new dependency, no new migration tool. Slug indexing, draft/published filtering, and category relations are trivial with Drizzle. |
| `drizzle-zod` | 0.8 (already installed) | Auto-generate insert/update Zod schemas from blog tables | Already used for all other tables. Zero marginal cost. |

### Blog System — Admin Editor (Write Path)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@uiw/react-md-editor` | 4.0.11 | Markdown editor with split-pane preview for admin blog post creation | Lightweight (~4.6 kB gzipped), batteries-included (toolbar, GFM, live preview, tab indentation). Peer dep is `react >=16.8.0` — React 19 satisfies it. Runs as a React island with `client:load`. No WYSIWYG complexity, no Lexical/ProseMirror runtime in the admin bundle. The PROJECT.md explicitly rules out a WYSIWYG editor. |

### Blog System — Public Rendering (Read Path)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `react-markdown` | 10.1.0 | Render stored markdown to React components on public `/blog/[slug]` pages | v10 is the current release (Feb 2025), supports React >=18 (React 19 satisfies), no `dangerouslySetInnerHTML`, built on remark/rehype so the plugin ecosystem is fully composable. Server-renderable in Astro without any `client:*` directive — the markdown processing happens at request time on the server. |
| `remark-gfm` | 4.0.1 | GitHub Flavored Markdown: tables, strikethrough, task lists, autolinks | Standard companion to `react-markdown`; required for any non-trivial blog content. |
| `rehype-highlight` | 7.0.2 | Syntax highlighting for code blocks (uses highlight.js) | Lighter than rehype-pretty-code/Shiki for this use case. Server-side highlighting means zero client-side JS for code blocks. |
| `rehype-slug` | 6.0.0 | Add `id` attributes to headings for anchor links | Single-purpose, tiny, no config needed. |
| `slugify` | 1.6.6 | Generate URL-safe slugs from post titles at creation time | Already a common dependency in this ecosystem; deterministic, handles unicode, configurable separator. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `reading-time` | 1.5.0 | Estimate read time from markdown content | Add to blog post API response; display on post list and detail pages |
| `rehype-autolink-headings` | 7.1.0 | Add anchor links to headings (pairs with `rehype-slug`) | Add when headings linking becomes desirable; low cost to add later |

---

## Installation

```bash
# Admin editor (React island, client-side)
pnpm add @uiw/react-md-editor

# Public markdown rendering (server-side in Astro)
pnpm add react-markdown remark-gfm rehype-highlight rehype-slug

# Utilities
pnpm add slugify reading-time
```

Note: `uploadthing`, `drizzle-orm`, `drizzle-zod`, `@neondatabase/serverless` are already installed. No new installation needed for the PDF storage layer.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `<iframe>` for PDF display | `react-pdf` (wojtekmaj) v10.4.1 | Only if you need text selection, per-page UI controls, annotations, or thumbnail strips. Accept the Vite/worker config complexity and ~500 kB bundle cost. |
| `<iframe>` for PDF display | `pdfjs-dist` 5.5.207 directly | Only if you need to build a fully custom PDF viewer UI from scratch (pan, zoom, page thumbnails, search). Essentially building react-pdf yourself. |
| `@uiw/react-md-editor` | `@mdxeditor/editor` (MDXEditor) | MDXEditor is a true WYSIWYG (Lexical-based), 851 kB gzipped. Use it if stakeholders require formatting-as-you-type without ever seeing markdown syntax. Not this project. |
| `@uiw/react-md-editor` | `react-simplemde-editor` / EasyMDE | Another markdown editor option; CodeMirror-based so slightly heavier. Valid alternative if `@uiw` causes issues, but `@uiw` is more actively maintained. |
| `react-markdown` + plugins | Custom `marked` + `dangerouslySetInnerHTML` | Use marked only if you need server-side rendering outside React (e.g., plain Node.js email templates). Never use `dangerouslySetInnerHTML` in a public-facing route without a sanitizer. |
| `rehype-highlight` | `rehype-pretty-code` (Shiki) | Use `rehype-pretty-code` if the blog requires line numbers, line highlighting, or multiple themes. Shiki is larger but produces better output for developer-focused blogs. Overkill here. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-pdf` for simple catalog display | Adds ~500 kB to client bundle, requires PDF.js worker configuration that has documented Vite/Astro friction (GitHub issues #1148, #1843, discussion #1823). Existing `<iframe>` pattern already validated in this codebase. | Native `<iframe>` with UploadThing CDN URL |
| `@react-pdf/renderer` (diegomura) | This is a PDF *generation* library (renders React to PDF), not a PDF *viewer*. Completely wrong tool. React 19 compat issues also documented (GitHub issues #2756, #2912, #2964). | Not applicable — not needed at all |
| MDXEditor / `@mdxeditor/editor` | 851 kB gzipped WYSIWYG adds significant admin bundle weight. Requires Lexical runtime. PROJECT.md explicitly rules out WYSIWYG. | `@uiw/react-md-editor` |
| Astro Content Collections for blog | Content Collections are for file-system markdown (`.md`/`.mdx` files committed to the repo). This blog is admin-authored via a database — storing posts in the filesystem requires git commits to publish and breaks the admin-CRUD pattern used by every other content type in this project. | Drizzle ORM + Neon PostgreSQL (consistent with existing pattern) |
| A separate CMS (Contentful, Sanity, Strapi) | Adds a new service, new credentials, new auth context, and a new data fetching pattern. The existing stack (Drizzle + admin UI + REST API) already solves the same problem without external dependencies. | Drizzle ORM + existing admin island pattern |
| `dangerouslySetInnerHTML` for markdown output | XSS vector. Any user-provided markdown (even admin input) can contain malicious HTML if the sanitizer is absent or misconfigured. | `react-markdown` (renders to React elements, never raw HTML) |

---

## Stack Patterns by Variant

**PDF display — catalog page (`/catalog`, public, Astro page):**
- Fetch active catalog row from DB in Astro frontmatter (server-side)
- Render `<iframe src={pdfUrl} />` directly in `.astro` file
- No React island needed; zero client-side JS for this feature

**PDF upload — admin (`/admin/catalog`, React island):**
- Add `pdfUploader` route to `src/server/uploadthing.ts` following the exact same pattern as `imageUploader`
- Use existing `UploadButton` / `UploadDropzone` from `src/lib/uploadthing.ts` in the admin island
- On upload complete, call `/api/admin/catalogs` to persist URL and set as active

**Blog post creation — admin (`/admin/blog/new`, React island):**
- `@uiw/react-md-editor` as `client:load` island
- Post form: title (text), slug (auto-derived via `slugify`, editable), excerpt (textarea), cover image (`UploadButton`), category (select), status (draft/published), body (MDEditor)
- Submit to `/api/admin/blog/posts` (POST) — same REST pattern as all other admin mutations

**Blog post rendering — public (`/blog/[slug]`, Astro page):**
- Fetch post from DB in Astro frontmatter
- Pass `post.body` (raw markdown string) to a React component that renders with `react-markdown` + plugins
- Component can be `client:load` for interactivity or rendered server-only (no `client:*` directive) if no interaction needed
- `react-markdown` renders to React elements server-side in Astro — no `dangerouslySetInnerHTML`, no client JS required

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|----------------|-------|
| `react-pdf` 10.4.1 | React ^16.8 \|\| ^17 \|\| ^18 \|\| ^19 | ESM-only (dropped CJS in v10). Worker must be configured via `import.meta.url` — known Vite friction. Not recommended for this project. |
| `@uiw/react-md-editor` 4.0.11 | React `>=16.8.0` | React 19 satisfies peer dep. No documented React 19-specific issues found. Verify with `pnpm install` — pnpm will warn on genuine incompatibilities. |
| `react-markdown` 10.1.0 | React `>=18` | React 19 satisfies. v10 released Feb 2025. ESM-only. Astro Vite config handles ESM fine. |
| `remark-gfm` 4.0.1 | `react-markdown` 10.x | Part of the same unified/remark ecosystem. Version pinned to work with react-markdown v10. |
| `rehype-highlight` 7.0.2 | `react-markdown` 10.x | highlight.js peer dep — verify `highlight.js` version if you add it as a direct dep. |
| UploadThing `pdf` type | `uploadthing` 7.x (current) | `pdf` is a first-class shorthand type in UploadThing file routes alongside `image`, `video`, `audio`. Confirmed in official docs. |

---

## UploadThing PDF Router Extension

The required change to `src/server/uploadthing.ts` is additive — no existing routes are modified:

```typescript
pdfUploader: f({
  pdf: {
    maxFileSize: "32MB",
    maxFileCount: 1,
  },
})
  .middleware(async ({ req }) => {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) throw new Error("Unauthorized");
    return { userId: session.user.id, uploadedAt: new Date().toISOString() };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    return { url: file.ufsUrl };
  }),
```

This mirrors the existing `imageUploader` pattern exactly. 32 MB is a reasonable upper bound for catalog PDFs (adjustable).

---

## Sources

- `npm info react-pdf version` — v10.4.1 confirmed (2026-03-05)
- `npm info @uiw/react-md-editor version` — v4.0.11, peer dep `react >=16.8.0` confirmed
- `npm info react-markdown version` — v10.1.0 confirmed
- `npm info pdfjs-dist version` — v5.5.207 confirmed
- `npm info remark-gfm / rehype-highlight / rehype-slug / slugify` — versions confirmed
- [UploadThing File Routes docs](https://docs.uploadthing.com/file-routes) — `pdf` shorthand type confirmed (HIGH confidence)
- [react-pdf npm releases](https://github.com/wojtekmaj/react-pdf/releases) — v10 ESM-only, React 19 peer dep confirmed
- [react-pdf Astro discussion #1823](https://github.com/diegomura/react-pdf/discussions/1823) — known Astro client:only friction documented (MEDIUM confidence — issue exists, workarounds debated)
- [Vite worker import.meta.url issue #10837](https://github.com/vitejs/vite/issues/10837) — worker config friction with Vite confirmed
- [React PDF Viewers 2025 Guide](https://sudopdf.com/blog/react-pdf-viewers-guide) — iframe vs react-pdf tradeoff summary (MEDIUM confidence)
- [react-markdown changelog](https://github.com/remarkjs/react-markdown/blob/main/changelog.md) — v10 Feb 2025 release, React >=18 peer dep (HIGH confidence)
- [uiw/react-md-editor GitHub releases](https://github.com/uiwjs/react-md-editor/releases) — v4.0.11 latest (HIGH confidence)
- Training data knowledge of existing codebase patterns (terms_conditions table, uploadthing router) — validated against read source files

---

*Stack research for: PDF catalog viewer + markdown blog (Green Lion Innovations v3)*
*Researched: 2026-03-05*
