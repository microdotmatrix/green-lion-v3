---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (no jest/vitest/pytest installed) |
| **Config file** | None |
| **Quick run command** | Manual (see below) |
| **Full suite command** | Manual (see below) |
| **Estimated runtime** | Manual |

---

## Sampling Rate

- **After every task commit:** Run TypeScript check: `pnpm tsc --noEmit`
- **After every plan wave:** Run full manual verification suite (see below)
- **Before `/gsd:verify-work`:** All manual checks must be confirmed green
- **Max feedback latency:** Manual (no automated timer)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | SC-1 (tables exist) | manual | `pnpm tsc --noEmit` (type check only) | N/A | ⬜ pending |
| 1-01-02 | 01 | 1 | SC-3 (netlify pipeline) | manual | `pnpm tsc --noEmit` | N/A | ⬜ pending |
| 1-02-01 | 02 | 1 | SC-2 (pdf upload) | manual | `pnpm tsc --noEmit` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

*No test framework to install. Phase 1 is pure infrastructure with no application logic to unit test — verification is integration-based against live services.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `productCatalogs`, `blogCategories`, `blogPosts` tables exist in Neon DB | SC-1 | Requires live DB connection; no test framework installed | Run `pnpm db:migrate` against dev DB; then `pnpm db:studio` to inspect tables, OR inspect migration output for success with no errors |
| Admin can upload PDF via UploadThing without rejection | SC-2 | Requires live UploadThing + browser session; no test framework | Log in as approved admin; navigate to admin upload UI; upload a test PDF <= 32 MB; confirm CDN URL returned and no file-type/size rejection |
| Netlify build runs migration step automatically | SC-3 | Requires actual Netlify deployment; CI/CD integration | Push commit to production branch; inspect Netlify build log for `drizzle-kit migrate` output before `astro build`; confirm tables present in production DB |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency acceptable for manual-only phase
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
