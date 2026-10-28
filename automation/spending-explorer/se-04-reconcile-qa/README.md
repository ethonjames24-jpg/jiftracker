# Spending Explorer — SE-03 / SE-04 Parallel Build Kickoff

Status: **ISOLATED DEVELOPMENT, REVIEW ONLY — NOT AN ACCEPTED PIPELINE**

Owner approval, October 28, 2026: change the execution priority so data extraction and reconciliation proceed independently of the outstanding SCAN-01 native release gates. Do not merge, deploy, activate n8n, alter the public workbook, modify the frozen model or change the monthly tracker.

## Existing verified foundations — do not rebuild them

* The private FY2026/27 operational model contains **2,912 As Passed FACT records** and its approved model controls report gross **J$1,490,511,399,000**, signed Appropriations-in-Aid **−J$48,730,045,000**, net **J$1,441,781,354,000**.
* The public Spending Explorer's separate **v1.1 versioned feed is already marked RELEASED_VERSIONED_FEED / AUTHORIZED**, including FY2025/26 and FY2026/27, Every J$100 and annual comparisons. Treat the public feed as immutable until explicit release authorization.
* The frozen Data Model v1 and approved operational v1.1 are separate. Do not change either to make an automated candidate pass.
* SE-01 produced an accepted five-source MONITORED_NO_CHANGE receipt, but scheduling/production monitoring is not certified. SE-02 is inactive REPORT_ONLY in draft PR #39. SE-03–SE-07 automation remains unaccepted.
* The private QA workbook contains older high-severity **FAIL** records for sub-programme/activity counts (QA_HIER_005, 006, 007), alongside subsequent PASS records such as QA_LINK_003 for 766 canonical activity IDs. Do not silently rewrite or treat the older records as resolved until their historical/supersession status is explicitly reconciled.

## What this branch implements now

`se04_reconcile.py` is an **offline, read-only** FY2026/27 private FACT CSV validation prototype with deterministic JSON report and exit status 2 on failure. It checks the pinned As Passed source/year, row count, exact integer JMD, lineage fields, fact ID uniqueness, signed AIA separated from gross, net totals and AIA public category. `test_se04_reconcile.py` contains 14 synthetic-case unit tests. These tests do not establish the correctness of the actual private 2,912-row export, PDF/CSV extraction, schema completeness, public serving rollup, released FY2025/26 comparison or production n8n compatibility.

Run locally with Python 3.10+:

```bash
cd automation/spending-explorer/se-04-reconcile-qa
python3 -m unittest -v test_se04_reconcile.py
python3 se04_reconcile.py /path/to/approved-private-fact-export.csv
```

Do **not** upload a private FACT workbook or raw government source files into a public GitHub repository. Work with approved fixture hashes and non-sensitive synthetic samples. The operator supplies any private export as a local file. No network/Sheet/Drive/Docker calls are implemented.

## Priority and acceptance sequence

1. **SE-03 input adapter (next):** Reuse existing FY2026/27 frozen FACT/staging mapping as a reference. Obtain a controlled source extract and parser-version pin. Reproduce existing hierarchy, line-level evidence and 2,912 records deterministically. Do not fabricate missing source pages, amounts or codes. Reconcile old and new outputs record by record.
2. **SE-04 baseline parity (in progress):** Validate a separately approved export of the frozen FY2026/27 FACT table; independently check 2,912 rows, gross/AIA/net exact totals, 61 authorized-by-law, 2,821 voted-estimate and 30 AIA rows; source and import-batch lineage; identities and foreign keys. Review historical QA_HIER FAIL vs later QA_LINK PASS and record supersession evidence rather than overwriting either set.
3. **SE-04 public contract parity:** Recompute 1,134 FY2026/27 aggregated Explorer rows, 11 Every J$100 categories and exact 100-per-J$100 share, plus independently released FY2025/26 data and the annual comparison. Use the approved public-field whitelist and no actuals/outcomes.
4. **SE-05 / SE-06:** Build candidate mapping exceptions, reviewer dispositions and explicit technical, editorial and release decision records. Do not reuse old human approvals for new source versions.
5. **SE-02 / SCAN-01 in parallel:** Complete remaining scanner native acceptance separately. Scanner remains mandatory for automatic live-source archive acquisition; no attempt to bypass or substitute an unverified scan result.
6. **SE-07:** Perform a shadow release with isolated versioned staging, frontend contract tests and rollback rehearsal. The public active pointer must remain untouched until explicit owner approval.

## Open issues / no-go conditions

* Real end-to-end PDF/CSV extraction, complete frozen fixture, parser regression and full private FACT row comparison have not run.
* A full private workbook export may legitimately contain blank lineage at some grains, depending on approved source treatment. Any validator incompatibility must be reconciled to the pinned source and accounting contract, not bypassed or asserted resolved.
* The older QA count discrepancy is **under review**, not declared fixed.
* Stage 4 changed-signature update handoff, real in-flight scan drain and cold-controller recovery remain unaccepted; operational scanner was last owner-confirmed READY.
* No new workflow, schedule, public promotion, subscriber message, git merge or deployment authorized by this kickoff.

## Ground truth

- [Spending Explorer workflow specification](https://docs.google.com/document/d/1bm9VaPwJI5CFy9iINmZ8u5HxXXWk7_QHKQeZ9b4u30Y/edit)
- [Operational model v1.1](https://docs.google.com/spreadsheets/d/1xaNCRt_vMPxBjB56SuqoUKOyXRpsHnd5lX6t06hsQX0/edit)
- [Frozen Data Model v1](https://docs.google.com/spreadsheets/d/1cgOxWj78M1_SsFHrrd2nkUrxg_BxC4rFbngsspg7sPQ/edit)
- [Public feed v1.1](https://docs.google.com/spreadsheets/d/1SWibIHNJzgkWRPb57YiBvV3QHXKwrRrgXzG0fKdvv80/edit)
- [SCAN-01 remaining native release gates](https://docs.google.com/document/d/1Sf50lBCHDOvqdUJrDG-rukzMFD-MuLTLLKnsErgIKGU/edit)
- [SE-02 draft PR #39](https://github.com/ethonjames24-jpg/jiftracker/pull/39)
