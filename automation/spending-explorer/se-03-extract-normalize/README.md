# SE-03 historical staging normalization — REVIEW ONLY

This module accepts the existing approved STG_FactLoad extraction as input. It DOES NOT re-extract the original 716-page FY2026/27 As Passed PDF or claim source-byte fidelity. Output is review-only canonical line JSONL with raw key, reviewed canonical key, exact JMD amount, page, fiscal year/source and deterministic staging-row reference.

Inputs, kept outside repository: a 9-column STG_FactLoad.csv and RECON_ActivityLinks.csv with old_activity_id, resolved_activity_id, review_status. Missing/ambiguous legacy NA activity links block normalization. Operator must supply approved SHA-256 pins. No network, public data, Sheets writes, or scanner; incomplete lines fail closed. Receipt marks original_pdf_extraction_verified and fact_record_parity_verified false.

Offline operator command (only after exact private exports approved):

    python3 -m unittest -v test_se03_staging_normalize.py
    python3 se03_staging_normalize.py --staging-csv /private/STG_FactLoad.csv --staging-sha256 PINNED_SHA256 --crosswalk-csv /private/RECON_ActivityLinks.csv --crosswalk-sha256 PINNED_SHA256 --out-dir /private/empty/new-review-dir

Frozen FY2026/27 expected: 2,912 rows, gross JMD 1,490,511,399,000, AIA -48,730,045,000, net 1,441,781,354,000; measure counts 61/2821/30. Successful normalization does NOT prove parsing or exact FACT field parity.

## Executed historical comparison — November 8, 2026

The original 14 normalizer tests were executed successfully. Five additional
regression tests reproduced then guarded rejection-status suffixes, crosswalk
changes outside sub-programme membership, empty key components and malformed
comma-grouped amounts. The revised normalizer suite passes 19 tests.

`se03_staging_fact_parity.py` compares all normalized lines to the frozen FACT
as a **nine-field multiset projection**, preserving multiplicity. It separately
compares existing operational FY26 FACT to frozen FACT by ID across all 33
fields. Its 12 synthetic tests pass. The comparator accepts four explicit local
CSVs and requires a SHA-256 pin for each:

```bash
python3 se03_staging_fact_parity.py \
  --staging-csv /private/STG_FactLoad.csv --staging-sha256 STAGING_SHA256 \
  --crosswalk-csv /private/RECON_ActivityLinks.csv --crosswalk-sha256 CROSSWALK_SHA256 \
  --frozen-csv /private/frozen_FACT.csv --frozen-sha256 FROZEN_SHA256 \
  --operational-csv /private/operational_FACT.csv --operational-sha256 OPERATIONAL_SHA256
```

The current connected Sheets capture passed: 2,912 normalized lines, 309 reviewed
crosswalk mappings, zero missing/extra projection signatures and zero duplicate
signatures. Existing FY26 operational/frozen tables have 2,912 IDs and zero
33-field differences. All nine shared fields are listed in the receipt. Staging
has blank budget_number/budget_type columns; the code does not infer those fields
or claim full 33-field staging reconstruction. Vote leading-zero normalization
is format-only (1000 vs 01000). No other key substitution is made beyond the
reviewed activity crosswalk.

Input CSVs were serialized locally from bounded, read-only connector values,
padding omitted trailing cells to the observed header width. Their hashes pin
that capture; they are **not the bytes of a prior operator CSV export**. Raw
captures, CSVs, normalized rows and row-level differences stay outside GitHub.
The same operational capture passed the SE-04 CLI for both fiscal years.
See `SE03_STAGING_CONNECTED_ACCEPTANCE_20261108.json` and
`SE03_STAGING_CONNECTED_REVIEW_20261108.md` for execution and limitations.

PENDING: independent original As Passed PDF extraction, remaining printed-column
and grain exceptions, full source-derived 2,912×33 reconstruction, FY2025/26
distinct source extraction, serving-table recomputation, hosted CI, independent
peer review and controlled human release gates. The prior approved CSV is
incomplete and remains rejected as a canonical source. Existing historical QA
evidence is preserved. NO MERGE / DEPLOY / WORKFLOW ACTIVATION.

