# JIF SE-03 — Native FY2026/27 FACT Structural Preflight PASS and Economic-Cell Candidate Review

**Date:** 2026-10-28. **Release:** NO-GO. **Scope:** draft PR #42, local-only processing, source-pinned review evidence. **No public/frozen Sheet write, archive mutation, approval of money totals or sending.**

## Accepted operator native structural receipt

The user ran the corrected `jif_se03_fact_preflight_20261028.sh` on their Mac and pasted the complete terminal summary. This is operator-supplied stdout, not an independently re-opened local JSON.

- Two pinned GitHub code identities PASS; **10/10** local native regression tests PASS in 0.027s.
- Private `FACT_Government_Spending` export SHA-256: `8ea4d7ac2b94eb5c8f5831da4b4a989e495e172e23dc6dc5269e6e55555c234c`.
- Exact 33-field header, source identity, unique keys, page range, capital Head/Budget and AIA sign rules passed; **fatal_error_count=0**.
- FY2026/27: **2,912** records (**2,801 Activity**, **81 Programme**, **30 AIA/Vote**), with **114 Capital Budget 6** FACT rows. FY2025/26: **2,900** additional records correctly skipped by FY26 preflight.
- The status counts are **not disjoint exceptions**: `EXPLICIT_ON_PAGE_CODE_ECON_AMOUNT_NOT_VERIFIED=2801`; `MULTIPLE_OR_CONFLICTING_PAGE_CONTEXT_REVIEW=269` flags possible multi-heading context on FY26 pages; `PROGRAMME_GRAIN_PDF_REVIEW_REQUIRED=81`; `AIA_VOTE_RECONSTRUCTION_REQUIRED=30`.
- Formal disposition: `FACT_REVIEW_QUEUE_PREFLIGHT_PASS_REVIEW_ONLY`; `source_economic_amounts_independently_matched=false`; `full_2912_row_source_reconstruction_accepted=false`; `publication_authorized=false`.
- Structured receipt: `automation/spending-explorer/se-03-extract-normalize/SE03_PRIVATE_FACT_PREFLIGHT_NATIVE_RECEIPT_20261028.json` in draft PR #42.

## Next review-only extraction/financial candidate gate (implemented, not yet run on private PDF/FACT)

The new source-pinned `se03_pdf_economic_review.py` + 10 safety tests (both exact byte-parity with locally tested Python sources; 10/10 local synthetic PASS) reuse the existing `economic_candidate_count` bounding-box search from source-validated As Passed parser. This examines **the PDF page directly** for a printed economic object code and corresponding expected amount at the expected FY2026/27 column for each Activity-grain FACT, without changing any CSV or protected model.

Classification distinguishes:
- AIA/Vote = `AIA_VOTE_METHOD_REQUIRED` (no Activity assertion).
- Programme = `PROGRAMME_GRAIN_METHOD_REQUIRED` (no Activity assertion).
- Capital Project vs Recurrent Activity: printed project or activity code must match source-grain; mismatches remain review-only.
- Multiple section headings / Head/Budget ambiguity = context review, **even if a numeric amount candidate appears**.
- For eligible Activity rows, economic object/amount candidate occurrences = 0, exactly 1, or multiple. Exactly 1 is **UNIQUE_ECONOMIC_CELL_CANDIDATE_REVIEW_ONLY**, NOT a proven 33-field canonical financial match.
- All 2,912 records are classified into aggregate counts, source PDF SHA and private CSV SHA logged; no private raw rows printed. At most 5 sample FACT ids/status are included in local JSON.

This matcher is intentionally bounded to existing fixed coordinates from the earlier parser. Missing/ambiguous matches may be PDF extraction/geometry issues rather than incorrect budget figures. The programme and AIA methods remain separately open. It does **not** settle the historic 112 continuation, 67 economic-column, 24 programme-exception or 30 AIA worklists, nor authorize release.

**Pinned native launcher:** `automation/spending-explorer/se-03-extract-normalize/run_se03_pdf_economic_candidates_native.sh`, immutable source commit `ff1f8c5b51b5224d466e3fdfdffb5c4bbccf7d77`, **seven exact Git blob pins**. Existing private CSV SHA `8ea4d7ac...` is required so a different export cannot silently enter the audit. It reuses the verified `JIF_SE03_2026-27_As_Passed.pdf`, corrected capital-v2 716-page inventory and isolated PyMuPDF environment. Local input and report only: `~/Downloads/JIF_SE03_PDF_Page_Review_20261028/se03_pdf_economic_candidates_review_only.json`.

After fetching and checking seven blobs, it runs **46** included synthetic unit tests locally (prior 26 page inventory + 10 private FACT + 10 new economic candidate), verifies private export SHA, and runs economic classification against the actual pinned PDF. This is a review gate, not a publication gate. Hosted PR CI has been extended from **70 to 80 intended synthetic tests**, but no completed hosted PASS evidenced.

### Mac operator command

```bash
curl -fL --show-error \
  "https://raw.githubusercontent.com/ethonjames24-jpg/jiftracker/4661796d5b15bb722aa2bcb2b62c8c545ccdead9/automation/spending-explorer/se-03-extract-normalize/run_se03_pdf_economic_candidates_native.sh" \
  -o "$HOME/Downloads/jif_se03_pdf_economic_candidates_20261028.sh"
bash -n "$HOME/Downloads/jif_se03_pdf_economic_candidates_20261028.sh" && \
bash "$HOME/Downloads/jif_se03_pdf_economic_candidates_20261028.sh"
```

If the CSV pathname is ambiguous, provide `JIF_SE03_FACT_CSV` pointing to the actual FY26 export that yielded the accepted SHA. Do not upload the raw CSV. If the PDF differs from its existing local filename, set `JIF_SE03_PDF` to the exact local source path; the Python checker still enforces the pinned PDF bytes.

**Outstanding steps after this source candidate gate:** page-specific row/economic-column context verification including continuations, financial all-33-field and numeric source acceptance, AIA vote method, programme grain and capital-project mapping; approved FY-scoped repair of historical three stale multi-year QA flags (316 + 32 = 348; 766 + 74 = 840); recompute 1,134 Spending Explorer and 11 Every J$100 data-serving rows; frontend and hosted CI review; scanner/intake qualification; independent owner release authorization and production readback.


## Economic-cell scan — actual Mac native result (2026-10-28)

**ACCEPTED review-only execution:** 7/7 exact Git blob checks PASS, 46/46 synthetic tests PASS, private export SHA-256 `8ea4d7ac2b94eb5c8f5831da4b4a989e495e172e23dc6dc5269e6e55555c234c` PASS. Source PDF SHA matched, all 2,912 FY2026/27 FACT rows classified. Classified statuses (disjoint): UNIQUE_ECONOMIC_CELL_CANDIDATE_REVIEW_ONLY 2,114; ECONOMIC_CELL_MULTIPLE_CANDIDATES 419; MULTI_SECTION_CONTEXT_REVIEW_REQUIRED 258; ECONOMIC_CELL_NOT_FOUND_BY_BOUNDING_BOX 10; PROGRAMME_GRAIN_METHOD_REQUIRED 81; AIA_VOTE_METHOD_REQUIRED 30. Activity geometric candidates: 0=10, 1=2,364, 2+=427. The 258 multi-section records include 250 geometrically unique and 8 with geometric multi-candidates. All **2,114** qualified unique-candidate rows still require independent complete source context verification; none is automatically accepted.

**Next stage risk-driven sequence:** (1) inspect physical-page economic table layout and repeated object codes for the 419 unqualified multiple candidates and 10 coordinate misses; (2) resolve 258 multi-section records using explicit physical-page source headings and line position, never unsupported carry-forward; (3) verify unique candidate evidence with source section context and correct source value/units; (4) implement independent Programme and vote AIA recognition for 81/30 rows; (5) only then compare fully source-derived 33 fields across 2,912 rows to frozen FACT and re-run serving QA. Do not assert an error or fabricated amount from a geometric result. Historic 112/67/24/30 lists remain separate open worklists, no source-derived acceptance here. Native scan receipt recorded in `SE03_PDF_ECONOMIC_CANDIDATES_NATIVE_RECEIPT_20261028.json`. Local detailed JSON exists at `~/Downloads/JIF_SE03_PDF_Page_Review_20261028/se03_pdf_economic_candidates_review_only.json`, not independently inspected.
