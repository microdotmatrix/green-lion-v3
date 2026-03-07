---
phase: 4
slug: blog-frontend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no vitest/jest/test directories detected in project |
| **Config file** | None — consistent with all prior phases |
| **Quick run command** | `pnpm dev` then navigate in browser |
| **Full suite command** | Manual browser inspection + `curl -s <url> | grep og:image` |
| **Estimated runtime** | ~2 minutes (manual) |

---

## Sampling Rate

- **After every task commit:** `pnpm build && pnpm preview` — verify route loads without error
- **After every plan wave:** Full manual checklist (all routes, 404 guards, OG tags)
- **Before `/gsd:verify-work`:** Full suite must pass
- **Max feedback latency:** ~120 seconds (build + manual check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | BFNT-04 | manual | `curl -s http://localhost:4321/blog/<slug> \| grep og:image` | ❌ | ⬜ pending |
| 04-01-02 | 01 | 1 | BFNT-01 | manual | Navigate to /blog — verify hero + grid layout | ❌ | ⬜ pending |
| 04-01-03 | 01 | 1 | BFNT-02 | manual | Navigate to /blog/<published-slug> and /blog/<draft-slug> | ❌ | ⬜ pending |
| 04-01-04 | 01 | 1 | BFNT-03 | manual | Navigate to /blog/category/<slug> | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework needed — consistent with all prior phases. All behaviors verified manually via browser + curl.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/blog` shows all published posts (hero + grid) | BFNT-01 | No test framework | Run `pnpm dev`; visit `/blog`; confirm hero shows most recent published post; confirm grid shows remaining |
| `/blog` filter bar shows only categories with published posts | BFNT-01 | No test framework | Confirm pills match only categories that have at least one published post |
| `/blog/[slug]` renders full HTML body for published post | BFNT-02 | No test framework | Visit a published post URL; confirm full content renders; inspect source for prose |
| `/blog/[draft-slug]` returns 404 | BFNT-02 | No test framework | Visit a draft post URL; confirm browser receives 404 status (DevTools Network tab) |
| `/blog/category/[slug]` shows filtered published posts | BFNT-03 | No test framework | Visit a category page; confirm only posts in that category are listed |
| `/blog/category/[missing-slug]` returns 404 | BFNT-03 | No test framework | Visit an invalid category slug; confirm 404 response |
| Post detail page OG meta matches post cover image | BFNT-04 | No test framework | `curl -s http://localhost:4321/blog/<slug> \| grep -E "og:image\|twitter:image"` — confirm coverImageUrl present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
