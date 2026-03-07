---
phase: 3
slug: blog-admin
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected in project source — manual-only phase |
| **Config file** | none — Wave 0 would install vitest if automated tests are added |
| **Quick run command** | `pnpm test` (after Wave 0 setup, if added) |
| **Full suite command** | `pnpm test` (after Wave 0 setup, if added) |
| **Estimated runtime** | N/A — no test framework exists |

---

## Sampling Rate

- **After every task commit:** Manual browser check + `pnpm build` to verify no TypeScript errors
- **After every plan wave:** Full manual UAT walkthrough against success criteria
- **Before `/gsd:verify-work`:** All manual verifications below must pass
- **Max feedback latency:** Immediate (browser reload)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | BLOG-01 | manual | `pnpm build` (type check only) | ❌ Wave 0 | ⬜ pending |
| 03-01-02 | 01 | 1 | BLOG-03 | manual | `pnpm build` | ❌ Wave 0 | ⬜ pending |
| 03-01-03 | 01 | 1 | BLOG-04 | manual | `pnpm build` | ❌ Wave 0 | ⬜ pending |
| 03-01-04 | 01 | 1 | BLOG-05 | manual | `pnpm build` | ❌ Wave 0 | ⬜ pending |
| 03-02-01 | 02 | 1 | BLOG-01 | manual | `pnpm build` | ❌ Wave 0 | ⬜ pending |
| 03-02-02 | 02 | 2 | BLOG-02 | manual | `pnpm build` | ❌ Wave 0 | ⬜ pending |
| 03-03-01 | 03 | 2 | BLOG-01, BLOG-02 | manual | `pnpm build` | ❌ Wave 0 | ⬜ pending |
| 03-03-02 | 03 | 2 | BLOG-03 | manual | `pnpm build` | ❌ Wave 0 | ⬜ pending |
| 03-03-03 | 03 | 2 | BLOG-04 | manual | `pnpm build` | ❌ Wave 0 | ⬜ pending |
| 03-03-04 | 03 | 2 | BLOG-05 | manual | `pnpm build` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No test framework exists in the project (confirmed by filesystem scan)
- If automated tests are desired, Wave 0 would require:
  - [ ] `pnpm add -D vitest @vitest/ui` — test runner
  - [ ] `vitest.config.ts` — configuration
  - [ ] Mock DB setup for Drizzle queries

*Current project state: no test infrastructure exists — all previous phases verified manually. Wave 0 is optional for Phase 3.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Create blog post with Tiptap editor | BLOG-01 | No test framework; Tiptap is browser-only | Navigate to /admin/blog/new, fill title/body/excerpt/cover, select category, save — verify post appears in table |
| Edit existing post fields including cover image | BLOG-02 | React island with browser-only editor | Open a post via Edit button, change title + body + cover image, save — verify changes persist on re-open |
| Delete post permanently | BLOG-03 | Requires browser confirm dialog | Click Delete in table, confirm dialog, verify post is removed from list |
| Toggle draft/published in table row | BLOG-04 | In-table toggle interaction | Click publish toggle in table row, verify status badge updates, verify post is/isn't returned on public routes |
| Toggle draft/published in editor form | BLOG-04 | Editor form status select | Open edit page, change status selector Draft→Published, save, verify |
| Draft post returns 404 on public slug route | BLOG-04 | Requires server-side route behavior | Create draft post, navigate to /blog/[slug], verify 404 |
| Inline category creation via combobox | BLOG-05 | Browser combobox + mutation flow | Type new category name in combobox, click "+ Create X", verify category is created and selected immediately |
| HTML sanitization prevents XSS | BLOG-01, BLOG-02 | Requires API-level curl test | POST body containing `<script>alert(1)</script>` via curl to /api/admin/blog-posts, verify stored HTML is stripped |
| Slug auto-generated, not editable | BLOG-01 | Form field visibility check | Create post with title "My Test Post", verify slug `my-test-post` in DB, verify no slug field in form |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency acceptable (build check < 30s)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
