# Phase 1: Foundation - Research

**Researched:** 2026-03-06
**Domain:** Drizzle ORM schema migrations, UploadThing v7 file routes, Netlify build pipeline
**Confidence:** HIGH

## Summary

Phase 1 is pure infrastructure: three new Drizzle schema tables, an extended UploadThing router, and a `netlify.toml` file. Every piece builds on patterns already established in the codebase — no new libraries are needed and no architectural decisions remain open. The existing schema.ts is the single source of truth for all DB structure; the four committed migrations (0000–0003) cover auth, products, categories, quotes, and admin invites. The three new tables (`productCatalogs`, `blogCategories`, `blogPosts`) slot in after the existing block, following established conventions exactly.

The UploadThing router (`src/server/uploadthing.ts`) already has one route (`imageUploader`) with the correct middleware shape. Adding `pdfUploader` is additive and follows the same pattern — use the `"pdf"` file type key with `maxFileSize: "32MB"`. The existing `imageUploader` middleware does not check `approved`, which must be corrected in the same task per the decisions.

Netlify deployment is already configured via `@astrojs/netlify` adapter in `astro.config.mjs`. The only missing piece is `netlify.toml` at the project root to inject `drizzle-kit migrate` before `astro build` and pin `NODE_VERSION = "24"`. The package.json `build` script stays as `astro build` — Netlify overrides it via `netlify.toml`.

**Primary recommendation:** Follow the exact patterns in schema.ts (varchar UUID PK, `$onUpdate`, set-null FKs, createInsertSchema at file bottom). Write `netlify.toml` with `command = "drizzle-kit migrate && astro build"` and `NODE_VERSION = "24"`. Verification is manual (Netlify deploy log + UploadThing upload test).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### productCatalogs table schema
- Columns: `id`, `displayName`, `pdfUrl`, `isActive`, `notes` (nullable text), `uploadedBy` (nullable FK to user.id, set null on delete), `createdAt`, `updatedAt`
- `isActive` is a boolean flag — enforced as single-active via transaction in Phase 2 API
- `uploadedBy` tracks which admin added the version (audit trail)
- `notes` is an optional version description (e.g., "Spring 2026 pricing update"), nullable text
- `updatedAt` included — consistent with products and contact_submissions
- File metadata (size, filename) NOT stored — only the UploadThing URL, consistent with existing image storage pattern

#### blogCategories table schema
- Columns: `id`, `name`, `slug` (unique), `createdAt`
- Minimal — categories are labels; slug enables `/blog/category/[slug]` routing

#### blogPosts table schema
- Columns: `id`, `title`, `slug` (unique), `body` (text, markdown), `excerpt`, `coverImageUrl`, `categoryId` (nullable FK to blogCategories.id, set null on delete), `authorId` (nullable FK to user.id, set null on delete), `status` ('draft'|'published'), `publishedAt` (nullable timestamp), `createdAt`, `updatedAt`
- `status` controls visibility; `publishedAt` is set when admin publishes and enables "Published on [date]" display on the frontend
- `publishedAt` makes v2 scheduling trivial to add without schema changes
- `updatedAt` included for last-edited tracking
- `authorId` tracks which admin authored the post — used for "by [Name]" attribution on public blog
- `readingTime` NOT stored — computed at render time using reading-time library (avoids stale data when posts are edited)
- Slug is URL-safe, derived from title at creation time (decided pre-phase)

#### Netlify build pipeline
- Create `netlify.toml` in project root (does not exist yet)
- Keep `package.json` build script as `astro build` — local dev does not run migrations
- `netlify.toml` build command: `drizzle-kit migrate && astro build`
- `netlify.toml` includes: `publish = "dist/"`, `NODE_VERSION = "24"`
- Uses `drizzle-kit migrate` (runs committed migration files), NOT `drizzle-kit push` — safe for production

#### UploadThing auth
- Both `imageUploader` and `pdfUploader` check `session?.user` AND `approved: true`
- Update existing `imageUploader` middleware to add approved check for consistency across all upload routes
- Auth error thrown as `new Error("Unauthorized")` — matches existing pattern

### Claude's Discretion
- Exact Drizzle index placement on new tables (e.g., slug, categoryId, status, uploadedBy)
- Drizzle relations for all three new tables (follow existing relational pattern in schema.ts)
- Insert schema exports and TypeScript select/insert types (follow existing pattern at bottom of schema.ts)
- `netlify.toml` node_bundler and functions directory settings — use @astrojs/netlify adapter defaults

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 | ORM and schema definition | Already in use; all tables defined here |
| drizzle-kit | ^0.31.8 | Migration generation and apply | `db:generate` and `db:migrate` scripts already in package.json |
| drizzle-zod | ^0.8.3 | createInsertSchema for validation | Already used by all existing tables |
| uploadthing | ^7.7.4 | File storage and CDN | Already in use; `imageUploader` is live |
| @uploadthing/react | ^7.3.3 | React upload components | Already installed |
| zod | ^4.3.5 | Schema validation and TypeScript types | Already in use |

### No New Installation Required

All packages needed for Phase 1 are already present in `package.json`. Running `pnpm install` is not needed.

## Architecture Patterns

### Recommended Project Structure (existing — Phase 1 appends to these files)

```
src/lib/db/
└── schema.ts          # All three tables append here (after termsConditions)

src/server/
└── uploadthing.ts     # pdfUploader added; imageUploader middleware updated

drizzle/               # New migration file generated here after schema change
├── 0000_real_lilith.sql
├── 0001_smart_cargill.sql
├── 0002_invites_and_approval.sql
├── 0003_adorable_charles_xavier.sql
└── 0004_*.sql         # Generated by `pnpm db:generate` in Plan 01-01

[project root]/
└── netlify.toml       # Created new in Plan 01-01 (does not exist yet)
```

### Pattern 1: Drizzle Table Definition (from schema.ts)

**What:** Every application table uses `varchar` UUID primary key, `timestamp` for createdAt/updatedAt, and FK references with explicit `onDelete` behavior.

**When to use:** All three new tables follow this exactly.

```typescript
// Source: src/lib/db/schema.ts (existing productCatalogs-equivalent pattern from contactSubmissions)
export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  // ... fields ...
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
```

The `/* @__PURE__ */` comment is already present in the codebase — preserve it in new tables.

### Pattern 2: FK with Set-Null (from schema.ts)

**What:** Nullable foreign keys that become null when the referenced row is deleted — used for soft audit trails.

**When to use:** `uploadedBy`, `authorId`, `categoryId` on new tables.

```typescript
// Source: src/lib/db/schema.ts (adminInvite.invitedBy pattern)
invitedBy: text("invited_by").references(() => user.id, {
  onDelete: "set null",
}),
```

Note: `uploadedBy` and `authorId` reference `user.id` which is `text` type (not `varchar`). The FK column must also be `text` (not `varchar`) to match.

### Pattern 3: Index Definition (from schema.ts)

**What:** Indexes passed as second argument to `pgTable` in an array, using `index("name").on(table.column)`.

**When to use:** High-cardinality query columns — slug lookups, FK joins, status filters.

```typescript
// Source: src/lib/db/schema.ts (session table pattern)
export const session = pgTable(
  "session",
  { /* ... columns */ },
  (table) => [index("session_userId_idx").on(table.userId)],
);
```

Recommended indexes for new tables (Claude's discretion):
- `blogCategories`: index on `slug`
- `blogPosts`: index on `slug`, `categoryId`, `status`, `authorId`
- `productCatalogs`: index on `uploadedBy`, `isActive`

### Pattern 4: Drizzle Relations (from schema.ts)

**What:** Relations declared separately from table definitions, enabling Drizzle's relational query API.

**When to use:** All three new tables need relations declared.

```typescript
// Source: src/lib/db/schema.ts (feedbackReplies pattern — one-to-one with user)
export const feedbackRepliesRelations = relations(
  feedbackReplies,
  ({ one }) => ({
    adminUser: one(user, {
      fields: [feedbackReplies.adminUserId],
      references: [user.id],
    }),
  }),
);
```

Also update `userRelations` to add `many(productCatalogs)`, `many(blogPosts)` as appropriate.

### Pattern 5: Insert Schema and Type Exports (from schema.ts)

**What:** The bottom of schema.ts has two blocks: insert schemas (createInsertSchema), then select/insert types. New tables append to both blocks.

**When to use:** All three new tables must follow this pattern.

```typescript
// Source: src/lib/db/schema.ts (bottom block pattern)
export const insertContactSubmissionSchema = createInsertSchema(
  contactSubmissions,
).omit({ id: true, createdAt: true, updatedAt: true });

// Select types block:
export type ContactSubmission = typeof contactSubmissions.$inferSelect;

// Insert types block:
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
```

### Pattern 6: UploadThing Route (from src/server/uploadthing.ts)

**What:** Each upload route has: file type config, `.middleware()` for auth, `.onUploadComplete()` returning metadata.

**When to use:** `pdfUploader` follows this exactly; `imageUploader` gets its middleware updated.

```typescript
// Source: src/server/uploadthing.ts (existing imageUploader — reference for pdfUploader shape)
imageUploader: f({
  image: { maxFileSize: "4MB", maxFileCount: 1 },
})
  .middleware(async ({ req }) => {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) throw new Error("Unauthorized");
    return { userId: session.user.id, uploadedAt: new Date().toISOString() };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete for user:", metadata.userId);
    return { url: file.ufsUrl };
  }),
```

For `pdfUploader`: change `image` key to `pdf`, set `maxFileSize: "32MB"`, add `approved` check.

Updated middleware (both routes):
```typescript
.middleware(async ({ req }) => {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user || !session.user.approved) throw new Error("Unauthorized");
  return { userId: session.user.id, uploadedAt: new Date().toISOString() };
})
```

Note: `session.user.approved` is available because `approved` is defined on the `user` table and better-auth returns full user fields via `getSession`.

### Pattern 7: netlify.toml Structure

**What:** Minimal `netlify.toml` that overrides the build command to run migration before build, pins Node version, and sets publish directory.

**When to use:** Create at project root in Plan 01-01.

```toml
[build]
  command = "drizzle-kit migrate && astro build"
  publish = "dist/"

[build.environment]
  NODE_VERSION = "24"
```

The `@astrojs/netlify` adapter is already configured in `astro.config.mjs` (`adapter: netlify()`). No additional adapter settings are needed in `netlify.toml`. The adapter handles Functions directory automatically.

### Anti-Patterns to Avoid

- **Using `drizzle-kit push` in the Netlify build command:** `push` compares schema directly and can drop columns. `migrate` only applies committed `.sql` files — it is safe for production.
- **Storing FK to `user.id` as `varchar`:** The `user.id` column is `text` (not `varchar`), so FK columns referencing it must also be `text` to avoid type mismatch.
- **Omitting `updatedAt` from `createInsertSchema().omit()`:** All tables with `updatedAt` must omit it from insert schemas (it is server-managed). See existing pattern.
- **Skipping the `approved` check on `imageUploader`:** The CONTEXT.md decision requires updating the existing route — not just adding the new one. The planner must include this as a step in Plan 01-02.
- **Running `pnpm db:migrate` during local dev:** The workflow decision is that `netlify.toml` runs migrations at Netlify build time only. Local development uses `pnpm db:push` (already a script) or `pnpm db:migrate` manually when needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom ID generator | `varchar("id").primaryKey().default(sql\`gen_random_uuid()\`)` | PostgreSQL native; already used in 10+ tables |
| Insert validation | Manual Zod schema | `createInsertSchema(table).omit({...})` from drizzle-zod | Auto-syncs with schema; avoids drift |
| File upload storage | Custom S3/storage layer | UploadThing router extension | CDN, type validation, auth middleware already wired |
| Migration tracking | Manual SQL version table | `drizzle-kit migrate` via `__drizzle_migrations` table | Idempotent, conflict-safe, auto-tracks applied files |

**Key insight:** This phase is entirely about extending existing infrastructure, not building new infrastructure. Every tool and pattern is already in place.

## Common Pitfalls

### Pitfall 1: FK Type Mismatch (varchar vs text)

**What goes wrong:** Schema-generated migration fails or TypeScript errors appear because `uploadedBy`/`authorId` are declared as `varchar` but `user.id` is `text`.
**Why it happens:** The `user` table (from better-auth) uses `text("id")` not `varchar("id")`. The other application tables use `varchar` for their own IDs but `text` for FK columns referencing user IDs.
**How to avoid:** Declare `uploadedBy`, `authorId` as `text("uploaded_by")` (not `varchar`). Check the existing pattern — `feedbackReplies.adminUserId` is `text`.
**Warning signs:** TypeScript error on `.references(() => user.id)` with a varchar FK column; or Drizzle generating a type-cast migration.

### Pitfall 2: Missing `approved` Check on Existing imageUploader

**What goes wrong:** The plan only adds `pdfUploader` but forgets to update `imageUploader` middleware — both routes must be consistent per the decision.
**Why it happens:** The task description focuses on adding the new route; the existing route update is easy to overlook.
**How to avoid:** Plan 01-02 must explicitly include updating `imageUploader` middleware as a step, not just adding `pdfUploader`.
**Warning signs:** `imageUploader` middleware in the final commit still only checks `session?.user` without `approved`.

### Pitfall 3: Netlify Build Fails Because DATABASE_URL Is Not Set as Env Var

**What goes wrong:** `drizzle-kit migrate` runs during Netlify build but cannot connect because `DATABASE_URL` is not configured in Netlify site environment variables.
**Why it happens:** `drizzle.config.ts` reads from `.env.local` locally (via `dotenv.config({ path: ".env.local" })`), but `.env.local` is not committed. Netlify needs the variable set in the dashboard.
**How to avoid:** Verify `DATABASE_URL` is set in Netlify site settings > Environment Variables before the first deployment. This is a verification step in the success criteria.
**Warning signs:** Build log shows `Error: DATABASE_URL is not set` or connection refused during the migrate step.

### Pitfall 4: drizzle-kit migrate Applies Only Committed Migration Files

**What goes wrong:** Developer runs `pnpm db:generate` but forgets to commit the generated `.sql` file before pushing to Netlify — migration does not run in production.
**Why it happens:** `drizzle-kit migrate` reads from the `./drizzle/` directory in the build environment. Only committed files are present.
**How to avoid:** The workflow for Plan 01-01 must include: generate → inspect the SQL → commit the migration file → verify locally → push.
**Warning signs:** Tables not appearing in production despite successful build; no error in build log (migration silently skips unapplied files if they aren't present).

### Pitfall 5: UploadThing `approved` Field Not on Session User Type

**What goes wrong:** `session.user.approved` causes a TypeScript error because better-auth's inferred session type may not include the custom `approved` field.
**Why it happens:** The `approved` column was added to the `user` table via Drizzle (migration 0003), but better-auth's type inference depends on its own schema definition, not Drizzle's.
**How to avoid:** Check `src/lib/auth.ts` to confirm `approved` is declared in better-auth's user additional fields config. If it is, the type is available. If not, cast: `(session.user as any).approved` or extend better-auth's user type.
**Warning signs:** TypeScript error: `Property 'approved' does not exist on type 'User'` in uploadthing.ts.

## Code Examples

### Complete productCatalogs Table Definition

```typescript
// Follow pattern from: src/lib/db/schema.ts (contactSubmissions + adminInvite.invitedBy)
export const productCatalogs = pgTable(
  "product_catalogs",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    displayName: text("display_name").notNull(),
    pdfUrl: text("pdf_url").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    notes: text("notes"),
    uploadedBy: text("uploaded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("product_catalogs_uploadedBy_idx").on(table.uploadedBy),
    index("product_catalogs_isActive_idx").on(table.isActive),
  ],
);
```

### Complete blogCategories Table Definition

```typescript
// Source pattern: src/lib/db/schema.ts (tradeshowReps.slug for unique slug pattern)
export const blogCategories = pgTable(
  "blog_categories",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("blog_categories_slug_idx").on(table.slug)],
);
```

### Complete blogPosts Table Definition

```typescript
// Source pattern: src/lib/db/schema.ts (contactSubmissions for updatedAt, adminInvite for set-null FKs)
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    body: text("body").notNull(),
    excerpt: text("excerpt").notNull(),
    coverImageUrl: text("cover_image_url"),
    categoryId: varchar("category_id").references(() => blogCategories.id, {
      onDelete: "set null",
    }),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("draft").$type<"draft" | "published">(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("blog_posts_slug_idx").on(table.slug),
    index("blog_posts_categoryId_idx").on(table.categoryId),
    index("blog_posts_authorId_idx").on(table.authorId),
    index("blog_posts_status_idx").on(table.status),
  ],
);
```

Note: `categoryId` references `blogCategories.id` which is `varchar` — so `categoryId` is also `varchar`. `authorId` references `user.id` which is `text` — so `authorId` is `text`.

### pdfUploader Route Addition

```typescript
// Source: src/server/uploadthing.ts (extend existing uploadRouter object)
pdfUploader: f({
  pdf: {
    maxFileSize: "32MB",
    maxFileCount: 1,
  },
})
  .middleware(async ({ req }) => {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session?.user || !session.user.approved) {
      throw new Error("Unauthorized");
    }
    return {
      userId: session.user.id,
      uploadedAt: new Date().toISOString(),
    };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("PDF upload complete for user:", metadata.userId);
    return { url: file.ufsUrl };
  }),
```

### netlify.toml (complete file)

```toml
[build]
  command = "drizzle-kit migrate && astro build"
  publish = "dist/"

[build.environment]
  NODE_VERSION = "24"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `drizzle-kit push` in CI | `drizzle-kit migrate` in CI | drizzle-kit v0.20+ | `migrate` is safe for production (no destructive drift detection); `push` can drop columns |
| UploadThing `file.url` | `file.ufsUrl` | UploadThing v7 | `ufsUrl` is the CDN URL — already used in existing `imageUploader` onUploadComplete |
| `@astrojs/node` adapter | `@astrojs/netlify` adapter | already configured | `astro.config.mjs` uses `netlify()` adapter; `@astrojs/node` is still in package.json but not active |

**Deprecated/outdated:**
- `file.url` in UploadThing: The existing `imageUploader` already uses `file.ufsUrl` — use the same for `pdfUploader`.
- `drizzle-kit push` in production builds: Unsafe — use `drizzle-kit migrate` only.

## Open Questions

1. **`session.user.approved` type availability in uploadthing.ts middleware**
   - What we know: The `approved` boolean is on the `user` table; better-auth is configured with a Drizzle adapter
   - What's unclear: Whether better-auth's `getSession` return type automatically includes custom fields like `approved`
   - Recommendation: Check `src/lib/auth.ts` for `user.additionalFields` config. If `approved` is declared there, the type is inferred. If not, cast with `(session.user as any).approved` and add a TODO comment to update auth config.

2. **Netlify `DATABASE_URL` env var configured in dashboard**
   - What we know: `drizzle.config.ts` reads from `.env.local` locally; Netlify needs it as a site env var
   - What's unclear: Whether it is already set in the Netlify dashboard from previous deployment
   - Recommendation: Verification step in success criteria — check Netlify dashboard or confirm via a test deploy.

## Validation Architecture

### Test Framework

No automated test framework is installed in this project. All tests for Phase 1 are manual verification steps against live infrastructure.

| Property | Value |
|----------|-------|
| Framework | None (no jest/vitest/pytest installed) |
| Config file | None |
| Quick run command | Manual (see below) |
| Full suite command | Manual (see below) |

### Phase Requirements to Verification Map

Phase 1 has no v1 requirement IDs — it is pure infrastructure. The success criteria map to manual verification gates:

| Success Criterion | Verification Type | Command / Action |
|-------------------|------------------|------------------|
| `productCatalogs`, `blogCategories`, `blogPosts` tables exist in Neon after migration | Manual DB check | `pnpm db:studio` → inspect tables, OR run `drizzle-kit migrate` locally against dev DB and confirm no errors |
| Admin user can upload PDF via UploadThing without rejection error | Manual upload test | Log in as approved admin, navigate to any admin page with upload button, upload a test PDF <= 32 MB, confirm CDN URL returned |
| Netlify build pipeline runs migration step automatically | Netlify deploy log inspection | Push commit to production branch, inspect Netlify build log for `drizzle-kit migrate` output before `astro build` |

### Wave 0 Gaps

None — no test framework to install. Verification is entirely manual and integration-based. This is appropriate for infrastructure-only work with no application logic to unit test.

## Sources

### Primary (HIGH confidence)
- `src/lib/db/schema.ts` — existing table definitions, all patterns extracted from live code
- `src/server/uploadthing.ts` — existing imageUploader route, basis for pdfUploader pattern
- `drizzle.config.ts` — confirmed schema path and migration output directory
- `package.json` — confirmed installed versions: drizzle-orm 0.45.1, drizzle-kit 0.31.8, uploadthing 7.7.4, drizzle-zod 0.8.3
- `astro.config.mjs` — confirmed `netlify()` adapter already active, output: "server"

### Secondary (MEDIUM confidence)
- [UploadThing File Routes docs](https://docs.uploadthing.com/file-routes) — confirmed `"pdf"` file type key, `maxFileSize` format, v7 middleware and onUploadComplete pattern
- [drizzle-kit migrate docs](https://orm.drizzle.team/docs/drizzle-kit-migrate) — confirmed applies committed SQL files, reads `__drizzle_migrations` table, safe for production
- [Netlify Astro docs](https://docs.netlify.com/build/frameworks/framework-setup-guides/astro/) — confirmed `NODE_VERSION` key in `[build.environment]`, `publish = "dist/"` for Astro, adapter handles Functions automatically

### Tertiary (LOW confidence)
- None — all material findings verified against official sources or live code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages present in package.json, versions confirmed
- Architecture: HIGH — patterns extracted directly from live schema.ts and uploadthing.ts
- Pitfalls: HIGH — FK type mismatch and approved field issues identified from reading live code; build pipeline gaps from official docs
- Netlify config: MEDIUM — `netlify.toml` pattern verified via official Netlify docs; actual DATABASE_URL presence in Netlify dashboard not confirmed

**Research date:** 2026-03-06
**Valid until:** 2026-06-06 (stable stack; drizzle-orm and uploadthing are fast-moving but patterns are version-confirmed)
