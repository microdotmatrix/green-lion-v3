# Phase 1: Foundation - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Foundational infrastructure that Phase 2 (PDF Catalog) and Phase 3 (Blog Admin) depend on. Delivers three new Drizzle schema tables (`productCatalogs`, `blogCategories`, `blogPosts`), a UploadThing `pdfUploader` route extension, and a Netlify build pipeline with automatic migration. No user-facing UI in this phase.

</domain>

<decisions>
## Implementation Decisions

### productCatalogs table schema
- Columns: `id`, `displayName`, `pdfUrl`, `isActive`, `notes` (nullable text), `uploadedBy` (nullable FK → user.id, set null on delete), `createdAt`, `updatedAt`
- `isActive` is a boolean flag — enforced as single-active via transaction in Phase 2 API
- `uploadedBy` tracks which admin added the version (audit trail)
- `notes` is an optional version description (e.g., "Spring 2026 pricing update"), nullable text
- `updatedAt` included — consistent with products and contact_submissions
- File metadata (size, filename) NOT stored — only the UploadThing URL, consistent with existing image storage pattern

### blogCategories table schema
- Columns: `id`, `name`, `slug` (unique), `createdAt`
- Minimal — categories are labels; slug enables `/blog/category/[slug]` routing

### blogPosts table schema
- Columns: `id`, `title`, `slug` (unique), `body` (text, markdown), `excerpt`, `coverImageUrl`, `categoryId` (nullable FK → blogCategories.id, set null on delete), `authorId` (nullable FK → user.id, set null on delete), `status` ('draft'|'published'), `publishedAt` (nullable timestamp), `createdAt`, `updatedAt`
- `status` controls visibility; `publishedAt` is set when admin publishes and enables "Published on [date]" display on the frontend
- `publishedAt` makes v2 scheduling trivial to add without schema changes
- `updatedAt` included for last-edited tracking
- `authorId` tracks which admin authored the post — used for "by [Name]" attribution on public blog
- `readingTime` NOT stored — computed at render time using reading-time library (avoids stale data when posts are edited)
- Slug is URL-safe, derived from title at creation time (decided pre-phase)

### Netlify build pipeline
- Create `netlify.toml` in project root (does not exist yet)
- Keep `package.json` build script as `astro build` — local dev does not run migrations
- `netlify.toml` build command: `drizzle-kit migrate && astro build`
- `netlify.toml` includes: `publish = "dist/"`, `NODE_VERSION = "24"`
- Uses `drizzle-kit migrate` (runs committed migration files), NOT `drizzle-kit push` — safe for production

### UploadThing auth
- Both `imageUploader` and `pdfUploader` check `session?.user` AND `approved: true`
- Update existing `imageUploader` middleware to add approved check for consistency across all upload routes
- Auth error thrown as `new Error("Unauthorized")` — matches existing pattern

### Claude's Discretion
- Exact Drizzle index placement on new tables (e.g., slug, categoryId, status, uploadedBy)
- Drizzle relations for all three new tables (follow existing relational pattern in schema.ts)
- Insert schema exports and TypeScript select/insert types (follow existing pattern at bottom of schema.ts)
- `netlify.toml` node_bundler and functions directory settings — use @astrojs/netlify adapter defaults

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/server/uploadthing.ts`: Add `pdfUploader` route following the same middleware + onUploadComplete structure as `imageUploader`. Also update `imageUploader` auth to check `approved`.
- `drizzle.config.ts`: Already configured for `./src/lib/db/schema.ts` schema and `./drizzle/` migration output — just add new tables to schema.ts and run `db:generate`.
- `src/lib/db/schema.ts`: Follow existing table patterns throughout. All three new tables append to this file.

### Established Patterns
- PK: `varchar("id").primaryKey().default(sql\`gen_random_uuid()\`)` — use for all three new tables
- `updatedAt`: `.defaultNow().$onUpdate(() => new Date())` — use for productCatalogs and blogPosts
- FK with set-null: `references(() => user.id, { onDelete: "set null" })` — use for uploadedBy, authorId, categoryId
- Insert schema: `createInsertSchema(table).omit({ id: true, createdAt: true, updatedAt: true })` — follow for all three tables
- Type exports: `typeof table.$inferSelect` for select types, `z.infer<typeof insertSchema>` for insert types — follow existing block at bottom of schema.ts

### Integration Points
- `src/lib/db/schema.ts` — append three new tables, relations, insert schemas, and type exports
- `src/server/uploadthing.ts` — add `pdfUploader` route; update `imageUploader` middleware
- `netlify.toml` — create new file in project root
- `./drizzle/` — migration files committed here are what `drizzle-kit migrate` applies in the Netlify build

</code_context>

<specifics>
## Specific Ideas

- `netlify.toml` should lock `NODE_VERSION = "24"` to match the active development runtime (Node.js v24)
- No other specific requirements — standard Drizzle patterns apply throughout

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-06*
