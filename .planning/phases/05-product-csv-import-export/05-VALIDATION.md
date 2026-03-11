---
phase: 5
slug: product-csv-import-export
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (to be installed — no test infrastructure detected in project) |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `pnpm vitest run` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 0 | VITEST-SETUP | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 5-02-01 | 02 | 1 | BOM-STRIP | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 1 | ROW-VALIDATE | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 5-02-03 | 02 | 1 | CATEGORY-MAP | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 5-02-04 | 02 | 1 | TIER-FLATTEN | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 5-03-01 | 03 | 1 | EXPORT-ROW | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 5-04-01 | 04 | 2 | IMPORT-API | manual | — | — | ⬜ pending |
| 5-04-02 | 04 | 2 | EXPORT-API | manual | — | — | ⬜ pending |
| 5-05-01 | 05 | 2 | IMPORT-UI | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — project root, configure for Node.js environment
- [ ] `pnpm add -D vitest` — install vitest test framework
- [ ] `src/lib/csv/__tests__/import.test.ts` — unit test stubs for BOM strip, row validation, category map lookup, tier flatten
- [ ] `src/lib/csv/__tests__/export.test.ts` — unit test stubs for export row mapping (category name, tier columns)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Import: valid CSV → products appear in admin list | END-TO-END | Requires live DB + UI interaction | Upload test CSV, verify products table updates |
| Import: upsert existing SKU → product data updated | UPSERT | Requires live DB state | Upload CSV with existing SKU, verify updated values |
| Import: category auto-create | DB-SIDE-EFFECT | Requires live DB | Import row with new category name, verify category created |
| Import: results dialog shows correct counts + skipped rows | UI | React component render + mutation state | Trigger import, check dialog shows insert/update/skip counts with reasons |
| Export: browser download triggered | BROWSER | Requires browser interaction | Click Export CSV, verify file download |
| Export: CSV re-importable (round-trip) | ROUND-TRIP | Requires live DB | Export, re-import same file, verify no changes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
