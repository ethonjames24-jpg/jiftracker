# Tracker UI review fixes — 2026-10-27

State: [IN PROGRESS]. Primary route: frontend-ui-eng; supporting debug-error-recovery, browser-test-devtools, code-review-quality.

Scope authorized: month/history synchronization, complete comparisons, guarded April/June copy corrections, historical labels, evidence-backed metadata and method disclosure, compact monthly layout, mobile navigation/table, accessible subscription feedback, amber contrast. Preserve JIF assets and use Humanize UX wording.

Constraints: no financial value/status recalculation; no source/approval hash changes; no Sheets/n8n/subscriber writes; no Explorer logic or release controls; preserve capture/admin routes. Branch + PR authorized; merge/deploy not authorized.

Acceptance: Back/Forward and rapid selection resolve the displayed month; every comparison measure renders; revised source copy supersedes guarded corrections; latest/historical labels are accurate; metadata has explicit evidence; method reflects published receipts; 320/390/768/1440 layouts usable; form focus and errors accessible; subscription tests use mocked responses only; existing tests and build pass.

Evidence baseline: main 7bf7a11; live review reproduced history mismatch and five-item list truncation. May–August receipts document KPI thresholds and source roles; August p2 records publication 2026-09-30. No verified overall aggregation formula or earlier official publication dates located yet; do not invent either.

Verification: 58 tests pass; production build and diff check pass. Local Chromium with synthetic feeds passes five months, Back/Forward, delayed-response race, complete comparisons, 320/390/768/1440 overflow checks, mobile disclosures, form validation/focus and three mocked subscription outcomes; zero page errors and real sends. See jif-budget-tracker-source/docs/ui-review-2026-10-27/VALIDATION.md for screenshots and limits.

Next action: open PR; owner merge/deployment decision remains separate. Rollback: revert this branch's changes; no data reconciliation required.

## Website source/methodology disclosure — October 28, 2026

State: [APPROVED] for implementation verification only. Primary route: incremental-impl. Owner approved the website-only plan; merge and deployment remain separate. Baseline: 570a2174fc42c472c775414265f5fc320e6ede0c. Scope, constraints and evidence: jif-budget-tracker-source/docs/source-methodology-2026-10-28/PLAN.md and VALIDATION.md. Financial history, original source links, public-feed/workflow contracts, receipts, capture and Explorer are preserved. Evidence: 61 tests, production build, diff check, 40 KPI rows and 15 capture markup comparisons, five months/four viewport widths, keyboard/history checks and zero real writes. Next: owner review of PR, then separate merge/deployment approval. Historical later-source adoption/restatement remains a distinct decision.
