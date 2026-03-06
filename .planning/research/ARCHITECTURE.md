# Architecture Research

**Domain:** PDF catalog viewer + blog system on Astro 5 islands app
**Researched:** 2026-03-05
**Confidence:** HIGH — derived directly from codebase analysis, not external sources

## Standard Architecture

### System Overview

Both features follow the same two-layer architecture already established:

```
┌──────────────────────────────────────────────────────────────────┐
│                    ADMIN LAYER (protected)                        │
│                                                                  │
│  Astro page shell           React island (client:load)           │
│  ┌────────────────────┐     ┌─────────────────────────────────┐  │
│  │ /admin/catalogs    │────>│ AdminCatalogsPage               │  │
│  │ /admin/blog        │     │   └─ CatalogsPage               │  │
│  └────────────────────┘     │       ├─ CatalogsTable          │  │
│                             │       ├─ CatalogUploadDialog     │  │
│                             │       └─ DeleteCatalogDialog     │  │
│                             │                                  │  │
│                             │ AdminBlogPage                    │  │
│                             │   └─ BlogPostsPage               │  │
│                             │       ├─ BlogPostsTable          │  │
│                             │       ├─ BlogPostFormDialog      │  │
│                             │       └─ DeletePostDialog        │  │
│                             └─────────────────────────────────┘  │
│                                         │                        │
│                                         ▼ TanStack Query fetch   │
│  REST API endpoints (src/pages/api/admin/)                       │
│  ┌──────────────────────┐  ┌───────────────────────────────┐     │
│  │ /api/admin/catalogs  │  │ /api/admin/blog-posts         │     │
│  │   index.ts (GET/POST)│  │   index.ts (GET/POST)         │     │
│  │   [id].ts (PUT/DEL)  │  │   [id].ts (GET/PUT/DEL)       │     │
│  └──────────────────────┘  └───────────────────────────────┘     │
│                    │                       │                      │
│                    ▼                       ▼                      │
│             Drizzle ORM + Neon PostgreSQL                        │
│          (productCatalogs table) (blogPosts + blogCategories)    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    PUBLIC LAYER (SSR, no auth)                    │
│                                                                  │
│  Astro page + frontmatter DB query + static Astro components     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ /catalog                                                    │ │
│  │   frontmatter: query active catalog URL from DB             │ │
│  │   renders: <iframe> or <object> embedding the PDF URL       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ /blog                  (post listing)                       │ │
│  │ /blog/[slug]           (single post)                        │ │
│  │ /blog/category/[slug]  (category filter)                    │ │
│  │   frontmatter: query DB directly via Drizzle                │ │
│  │   renders: static Astro components, no client JS            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    FILE UPLOAD LAYER                              │
│  UploadThing router (src/server/uploadthing.ts)                  │
│  imageUploader — existing                                        │
│  pdfUploader   — ADD: accepts application/pdf, max 50MB,         │
│                  same better-auth session middleware              │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Location |
|-----------|----------------|----------|
| `src/pages/admin/catalogs.astro` | Thin shell: extract `locals.user`, mount island | `src/pages/admin/` |
| `AdminCatalogsPage` | Receive user prop, wrap with AdminSidebar | `src/components/admin/pages/admin-catalogs-page.tsx` |
| `CatalogsPage` | All catalog CRUD state, TanStack Query calls | `src/components/admin/catalogs/catalogs-page.tsx` |
| `CatalogsTable` | Render catalog list, emit edit/delete/setActive events | `src/components/admin/catalogs/catalogs-table.tsx` |
| `CatalogUploadDialog` | UploadThing PDF upload + metadata form, POST/PUT to API | `src/components/admin/catalogs/catalog-upload-dialog.tsx` |
| `DeleteCatalogDialog` | Confirm + execute DELETE | `src/components/admin/catalogs/delete-catalog-dialog.tsx` |
| `GET/POST /api/admin/catalogs/index.ts` | List all catalogs; create new catalog record | `src/pages/api/admin/catalogs/index.ts` |
| `GET/PUT/DELETE /api/admin/catalogs/[id].ts` | Fetch single; update (activate, rename); delete | `src/pages/api/admin/catalogs/[id].ts` |
| `src/pages/catalog.astro` | Query active catalog URL from DB, embed PDF | `src/pages/catalog.astro` |
| `src/pages/admin/blog.astro` | Thin shell: extract user, mount island | `src/pages/admin/` |
| `AdminBlogPage` | Receive user prop, wrap with AdminSidebar | `src/components/admin/pages/admin-blog-page.tsx` |
| `BlogPostsPage` | All blog post CRUD state, TanStack Query calls | `src/components/admin/blog/blog-posts-page.tsx` |
| `BlogPostsTable` | Render post list with status badges, emit events | `src/components/admin/blog/blog-posts-table.tsx` |
| `BlogPostFormDialog` | Create/edit form with markdown editor, cover image upload, category select | `src/components/admin/blog/blog-post-form-dialog.tsx` |
| `DeletePostDialog` | Confirm + execute DELETE | `src/components/admin/blog/delete-post-dialog.tsx` |
| `GET/POST /api/admin/blog-posts/index.ts` | List all posts (admin sees drafts); create post | `src/pages/api/admin/blog-posts/index.ts` |
| `GET/PUT/DELETE /api/admin/blog-posts/[id].ts` | Fetch single; update; delete | `src/pages/api/admin/blog-posts/[id].ts` |
| `GET/POST /api/admin/blog-categories/index.ts` | List and create blog categories | `src/pages/api/admin/blog-categories/index.ts` |
| `GET/PUT/DELETE /api/admin/blog-categories/[id].ts` | Single category operations | `src/pages/api/admin/blog-categories/[id].ts` |
| `src/pages/blog/index.astro` | List published posts, query DB in frontmatter | `src/pages/blog/` |
| `src/pages/blog/[slug].astro` | Single post, render markdown to HTML in frontmatter | `src/pages/blog/[slug].astro` |
| `src/pages/blog/category/[slug].astro` | Category-filtered post list, query DB | `src/pages/blog/category/[slug].astro` |
| `pdfUploader` (UploadThing route) | Accept PDF uploads from authenticated admins | `src/server/uploadthing.ts` (new route alongside `imageUploader`) |

## Recommended Project Structure

New files/directories to add — nothing existing changes shape:

```
src/
├── components/
│   └── admin/
│       ├── catalogs/                   # Catalog admin sub-components
│       │   ├── catalogs-page.tsx       # CRUD coordinator (mirrors services-page.tsx)
│       │   ├── catalogs-table.tsx      # Data table with version list
│       │   ├── catalog-upload-dialog.tsx  # Upload PDF + set name/version label
│       │   └── delete-catalog-dialog.tsx  # Confirm delete
│       ├── blog/                       # Blog admin sub-components
│       │   ├── blog-posts-page.tsx     # CRUD coordinator
│       │   ├── blog-posts-table.tsx    # Data table with status badges
│       │   ├── blog-post-form-dialog.tsx  # Create/edit: title, slug, markdown body, cover image, category, status
│       │   └── delete-post-dialog.tsx
│       └── pages/
│           ├── admin-catalogs-page.tsx # Thin island entry: AdminSidebar + CatalogsPage
│           └── admin-blog-page.tsx     # Thin island entry: AdminSidebar + BlogPostsPage
├── pages/
│   ├── admin/
│   │   ├── catalogs.astro             # Shell: locals.user → AdminCatalogsPage client:load
│   │   └── blog.astro                 # Shell: locals.user → AdminBlogPage client:load
│   ├── api/
│   │   └── admin/
│   │       ├── catalogs/
│   │       │   ├── index.ts           # GET (list all), POST (create)
│   │       │   └── [id].ts            # PUT (update name/active flag), DELETE
│   │       ├── blog-posts/
│   │       │   ├── index.ts           # GET (all, incl drafts for admin), POST (create)
│   │       │   └── [id].ts            # GET, PUT, DELETE
│   │       └── blog-categories/
│   │           ├── index.ts           # GET, POST
│   │           └── [id].ts            # PUT, DELETE
│   ├── blog/
│   │   ├── index.astro                # Published post listing
│   │   ├── [slug].astro               # Individual post
│   │   └── category/
│   │       └── [slug].astro           # Category-filtered listing
│   └── catalog.astro                  # Public catalog viewer
└── lib/
    └── db/
        └── schema.ts                  # ADD: productCatalogs, blogPosts, blogCategories tables
```

### Structure Rationale

- **`src/components/admin/catalogs/`** and **`src/components/admin/blog/`**: Mirrors the existing domain-grouped pattern (`products/`, `categories/`, `tradeshows/`). Each domain owns its sub-components.
- **`src/components/admin/pages/admin-catalogs-page.tsx`** and **`admin-blog-page.tsx`**: Follow the exact thin-wrapper convention (`AdminSidebar` + inner page component), identical to `admin-services-page.tsx`.
- **`src/pages/blog/`** as a directory: Needed because there are three public routes under `/blog/*`. Mirrors `src/pages/products/` which also uses a directory with an `index.astro` and dynamic child routes.
- **`src/pages/catalog.astro`** as a flat file: Only one public catalog route; no sub-routes.
- **`src/pages/api/admin/blog-categories/`** separate from `blog-posts/`: Categories are a first-class resource with independent CRUD, consistent with how `categories` is separate from `products` in the existing API structure.

## Architectural Patterns

### Pattern 1: Admin Island (existing — replicate exactly)

**What:** A thin Astro page extracts `locals.user` and passes it to a React island via `client:load`. The island wraps everything in `AdminSidebar` and delegates to a domain-specific inner page component.

**When to use:** Every admin route. No exceptions — this is the established contract.

**Example for catalog:**

```typescript
// src/pages/admin/catalogs.astro
---
import { AdminCatalogsPage } from "@/components/admin/pages/admin-catalogs-page";
import AdminLayout from "@/layouts/admin.astro";
const user = Astro.locals.user;
---
<AdminLayout title="Catalogs" description="Manage PDF Catalogs">
  <AdminCatalogsPage client:load user={user!} />
</AdminLayout>
```

```typescript
// src/components/admin/pages/admin-catalogs-page.tsx
import AdminSidebar from "@/components/admin/admin-sidebar";
import CatalogsPage from "@/components/admin/catalogs/catalogs-page";
interface Props { user: { id: string; name: string; email: string; image?: string | null } }
export function AdminCatalogsPage({ user }: Props) {
  return <AdminSidebar user={user}><CatalogsPage /></AdminSidebar>;
}
```

### Pattern 2: REST API Route (existing — replicate exactly)

**What:** Collection endpoint (`index.ts`) handles GET (list) and POST (create). Item endpoint (`[id].ts`) handles GET (single), PUT (update), DELETE. Every handler opens with `if (!locals.user || !locals.session) return 401`. Validation uses `insertXSchema.safeParse(body)`. Returns JSON with appropriate status codes.

**When to use:** Every admin mutation. Public API routes omit the auth guard.

**Example for catalog activate:**

```typescript
// src/pages/api/admin/catalogs/[id].ts — PUT handler fragment
export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, ... });
  }
  const body = await request.json();
  // If setting active: flip all to inactive, then set this one active (transaction)
  // Otherwise: update name/label only
  const [updated] = await db.update(productCatalogs)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(productCatalogs.id, params.id!))
    .returning();
  return new Response(JSON.stringify(updated), { status: 200, ... });
};
```

### Pattern 3: Public SSR Page with Frontmatter Query (existing — replicate exactly)

**What:** Astro page queries the database directly in the frontmatter `---` block. Passes data to static Astro components. No client-side JS required. Middleware skips auth on public paths.

**When to use:** `/catalog`, `/blog`, `/blog/[slug]`, `/blog/category/[slug]` — all public read-only views.

**Example for catalog page:**

```typescript
// src/pages/catalog.astro
---
import { db } from "@/lib/db";
import { productCatalogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Layout from "@/layouts/default.astro";

const activeCatalog = await db
  .select()
  .from(productCatalogs)
  .where(eq(productCatalogs.isActive, true))
  .limit(1);
const pdfUrl = activeCatalog[0]?.pdfUrl ?? null;
---
<Layout title="Product Catalog">
  {pdfUrl ? (
    <iframe src={pdfUrl} width="100%" height="900" title="Product Catalog" />
  ) : (
    <p>No catalog available at this time.</p>
  )}
</Layout>
```

**Example for blog listing:**

```typescript
// src/pages/blog/index.astro
---
import { db } from "@/lib/db";
import { blogPosts, blogCategories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Layout from "@/layouts/default.astro";

const posts = await db
  .select()
  .from(blogPosts)
  .where(eq(blogPosts.status, "published"))
  .orderBy(desc(blogPosts.publishedAt));
---
```

## Data Flow

### Catalog Upload Flow (Admin)

```
Admin opens CatalogUploadDialog
  ↓
Admin selects PDF file → UploadButton (from @/lib/uploadthing.ts, pdfUploader endpoint)
  ↓
Browser → POST /api/uploadthing → UploadThing middleware verifies better-auth session
  ↓
UploadThing stores file → returns { url: file.ufsUrl }
  ↓
onUploadComplete callback in CatalogUploadDialog receives URL
  ↓
Admin fills name/version label → submits form
  ↓
POST /api/admin/catalogs with { name, versionLabel, pdfUrl }
  ↓
API route: insertCatalogSchema.safeParse(body) → db.insert(productCatalogs)
  ↓
TanStack Query invalidates ["catalogs"] key → table re-renders
```

### Catalog Activate Flow (Admin)

```
Admin clicks "Set as Active" on a catalog row
  ↓
PUT /api/admin/catalogs/[id] with { isActive: true }
  ↓
API route: db transaction
  1. UPDATE productCatalogs SET isActive = false (all rows)
  2. UPDATE productCatalogs SET isActive = true WHERE id = [id]
  ↓
Returns updated catalog → TanStack Query invalidates ["catalogs"]
```

### Public Catalog View Flow

```
Browser GET /catalog
  ↓
Middleware: non-admin path → calls next()
  ↓
Astro frontmatter: db.select().from(productCatalogs).where(eq(isActive, true)).limit(1)
  ↓
Astro renders HTML with <iframe src={pdfUrl}> or empty state
  ↓
Response delivered — zero client-side JS
```

### Blog Post Creation Flow (Admin)

```
Admin opens BlogPostFormDialog → fills title, body (markdown), excerpt, cover image, category, status
  ↓
Cover image upload: UploadButton (imageUploader) → returns { url }
  ↓
Slug auto-generated from title on the client (toLowerCase + replace non-alphanumeric → hyphens)
  ↓
POST /api/admin/blog-posts with { title, slug, body, excerpt, coverImageUrl, categoryId, status }
  ↓
API route: insertBlogPostSchema.safeParse(body) → db.insert(blogPosts)
  ↓
TanStack Query invalidates ["blog-posts"] → table re-renders
```

### Blog Publish/Draft Toggle Flow (Admin)

```
Admin clicks status toggle on post row
  ↓
PUT /api/admin/blog-posts/[id] with { status: "published" | "draft", publishedAt: new Date() | null }
  ↓
db.update(blogPosts).set({ status, publishedAt }).where(eq(id, [id]))
  ↓
TanStack Query invalidates → row updates with new status badge
```

### Public Blog View Flow

```
Browser GET /blog
  ↓
Astro frontmatter: db.select().from(blogPosts).where(eq(status, "published")).orderBy(desc(publishedAt))
  ↓
Astro renders post list as static HTML — no client-side JS
  ↓
Browser GET /blog/[slug]
  ↓
Astro frontmatter: db.select().where(eq(slug, params.slug) AND eq(status, "published"))
  ↓
Markdown body compiled to HTML: use marked or @astrojs/markdown-remark's renderMarkdown in frontmatter
  ↓
Astro renders full post HTML
```

### State Management

| Context | Approach |
|---------|----------|
| Admin catalog/blog pages | TanStack Query (same 5-min stale time pattern); keys: `["catalogs"]`, `["blog-posts"]`, `["blog-categories"]` |
| Blog post form | Local React state within `BlogPostFormDialog` (same as `ServiceFormDialog` pattern) |
| Public pages | No client state — all data in Astro frontmatter, delivered as HTML |
| Slug generation | Client-side derived value, not stored server-side state |

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| UploadThing | Add `pdfUploader` route to `src/server/uploadthing.ts` alongside existing `imageUploader` | Same auth middleware; set `maxFileSize: "50MB"`, accept `application/pdf` |
| UploadThing (cover images) | Reuse existing `imageUploader` | No change needed; blog covers are standard images |
| Neon/Drizzle | Two new tables: `productCatalogs`, `blogPosts`, `blogCategories` (with `blogPostsToCategories` junction if many-to-many, or just `categoryId` FK if one-to-many) | Run `drizzle-kit generate` + `drizzle-kit migrate` after schema changes |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Admin page shell ↔ React island | Astro `client:load` prop: `user` object only | Consistent with all 13 existing admin pages |
| React island ↔ REST API | TanStack Query `fetch` calls to `/api/admin/*` | Auth validated by middleware + local guard in handler |
| REST API ↔ DB | Drizzle ORM via `db` singleton from `@/lib/db` | No raw SQL |
| Public page ↔ DB | Drizzle query in Astro frontmatter | Direct import; no intermediate service layer |
| Admin UploadThing component ↔ file router | UploadThing React component from `@/lib/uploadthing.ts`, endpoint name matches router key | `pdfUploader` key must match in both client generator and router definition |
| `productCatalogs.isActive` constraint | Enforced at API layer in PUT handler (transaction), not at DB layer | DB has no unique partial index — API logic owns single-active invariant |

## Schema Design (New Tables)

These additions follow all existing schema conventions exactly: `varchar` PK with `gen_random_uuid()`, `timestamp` with `defaultNow()`, `createInsertSchema` omitting `id`/`createdAt`, named exports for insert schema + select type + insert type.

```typescript
// productCatalogs — follows termsConditions pattern (existing)
export const productCatalogs = pgTable("product_catalogs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),          // human label, e.g. "2026 Spring Catalog"
  versionLabel: text("version_label"),   // optional: "v2.1"
  pdfUrl: text("pdf_url").notNull(),     // UploadThing URL
  isActive: boolean("is_active").notNull().default(false),
  uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// blogCategories — follows categories pattern
export const blogCategories = pgTable("blog_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// blogPosts — new
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => blogCategories.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),          // raw markdown
  coverImageUrl: text("cover_image_url"),
  status: text("status").notNull().default("draft"), // 'draft' | 'published'
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("blog_posts_slug_idx").on(table.slug),
  index("blog_posts_status_idx").on(table.status),
  index("blog_posts_categoryId_idx").on(table.categoryId),
]);
```

## Build Order (Dependencies)

The dependency graph dictates this sequence:

**Phase A — Foundation (must be first):**
1. Schema additions (`productCatalogs`, `blogCategories`, `blogPosts`) + Drizzle migration — everything else depends on the tables existing
2. UploadThing `pdfUploader` route — catalog upload dialog depends on this endpoint

**Phase B — Catalog Feature (self-contained after A):**
3. `GET/POST /api/admin/catalogs/index.ts` + `PUT/DELETE /api/admin/catalogs/[id].ts`
4. Admin catalog sub-components (`catalogs-page.tsx`, `catalogs-table.tsx`, `catalog-upload-dialog.tsx`, `delete-catalog-dialog.tsx`)
5. `src/pages/admin/catalogs.astro` + `admin-catalogs-page.tsx`
6. `src/pages/catalog.astro` (public viewer — depends on data existing)

**Phase C — Blog Feature (self-contained after A, parallel with B):**
7. `GET/POST /api/admin/blog-categories/index.ts` + `[id].ts`
8. `GET/POST /api/admin/blog-posts/index.ts` + `[id].ts`
9. Admin blog sub-components (`blog-posts-page.tsx`, `blog-posts-table.tsx`, `blog-post-form-dialog.tsx`, `delete-post-dialog.tsx`)
10. `src/pages/admin/blog.astro` + `admin-blog-page.tsx`
11. `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/blog/category/[slug].astro`

B and C can proceed in parallel once A is done. Within each phase, API routes should be built before the UI components that call them.

## Anti-Patterns

### Anti-Pattern 1: Querying DB in a React Island Directly

**What people do:** Import `db` inside a React component and call it at render time or in `useEffect`.

**Why it's wrong:** `db` uses the Neon serverless driver which only runs server-side. React islands run in the browser on the client. Importing server-side modules into `client:load` islands causes build failures or runtime errors in this stack.

**Do this instead:** Public pages query the DB in Astro frontmatter and pass data as props or render it as HTML. Admin islands fetch via `fetch('/api/admin/...')` using TanStack Query — the API route runs server-side.

### Anti-Pattern 2: Creating a Public API Endpoint for Admin Blog Data

**What people do:** Create `/api/blog-posts` (no `/admin/` prefix) so the public blog can fetch posts client-side.

**Why it's wrong:** The public blog pages are SSR Astro pages. There is no need for a client-side fetch — the frontmatter query is faster (no extra round-trip), simpler, and consistent with how every other public page in this codebase works. A public API endpoint adds surface area with no benefit.

**Do this instead:** Public blog routes query the DB in Astro frontmatter. The admin API at `/api/admin/blog-posts/` is only for the admin island's TanStack Query calls.

### Anti-Pattern 3: Using a Single "Active" Boolean Without Transaction Safety

**What people do:** Update the `isActive` column on the target catalog row directly without first clearing all other rows.

**Why it's wrong:** A race condition or partial failure can leave multiple catalogs marked active. The public `/catalog` page uses `.limit(1)` which makes this silent (it picks an arbitrary "active" row), but the invariant is broken.

**Do this instead:** The PUT handler for setting a catalog active uses a Drizzle transaction: first `UPDATE product_catalogs SET is_active = false`, then `UPDATE product_catalogs SET is_active = true WHERE id = [id]`. Both succeed or both roll back.

### Anti-Pattern 4: Writing the Blog Editor as a Full Rich Text WYSIWYG

**What people do:** Add TipTap, Quill, or Slate.js for a WYSIWYG editor in the blog form dialog.

**Why it's wrong:** The project scope explicitly rules this out (see PROJECT.md: "WYSIWYG adds complexity with no clear benefit"). A markdown `textarea` with a `<preview>` pane is sufficient and consistent with the existing stack. WYSIWYG editors also require careful handling of HTML sanitization on render.

**Do this instead:** Use a plain `textarea` for markdown input. On the public `/blog/[slug].astro` page, parse markdown to HTML server-side in the frontmatter using `marked` or the built-in Astro markdown utilities. This keeps zero new dependencies.

### Anti-Pattern 5: Adding a New Storage Provider for PDF Files

**What people do:** Introduce AWS S3, Cloudflare R2, or another storage service for PDFs.

**Why it's wrong:** UploadThing is already integrated and authenticated. Adding another provider doubles the integration surface and secrets management overhead.

**Do this instead:** Add a `pdfUploader` key to `src/server/uploadthing.ts` with `f({ "application/pdf": { maxFileSize: "50MB", maxFileCount: 1 } })` and the identical `better-auth` session middleware already used by `imageUploader`. The existing `UploadButton`/`UploadDropzone` generators from `@/lib/uploadthing.ts` will work with the new endpoint name.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (small team, low traffic) | Current architecture is appropriate — SSR on Netlify, Neon serverless handles variable load |
| Blog grows to 100+ posts | Add pagination to `/blog` index query; add `LIMIT`/`OFFSET` or cursor to the admin list API. Indices on `status` and `publishedAt` are the only performance concern |
| PDF catalog served at high volume | UploadThing serves files from their CDN directly — the Astro page only fetches a single URL row from the DB. No scaling concern at this level |
| Blog post rendering becomes slow | Markdown-to-HTML parsing happens in Astro frontmatter per request. If this becomes measurable, cache the rendered HTML in the DB column (`bodyHtml`) at write time in the API route |

### Scaling Priorities

1. **First bottleneck:** Blog list pagination — avoid fetching all posts in one query as the post count grows. Add `limit`/`offset` from day one in the API route, even if the UI doesn't paginate initially.
2. **Second bottleneck:** Markdown rendering per request — store `bodyHtml` in the schema alongside `body` if render time becomes measurable (this is unlikely with server-side `marked` for typical post lengths).

## Sources

- Codebase analysis of `src/server/uploadthing.ts`, `src/pages/api/admin/services/index.ts`, `src/components/admin/pages/admin-services-page.tsx`, `src/components/admin/content/services-page.tsx`, `src/pages/products/index.astro`, `src/lib/db/schema.ts` — HIGH confidence (direct code inspection)
- `.planning/codebase/ARCHITECTURE.md` — codebase analysis document — HIGH confidence
- `.planning/codebase/STRUCTURE.md` — structure conventions — HIGH confidence
- `.planning/PROJECT.md` — feature requirements and constraints — HIGH confidence

---
*Architecture research for: PDF catalog viewer + blog system on Astro 5 islands*
*Researched: 2026-03-05*
