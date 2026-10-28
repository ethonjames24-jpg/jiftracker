# SE-03 — As Passed PDF page evidence inventory, 28 October 2026

**Owner decision:** implementation and documentation of *review-only*, source-pinned PDF page evidence inventory are approved in existing draft PR #42. No merge, production, source archive changes, Google Sheet writes, AI inference, fact reconstruction, release/pointer change, or workflow activation is authorized.

## Source and controls

- **Controlling FY2026/27 As Passed PDF:** 23,172,267 bytes, SHA-256 `32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6`, 716 physical pages.
- Existing `se03_pdf_economic_evidence.py` is preserved unchanged and independently checks source-page economic-column *candidates*; it does not certify source-derived FACTs.
- New `se03_pdf_page_inventory.py` parses anchored, explicit on-page headings using PyMuPDF lines: Head, Budget, Function, SubFunction, Programme, Sub Programme, Activity and Project. Outputs 716 page records with raw **codes only** (not source text). It never populates absent head, budget, or programme identity from an earlier page.
- A page with several explicit distinct section identifiers marks a boundary; it cannot claim unique section identity.
- Optional `--private-fact-csv` reads a private local export only; does not upload, publish, or commit it. It classifies each FY26 row as on-page-heading (defer to existing classifier), reviewable same-section continuation candidate, unresolved ambiguous/missing context, programme/other grain, or vote-level AIA. The queue is **not independent source extraction**, does not assign amounts or change any FACT row, and must not be equated to the previous 112/67/24/30 categories without native reconciliation.
- It reuses the original classifier's economic-code and source amount/column heuristics solely to count candidate columns. This is intentionally not a line-value reconstruction.

## Implementation and synthetic validation

Files: `se03_pdf_page_inventory.py`, `test_se03_pdf_page_inventory.py`, `run_se03_pdf_page_inventory_native.sh`. Original `se03_pdf_continuation_review.py` is unchanged.

- 16 page-inventory synthetic tests run locally: **16/16 PASS**, Python compilation PASS. Cases include explicit page heading extraction, no implicit parent context, competing section headings, duplicate running headings, project vs activity, adjacent continuation only as a candidate, section mismatch, ambiguous/missing source information, malformed amount, source SHA rejection. These tests have **not** been run yet against the full 716-page PDF or exact remote code on the operator's Mac.
- New CI scope includes these 16 cases with the earlier 34 tests (total 50 synthetic tests) but **no completed GitHub-hosted CI run** has been observed.
- The native runner fetches three files from immutable code commit `e1364db149bc0ff3d6d28b44c6e2aff70be2feaa`, verifies their exact Git blob SHA-1 fingerprints, runs the 16 tests, uses the existing local As Passed PDF (or downloads a public PDF to an isolated Downloads path), and rejects incorrect PDF bytes/length before extracting page headings.
- Local review output directory: `~/Downloads/JIF_SE03_PDF_Page_Review_20261028`. Report: `se03_pdf_page_inventory_review_only.json`. Launcher uses `umask 077` to keep review artifacts private to the operator account.
- Runtime requires Python 3.10+ and PyMuPDF. If PyMuPDF is missing, the runner stops instead of altering the operator's Python environment.

Run (after obtaining the approved .sh launcher in Downloads):

```bash
bash "$HOME/Downloads/jif_se03_pdf_page_inventory_native_20261028.sh"
```

With the existing private FACT CSV, **only if its local path is known**, run:

```bash
JIF_SE03_FACT_CSV="$HOME/Downloads/YOUR_EXISTING_PRIVATE_FACT_EXPORT.csv" \
  bash "$HOME/Downloads/jif_se03_pdf_page_inventory_native_20261028.sh"
```

Do not fabricate the private CSV path, make a public copy or share the raw private export.

## Acceptance and exit criteria

**Open until owner native output:** verify 3/3 source Git blobs, 16/16 tests, PDF checksum+size/page count, 716 distinct page inventory records, and classification/status counts. The stage-1 page inventory may pass without a FACT CSV, but the 112 continuation-cases review remains **NOT RUN** in that condition.

Any continuation status, including `CONTINUATION_SCOPE_CANDIDATE_REVIEW_ONLY`, is a human-review proposal only. Must separately resolve 112 prior continuation cases, 67 unmatched economic candidates, 24 programme-grain records and 30 vote-level AIA entries with anchored page evidence, reconstruct all 2,912 FY26 FACT fields independently from As Passed, and rerun the 1,134/11 serving and SE-05/06/07 gates. The completed native CSV source-classification receipt `SE03_NATIVE_SOURCE_CLASSIFICATION_RECEIPT_20261028.json` remains accepted but cannot substitute for PDF proof. SCAN01/SE02 remain mandatory for automatic live acquisition.

**Status:** DRAFT / SOURCE-PINNED / LOCAL SYNTHETIC PASS / FULL NATIVE PDF INSPECTION PENDING / FACT PARITY NOT ACCEPTED / RELEASE NO-GO.
