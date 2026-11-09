# SE-03 historical staging checkpoint — November 8, 2026

This checkpoint advances draft PR #42. It proves historical input normalization
and bounded baseline comparisons. Original official-source reconstruction and
production acceptance remain open. Primary route: incremental implementation.

## Scope and evidence

Base revision: `351099429598fadc33df660b2c9e88a269d3e964`.
Code changes: tighten existing input guards; add an offline, SHA-pinned parity
command and synthetic tests; include these and existing SE-04 tests in review CI.
No new dependency, account, API integration, financial mapping or production path.

Read-only inputs: operational workbook `1xaNCRt_vMPxBjB56SuqoUKOyXRpsHnd5lX6t06hsQX0`
STG_FactLoad A1:I3000 (2,912 lines), RECON_ActivityLinks A1:Q500 (309 mappings),
FACT A1:AG6000 (5,812 rows); frozen workbook
`1cgOxWj78M1_SsFHrrd2nkUrxg_BxC4rFbngsspg7sPQ` FACT A1:AG3000 (2,912 rows).
FACT reads used at most 1,000 rows per call. Exact returned values were serialized
as UTF-8 CSV with LF line endings and trailing empty cells padded. This capture
is not a prior operator CSV export or a transactional multi-workbook snapshot.
Hashes identify these locally serialized bytes only. Raw captures and rows are
outside the repository; only aggregate receipts are committed.

| Check | Observed result | Limit |
| --- | --- | --- |
| Original normalizer unit suite | 14/14 pass | Synthetic |
| Revised normalizer + comparator | 19 + 12 = 31/31 pass | Synthetic |
| Prior SE-03 + SE-04 regression | 80 + 34 = 114/114 pass | Synthetic |
| Real historical normalization | 2,912 lines, 61 statutory / 2,821 voted / 30 AIA, exact financial controls | Existing staging, not original-source parsing |
| Staging to frozen projection | 2,912 signatures; 0 missing/extra or duplicate signatures | Nine shared fields only |
| Operational FY26 to frozen FACT | 2,912 IDs; 0 missing/extra/changed rows, all 33 fields | Existing workbook-to-workbook equality |
| SE-04 CLI on operational capture | Both years QA_PASS_REVIEW_ONLY; no errors | No public-serving or source-PDF parity |
| GitHub-hosted CI | Not verified at checkpoint creation | Local tests are not a hosted receipt |

Staging gross JMD 1,490,511,399,000; AIA -48,730,045,000; net
1,441,781,354,000. SE-04 also confirms FY25 gross 1,309,182,355,000,
AIA -49,133,377,000, net 1,260,048,978,000 across 2,900 records.

Projection fields: source_id, fiscal_year, measure_type, entity_type,
canonical_entity_key, economic_code, amount_jmd, source_page,
recurrent_or_capital. The stage's budget_number and budget_type are blank;
no values were inferred. Source_row is used to check FACT grain/code consistency;
the staging locator is retained separately. Organization, category, dimension
metadata, import IDs, dates and other absent fields are not reconstructed.
Vote 1000 is compared to 01000 by explicit five-digit formatting only.

## 1. 🎯 ARCHITECTURAL SUMMARY

Review covers the existing staging normalizer and new parity command, their
tests, relevant existing SE-04 code, and the changed review workflow. It is a
single-agent review, not independent peer approval or a complete 46-file PR audit.
Both commands stay offline. The comparator prints aggregate counts and hashes;
it does not emit private records, alter canonical data or grant release authority.

## 2. 🐇 CODERABBIT CHAT & LINE-BY-LINE REVIEW

Four guard problems were reproduced and repaired in this checkpoint:

- **File:** `se03_staging_normalize.py`
- **Line/Chunk:** `status.endswith("QA_PASS")`
- **Issue:** [High] `NOT_QA_PASS` and `REJECTED_QA_PASS` could authorize a used legacy mapping.
- **Suggested Fix:** Implemented exact `status == "RESOLVED_QA_PASS"`; other statuses cannot resolve required legacy keys.

```python
if not old or not new or status != "RESOLVED_QA_PASS":
    continue
```

- **File:** `se03_staging_normalize.py`
- **Line/Chunk:** `activity_crosswalk`
- **Issue:** [Medium] A reviewed target could change the activity or parent programme, beyond the intended missing sub-programme resolution.
- **Suggested Fix:** Implemented complete numeric-key grammar and equal programme/activity components; only the sub-programme component may change from NA.

```python
if (legacy[1], legacy[2]) != (resolved[1], resolved[3]):
    raise Rejected("CROSSWALK_CHANGES_ACTIVITY_IDENTITY")
```

- **File:** `se03_staging_normalize.py`
- **Line/Chunk:** activity/programme key structure and amount grammar
- **Issue:** [Medium] Component count admitted empty components; removing commas admitted malformed strings such as `1,,000` as a valid amount.
- **Suggested Fix:** Implemented nonempty ASCII-digit components and properly grouped comma grammar; plain integer strings remain valid.

```python
if not s or not re.fullmatch(r"-?(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)", s):
    raise Rejected("INVALID_JMD_AMOUNT")
```

No existing live financial error was established. The current reviewed crosswalk
and all real staging rows pass the tightened checks.

## 3. 🛑 AI "SLOP" & BLOAT DETECTION

No new third-party dependency or generic abstraction was added. Existing
normalization/CSV parsing are reused. The comparator deliberately does not
manufacture absent FACT fields or infer financial values from expected totals.
The inherited CI step still runs its existing 80 tests; new steps add 65 tests.

## 4. 🛡️ SECURITY & PERFORMANCE AUDIT

Offline standard-library tools; no HTTP, credentials, Sheet writes, shell
execution from source contents or publisher. Input pins are mandatory and the
CLI returns exit 2 on denial. Review status always denies release. Comparison
uses counters and ID indexes, preserving multiplicity with linear record work.
No separate dependency vulnerability scan or load benchmark was performed.
The CSV pins establish identity of a supplied capture, not human approval or
official-source authenticity. Private captures must remain outside public Git.

## 5. 🧪 AUTOMATED TEST CASE SEPARATION

### 🔸 RUNTIME EVALUATION (TESTS ACTUALLY RUN)

Original source/test blobs verified against GitHub before modification.
Original normalizer 14 tests passed. The added negative controls then produced
9 failing subcases across four methods, proving the guards were too permissive.
After repair, 19 normalizer + 12 comparator tests passed. Existing 80 SE-03 and
34 SE-04 tests passed: **145 total final tests; zero failures**.

Commands: `python3 -m unittest -v` with the five inherited SE-03 test modules
plus `test_se03_staging_normalize test_se03_staging_fact_parity`; separately
`python3 -m unittest -v test_se04_multiyear test_se04_reconcile`.
Real comparator invoked with all four CSVs and exact pins, exit 0; SE-04 CLI
invoked with the operational capture and report JSON, exit 0. See aggregate JSON
receipt for exact inputs, interpreter version, code hashes and results.

### 🔸 GENERATED TEST CASES (PROPOSED)

No unexecuted test code is being presented as passed. All 17 net-new test methods
in the normalizer/comparator files were executed. Future official PDF fixtures,
column ownership, Programme and AIA methods need separate evidence and tests.

## Remaining gates and next action

| Identified Blocker | Workflow | Required next steps |
| --- | --- | --- |
| Official-source reconstruction not accepted | Source verification | Recover/run pinned column-geometry diagnostic; resolve 579 token pairs, 1 empty cell, 10 candidate differences, 3 repeated economic rows, 2 section ambiguities, 81 Programme and 30 AIA methods; reconstruct source-derived FACT |
| Staging lacks remaining FACT fields | Reconciliation | Establish separately evidenced mapping/lineage; do not equate nine-field projection with 33-field reconstruction |
| Serving QA and year scoping remain open | Reconciliation | Recompute DS outputs and year-scoped hierarchy checks; preserve historic FAIL records |
| Hosted CI and independent peer review not verified | Review | Capture actual current-head receipts and obtain review before acceptance |

Historical exception lists are overlapping diagnostics, not additive errors.
The Approved CSV remains FAILED_CLOSED_SOURCE_INCOMPLETE; As Presented stays
supporting-only. Existing public v1.1 is a prior release, not new pipeline
acceptance. SE-02/SCAN-01 qualification, durable SE-05/06 and SE-07 shadow and
rollback stay separate. No n8n import/execution/activation or source acquisition
occurred. EAA remains PAUSED_DOCUMENTATION_ONLY. Corrected Checkpoint C is not
resumed. Public financial values, frozen/operational workbooks and production
were not changed. PR42 must remain draft/unmerged.

[CROSS_AGENT_HANDOFF]
NEXT_AGENT: source-driven-dev
ROUTE_STATE: [IN PROGRESS]
INSTRUCTION: Resume the pinned original As Passed PDF column-ownership investigation, then source-derived reconstruction and full SE-04/serving reconciliation. Do not reuse historical-stage parity as source acceptance.
CONTEXT: Draft PR42; historical 2,912-row nine-field parity and pre-existing 33-field workbook equality established. Official Approved CSV is incomplete. EAA and Checkpoint C remain paused; no merge/deploy/live workflow or Sheet write authorization.
EVIDENCE: SE03_STAGING_CONNECTED_ACCEPTANCE_20261108.json; 145 final local tests pass. Hosted CI, independent peer review and original PDF reconstruction remain unverified.
[/CROSS_AGENT_HANDOFF]
