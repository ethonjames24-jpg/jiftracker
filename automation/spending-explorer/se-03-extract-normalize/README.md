# SE-03 historical staging normalization — REVIEW ONLY

This module accepts the existing approved STG_FactLoad extraction as input. It DOES NOT re-extract the original 716-page FY2026/27 As Passed PDF or claim source-byte fidelity. Output is review-only canonical line JSONL with raw key, reviewed canonical key, exact JMD amount, page, fiscal year/source and deterministic staging-row reference.

Inputs, kept outside repository: a 9-column STG_FactLoad.csv and RECON_ActivityLinks.csv with old_activity_id, resolved_activity_id, review_status. Missing/ambiguous legacy NA activity links block normalization. Operator must supply approved SHA-256 pins. No network, public data, Sheets writes, or scanner; incomplete lines fail closed. Receipt marks original_pdf_extraction_verified and fact_record_parity_verified false.

Offline operator command (only after exact private exports approved):

    python3 -m unittest -v test_se03_staging_normalize.py
    python3 se03_staging_normalize.py --staging-csv /private/STG_FactLoad.csv --staging-sha256 PINNED_SHA256 --crosswalk-csv /private/RECON_ActivityLinks.csv --crosswalk-sha256 PINNED_SHA256 --out-dir /private/empty/new-review-dir

Frozen FY2026/27 expected: 2,912 rows, gross JMD 1,490,511,399,000, AIA -48,730,045,000, net 1,441,781,354,000; measure counts 61/2821/30. Successful normalization does NOT prove parsing or exact FACT field parity.

PENDING native review: independent new test execution, approved source CSV export hashes, 2,912-line normalized-to-frozen FACT comparison, official PDF/CSV byte-level source extraction with source-page evidence and pinned parser hash, FY2025/26 distinct source, SE-04 public aggregate parity. Preserve prior historical QA and publication controls. NO MERGE / DEPLOY.
