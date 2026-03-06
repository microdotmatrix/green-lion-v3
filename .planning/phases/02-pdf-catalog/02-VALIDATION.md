---
phase: 2
slug: pdf-catalog
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework detected in project |
| **Config file** | none — all requirements are integration-level (browser + CDN + live DB) |
| **Quick run command** | `pnpm build` |
| **Full suite command** | `pnpm build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build`
- **After every plan wave:** Run `pnpm build`
- **Before `/gsd:verify-work`:** Full manual browser walkthrough of all 5 success criteria
- **Max feedback latency:** ~15 seconds (build) + manual pass at phase gate

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | CAT-01, CAT-02, CAT-03 | build | `pnpm build` | ✅ | ⬜ pending |
| 2-01-02 | 01 | 1 | CAT-02 | build | `pnpm build` | ✅ | ⬜ pending |
| 2-02-01 | 02 | 2 | CAT-01 | manual | n/a | n/a | ⬜ pending |
| 2-02-02 | 02 | 2 | CAT-02, CAT-03 | manual | n/a | n/a | ⬜ pending |
| 2-03-01 | 03 | 3 | CAT-04, CAT-05 | manual | n/a | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test framework scaffolding needed — all catalog requirements involve browser rendering, real file uploads, and live database state. `pnpm build` (TypeScript type checking) is the only meaningful automated validation available for this phase.

- [ ] `pnpm build` passes with zero type errors before any new code is merged

*Existing infrastructure covers all phase requirements (build-time type checking only).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin uploads PDF and sees it in catalog list | CAT-01 | Requires real browser + UploadThing CDN interaction | Log in as admin → Dashboard → Catalogs → Add Version → upload a PDF → confirm row appears in table |
| Only one catalog is active at a time | CAT-02 | Requires live DB state verification | With 2+ catalog versions: set one active → confirm previous becomes inactive; attempt to set active again → confirm idempotent |
| Admin can delete inactive catalog; blocked on active | CAT-03 | Requires browser interaction + live DB | Try deleting active version → confirm error toast; set another active → delete former active → confirm success |
| `/catalog` embeds active PDF in iframe | CAT-04 | Requires browser to render PDF inline | Visit `/catalog` in desktop browser → confirm PDF displays in iframe viewport |
| Download button always visible on catalog page | CAT-05 | Requires browser UI check (mobile + desktop) | Visit `/catalog` on desktop — confirm download button visible; visit on mobile — confirm download button visible and functional |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
