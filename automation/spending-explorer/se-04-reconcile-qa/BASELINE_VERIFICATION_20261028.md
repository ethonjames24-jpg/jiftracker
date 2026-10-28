# JIF Spending Explorer SE-03/SE-04 — 2026-10-28 baseline audit

**Review status:** Read-only workbook reconciliation completed. Automated official source re-extraction, local private CSV export test and production release are NOT completed. Do not change frozen, released or historical QA records to force a PASS.

## Sources
Private operational FY2025/26–2026/27 workbook: 1xaNCRt_vMPxBjB56SuqoUKOyXRpsHnd5lX6t06hsQX0.
Frozen FY2026/27 v1 reference: 1cgOxWj78M1_SsFHrrd2nkUrxg_BxC4rFbngsspg7sPQ.
Released public v1.1 feed: 1SWibIHNJzgkWRPb57YiBvV3QHXKwrRrgXzG0fKdvv80.
Controlled handoff: https://docs.google.com/document/d/1j6K8G7o0_2Rse8eupO17cZOZZwFeEuNwYJOogGTZmlw/edit

## Independently recomputed FACT controls

| Control | FY2025/26 | FY2026/27 |
| --- | ---: | ---: |
| FACT rows | 2,900 | 2,912 |
| Authorized by law / voted / AIA rows | 64 / 2,805 / 31 | 61 / 2,821 / 30 |
| Gross approved JMD | 1,309,182,355,000 | 1,490,511,399,000 |
| Signed AIA JMD | -49,133,377,000 | -48,730,045,000 |
| Net approved JMD | 1,260,048,978,000 | 1,441,781,354,000 |

All 5,812 operational FACT IDs are globally unique. Amounts are integral JMD with no positive AIA or negative non-AIA amounts. All source IDs match their respective As Passed source. Independent comparison between frozen FY2026/27 and operational FY2026/27 verified identical 33-column headers and **zero field changes across all 2,912 FACT records** matched by ID. This demonstrates workbook parity, NOT new source extraction from a PDF or CSV.

## Historical QA year-scope discrepancy

DIM_SubProgramme: 316 unique records with active_from 2026-04-01, plus 32 records active_from 2025-04-01, total 348.
DIM_Activity: 766 unique records with active_from 2026-04-01, plus 74 records active_from 2025-04-01, total 840. There are zero duplicate dimension IDs.
Historical QA_HIER_005, QA_HIER_006, QA_HIER_007 FY2026/27-only count expectations were applied to the expanded all-year tables; subsequent QA_LINK_003 confirms 766 canonical FY2026/27 activities. Do NOT delete or rewrite original FAIL evidence. Implement new versioned year-scoped QA checks.

## Source grain exceptions

FY2026/27 has 81 voted-estimate and 30 AIA rows without activity/sub-programme IDs. FY2025/26 has 31 vote-level AIA rows without source-page or activity/sub-programme IDs. Do not invent missing activity assignments or amounts. Non-AIA source-page absence is a failure.

## Public v1.1 readback

FY2026/27 has 1,134 RELEASED Explorer records and 11 RELEASED Every J$100 records. Both totals reconcile to J$1,441,781,354,000 and signed AIA -J$48,730,045,000.
FY2025/26 has 1,122 and 11 RELEASED records respectively, both reconcile to J$1,260,048,978,000 and signed AIA -J$49,133,377,000.
The annual comparison has 11 released categories and current-year total equal FY2026/27 net. Displayed FY2025/26 per-J$100 values sum to 99.99 due rounding; monetary totals reconcile exactly. Confirm rounding tolerance before literal 100.00 assertions.

## Code checkpoint and open gates

New se04_multiyear.py adds source-year-aware fail-closed CSV checks without altering existing se04_reconcile.py. New test_se04_multiyear.py covers 18 synthetic local cases (PASS on locally tested source); source Git blob hash is 9902f0cafd79697a35c1582dada76597fdce0732, identical to local. The new CLI has NOT run against an operator-approved private CSV export. No private rows are committed. Native SE-03 parser reproduction, complete source file lineage proof, current model foreign-key reconciliation, SE-04 derived-serving regeneration, new source-run exception decisions and SE-05–SE-07 automation are still pending. SCAN-01/SE-02 security completion proceeds independently and remains mandatory for unattended live acquisition. This PR is draft, unmerged and not deployed.
