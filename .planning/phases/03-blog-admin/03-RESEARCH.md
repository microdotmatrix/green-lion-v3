# Phase 3: Blog Admin - Research

**Researched:** 2026-03-06
**Domain:** Tiptap WYSIWYG editor, React admin form patterns, HTML sanitization, shadcn/ui combobox with inline creation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Editor: @tiptap/react WYSIWYG (NOT markdown) — StarterKit + Image + Link + Placeholder extensions at minimum
- Body stored as HTML in blogPosts.body column
- Editor pages at /admin/blog/new and /admin/blog/[id]/edit (NOT dialogs)
- Inline category creation via combobox with "+ Create X" option
- Cover image uses existing ImageUpload component wired to UploadThing
- Slug auto-generated from title via slugify (not editable by admin)
- TanStack Query for all data fetching/mutations
- Status (Draft/Published) toggle available both in table row AND editor form
- 25 posts per page pagination

### Claude's Discretion
- Exact Tiptap extensions to install (StarterKit, Image, Link, Placeholder are expected; CodeBlock, Table at discretion)
- Sanitization approach for HTML output before storage (DOMPurify or server-side sanitize-html)
- Exact combobox component implementation (Radix Combobox or cmdk — whichever fits the existing shadcn/ui stack)
- Toast wording for create/update/delete/publish success messages
- Delete confirmation dialog copy
- Exact in-table publish toggle visual (toggle switch vs "Publish" / "Unpublish" button)

### Deferred Ideas (OUT OF SCOPE)
- Tiptap AI integrations (e.g., AI writing assist) — future phase when the AI use case is defined
- Standalone blog category admin page (rename, delete) — noted but explicitly out of BLOG-05 scope; add to v2 backlog
- Slug manual override — auto-generation is sufficient for v1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BLOG-01 | Admin can create a blog post with title, HTML body (Tiptap), excerpt, cover image, and category | Tiptap editor + REST POST /api/admin/blog-posts + existing ImageUpload component |
| BLOG-02 | Admin can edit an existing blog post (any field, including replacing the cover image) | REST GET + PUT /api/admin/blog-posts/[id] + editor form prefilled with existing data |
| BLOG-03 | Admin can delete a blog post permanently | REST DELETE /api/admin/blog-posts/[id] + AlertDialog confirmation pattern (already used in catalog) |
| BLOG-04 | Admin can toggle a post between draft and published status without deleting it | PATCH-style PUT on status field, wired both to table row action and editor status select |
| BLOG-05 | Admin can create a new blog category inline while authoring or editing a post | cmdk Command+Popover combobox with onSelect creating category via POST /api/admin/blog-categories |
</phase_requirements>

---

## Summary

Phase 3 adds a blog authoring surface in the admin. The stack is well-defined: Tiptap 3.x for the editor, the existing TanStack Query + Drizzle + Astro API pattern for data, and existing shadcn/ui components for all UI chrome. The schema (`blogPosts`, `blogCategories`) is already defined in Phase 1 — no migration is needed.

The only genuinely new dependencies are the Tiptap packages plus `slugify` for slug generation and `sanitize-html` (or equivalent) for server-side XSS sanitization before storing HTML. Everything else reuses established components and patterns: the `ImageUpload` component for cover image, `AlertDialog` for delete confirmation, `Command` + `Popover` for the inline category combobox (both already installed), and the thin Astro shell → React island pattern from Phase 2.

The key implementation challenge is the Tiptap editor itself — it is client-only (requires `immediatelyRender: false` in SSR mode) and its Image extension handles only rendering, so a custom upload handler using `@tiptap/extension-file-handler` is needed for in-body image drag/drop. The Link extension has no built-in UI — a minimal BubbleMenu toolbar must be implemented. Both are well-documented patterns.

**Primary recommendation:** Install `@tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-file-handler slugify sanitize-html` and follow the existing admin feature pattern: `src/components/admin/blog/` with page, table, hooks, api, types, and a delete dialog file.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tiptap/react | 3.20.x | React bindings + useEditor hook + EditorContent | Official React integration for Tiptap 3 |
| @tiptap/pm | 3.20.x | ProseMirror peer dependencies | Required peer dep for all Tiptap packages |
| @tiptap/starter-kit | 3.20.x | Bundled node/mark/functionality extensions | Bold, italic, headings, lists, code, blockquote, undo/redo in one package |
| @tiptap/extension-image | 3.20.x | Image node rendering in editor | Standard image support; upload is separate |
| @tiptap/extension-link | 3.20.x | Link mark with autolink + linkOnPaste | Autolinks on type/paste; headless — build minimal UI |
| @tiptap/extension-placeholder | 3.20.x | Ghost text when editor is empty | UX polish, requires one CSS rule |
| @tiptap/extension-file-handler | 3.20.x | Handles image drag/drop and paste events | Free/MIT (open-sourced 2025); wires to UploadThing |
| slugify | latest | title → URL slug | Zero-dep, widely used, consistent output |
| sanitize-html | latest | Server-side XSS sanitization of Tiptap HTML output before DB write | Tiptap explicitly recommends server-side sanitization |

### Supporting (already installed — no new install needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cmdk | ^1.1.1 | Command palette primitives | Already installed; used in Command component for category combobox |
| @tanstack/react-query | ^5.x | Data fetching + mutations | All blog post and category API calls |
| sonner | ^2.x | Toast notifications | Success/error feedback on mutations |
| drizzle-orm | ^0.45.x | DB queries | Blog post + category CRUD |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sanitize-html (server) | DOMPurify (client) | DOMPurify requires jsdom on server (heavier); sanitize-html is Node-first — prefer server-side |
| @tiptap/extension-file-handler | Input[type=file] button only | FileHandler gives drag-drop and paste for inline images; user experience is significantly better |
| slugify | Custom regex | Custom slugs miss Unicode transliteration; slugify handles accented characters correctly |

**Installation (new packages only):**
```bash
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-file-handler slugify sanitize-html
pnpm add -D @types/sanitize-html
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/admin/blog/
│   ├── blog-page.tsx          # List page island (wraps QueryClientProvider)
│   ├── blog-table.tsx         # Posts table: Title | Category | Status | Date | Actions
│   ├── blog-editor.tsx        # Full-page editor: Tiptap + form fields
│   ├── blog-editor-toolbar.tsx # Formatting buttons + link dialog above EditorContent
│   ├── category-combobox.tsx  # Command+Popover combobox with "Create X" option
│   ├── delete-blog-dialog.tsx # AlertDialog delete confirmation
│   ├── hooks.ts               # useBlogPosts, useBlogPost, useBlogMutations, useBlogCategories, useCategoryMutations
│   ├── api.ts                 # fetch wrappers for /api/admin/blog-posts and /api/admin/blog-categories
│   └── types.ts               # BlogPost, BlogCategory, BlogPostFormData, etc.
│
├── pages/admin/blog/
│   ├── index.astro            # Thin shell → <BlogPage client:load />
│   ├── new.astro              # Thin shell → <BlogEditor mode="create" client:load />
│   └── [id]/
│       └── edit.astro         # Thin shell → <BlogEditor mode="edit" postId={id} client:load />
│
├── pages/api/admin/
│   ├── blog-posts/
│   │   ├── index.ts           # GET (paginated list), POST (create)
│   │   └── [id].ts            # GET (single), PUT (update + status toggle), DELETE
│   └── blog-categories/
│       ├── index.ts           # GET (all), POST (create with slug)
│       └── [id].ts            # DELETE (future use, not in scope for Phase 3)
```

### Pattern 1: Thin Astro Shell → React Island

Same as Phase 2 catalogs. The Astro page passes server-obtained data (e.g., post ID from URL params) as props to the island. Auth guard is handled by the admin layout, not per-page.

```typescript
// src/pages/admin/blog/[id]/edit.astro
---
import { BlogEditor } from "@/components/admin/blog/blog-editor";
import AdminLayout from "@/layouts/admin.astro";
const { id } = Astro.params;
---
<AdminLayout title="Edit Post">
  <BlogEditor mode="edit" postId={id} client:load />
</AdminLayout>
```

### Pattern 2: Tiptap Editor with SSR Guard

**Critical:** Tiptap is a browser-only library. Set `immediatelyRender: false` to prevent Astro SSR hydration mismatches.

```typescript
// Source: https://tiptap.dev/docs/editor/getting-started/install/react
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

const editor = useEditor({
  extensions: [
    StarterKit,
    Image,
    Link.configure({
      openOnClick: false,     // editor mode — don't navigate on click
      defaultProtocol: 'https',
      autolink: true,
      linkOnPaste: true,
    }),
    Placeholder.configure({ placeholder: 'Start writing your post...' }),
  ],
  content: initialHtml,
  immediatelyRender: false,  // REQUIRED for Astro/SSR
});
```

**Placeholder CSS** (add to `global.css`):
```css
.tiptap p.is-editor-empty:first-child::before {
  color: theme('colors.zinc.500');
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
```

### Pattern 3: Inline Image Upload via FileHandler + UploadThing

The Image extension only renders images; it does not upload. Wire `@tiptap/extension-file-handler` to call UploadThing's `useUploadThing` hook inside the `onDrop`/`onPaste` callbacks.

```typescript
// Source: https://tiptap.dev/docs/editor/extensions/functionality/filehandler
import FileHandler from '@tiptap/extension-file-handler';
import { useUploadThing } from '@/lib/uploadthing';

// Inside component:
const { startUpload } = useUploadThing('imageUploader');

FileHandler.configure({
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  onDrop: async (editor, files, pos) => {
    const uploaded = await startUpload(files);
    if (uploaded?.[0]?.ufsUrl) {
      editor.chain().focus().setImage({ src: uploaded[0].ufsUrl }).run();
    }
  },
  onPaste: async (editor, files) => {
    const uploaded = await startUpload(files);
    if (uploaded?.[0]?.ufsUrl) {
      editor.chain().focus().setImage({ src: uploaded[0].ufsUrl }).run();
    }
  },
});
```

**Note:** `useUploadThing` is already exported from `src/lib/uploadthing.ts` via `generateReactHelpers`. No new setup needed.

### Pattern 4: Inline Category Combobox with "Create X"

Both `cmdk` (the `Command` primitive) and `Popover` are already installed. The `Command` component is already in `src/components/ui/command.tsx`. Build `category-combobox.tsx` using `Command` + `Popover` + a `useMutation` for inline creation:

```typescript
// Pattern: Command + Popover combobox with "Create X"
// Source: https://www.shadcn.io/patterns/combobox-custom-actions-1
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox" ...>
      {selectedCategory?.name ?? "Select category..."}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandInput placeholder="Search categories..." onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>
          {search && (
            <CommandItem onSelect={() => handleCreate(search)}>
              <PlusIcon /> Create "{search}"
            </CommandItem>
          )}
        </CommandEmpty>
        <CommandGroup>
          {categories.map(cat => (
            <CommandItem key={cat.id} onSelect={() => handleSelect(cat)}>
              {cat.name}
            </CommandItem>
          ))}
        </CommandGroup>
        {search && (
          <>
            <CommandSeparator />
            <CommandItem onSelect={() => handleCreate(search)}>
              <PlusIcon /> Create "{search}"
            </CommandItem>
          </>
        )}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

`handleCreate` calls `useMutation` → POST `/api/admin/blog-categories`, then immediately selects the returned category and invalidates the categories query.

### Pattern 5: Server-Side HTML Sanitization

Tiptap does not sanitize on the server. The POST/PUT handlers for `/api/admin/blog-posts` must sanitize `body` before writing to the database.

```typescript
// Source: Tiptap discussion #2845 + sanitize-html docs
import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags,
  'img', 'h1', 'h2', 'h3', 'h4',
];
const allowedAttributes = {
  ...sanitizeHtml.defaults.allowedAttributes,
  img: ['src', 'alt', 'title', 'width', 'height'],
  a: ['href', 'name', 'target', 'rel'],
};

const clean = sanitizeHtml(body, { allowedTags, allowedAttributes });
```

Call this before every `db.insert` or `db.update` on the `body` field.

### Pattern 6: Blog Posts API — Paginated List

```typescript
// GET /api/admin/blog-posts?page=1&limit=25
const page = Number(url.searchParams.get('page') ?? 1);
const limit = 25;
const offset = (page - 1) * limit;

const posts = await db
  .select({ ...blogPosts, categoryName: blogCategories.name })
  .from(blogPosts)
  .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
  .orderBy(desc(blogPosts.createdAt))
  .limit(limit)
  .offset(offset);

const [{ count }] = await db
  .select({ count: sql<number>`count(*)` })
  .from(blogPosts);
```

### Pattern 7: Slug Generation

```typescript
import slugify from 'slugify';

function generateSlug(title: string): string {
  return slugify(title, { lower: true, strict: true, trim: true });
}
```

Call `generateSlug(title)` server-side in the POST handler only (creation). On PUT (edit), do not regenerate the slug. Enforce uniqueness in the DB (already indexed with `.unique()`); catch the Postgres unique constraint and return 409.

### Anti-Patterns to Avoid

- **Not setting `immediatelyRender: false`:** Causes Astro SSR hydration mismatch error. Always set it.
- **Generating slug client-side:** If title changes during editing, slug must not change. Generate once at creation on the server.
- **Using Tiptap's JSON format instead of HTML:** CONTEXT.md locks the decision to HTML. Storing JSON adds complexity Phase 4 doesn't need.
- **Storing unsanitized HTML:** Tiptap does not sanitize input — always pass through `sanitize-html` server-side before DB write.
- **Skipping `@tiptap/pm`:** This is a required peer dependency; omitting it causes runtime errors.
- **Using AlertDialog for the editor page (edit/new):** CONTEXT.md specifies full-page routes, not dialogs.
- **Adding Link extension openOnClick: true in editor:** Admins need to click links to position cursor, not navigate away.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich text editing | Custom contentEditable | @tiptap/react + StarterKit | ProseMirror-backed; handles all cursor, selection, undo/redo edge cases |
| Image drag/drop handling | FileReader + custom drop listener | @tiptap/extension-file-handler | Handles ProseMirror drop position insertion correctly |
| Link detection on paste/type | Regex URL detection | Link extension with autolink: true | Handles edge cases (parens, punctuation) that regex misses |
| Title-to-slug conversion | Custom replace/toLowerCase | slugify package | Handles Unicode, diacritics, special chars correctly |
| HTML XSS sanitization | Tag blocklist regex | sanitize-html | Regex sanitization is famously bypassable |
| Combobox with filter | Custom dropdown | cmdk Command (already installed) | Already in the project; proven accessible, keyboard-navigable |

**Key insight:** Tiptap 3 packages are MIT-licensed (including formerly-Pro FileHandler), actively maintained (last publish: days ago), and React 19 compatible for the core packages. Don't build custom solutions for any of these.

---

## Common Pitfalls

### Pitfall 1: SSR Hydration Error on Editor Mount
**What goes wrong:** Astro server renders the page, Tiptap initializes immediately, browser receives different HTML → hydration mismatch error logged, editor may flash or fail.
**Why it happens:** `useEditor` initializes with content by default on first render, including server render. Tiptap explicitly requires opting out.
**How to avoid:** Always pass `immediatelyRender: false` in the `useEditor` options. Confirmed required for Next.js and Astro SSR.
**Warning signs:** Console error "SSR has been detected, please set `immediatelyRender` explicitly to `false`".

### Pitfall 2: Slug Conflicts on Duplicate Titles
**What goes wrong:** Two posts titled "My Post" both get slug `my-post` — DB unique constraint throws, which surfaces as a 500 if uncaught.
**Why it happens:** `slugify` is deterministic; identical titles always produce identical slugs.
**How to avoid:** In the POST handler, catch the Postgres unique violation (error code `23505`) and return a 400 with a meaningful message. Consider appending a short random suffix (e.g., `my-post-1a2b`) if collision detected.
**Warning signs:** `onError` toast fires after creating a post with an existing title.

### Pitfall 3: HTML Stored Without Sanitization
**What goes wrong:** Admin (or a compromised account) submits a post body with `<script>` or `javascript:` hrefs — stored in DB, later rendered on public blog with `dangerouslySetInnerHTML`.
**Why it happens:** Tiptap only controls its own extensions' output; arbitrary HTML can still be submitted via the API directly.
**How to avoid:** Always call `sanitize-html` in the PUT/POST handler before `db.insert` / `db.update`. Never trust the client.
**Warning signs:** No sanitization call in the API handler body.

### Pitfall 4: Inline Image Upload Fires Before UploadThing Returns URL
**What goes wrong:** `editor.commands.setImage({ src: undefined })` inserts a broken image node.
**Why it happens:** Async upload result not awaited before calling `setImage`.
**How to avoid:** `await startUpload(files)` inside the `onDrop`/`onPaste` callbacks, check `uploaded?.[0]?.ufsUrl` is truthy before inserting. This is the same two-phase upload pattern enforced in Phase 2 catalogs.
**Warning signs:** Broken image `<img src="">` appears in the editor after drag/drop.

### Pitfall 5: Category Combobox Race Condition
**What goes wrong:** Admin types a category name, clicks "Create X", the mutation fires, but the `useQuery` result hasn't refreshed yet — the UI momentarily shows no selection or the wrong category.
**Why it happens:** Optimistic updates not applied; query invalidation is async.
**How to avoid:** After `createCategoryMut.mutate` returns the new category, immediately call `setSelectedCategory(newCategory)` locally before query invalidation. Use TanStack Query's `onSuccess` callback to invalidate `["admin-blog-categories"]`.

### Pitfall 6: Editor "Edit" Page Has Stale Content
**What goes wrong:** Admin edits a post, saves, navigates back to the table, re-opens edit — editor still shows the old content because `useQuery` served from cache.
**Why it happens:** TanStack Query caches the `["blog-post", id]` result.
**How to avoid:** After a successful `PUT` mutation, call `queryClient.invalidateQueries({ queryKey: ["blog-post", id] })` so the next mount of the edit page re-fetches fresh data.

---

## Code Examples

### Editor Component Skeleton (verified patterns)

```typescript
// Source: https://tiptap.dev/docs/editor/getting-started/install/react
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';

function BlogEditor({ initialContent = '' }: { initialContent?: string }) {
  const editor = useEditor({
    extensions: [StarterKit, Image, Link.configure({ openOnClick: false }), Placeholder.configure({ placeholder: 'Write your post...' })],
    content: initialContent,
    immediatelyRender: false,  // SSR guard
  });

  return (
    <div className="rounded-md border min-h-[400px] p-4">
      {editor && (
        <BubbleMenu editor={editor}>
          {/* Bold, Italic, Link toolbar buttons */}
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
```

### Slug Generation (server-side only)

```typescript
import slugify from 'slugify';

// In POST /api/admin/blog-posts handler:
const slug = slugify(parsed.data.title, { lower: true, strict: true, trim: true });
```

### Status Toggle Mutation Pattern

```typescript
// In hooks.ts — reuse same PUT endpoint, only send status field change
const toggleStatusMut = useMutation({
  mutationFn: ({ id, status }: { id: string; status: 'draft' | 'published' }) =>
    updateBlogPost(id, { status, publishedAt: status === 'published' ? new Date().toISOString() : null }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    toast.success('Post status updated');
  },
  onError: (error: Error) => toast.error(error.message),
});
```

### Pagination (25 per page)

```typescript
// In hooks.ts
export function useBlogPosts(page = 1) {
  return useQuery({
    queryKey: ['admin-blog-posts', page],
    queryFn: () => fetchBlogPosts(page),
  });
}

// In blog-page.tsx
const [page, setPage] = useState(1);
const { data } = useBlogPosts(page);
// data.posts, data.total, data.totalPages
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @tiptap-pro/extension-file-handler (paid) | @tiptap/extension-file-handler (MIT) | Mid-2025 | No license/registry auth needed; install from public npm |
| BubbleMenu from '@tiptap/react' | BubbleMenu from '@tiptap/react/menus' | Tiptap 3.x | Different import path — use `/menus` subpath |
| Tiptap 2.x `useEditor()` renders on server | Tiptap 3.x requires `immediatelyRender: false` | Tiptap 2.5+ | Explicit opt-out required for all SSR frameworks |

**Deprecated/outdated:**
- `@uiw/react-md-editor` and `react-markdown` were listed in the original Phase 3 roadmap — CONTEXT.md fully replaces these with Tiptap. Do not install.
- `@tiptap-pro/extension-drag-handle` — uses deprecated `tippyjs-react` with React 19 issues. Not needed for this phase.
- `isomorphic-dompurify` — unnecessary when using `sanitize-html` which is Node-first and already handles server-side safely.

---

## Open Questions

1. **Toolbar scope for the editor**
   - What we know: Link extension provides no UI; BubbleMenu from `@tiptap/react/menus` is the standard approach
   - What's unclear: Exact set of toolbar actions (Bold, Italic, Link at minimum from StarterKit; Heading levels?)
   - Recommendation: Plan for a BubbleMenu with Bold, Italic, Strike, Link actions; a fixed toolbar above the editor with Heading 1/2/3, BulletList, OrderedList, Blockquote, Undo, Redo

2. **Tiptap Starter Kit — Link inclusion**
   - What we know: One source suggested StarterKit includes a Link mark; another listed it as a separate extension. StarterKit v3 changelog needed.
   - What's unclear: Whether `@tiptap/extension-link` conflicts if StarterKit already bundles a Link mark
   - Recommendation: Install `@tiptap/extension-link` separately and configure with `openOnClick: false`; if conflict occurs, exclude from StarterKit via `StarterKit.configure({ link: false })`

3. **publishedAt timestamp handling**
   - What we know: The `blogPosts` schema has a `publishedAt` nullable timestamp
   - What's unclear: Should publishing for the first time set `publishedAt`, and subsequent unpublish/republish leave the original date?
   - Recommendation: SET `publishedAt = NOW()` only when transitioning from draft→published and `publishedAt` is currently null; unpublishing sets `status = 'draft'` but does not clear `publishedAt`

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected in project source (only node_modules test files found) |
| Config file | None — Wave 0 gap |
| Quick run command | `pnpm test` (after Wave 0 setup) |
| Full suite command | `pnpm test` (after Wave 0 setup) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BLOG-01 | POST /api/admin/blog-posts creates post with sanitized HTML, auto-slug | manual-only | n/a — no test framework | ❌ Wave 0 (if added) |
| BLOG-02 | PUT /api/admin/blog-posts/[id] updates fields | manual-only | n/a | ❌ Wave 0 (if added) |
| BLOG-03 | DELETE /api/admin/blog-posts/[id] removes post | manual-only | n/a | ❌ Wave 0 (if added) |
| BLOG-04 | Status toggle changes draft↔published, sets publishedAt | manual-only | n/a | ❌ Wave 0 (if added) |
| BLOG-05 | POST /api/admin/blog-categories creates category with slug | manual-only | n/a | ❌ Wave 0 (if added) |

**Note:** The project has no test infrastructure in source. All validation for Phase 3 is manual (browser + API calls). If the team adds vitest, the API route handlers are pure functions that can be unit-tested without a real DB via mocked Drizzle.

### Wave 0 Gaps
- No test framework installed; no `vitest.config.*`, `jest.config.*`, or test directories found in source
- If the team wants automated tests for Phase 3, Wave 0 would need: `pnpm add -D vitest @vitest/ui msw` and a `vitest.config.ts`

*(Current project state: no test infrastructure exists — all previous phases verified manually)*

---

## Sources

### Primary (HIGH confidence)
- [Tiptap React Install Docs](https://tiptap.dev/docs/editor/getting-started/install/react) — verified: `immediatelyRender: false` requirement, package names, basic useEditor setup
- [Tiptap StarterKit Docs](https://tiptap.dev/docs/editor/extensions/functionality/starterkit) — verified: what's included/excluded (Image and Placeholder NOT in StarterKit)
- [Tiptap Image Extension Docs](https://tiptap.dev/docs/editor/extensions/nodes/image) — verified: Image only renders, `setImage()` API, use FileHandler for uploads
- [Tiptap Link Extension Docs](https://tiptap.dev/docs/editor/extensions/marks/link) — verified: headless (no UI), `openOnClick`, autolink config
- [Tiptap Placeholder Docs](https://tiptap.dev/docs/editor/extensions/functionality/placeholder) — verified: `@tiptap/extension-placeholder` package, CSS requirement
- [Tiptap FileHandler Docs](https://tiptap.dev/docs/editor/extensions/functionality/filehandler) — verified: MIT/free (open-sourced 2025), `onDrop`/`onPaste` API
- [Tiptap BubbleMenu Docs](https://tiptap.dev/docs/editor/extensions/functionality/bubble-menu) — verified: import path `@tiptap/react/menus`
- [Existing codebase schema.ts] — verified: blogPosts and blogCategories tables, insertBlogPostSchema, BlogPost type all defined
- [Existing codebase image-upload.tsx] — verified: accepts `value` + `onChange(url)` props, uses `imageUploader` UploadThing endpoint
- [shadcn combobox custom actions pattern](https://www.shadcn.io/patterns/combobox-custom-actions-1) — verified: Command + Popover pattern with CommandEmpty create action

### Secondary (MEDIUM confidence)
- [Tiptap open-source announcement](https://tiptap.dev/blog/release-notes/were-open-sourcing-more-of-tiptap) — FileHandler was previously Pro, now MIT
- [sanitize-html npm](https://www.npmjs.com/package/sanitize-html) — server-side Node-first HTML sanitization; Tiptap community strongly recommends it
- [Tiptap GitHub discussion #2845](https://github.com/ueberdosis/tiptap/discussions/2845) — community consensus on server-side sanitization requirement

### Tertiary (LOW confidence)
- Whether StarterKit v3 bundles Link mark or not — conflicting sources; resolution in Open Questions #2

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via official Tiptap docs and npm; versions confirmed active
- Architecture: HIGH — patterns derived from existing codebase catalog feature, official Tiptap docs, and verified shadcn patterns
- Pitfalls: HIGH — SSR hydration issue has official documentation; sanitization recommendation is from Tiptap's own community; others derived from established patterns in codebase
- Validation: HIGH — no test infrastructure confirmed by filesystem scan

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (Tiptap 3.x is actively developed; re-verify package names if delayed beyond this date)
