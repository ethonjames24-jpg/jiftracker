# SE-03 Capital Head source-pattern correction — 28 October 2026

**Status:** Approved engineering implementation in DRAFT PR #42. SOURCE TEXT VERIFIED; LOCAL REGEX SMOKE 6/6 PASS; full changed-parser native PDF execution and remote 26-test confirmation PENDING. No merge/deploy/release.

## Controlling source evidence

Read live original connected Ministry of Finance FY2026/27 *As Passed* PDF (file ID `1MJGhYxeIaaChVEjFJ01qk2snLbh10aiq`; controlling byte pin `32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6`). Text includes:

- `Head 15000C - Office of the Prime Minister` followed by `Budget 6 - Capital`.
- `Head 19000C - Ministry of Economic Growth and Infrastructure Development` followed by `Budget 6 - Capital`.
- `Head 20000C - Ministry of Finance and the Public Service` followed by `Budget 6 - Capital`.
- Analogous source headings for **13 distinct Capital codes**: `15000C`, `19000C`, `20000C`, `22000C`, `26000C`, `28000C`, `40000C`, `41000C`, `42000C`, `51000C`, `53000C`, `69000C`, `72000C`.

The prior anchored regex `^Head\s+(\d{5})\s*[-–—]` rejected these because it required punctuation after exactly five digits. This explains the **mechanism** of the 143/143 Capital-page Head detection failure in the uploaded old inventory; it does not prove that every one of the 143 pages will be captured by the corrected parser. Web PDF screenshot retrieval failed due the 23 MB source-size limit; the above is from the live source's extracted text, not a screenshot-based verification.

## Scoped parser correction

- `se03_pdf_page_inventory.py` now accepts **only optional source-printed C suffix**: `^Head\s+(\d{5}C?)\s*[-–—]`. The Head value remains exactly `15000C` rather than being silently recoded to `15000`; it is still not used to populate canonical FACTs.
- Adds `head_budget_conflicts` when a single explicit Head/Budget pair is incoherent (e.g., `Head 15000` with `Budget 6`, or `Head 15000C` with `Budget 1`). A conflict makes a page ineligible for provisional cross-page continuation. Multiple distinct Head/Programme codes continue to fail closed.
- Does NOT infer a missing Capital Head from a preceding page; does NOT merge recurrent and capital section identities; does NOT revise numeric economic-column rules or AIA interpretation.
- Original full 716-page inventory receipt remains accepted for **execution**, but its Capital Head coverage is superseded for comparison only when changed-parser native output is received and reviewed.

## Regression tests and native operator gate

Ten tests added to `test_se03_pdf_page_inventory.py` (prior 16 → **26 intended**). Positive: printed capital suffix, thirteen-code representative headings, repeated page headings, review-only adjacent continuation. Negative: invalid suffixes, wrong Head/Budget combinations, multiple capital Heads, cross-version identity mismatch, and forbidden automatic acceptance.

Read-only CI workflow now lists **60 intended synthetic tests** (34 existing source/continuation + 26 page-inventory); completed GitHub Actions run not observed.

New source-pinned runner `run_se03_pdf_capital_head_v2_native.sh` fetches 3 exact GitHub source files from immutable source commit `759568c36bef906fea66feacee603494db43ebd6`, verifies blob identity, runs 26 page-inventory synthetic tests, verifies the already-downloaded exact As Passed PDF SHA/size, and writes a **new non-overwriting local** inventory report and structured Capital Head coverage summary in the user's Downloads review directory. Existing isolated PyMuPDF .venv reused; **does not read private FACT CSV**, create FACT queues or modify a protected workbook.

Expected outputs are **observations**, not an automatic pass of 143 pages: report Budget 6 page count, pages with explicit *C Head, remaining Head-less pages, all source codes seen and any Head/Budget conflicts. Any uncaptured capital page remains a review exception pending source-page examination.

## Remaining gates

Prior exception worklists (112 continuation, 67 economic, 24 programme, 30 vote-level AIA) remain OPEN. Financial/33-field reconstruction of all 2,912 FY26 FACT rows, derived Explorer/Every100 QA, independent CI, SE05/06/07 editorial approvals, SCAN01/SE02 source intake and production release are **NOT ACCEPTED**. No changes to frozen/private/public sheets, active n8n or scanner.


## Native execution acceptance — capital Head detection CLOSED / PASS_REVIEW_ONLY (28 October)

The operator's Mac Terminal output from `jif_se03_pdf_capital_head_v2_20261028.sh` supplies the following independent execution receipt, transcribed to `SE03_CAPITAL_HEAD_V2_NATIVE_ACCEPTANCE_20261028.json`:
- All **3/3** immutable GitHub code blob identities PASS, with source commit `759568c36bef906fea66feacee603494db43ebd6`.
- **26/26** exact remote-code isolated tests PASS.
- Controlling As Passed PDF: **23,172,267 bytes**, SHA-256 `32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6`, identity PASS.
- The corrected parser processed **716/716 physical pages**, produced 716 page inventory records.
- Budget 6 pages: **143**; with explicitly detected `C`-suffixed capital Head: **143/143**; without explicit capital Head: **0**; explicit Head/Budget conflicts: **none detected**. Thirteen unique Capital Head codes match the direct source-text list.
- `SE03_PDF_CAPITAL_HEAD_V2=PASS_REVIEW_ONLY`. Separate local JSON reports were produced, but the assistant has **not independently read those two local files**, only the pasted stdout. Audit status is based on the operator's exact terminal evidence.

**Gate now CLOSED:** capital Head source-heading detection coverage 143/143 in the pinned FY26 PDF. **Other gates remain OPEN:** no private FACT CSV was provided; `FACT_QUEUE_NOT_EXECUTED=TRUE`; no economic-column amount or canonical row mapping accepted; previously unresolved **112 continuation, 67 economic, 24 programme and 30 vote-level AIA** cases are **not cleared**. The 2,912-row/33-field As Passed canonical data re-extraction, DS serving parity and GitHub-hosted PR CI still need separate receipts. Production release remains **NO-GO**. A `fitz` API deprecation warning was nonblocking and does not require a new source-processing rerun.

Next engineering priority: identify a safe local-only, header-exact FY26 FACT export and execute the private review queue against the now-corrected page hierarchy, keeping activity/project/programme/AIA grain distinctions and preserving source authority. Do not write the protected model, publish data or automatically accept any review candidate.
