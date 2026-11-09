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

## Source-only PDF financial candidate — November 8, 2026

`se03_pdf_source_extract.py` reads the pinned 716-page As Passed PDF directly.
It takes **no staging, crosswalk or FACT input**. Runtime geometry is pinned to
PyMuPDF 1.26.6. It locates the current-year column from the printed 2026-2027
and 2027-2028 header centers; complete numeric words must fit inside that cell.
Crossing/ambiguous numeric tokens, conflicting headers, missing units or broken
hierarchy/continuity stop extraction. Repeated identical header layouts agree;
conflicting layouts do not. A Sub Programme heading closes prior Activity scope.

```bash
python3 se03_pdf_source_extract.py --pdf /private/AsPassed.pdf \
  --out-dir /private/new-empty-source-review-directory
```

Output financial records stay local. Programme residuals are explicitly
**printed programme/economic amount minus all source-extracted detail amounts**;
they are not represented as printed Activity cells. The two agreeing printed
AIA summaries per vote produce one negative offset, with both occurrences kept
as lineage. Grand totals are rejection controls applied after extraction; they
do not select cells, fill gaps or supply amounts.

Actual source run produced 2,912 candidate records (2,809 Activity/Project,
73 Programme residual, 30 vote AIA), exact 61/2,821/30 measures and approved
gross/AIA/net controls. This advances the prior pending source-only financial
extraction gate; full 33-field reconstruction and release remain unaccepted.

Compare the already extracted candidate separately:

```bash
python3 se03_pdf_source_compare.py \
  --candidate-jsonl /private/source_records_LOCAL_ONLY.jsonl \
  --candidate-sha256 CANDIDATE_SHA256 \
  --frozen-csv /private/frozen_FACT.csv --frozen-sha256 FROZEN_SHA256
```

The comparison reports **2,904 exact nine-field matches and eight equal-amount
grain/page differences**: seven source Activity rows on physical page 446
correspond to frozen Programme residual rows on page 445; one Activity row on
page 534 corresponds to a frozen Programme residual on page 532. All 1,134
Programme/economic financial groups match, including AIA. This is not a derived
public DS/metadata acceptance. The comparator deliberately returns exit **2**
for `SOURCE_TOTALS_MATCH_IDENTITY_REVIEW_REQUIRED`; no automatic remapping or
frozen-model change occurs. See `SE03_SOURCE_PDF_REVIEW_20261108.md` and its
aggregate receipt for exact evidence, review findings and unresolved decisions.

## Approved frozen-v1 compatibility projection — November 9, 2026

The owner approved the explicit eight-row compatibility mapping, preserving
frozen v1. `se03_frozen_v1_compat.py` applies the pinned profile in
`se03_frozen_v1_compat_rules.json` only to the already pinned source candidate.
Every rule must match exactly once. Only entity grain/key and v1 reference page
are changed; financial values/source/year/measure/economic class/vote/budget stay
identical. All original physical source records, including page/Y/geometry and
derivations, remain together under `physical_source_evidence` on every output
record. The source candidate is not overwritten.

```bash
python3 se03_frozen_v1_compat.py \
  --candidate-jsonl /private/source_records_LOCAL_ONLY.jsonl \
  --frozen-csv /private/frozen_FACT.csv --out-dir /private/new-compat-directory
```

Actual compatibility run: eight rules matched once each, **2,912/2,912 exact
nine-field signatures**, no missing/extra/duplicate signatures, zero financial
changes. The previous raw source-vs-frozen eight-difference receipt remains
unchanged; the separate compatibility layer supplies the approved disposition.
This is not new Activity-grain model adoption or a release approval.

Canonical and serving follow-through is implemented in the adjacent SE-04
`se04_canonical_serving.py`. It checks governed dimension parents, derives
canonical fields/category mappings, explicitly carries three baseline replay
references (`fact_id`, `import_batch_id`, `loaded_at`), and compares all 33 fields.
This is a **baseline replay**, not independent reconstruction of those three
provenance fields from the PDF. Private replay rows and full source evidence
stay outside GitHub. See
`../se-04-reconcile-qa/SE04_COMPAT_SERVING_REVIEW_20261109.md` and its aggregate
receipt for FY26 frozen/public serving parity, hierarchy cohorts and remaining
gates. No financial Sheet, feed, workflow, scanner or production state changed.

