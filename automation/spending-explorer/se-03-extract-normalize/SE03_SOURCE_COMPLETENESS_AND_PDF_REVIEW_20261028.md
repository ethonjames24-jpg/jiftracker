# SE-03 Official source completeness and PDF continuity evidence — 28 October 2026

**Decision:** Owner approved development and documentation in draft PR #42. REVIEW ONLY; no canonical re-extraction acceptance, merge, deploy, scanner/source intake change, public sheet write or workflow activation.

## Source authority and identity

- **Controlling:** FY2026/27 *As Passed* expenditure PDF, 716 physical pages; SHA-256 `32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6`; source `SRC_EOE_2026_27_PASSED`.
- **Supporting:** As Presented CSV; 12,262,651 bytes; SHA-256 `d480726d35bb1d694f4f0a48e2fab3038c5968d335dc45b00ab5f51bfb497f1a`.
- **INCOMPLETE / not canonical extraction input:** Approved CSV; 10,891,264 bytes; SHA-256 `cdb6ce99c678feabb3c3c48cf2bcc06d756762a8240c302f82719cabecb4e7ab`. The accepted SE-01 fingerprint matched but file ends mid-record. Byte identity DOES NOT certify data completeness.

## Owner-supplied full-file v4 comparison, verified read-only

Approved CSV: 20,962 complete 33-column rows, one five-column truncated record 20,964 (physical line 21,240), no Total footer or final newline, 53 organisations. Last complete code `5300041068/11/1000/0401/18320/10005/240201/00`; truncated next code ends `240202/00`. FY26 raw total J$1,422,984,394,000 (recurrent J$1,344,186,034,000; capital J$78,798,360,000). It does NOT equal frozen gross or net.

As Presented CSV: exact 3-record title/metadata/header, 23,559 complete 33-column budget rows, Total row at record 23,563, two trailing blank rows and newline termination; 56 organisations. Sum AND source footer J$1,490,511,399,000, numerically equal to frozen As Passed GROSS (not proof of identical allocations or authority). Recurrent gross J$1,390,771,039,000; capital gross J$99,740,360,000. Funded-by-AIA lines total J$48,730,045,000; these source rows are NOT automatically the signed canonical AIA offset.

20,957 shared coding blocks; 5 Approved-only (J$21,660,000,000); 2,602 Presented-only (J$67,527,005,000). Common edited-block delta -J$21,660,000,000 offsets Approved-only delta +J$21,660,000,000; net Approved minus Presented -J$67,527,005,000. Presented-only organisation codes include 53038, 69000 and 72000. Do not assume the unobserved Approved amounts would be unchanged from Presented.

Frozen As Passed baseline: 2,912 FY26 FACT rows (61 authorized by law, 2,821 voted, 30 signed AIA); gross J$1,490,511,399,000, AIA -J$48,730,045,000, net J$1,441,781,354,000. Existing RECON_AsPassed tab records J$20b capital-to-recurrent shift across versions and five change rows (Cabinet/NaRRA, Finance, Education, Health); preserve that approved reconciliation.

## This review-only implementation

- `se03_source_completeness.py`: pinned byte identity AND independent completeness checks. CP1252 strict decoding candidate, exact source-specific 33-column headers and metadata, four fiscal-year amounts, Decimal integrality, source-row integrity/uniqueness, sum-to-footer, end-of-file checks and explicit no-authority/no-publication outputs. The pinned incomplete Approved CSV must return `FAILED_CLOSED_SOURCE_INCOMPLETE` notwithstanding a matching SHA. Complete Presented source can return `SUPPORTING_EVIDENCE_ONLY` and cannot trigger canonical extraction.
- `se03_pdf_continuation_review.py`: pure decision helper for review of candidate cross-page activity scope; only produces a *provisional* continuation candidate with adjacent pages, matching explicit head/vote/programme, prior explicit activity heading and one economic candidate. Never infers amounts, source pages or canonical rows. Section changes, absent identities and ambiguous matches remain unresolved.
- Synthetic local tests: **31/31 PASS** across 17 CSV completeness and 14 PDF decision cases; Python compile PASS. These tests do **not** establish native execution against complete official source files or acceptance of 716-page PDF extraction. No private workbook/FACT export or source PDF/CSV bytes are included in the PR.

## Known SE-03 source evidence backlog

Previous source-pinned PDF classifier covered 2,882 non-AIA FACT records: 2,679 single activity-scoped candidates, 112 source pages missing explicit on-page activity heading, 67 unmatched economic columns, 24 programme-level grains, plus 30 AIA vote-level records. All remain review-only; aggregate candidate matches are NOT independent source-to-FACT reproduction.

## Mandatory exit gates

1. Run completeness gate on pinned native Approved and Presented bytes; retain stdout + exit receipts. Approved expected FAILED_CLOSED; Presented expected supporting-only. Recheck CP1252/schema if source revisions appear.
2. Wire review helper to independently sourced PDF page evidence; inspect and resolve 112 continuation cases, 67 unmatched economic, 24 programme, 30 AIA vote cases. Never fill gaps from Presented.
3. Reconstruct 2,912 canonical FY26 records FROM As Passed PDF and compare all 33 fields to frozen model; year-scoped foreign keys, exact gross/AIA/net, rederived 1,134 Explorer/11 Every J$100 and FY25 comparison.
4. SE-05/06 explicit technical/editorial/release approvals, SE-07 shadow readback/rollback; SCAN-01/SE-02 native security before autonomous intake. Preserve historical QA FAIL rows and annotate separately.

**Immutable:** frozen model v1, operational/private model v1.1, released public v1.1, monthly Tracker, scanner, production n8n state. PR remains DRAFT/UNMERGED/NO DEPLOY.

## 28 October — Remote-checkout and native-file test execution checkpoint

Added `.github/workflows/jif-se03-review-tests.yml` on the draft branch: minimal read-only `pull_request`/manual Actions job, `contents:read`, no persistent checkout credentials, no external budget data, no credentials, no staging/public writes. It runs Python compilation and 31 isolated synthetic tests against the **remote PR checkout**. As of the owner's next acceptance checkpoint GitHub has not returned a completed CI run; therefore remote CI remains **PENDING** until a successful run and exact head SHA are independently read back.

Added `se03_native_official_file_acceptance.py` to enforce **expected review-only source dispositions** against user-held pinned CSV bytes, and `run_se03_native_source_checkpoint.sh` as an operator-only launcher. The launcher fetches five **immutable commit-pinned** exact GitHub source/test files into a new local Downloads review directory, verifies their five Git blob SHA-1 IDs, runs the 31 synthetic tests **from GitHub code**, and then reads the two official CSVs already held locally in Downloads. It reports source verdicts, only, without uploading any source, private FACT exports, or modifying the existing model. If the repository requires authentication for raw checkout, the launcher fails; do not embed GitHub tokens or disable access controls to force it.

Expected official source checks: Approved CSV `FAILED_CLOSED_SOURCE_INCOMPLETE` (nonstandard final row, no footer, no final newline); As Presented CSV `SUPPORTING_EVIDENCE_ONLY`, full footer and exactly 23,559 rows. A successful wrapper receipt is `SOURCE_CLASSIFICATION_EXPECTED_PASS_REVIEW_ONLY`. This is explicitly NOT approval of canonical FY2026/27 PDF extraction.

New checker syntax was verified locally and its remote Git blob SHA-1 exactly matches the tested local checker `8fa3e906e127058841dda2b0cdb3fb1a9aed35cf`. The original four SE-03 helper/test modules have local-vs-remote blob differences; do not close their remote parity gate before the launcher or CI runs against pinned remote bytes. Real source-file native receipt has NOT been received yet. 2,912 source-derived records, 33-field parity, PDF boundary integration, programme/AIA rules and end-to-end QA remain open.

## October 28 — Native checkout PASS, source gate header STOP, scoped correction

Operator output from `jif_se03_pr42_native_checkpoint_20261028.sh`:
- **5/5 pinned GitHub source file blob identities PASS**. Previous local/remote mismatch risk is now CLOSED for the exact pinned source files.
- **31/31 tests PASS when executed on GitHub source bytes**.
- Official file gate returned `{"error":"UNRECOGNISED_HEADER","result":"FAILED_CLOSED","publication_authorized":false}`. This is a **validator-header-contract failure**, not an accepted source-quality verdict, and must not be reported as an official-file test PASS.
- Cause is not yet proven to a specific raw header byte from this error alone. The original strict byte equality on all 33 labels was too brittle for presentational whitespace. The targeted correction normalizes only contiguous whitespace in header labels, retains exact label semantics/order/year columns, detects duplicate normalized names, and now emits specific mismatching header columns if a true source-schema mismatch persists.
- Three added regression cases cover NBSP-vs-ASCII-space equivalence, semantic label mutation rejection, and normalized duplicate-name rejection. **34/34 local synthetic tests PASS; remote-code and official-file native proof for corrected version PENDING.**
- Corrected pinned Mac launcher `run_se03_native_source_checkpoint.sh` uses immutable source commit `5fbc89f321bd9b2b9a5a30d15538d11feef09cdb` and exact updated Git blob pins `e8f5c3cfc19c0dc299135acb521535c1b8d2c055`, `45922a71da1ac176a4b1902f40df6320aaf39a10`; other three pins unchanged. Expected successful run: 5/5 identities, 34 tests, expected Approved FAILED_CLOSED_SOURCE_INCOMPLETE / Presented SUPPORTING_EVIDENCE_ONLY, and final PASS_REVIEW_ONLY. No release or canonical 2,912-row approval even if all pass.

No PDF processing or 2,912-row canonical source-derived re-extraction was done at this checkpoint. Source authority, existing workbook, historical SE-01 receipts, n8n, scanner and release boundaries unchanged.

## SE03-NATIVE-2026-10-28-V2 — OWNER NATIVE RECEIPT ACCEPTED (classification only)

Owner provided Mac Terminal stdout from `jif_se03_pr42_native_checkpoint_v2_20261028.sh`. Recorded as immutable **source-disposition evidence** in `SE03_NATIVE_SOURCE_CLASSIFICATION_RECEIPT_20261028.json` (transcribed from operator output; not a GitHub CI artifact).

- Five GitHub blob SHA-1 values pinned to source commit `5fbc89f321bd9b2b9a5a30d15538d11feef09cdb` all **PASS**; exact remote PR-code identity verified.
- **34/34** isolated synthetic tests on those exact remote files: **PASS**.
- Approved CSV hash `cdb6ce99c678feabb3c3c48cf2bcc06d756762a8240c302f82719cabecb4e7ab`: **identity PASS, completeness FAILED_CLOSED_SOURCE_INCOMPLETE**, with exactly `NONSTANDARD_WIDTH:20964:5`, `TOTAL_FOOTER_MISSING`, `UNTERMINATED_LAST_RECORD`.
- As Presented CSV hash `d480726d35bb1d694f4f0a48e2fab3038c5968d335dc45b00ab5f51bfb497f1a`: **identity PASS, supporting-only disposition PASS**, no source-completeness anomalies.
- All **11/11** explicit native checker assertions true. Terminal end: `SE03_PR42_NATIVE_SOURCE_CHECKPOINT=PASS_REVIEW_ONLY`, `FULL_SOURCE_DERIVED_2912_ROW_RECONSTRUCTION=NOT_ACCEPTED`, `PRODUCTION_RELEASE=NO_GO`.

**Gate disposition:** Native official CSV source identity/completeness classification = **CLOSED/PASS (review only)**. Source-to-As-Passed independent extraction, candidate PDF page continuity, 2,912 full financial FACT parity, and DS recomputation remain **OPEN**. GitHub-hosted Actions CI also **PENDING** until a run with completion + correct PR head is observed. Do not promote supporting Presented file to controlling status, treat incomplete Approved as complete, or reinterpret this operator receipt as production approval.
