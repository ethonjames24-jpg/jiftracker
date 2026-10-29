# Jamaica In Focus — Spending Explorer full-completion gate register

**As of 2026-10-28 | DRAFT PR #42 | RELEASE = NO-GO**

Scope: annual government Spending Explorer, not the separately published monthly Budget Tracker. This document records validated evidence, open acceptance criteria, ownership, and correct sequencing. Counts below are source-specific rather than a speculative percent-complete.

## Source-to-release gates

| Gate | Current finding | Disposition / objective proof required |
| --- | --- | --- |
| SE-01 source monitoring | Five-source baseline accepted, MONITORED_NO_CHANGE recorded; byte identity distinct from completeness | Accepted *historical baseline*, ongoing monitoring. No fictional CHANGED receipt |
| SE-02 acquisition/archive | n8n workflow `I37vL2CouMUNCYxw` REPORT_ONLY, transport disabled, PR #39 open | **OPEN:** immutable native archive receipt and guard re-entry, content scan, protected credentials, retention, retries, concurrency controls |
| SCAN-01 security qualification | ClamAV clean/EICAR/hash/unauth/oversize basic tests previously passed | **OPEN:** real content/limit, signature freshness/reload, concurrency/size & transport contract; no production promotion |
| SE-03 original Approved CSV | Exact source SHA matches; file truncated (nonstandard five-field record, missing footer/newline) | **CLOSED source disposition:** FAILED_CLOSED_SOURCE_INCOMPLETE, cannot use as canonical FY26 extraction |
| SE-03 As Presented CSV | Exact source hash and complete footer; supporting only | **CLOSED source disposition:** SUPPORT_ONLY, never replace As Passed |
| SE-03 As Passed 716-page PDF | 23,172,267 bytes, SHA-256 `32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6`; page inventory 716/716 | **CLOSED identity/page-inventory execution** (review-only) |
| SE-03 Capital Heads | Native exact-code 26/26 tests; Budget 6 pages 143/143 explicit printed `C`-suffix Head; zero detected conflicts | **CLOSED heading-detection gate**, not economic/FACT verification |
| SE-03 economic-line evidence | Earlier direct exact economic evidence 2,679/2,912; historic 112 continuation, 67 ambiguous economic, 24 programme grain, 30 AIA distinct queues | **OPEN:** independently source-anchored, page-specific 33-field FACT audit with separate Capital Project, Programme and Vote AIA methods. Do not equate previously flagged queues with all rows at those grains |
| SE-03 frozen FY26 FACT basis | `FACT_Government_Spending` has 2,912 FY2026/27 rows (2,801 source_row Activity, 81 Programme, 30 Vote; 114 Budget 6). Frozen gross J$1,490,511,399,000; AIA −J$48,730,045,000; net J$1,441,781,354,000 | **Existing governed model / NOT independent As Passed source re-extraction.** Export privately as **current-sheet CSV only**, header exact 33 fields, no writes |
| SE-04 dimension scope integrity | Live `DIM_SubProgramme`: 316 FY26 records (303 Presented + 13 Passed), 32 FY25 additions = 348 all-years. `DIM_Activity`: 766 FY26 (413 Presented + 353 Passed), 74 FY25 additions = 840 all-years | **Source-period discrepancy EXPLAINED**, not missing FY26 dimension records. Historic QA_HIER_005/006/007 still store FAIL from unscoped global totals. **OPEN:** fix/check FY-scoped QA with approved non-destructive versioned correction; no overwriting frozen model or deleting FY25 additions |
| SE-04 linked model | Freeze `GSE-V1|FY2026/27|FACT2912|NET1441781354000|HEAD60|VOTE73|FUNC10|SUBFUNC55|PROG211|SUBPROG316|ACT766|CAT11|QA53`; prior 309 activity links marked resolved, 1,093 FACT foreign keys relinked | Existing model-level approval is historical. **OPEN:** independent exact source/field parity and replayability |
| SE-05 serving tables | `DS_SpendingExplorer` 1,134 rows and `DS_Every100` 11 rows in frozen model; signed AIA separate negative category | **OPEN:** recompute from verified canonical FACT; check category, gross/net, J$100 denominator, no double count, complete source link and machine readable API |
| SE-06 frontend | Frozen contract v1 route `/?view=spending`; source workbook separate from monthly tracker; v1.1 multi-year public-versioned feed previously released but frontend promotion pending | **OPEN:** full Spending Explorer integration, source-proven browser tests, accessibility/mobile/performance checks and monthly Tracker regression |
| SE-07 release | README_Control says DEVELOPMENT, MODEL_APPROVED_RELEASE_NOT_AUTHORIZED; PR #42 is draft/unmerged | **NO-GO:** human approval after independent evidence and CI. Cloudflare PR bot reports a successful **branch-preview** at head `51f785c`; a preview auto-deployment is not a production promotion |
| GitHub-hosted review CI | PR-specific completed run not observed; no checks on inspected head | **OPEN:** require actual completed PR-head build/test receipt and independent peer review, not just local operator tests |

## Order of execution to full completion

1. **Source-evidence baseline:** keep verified PDF and Capital C-suffix parser pinned. Export only the private `FACT_Government_Spending` tab as local CSV and validate exact 33-column contract, FY26 count, page/vote identity, Capital Project vs recurrent Activity, programme vs AIA grammar in local read-only preflight. Never upload this private export to GitHub or public Drive. A preflight status is a **queue-preparation** gate only.
2. **SE-03 definitive financial evidence:** run pinned PDF economic-column matching for every FY26 FACT row and triage the four historic worklists. For each disposition save physical page + printed Head/Budget/Programme/Project/Activity + exact column-value evidence; require separate written vote AIA mechanism. Reconstruct 2,912 source-derived FACT rows independently; compare every required field and amounts to frozen data. No guessed carry-forward across changed sections.
3. **SE-04 scope-safe reconciliation:** retain FY2025/26 additions and v1 freeze. Replace unscoped hierarchy QA checks only via new reviewed FY-scoped control/version, prove 316/766 FY26 and 32/74 FY25 separately; rerun signed AIA and gross/net tie-outs. Recompute serving outputs 1,134/11 after data-source QA.
4. **SE-05 and SE-06 readiness:** validate versioned v1/v1.1 contract, category mappings, source citations, mobile accessibility and existing monthly tracker isolation; collect production-equivalent CI and captured screenshot receipts.
5. **SE-02/SCAN-01 hardening:** secure acquisition/archives, current signature reload, size/concurrency controls, source change only on byte fingerprint evidence. Keep separate from annual pre-release manual baseline unless automatic acquisition qualification proven.
6. **SE-07 release:** owner reviews source reconciliation, warnings/risks and preview QA. Explicit separate authorization required to merge and promote the Spending Explorer; verify production readback, rollback and monitoring.

## Execution evidence and no-go controls

- [Draft PR #42](https://github.com/ethonjames24-jpg/jiftracker/pull/42), no merge or production release.
- [Source completeness and 34-test native receipt](automation/spending-explorer/se-03-extract-normalize/SE03_NATIVE_SOURCE_CLASSIFICATION_RECEIPT_20261028.json)
- [716-page inventory native receipt](automation/spending-explorer/se-03-extract-normalize/SE03_PDF_PAGE_INVENTORY_NATIVE_RECEIPT_20261028.json)
- [Capital Head 143/143 native receipt](automation/spending-explorer/se-03-extract-normalize/SE03_CAPITAL_HEAD_V2_NATIVE_ACCEPTANCE_20261028.json)
- [Capital source evidence](automation/spending-explorer/se-03-extract-normalize/SE03_CAPITAL_HEAD_SUFFIX_SOURCE_EVIDENCE_20261028.md)
- Google Drive: Document 17 SE-03/04 Engineering Handoff; Doc 11 workflow specification; Doc 01 Master Index.
- Current model release state: `MODEL_APPROVED_RELEASE_NOT_AUTHORIZED`; prior v1.1 versioned feed release is not evidence of Spending Explorer frontend production promotion.

No work in this gate register changes frozen, private operational or public Sheets, user subscriptions, official Ministry data, active n8n workflow, scanner runtime or Cloudflare Pages production deployment. **Full completion requires new receipts; do not mark done from documentation alone.**
