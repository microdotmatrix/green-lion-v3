# Pitfalls Research

**Domain:** PDF catalog viewer + blog system added to Astro 5 + Drizzle + Netlify SSR app
**Researched:** 2026-03-05
**Confidence:** HIGH (codebase-specific; findings verified against actual source files)

---

## Critical Pitfalls

### Pitfall 1: UploadThing PDF contentDisposition Defaults to "inline" — Breaks Mobile PDF Viewing

**What goes wrong:**
UploadThing v7 configures the `contentDisposition` per route. The default is `"inline"`, which instructs the browser to render the PDF in-tab rather than download it. On all mobile browsers (iOS Safari, Android Chrome), inline PDF rendering is either broken or shows only a static first-page image with no scroll or interaction. The catalog viewer built with `<iframe>` or `<embed>` will silently appear broken on mobile — visitors see a blank box or a non-interactive image.

**Why it happens:**
The existing `imageUploader` route in `src/server/uploadthing.ts` does not set `contentDisposition` because images always display inline without issue. Developers copy that pattern for the new `pdfUploader` route without knowing that PDFs have fundamentally different browser support for inline rendering.

**How to avoid:**
When adding the `pdfUploader` route, explicitly set `contentDisposition: "inline"` in the route config AND implement a fallback for mobile: detect `navigator.pdfViewerEnabled` on the client and show a "Download PDF" link when inline display is not supported. Do not rely on `<iframe src="...pdf">` alone.

```typescript
// src/server/uploadthing.ts — new pdfUploader route
pdfUploader: f({
  pdf: {
    maxFileSize: "32MB",  // catalogs can be large — 4MB default is too small
    maxFileCount: 1,
    contentDisposition: "inline",
  },
})
```

**Warning signs:**
- Test on an actual iOS device before calling PDF viewer "done" — desktop Chrome and Firefox look fine while mobile is broken.
- If QA only tests on desktop, this ships broken to mobile users.

**Phase to address:** PDF Catalog feature (Phase 1 or whichever phase adds the PDF upload route and viewer page)

---

### Pitfall 2: UploadThing PDF Default maxFileSize is 4MB — Catalogs Will Silently Fail to Upload

**What goes wrong:**
UploadThing's `pdf` file type defaults to a 4MB maximum file size. Product catalogs are commonly 10–40MB multi-page PDFs with embedded images. The upload will be rejected client-side with an error that is easy to miss if the UI does not surface it clearly. The admin will think the upload succeeded, navigate away, and the catalog field will remain null.

**Why it happens:**
The existing `imageUploader` in `src/server/uploadthing.ts` uses `maxFileSize: "4MB"` for images, which is appropriate. Copy-pasting this limit to a PDF route without checking catalog file sizes causes silent failures.

**How to avoid:**
Set `maxFileSize: "32MB"` (or higher depending on actual catalog file sizes) when defining the `pdfUploader` route. Additionally, `UPLOADTHING_TOKEN` is already documented in `CONCERNS.md` as missing from the Astro env schema — add it to `astro.config.mjs` alongside the new route so a missing token produces a build-time error rather than a silent runtime failure.

**Warning signs:**
- Admin reports "upload spins then nothing happens."
- Check UploadThing dashboard — the upload never appears in the file list.
- The `pdfUrl` column in the new `catalogVersions` table remains null after a supposed successful upload.

**Phase to address:** PDF Catalog feature — must be addressed during initial route setup, not discovered in QA.

---

### Pitfall 3: "Active Catalog" Toggle Without a Database-Level Mutual Exclusivity Guarantee

**What goes wrong:**
The requirement specifies multiple catalog versions with exactly one marked as `isActive = true`. If the "set active" API route is implemented as a two-step `UPDATE ... SET isActive = false WHERE true` followed by `UPDATE ... SET isActive = true WHERE id = $id`, two concurrent admin requests can both read "no active" state and set two rows active simultaneously. The Netlify Functions environment makes this realistic — Netlify spins up multiple concurrent function invocations.

**Why it happens:**
This mirrors the existing `generateQuoteNumber()` race condition already documented in `CONCERNS.md` (`src/pages/api/quotes/index.ts` lines 24–29). Developers treat the "only one active" invariant as an application concern, not a database constraint.

**How to avoid:**
Implement "set active" as a single atomic transaction or use a partial unique index. In PostgreSQL via Drizzle:

```sql
-- Partial unique index: at most one row can have isActive = true
CREATE UNIQUE INDEX one_active_catalog ON catalog_versions (is_active)
WHERE is_active = true;
```

Or use a Drizzle transaction:
```typescript
await db.transaction(async (tx) => {
  await tx.update(catalogVersions).set({ isActive: false });
  await tx.update(catalogVersions).set({ isActive: true }).where(eq(catalogVersions.id, id));
});
```

The transaction approach is simpler and matches Drizzle patterns. The partial unique index is stronger (enforced at the DB level) but requires a custom migration.

**Warning signs:**
- Admin panel shows two catalog versions both marked "Active."
- The public `/catalog` route renders the wrong PDF or alternates between two.

**Phase to address:** PDF Catalog feature — schema design phase, before the first migration is pushed.

---

### Pitfall 4: Blog Slug Collision on Duplicate or Near-Duplicate Titles

**What goes wrong:**
Blog post slugs derived from titles ("My First Post" → `my-first-post`) will collide if two posts have the same title, or if titles that differ only in punctuation/capitalization produce the same slug. A second `INSERT` with a duplicate slug value will throw a PostgreSQL unique constraint violation and return a 500 from the API route with no user-friendly message. The admin sees a generic error and does not know why the post failed to save.

**Why it happens:**
The `PROJECT.md` spec states "slugs should be URL-safe and derived from the post title at creation time." The existing codebase has no slug collision handling — the `tradeshowReps.slug` column has a `.unique()` constraint but the insert endpoint for reps does not appear to handle collision either. The pattern propagates.

**How to avoid:**
1. Check for slug uniqueness before inserting. If `my-first-post` exists, try `my-first-post-2`, `my-first-post-3`, etc.
2. Return a 409 with `{ error: "A post with this slug already exists. Edit the slug manually." }` if auto-increment is not desired.
3. Consider allowing the admin to override the generated slug at creation time, which also enables SEO-friendly customization.

**Warning signs:**
- API route returns 500 (not 409) when a slug collision occurs — raw DB error is leaking.
- Admin creates "Q4 Product Catalog" and "Q4 Product Catalog!" — the second fails silently.

**Phase to address:** Blog feature — API route for POST /api/admin/blog/posts.

---

### Pitfall 5: Missing `approved` Check on New Admin API Routes Propagates Existing Auth Bug

**What goes wrong:**
`CONCERNS.md` documents that 25 of 31 existing admin API routes only check `!locals.user || !locals.session` but not `locals.user.approved`. New routes for `/api/admin/blog/` and `/api/admin/catalog/` will almost certainly be scaffolded from existing routes and inherit the same missing check. A user who authenticates (passes the session check) but has not been approved by an admin will be able to create, edit, and delete blog posts and catalog versions directly via the API.

**Why it happens:**
Copy-paste from existing route templates. The correct pattern is present only in invite-related routes, which are not the natural template for new CRUD routes.

**How to avoid:**
Every new admin API route must include:
```typescript
if (!locals.user || !locals.session) return 401;
if (!locals.user.approved) return 403;  // this line is the one that's missing everywhere
```

Add a comment block to the new routes flagging this explicitly. Better long-term fix (from CONCERNS.md): centralize the approved check in Astro middleware.

**Warning signs:**
- Grep `src/pages/api/admin/` for `locals.user.approved` — if new blog/catalog routes are absent from results, the check is missing.
- An unapproved test account can reach `/api/admin/blog/posts` directly.

**Phase to address:** Both Blog and Catalog features — first line of every new API route handler.

---

### Pitfall 6: Markdown Body Stored as Raw Text — XSS on Render if HTML Is Allowed Through

**What goes wrong:**
If the blog post editor accepts raw Markdown and the render pipeline converts it to HTML using a library that allows embedded HTML by default (e.g., `marked` without `sanitize: true`, or `remark` without `rehype-sanitize`), an admin-authored post containing `<script>` or `<img onerror="...">` in the Markdown body will execute JavaScript in visitors' browsers.

**Why it happens:**
Most Markdown parsers allow raw HTML passthrough by default for flexibility. This is standard behavior but dangerous when the Markdown source is stored in a database and rendered server-side. The existing codebase already has a partial XSS issue documented in `CONCERNS.md` (contact form email templates). The same mindset ("it's admin-authored, so it's trusted") leads to skipping sanitization on blog output.

**How to avoid:**
Use `rehype-sanitize` in the Markdown render pipeline to strip disallowed HTML. This is the standard pattern for `unified`/`remark` stacks:
```typescript
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

const html = await unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSanitize)  // strips script, event handlers, etc.
  .use(rehypeStringify)
  .process(markdownBody);
```

Even for admin-authored content: a compromised admin account or a mistake in pasted content should not result in XSS for all visitors.

**Warning signs:**
- Blog post renders a test `<script>alert(1)</script>` in the body without escaping.
- The Markdown library is configured without explicit sanitization.

**Phase to address:** Blog feature — Markdown render utility, before the first public blog route is live.

---

### Pitfall 7: PDF Served from UploadThing CDN URL — X-Frame-Options May Block Embedding

**What goes wrong:**
UploadThing stores files on its CDN (currently `utfs.io` / `ufs.io`). When the catalog page uses `<iframe src="[uploadthing-url]">` to embed the PDF, the UploadThing CDN may send `X-Frame-Options: SAMEORIGIN` or a restrictive `Content-Security-Policy: frame-ancestors` header. The browser will refuse to render the PDF in the iframe and show a blank frame instead — no error is visible to the user.

**Why it happens:**
The existing terms and conditions PDF embed (`termsConditions.pdfUrl`) works today, which creates a false assumption that the CDN URL is always embeddable. CDN header policies can change, or the behavior may differ between file types or upload regions. This is not documented in UploadThing's public API surface.

**How to avoid:**
1. Verify the current UploadThing CDN headers by fetching a real PDF URL and inspecting `X-Frame-Options` and `Content-Security-Policy` response headers before building the iframe embed.
2. Build the catalog viewer with a fallback: if the iframe fails to load, show a "View PDF" button that opens the URL in a new tab.
3. Consider proxying the PDF through an Astro API route (`/api/catalog/[id]/pdf`) that fetches the UploadThing URL server-side and streams it with controlled headers. This also prevents direct URL exposure.

**Warning signs:**
- Browser DevTools console shows "Refused to display [url] in a frame because it set 'X-Frame-Options' to 'sameorigin'."
- The catalog page shows a blank white box.

**Phase to address:** PDF Catalog feature — catalog public page implementation.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copying existing API route auth pattern (session-only check) | Fast scaffolding of new routes | Unapproved users can reach new blog/catalog APIs directly | Never — always add the `approved` check |
| Storing blog body as raw Markdown string without render-time sanitization | No extra dependencies | XSS vector if HTML passthrough is enabled in Markdown parser | Never for public-facing content |
| Deriving slug from title without collision handling | Simple implementation | 500 errors on duplicate titles; confusing admin UX | Never — at minimum return 409 with descriptive error |
| Setting active catalog with two sequential UPDATEs | Simple query code | Race condition produces two active catalogs simultaneously | Never — use a transaction |
| Using UploadThing default maxFileSize (4MB) for PDF route | Copy existing image route | Upload failures for real catalog files without clear error | Never for PDFs — always set explicitly |
| Module-level cache in new admin API routes (e.g., for blog stats) | Reduces DB queries | Unreliable in Netlify Functions serverless; may persist stale data across users | Never in this deployment — existing stats.ts already documents this bug |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| UploadThing PDF route | Forgetting to add `UPLOADTHING_TOKEN` to Astro env schema (already missing per CONCERNS.md) | Add `envField.string({ context: "server", access: "secret" })` for `UPLOADTHING_TOKEN` in `astro.config.mjs` alongside the new PDF route |
| UploadThing PDF route | Assuming `contentDisposition: "inline"` works across all browsers | Implement a mobile fallback download link using `navigator.pdfViewerEnabled` |
| UploadThing CDN embed | Embedding `utfs.io` URLs directly in `<iframe>` without verifying CSP headers | Proxy through an Astro API route or verify headers before shipping |
| Drizzle migration | Running `db:generate` without `db:push` / `db:migrate` in production (Netlify deploy) | Ensure migration runs in Netlify build command or CI pipeline — schema changes are not auto-applied |
| Netlify Functions | Using module-level variables to cache blog/catalog data (copying stats.ts pattern) | Treat every function invocation as stateless; use HTTP cache headers instead |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No pagination on `/api/admin/blog/posts` — fetching all posts | Admin blog list lags as post count grows | Add `limit`/`offset` pagination from day one, with `Math.min(limit, 100)` cap (same bug exists in products endpoint per CONCERNS.md) | ~200+ posts |
| Rendering Markdown to HTML inside each API response (per request) | Blog list endpoint becomes slow; repeated CPU work | Cache rendered HTML in the `posts` table as a computed column, or render once at save time and store the HTML | ~50+ concurrent readers |
| N+1 queries in blog list (fetching tags/categories per-post in a loop) | Slow blog list page; DB connection pressure on Neon serverless HTTP driver | Use a single JOIN or Drizzle relational query that fetches all post metadata in one query | ~50+ posts |
| PDF file served via redirect through Netlify Function (proxy pattern) on each page load | Catalog page load time increases; function invocation cost | Set long `Cache-Control` headers on the proxied response; or use the CDN URL directly if X-Frame-Options allows it | Immediate on each visit |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| New blog/catalog API routes missing `locals.user.approved` check | Authenticated-but-unapproved users can create/edit/delete blog posts and catalog versions | Add `if (!locals.user.approved) return 403` to every new `/api/admin/` route — do not copy the incomplete pattern from existing product/category routes |
| Rendering Markdown body with raw HTML passthrough enabled | Admin XSS — a compromised account or pasted malicious Markdown executes JS for all visitors | Use `rehype-sanitize` in the Markdown render pipeline; never render unsanitized HTML from a DB-stored string |
| Blog draft posts accessible via direct URL if SSR check is only in the list query | Unpublished posts visible to anyone with a guessed slug | Explicitly check `status = 'published'` (and optionally `publishedAt <= now()`) in the `/blog/[slug]` page Astro frontmatter query, not just in the list API |
| No rate limiting on the public `/blog` and `/catalog` routes | Scraping or DoS of Neon serverless HTTP connections | Use Netlify's built-in rate limiting feature or Netlify Edge Middleware to add IP-based request throttling |
| UploadThing PDF URL stored without validation | Arbitrary URLs from a forged request stored as `pdfUrl` in the catalog table | Validate that the stored URL matches the expected UploadThing domain pattern (`utfs.io` or `ufs.io`) before saving |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| PDF viewer with no fallback for mobile browsers | Mobile visitors see a blank white box where the catalog should be; no indication of what went wrong | Detect `navigator.pdfViewerEnabled` and show a styled "Download Catalog (PDF)" CTA instead of a broken iframe |
| No visual distinction between draft and published posts in admin list | Admin accidentally publishes a draft or cannot tell which posts are live | Show a `Draft` / `Published` badge with distinct colors on each row; make the status toggle explicit and confirming |
| Slug shown only at creation time — no way to edit it later | Admin creates a post, the slug is ugly or wrong, but there is no field to fix it | Allow slug editing on the edit post form with a warning: "Changing the slug will break existing links to this post" |
| PDF catalog upload with no progress indicator | Admin uploads a 20MB catalog, sees nothing for 15–30 seconds, thinks it failed and clicks again | Use `useUploadThing` hook's `onUploadProgress` callback to show a progress bar during PDF upload |
| No confirmation before marking a new catalog version as "active" | Admin clicks "Set Active" accidentally while editing a draft version; live site now shows wrong PDF | Add a confirmation dialog: "This will replace the current active catalog on the public site. Continue?" |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **PDF upload route:** Verify `UPLOADTHING_TOKEN` is in the Astro env schema (`astro.config.mjs`) — currently missing per CONCERNS.md; will cause silent production failure
- [ ] **Catalog active flag:** Verify the "set active" mutation uses a transaction or partial unique index — a two-UPDATE pattern looks correct in dev but races in production
- [ ] **PDF embed viewer:** Test on a real iOS device or Android — desktop testing is insufficient; mobile PDF iframe rendering is broken in all mobile browsers
- [ ] **Blog draft posts:** Verify the `/blog/[slug]` Astro page explicitly filters `status = 'published'` in its own query — a draft leak via direct URL is common when the filter only exists in the list endpoint
- [ ] **New admin API routes:** Grep for `locals.user.approved` in every new file under `src/pages/api/admin/blog/` and `src/pages/api/admin/catalog/` — missing approved check is the most common auth bug in this codebase
- [ ] **Slug collision handling:** Verify the POST `/api/admin/blog/posts` endpoint returns a 409 (not 500) on duplicate slug — a raw DB constraint error is not user-facing feedback
- [ ] **Markdown render pipeline:** Confirm `rehype-sanitize` (or equivalent) is in the render chain — a test of `<script>alert(1)</script>` in post body should be escaped on the public page
- [ ] **UploadThing CDN embed:** Check `X-Frame-Options` on an actual uploaded PDF URL from UploadThing — verify the header is not `SAMEORIGIN` before relying on `<iframe>` embedding

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Two active catalog versions in DB | LOW | Run a one-off SQL `UPDATE catalog_versions SET is_active = false WHERE id != '[correct-id]'`; add the partial unique index in a new migration to prevent recurrence |
| Duplicate blog slug in production | LOW | Run `UPDATE blog_posts SET slug = slug || '-2' WHERE id = '[duplicate-id]'`; add slug collision logic to the API route |
| Markdown XSS discovered in published post | HIGH | Immediately unpublish affected post (`status = 'draft'`); sanitize the stored body content; add `rehype-sanitize` to render pipeline and re-render all posts |
| Mobile PDF viewer broken post-launch | MEDIUM | Add a client-side fallback download link (1–2 hours of work); no data migration needed |
| UPLOADTHING_TOKEN missing in production | MEDIUM | Add the env var in Netlify dashboard under Site Settings > Environment Variables; redeploy; all previous uploads are unaffected as they are stored on UploadThing CDN |
| Missing `approved` check on blog API found post-launch | MEDIUM | Add `if (!locals.user.approved) return 403` to all affected routes; redeploy; audit DB for any posts created by unapproved accounts |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| UploadThing PDF default 4MB limit | PDF Catalog — upload route setup | Upload a 25MB test PDF in dev; confirm it succeeds |
| PDF contentDisposition mobile compatibility | PDF Catalog — catalog public page | Test catalog page on iOS Safari; iframe renders or fallback link shows |
| Active catalog race condition | PDF Catalog — schema + API design | Attempt two simultaneous "set active" requests; only one row has `is_active = true` afterwards |
| Blog slug collision | Blog — POST /api/admin/blog/posts | Create two posts with identical titles; second returns 409, not 500 |
| Missing approved check on new routes | Both features — first route scaffolded | Unapproved test account receives 403 on all new admin API endpoints |
| Markdown XSS via raw HTML passthrough | Blog — Markdown render utility | Post body containing `<script>alert(1)</script>` renders escaped on public page |
| Draft post accessible via direct URL | Blog — /blog/[slug] page | Set a post to `draft` status; direct URL access returns 404 or redirects |
| UploadThing CDN X-Frame-Options blocking iframe | PDF Catalog — catalog public page | DevTools shows no "Refused to display in frame" console error on live URL |

---

## Sources

- Codebase: `src/server/uploadthing.ts` — current upload router (image-only, no PDF)
- Codebase: `src/lib/db/schema.ts` — existing `termsConditions` table (PDF URL pattern to follow/extend)
- Codebase: `.planning/codebase/CONCERNS.md` — documented existing auth bugs, race conditions, env var gaps
- UploadThing docs: https://docs.uploadthing.com/file-routes (PDF file type config, contentDisposition options, 4MB default)
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/pdfViewerEnabled (mobile PDF inline support)
- caniuse.com: https://caniuse.com/pdf-viewer (built-in PDF viewer browser support — mobile browsers largely unsupported)
- Netlify support: https://answers.netlify.com/t/cors-and-iframe/134453 (CORS and iframe header issues on Netlify)
- Drizzle ORM: https://orm.drizzle.team/docs/indexes-constraints (unique constraint patterns)
- OWASP: https://top10proactive.owasp.org/archive/2018/c4-encode-escape-data (output escaping for stored Markdown/HTML)

---
*Pitfalls research for: PDF catalog viewer + blog system on Astro 5 + Drizzle + Netlify SSR*
*Researched: 2026-03-05*
