---
phase: 5
slug: product-csv-import-export
status: deferred
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-10
deferred: 2026-03-10
---

# Phase 5 — Validation Strategy

> **Deferred:** No test infrastructure exists in this project. This phase adds additive, low-risk CRUD functionality (CSV upload/download). Vitest setup and unit tests for csv utility functions are deferred to a dedicated testing phase. Full behavioral verification is covered by the human checkpoint in Plan 02 Task 3.

---

## Deferral Rationale

- No `vitest.config.ts`, no `vitest` dependency, no test files exist anywhere in the project
- Installing a test framework as a side-effect of a feature phase adds unrelated scope
- CSV import/export is additive and low-risk: it creates new endpoints and a new component with no modification of existing logic
- The human checkpoint (Plan 02 Task 3) covers end-to-end behavioral verification including: BOM handling, category auto-create, tier replace, skipped-row reporting, and round-trip safety
- `pnpm tsc --noEmit` and `pnpm build` provide compile-time safety for each task

---

## Verification Coverage (This Phase)

| Behavior | How Verified |
|----------|-------------|
| TypeScript correctness | `pnpm tsc --noEmit` after each task |
| Astro endpoint resolution | `pnpm build` after each task |
| Auth guard, BOM strip, category auto-create, tier replace, round-trip | Plan 02 Task 3 human checkpoint |
| Import dialog UI states (idle/loading/results) | Plan 02 Task 3 human checkpoint |
| Export browser download | Plan 02 Task 3 human checkpoint |

---

## Future: Vitest Setup (When Test Infrastructure Is Added)

When a dedicated testing phase is run, the following unit tests should be created:

- `src/lib/csv/__tests__/import.test.ts` — BOM strip, row validation, category map lookup, tier flatten
- `src/lib/csv/__tests__/export.test.ts` — export row mapping (category name, tier columns), normalizePrice edge cases
- `vitest.config.ts` — Node.js environment, no DOM needed for pure utility tests
