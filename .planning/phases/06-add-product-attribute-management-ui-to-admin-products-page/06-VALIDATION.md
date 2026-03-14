---
phase: 6
slug: add-product-attribute-management-ui-to-admin-products-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured — no jest, vitest, or test directories exist |
| **Config file** | none |
| **Quick run command** | N/A |
| **Full suite command** | N/A |
| **Estimated runtime** | N/A |

---

## Sampling Rate

- **After every task commit:** Manual spot-check of the changed UI in the browser
- **After every plan wave:** Full manual walkthrough of the Attributes tab flow
- **Before `/gsd:verify-work`:** All manual verification scenarios below must be confirmed
- **Max feedback latency:** Per task (manual check after each implementation step)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| API route — GET/POST/DELETE/PUT | 01 | 1 | Product attributes CRUD | manual | N/A | ✅ after task | ⬜ pending |
| Types & API functions | 01 | 1 | Correct TypeScript types | manual | N/A | ✅ after task | ⬜ pending |
| TanStack Query hooks | 01 | 1 | Cache invalidation works | manual | N/A | ✅ after task | ⬜ pending |
| ProductFormDialog tab layout | 02 | 2 | Tabs render in edit mode | manual | N/A | ✅ after task | ⬜ pending |
| ProductAttributesTab component | 02 | 2 | From Category + product list | manual | N/A | ✅ after task | ⬜ pending |
| AssignAttributeDialog | 02 | 2 | Picker with "also on category" | manual | N/A | ✅ after task | ⬜ pending |
| ConfigureAttributeDialog | 02 | 2 | Edit/delete existing assignment | manual | N/A | ✅ after task | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test framework exists and this is a UI-only phase. No Wave 0 test infrastructure setup is warranted.

*Existing infrastructure covers all phase requirements.* (N/A — manual-only phase)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Attributes tab appears only in edit mode | CONTEXT.md — edit-only tab | UI state; no automated test framework | Open ProductFormDialog in create mode — confirm no Attributes tab. Open in edit mode — confirm tab appears. |
| Assigning attribute persists to `productAttributes` table | Core feature | DB state requires manual verification | Assign an attribute, close dialog, reopen — confirm attribute still listed. |
| Required toggle, additionalCost, supportedOptions save correctly | Core feature | Three separate fields need UI + DB verification | Assign an attribute, configure all three fields, save, reopen configure dialog — confirm values preserved. |
| supportedOptions checklist hidden for non-select types | Pitfall 1 | Conditional UI rendering | Open configure dialog for a `text` or `boolean` attribute — confirm no checklist is shown. |
| "From Category" section is read-only and reflects correct category | CONTEXT.md | Read-only UI state | Navigate to a product in a category with attributes — confirm "From Category" section shows correct attributes. |
| "Also on category" label appears in attribute picker | CONTEXT.md | Label logic in picker | Open AssignAttributeDialog for a product whose category has attributes — confirm overlap attributes are labeled. |
| Removing an attribute clears it from the list | Core feature | Mutation + re-fetch | Click remove on an assigned attribute — confirm it disappears from the list without page reload. |
| Create mode shows only Basic Info tab | CONTEXT.md | Regression check | Open ProductFormDialog in create mode — confirm single-form layout unchanged. |
| additionalCost accepts decimal values | Pitfall 3 | String vs. number type handling | Enter `12.50` as additionalCost, save, reopen — confirm `12.50` is preserved (not `12` or `12.5`). |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < N/A (manual-only phase)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
