---
phase: 03-blog-admin
plan: "02"
subsystem: ui
tags: [tiptap, react, tanstack-query, uploadthing, shadcn, combobox, editor, astro]

# Dependency graph
requires:
  - phase: 03-blog-admin
    plan: "01"
    provides: REST API endpoints, types.ts, api.ts fetch wrappers for blog posts and categories
  - phase: 01-foundation
    provides: DB schema (blogPosts, blogCategories), better-auth session, uploadthing imageUploader route
provides:
  - Full-page Tiptap blog editor React island (create + edit modes)
  - Formatting toolbar with fixed buttons + BubbleMenu on selection
  - Category combobox with inline creation via Command+Popover
  - TanStack Query hooks for all blog post and category operations
  - Astro shell pages for /admin/blog/new and /admin/blog/[id]/edit
  - Tiptap placeholder CSS in global.css
affects: [03-03]

# Tech tracking
tech-stack:
  added:
    - "@tiptap/react@3.20.1"
    - "@tiptap/pm@3.20.1"
    - "@tiptap/starter-kit@3.20.1"
    - "@tiptap/extension-image@3.20.1"
    - "@tiptap/extension-link@3.20.1"
    - "@tiptap/extension-placeholder@3.20.1"
    - "@tiptap/extension-file-handler@3.20.1"
  patterns:
    - "BubbleMenu imported from @tiptap/react/menus subpath (not @tiptap/react) to avoid bundling FloatingMenu"
    - "immediatelyRender: false on useEditor to prevent SSR hydration mismatch"
    - "BlogEditorInner as separate component inside BlogEditor prevents hook-in-provider ordering issues"
    - "prefilled ref guard prevents overwriting user edits on subsequent data fetches in edit mode"
    - "useEditor content sync via editor.commands.setContent for existing post body on load"
    - "FileHandler onDrop/onPaste: await startUpload(files) then setImage({ src: ufsUrl })"
    - "Category creation via createCategoryMut.mutateAsync returns new category immediately for combobox selection"
    - "toggleStatusMut delegates publishedAt logic to API route (sets on first draft->published transition)"

key-files:
  created:
    - src/components/admin/blog/hooks.ts
    - src/components/admin/blog/category-combobox.tsx
    - src/components/admin/blog/blog-editor-toolbar.tsx
    - src/components/admin/blog/blog-editor.tsx
    - src/pages/admin/blog/new.astro
    - src/pages/admin/blog/[id]/edit.astro
  modified:
    - src/styles/global.css
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "immediatelyRender: false set on useEditor to prevent SSR hydration warning in browser console"
  - "BubbleMenu imported from @tiptap/react/menus — plan specified this subpath import explicitly"
  - "BlogEditorInner pattern avoids hook ordering issues when wrapping with QueryProvider in BlogEditor"
  - "toggleStatusMut only passes status to updateBlogPost — API handles publishedAt internally on first transition"
  - "Combobox shows '+ Create X' both in CommandEmpty (no results) and at bottom of list when search is non-empty"

patterns-established:
  - "Island pattern: outer wrapper provides QueryProvider, inner component holds all state and hooks"
  - "Tiptap FileHandler async upload: await startUpload → check ufsUrl → editor.chain().setImage()"
  - "Combobox create flow: mutateAsync (not mutate) to get return value synchronously for immediate selection"

requirements-completed: [BLOG-01, BLOG-02, BLOG-04, BLOG-05]

# Metrics
duration: 10min
completed: 2026-03-06
---

# Phase 03 Plan 02: Blog Editor Island Summary

**Tiptap blog editor with drag/drop image upload, inline category creation combobox, TanStack Query hooks, and Astro shell pages for /admin/blog/new and /admin/blog/[id]/edit**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-06T19:30:00Z
- **Completed:** 2026-03-06T19:40:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Installed all 7 Tiptap packages (react, pm, starter-kit, image, link, placeholder, file-handler) and created 4 TanStack Query hooks
- Built full-page editor island with Tiptap (SSR-safe via immediatelyRender: false), FileHandler for drag/drop image upload via UploadThing, fixed formatting toolbar, and BubbleMenu on text selection
- Created category combobox with inline creation, two thin Astro shell pages, and Tiptap placeholder CSS

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Tiptap packages and create hooks.ts** - `c964205` (feat)
2. **Task 2: Build category-combobox, blog-editor-toolbar, blog-editor, Astro shells, and Tiptap CSS** - `eda1e8c` (feat)

## Files Created/Modified

- `src/components/admin/blog/hooks.ts` - useBlogPost, useBlogMutations, useBlogCategories, useCategoryMutations with toast notifications
- `src/components/admin/blog/category-combobox.tsx` - Command+Popover combobox with search filtering and '+ Create X' inline creation
- `src/components/admin/blog/blog-editor-toolbar.tsx` - Fixed toolbar (H2, H3, bold, italic, strike, lists, blockquote, undo/redo) + BubbleMenu from @tiptap/react/menus
- `src/components/admin/blog/blog-editor.tsx` - Full-page island with QueryProvider wrapper, Tiptap with FileHandler image upload, all form fields
- `src/pages/admin/blog/new.astro` - Thin Astro shell rendering BlogEditor mode=create
- `src/pages/admin/blog/[id]/edit.astro` - Thin Astro shell reading id from params, rendering BlogEditor mode=edit
- `src/styles/global.css` - Tiptap placeholder CSS rule appended
- `package.json` - 7 Tiptap packages added
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made

- `immediatelyRender: false` set on `useEditor` to prevent SSR hydration mismatch — required for Astro React island hydration
- `BubbleMenu` imported from `@tiptap/react/menus` subpath as specified in the plan verification criteria
- `BlogEditorInner` pattern: wraps all hooks in an inner component, `BlogEditor` only provides `QueryProvider` — avoids hook-in-provider React ordering violations
- `toggleStatusMut` only sends `status` to the API; the PUT route handles `publishedAt` internally on first draft→published transition — avoids type mismatch with `BlogPostFormData` which does not have a `publishedAt` field
- Combobox shows create button in both `CommandEmpty` (when no results match) and as bottom list item when search is non-empty — dual placement ensures discoverability

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] toggleStatusMut type mismatch: BlogPostFormData has no publishedAt field**
- **Found during:** Task 1 (hooks.ts creation)
- **Issue:** Plan's hooks.ts snippet passed `publishedAt` in `toggleStatusMut` via `updateBlogPost(id, { status, publishedAt })`. However `BlogPostFormData` (and the API's `updatePostSchema`) do not include `publishedAt` — the API handles it internally on status transition
- **Fix:** Removed `publishedAt` from `toggleStatusMut` — only passes `{ status }` to `updateBlogPost`
- **Files modified:** src/components/admin/blog/hooks.ts
- **Verification:** Build passes with no TypeScript errors
- **Committed in:** c964205 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type correctness)
**Impact on plan:** Fix required for TypeScript correctness; no functional scope change since the API handles publishedAt internally anyway.

## Issues Encountered

None beyond the type fix documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 7 files created and build verified passing
- `/admin/blog/new` and `/admin/blog/[id]/edit` routes exist in build output
- `blog-editor.CEgX4fOF.js` bundle generated (451 kB includes Tiptap)
- `immediatelyRender: false` confirmed in useEditor call
- BubbleMenu imports from `@tiptap/react/menus` as required
- Ready for plan 03-03 (blog admin list page and table)

---
*Phase: 03-blog-admin*
*Completed: 2026-03-06*

## Self-Check: PASSED

- All 6 new source files confirmed present on disk
- SUMMARY.md confirmed present
- Both task commits confirmed in git log (c964205, eda1e8c)
- All 7 Tiptap packages confirmed in package.json
- Tiptap placeholder CSS confirmed in global.css
- immediatelyRender: false confirmed in blog-editor.tsx line 108
- BubbleMenu confirmed imported from @tiptap/react/menus in blog-editor-toolbar.tsx
