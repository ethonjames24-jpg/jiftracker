**SE-03/SE-04 frozen-v1 compatibility, canonical replay and serving QA — November 9, 2026**

### 1. 🎯 ARCHITECTURAL SUMMARY

Base revision `a4e527065773fc8d73d5d487b4a2e16d8c58d740`; draft PR42.
State: **IN PROGRESS / REVIEW ONLY / NO MERGE OR PRODUCTION RELEASE**.
The owner approved the explicit eight-row compatibility path preserving frozen
v1, followed by canonical and serving QA. This does not authorize model adoption,
workflow activation, live data writes or publishing.

The source-only candidate remains byte-identical. A separate, pinned profile
maps seven Activity10005 rows (Head40000, Programme001, SubProgramme01, source
page446) to frozen Programme grain/reference page445, plus one Activity12816
row (Head41051, Programme326, SubProgramme24, sourcepage534) to frozen Programme
grain/reference page532. Every rule must match exactly once. Financial fields,
source/year/measure/economic class/vote/budget cannot change. The profile and both
input byte identities are pinned. Original complete source objects, including
physical page, Y and geometry, remain nested together on **every** projected row;
they are not reassigned to the frozen reference page.

| Verification | Observed result |
| --- | --- |
| Compatibility projection | 8/8 rules, each once; 2,912 exact shared-field matches; no missing/extra/duplicate signatures |
| Source/frozen input bytes | Unchanged; zero financial field changes |
| Canonical replay | 2,912 rows; zero differences across 33 fields |
| Dimension checks | Foreign keys, owner/parent links, source-derived hierarchy, vote/budget/year, sign and category priority pass |
| Frozen FY26 serving | 1,134 spending rows and 11 Every100 categories; exact amounts and matching labels/source metadata |
| Public v1.1 FY26 serving | Same 1,134/11; exact amounts and matching labels/source metadata |
| Frontend existing functions | 2,256 spending +22 summary rows accepted, zero warnings; FY26 filter 1,134/11, net1,441,781,354,000, 30 AIA rows |
| Local unique synthetic tests | 217/217 pass |

**Provenance boundary:** replay reconstructs financial/hierarchy fields from the
compatibility projection and approved dimensions/mapping rules. It carries three
old baseline reference fields: `fact_id`, `import_batch_id`, `loaded_at`. Those
fields identify the frozen replay target; they are **not a new ingestion receipt**
or independently recoverable PDF facts. Empty funding/location fields follow
the frozen unknown-value contract; this does not establish detailed source
funding/location coverage. Other metadata uses explicit approved annual/JMD/
As-Passed conventions. Therefore `independent_33_field_source_reconstruction`
remains false, despite exact 33-column baseline replay equality.

Serving QA groups the replay's financial values, not serving-table amounts, by
year/measure/organization/function/programme/economic class/public category/
budget/source. Category selection replays approved priority rules (economic AIA
and debt overrides before function mapping). Labels come from the approved
dimensions/category rules; URLs from the pinned catalogue. Stable serving IDs,
row statuses, timestamp timezone and required frontend strings are validated.
Historical update timestamps are checked, not misrepresented as new publication.

**Dimension scope:** current operational introduction cohorts reconcile
316 FY26-origin SubProgramme +32 FY25 additions =348; 766 FY26-origin Activity
+74 FY25 additions =840. IDs are unique in each table. These are introduction
cohorts according to existing `active_from` tags, **not a complete FY25 dimension
universe**. Original historical QA FAIL rows remain unchanged; this adds a
versioned local scope check rather than rewriting history.

### 2. 🐇 CODERABBIT CHAT & LINE-BY-LINE REVIEW

Two independent scoped reviewers inspected compatibility/canonical/serving code
and tests. Compatibility reviewer recomputed real projection and verified all
2,912 source-evidence objects, eight transformations, input immutability and
byte hash. Canonical reviewer ran real replay/serving and independently verified
the fixes below. Neither review grants production acceptance.

- **File:** `se04_canonical_serving.py`
- **Line/Chunk:** `index_rows` / `validate_metadata`
- **Issue:** [Medium, repaired] Whitespace-only IDs and IDs differing only by surrounding whitespace passed validation. Existing frontend trimming would drop or collide those rows.
- **Suggested Fix:** Reject blank/non-string/noncanonical-whitespace/duplicate IDs. Two regression tests failed before repair; parent and independent reviewer reran them successfully. No bad ID was established in the current capture.

```python
if not isinstance(value,str) or not value or value.strip()!=value or value in out:
    raise Rejected("MISSING_NONCANONICAL_OR_DUPLICATE_REFERENCE_ID:"+key)
```

- **File:** `se04_canonical_serving.py`
- **Line/Chunk:** required serving strings and reference-label equality
- **Issue:** [Medium, repaired] A blank reference source URL or economic label could validate an equally blank serving value, although the actual frontend rejects it.
- **Suggested Fix:** Check the frontend's nonblank required strings before reference equality; require function fields for non-AIA records. Two regression tests failed before repair and pass after; independent probes confirm denial. Current captured rows contain no established instance of the defect.

```python
if any(not isinstance(row.get(field),str) or not row[field]
       or row[field].strip()!=row[field] for field in fields):
    raise Rejected("SERVING_REQUIRED_STRING_MISSING_OR_NONCANONICAL")
```

Additional negative tests cover missing/duplicate rule hits, changed rule
preconditions, cross-programme mapping, missing/contradictory dimension parents,
category priority ambiguity, changed source amount, duplicate canonical ID,
compensating serving amount errors, duplicate/missing groups, wrong display
labels/source/denominator, nonfinite shares, excessive rounding, naive timestamps
and unreleased public statuses.

### 3. 🛑 AI "SLOP" & BLOAT DETECTION

No new dependency, network integration, UI or publisher. The compatibility
profile is eight explicit rules tied to one accepted source candidate and one
frozen baseline. It is not a heuristic that matches by equal amount or silently
rekeys future sources. Source values are never filled from expected totals.
Existing FACT signature/CSV/amount parsing is reused. Canonical metadata sources
and the three inherited references are explicit; no claim that all metadata is
independently printed in the government PDF.

### 4. 🛡️ SECURITY & PERFORMANCE AUDIT

Both commands run offline. The input manifest and every file hash are required;
the approved compatibility and frozen artifact pins are enforced again in SE04.
Manifest paths must stay within the manifest directory. Output requires a fresh
directory. No credential, subscriber, n8n, scanner, live Sheet writer or public
publisher path is present.

Private inputs/captures, full physical evidence and canonical replay CSV remain
outside GitHub. Committed receipt contains aggregate metrics and hashes only.
Reference pins describe bounded read-only connected Sheets values, serialized
UTF8/LF with omitted trailing cells padded to the observed schema. These are not
original native CSV-export bytes or an atomic multi-workbook transaction.

Rounding is presentation-only: each percentage/per-J100 value must be within
0.005 percentage points of exact integer arithmetic, plus1e-12 serialization
allowance. Eleven-category sum tolerance0.055. All monetary amounts and the net
denominator must match **exactly**. Frozen FY26 Every100 sum100.00; published
stored sum99.9999999932, with exact category amounts/net. No correction or
redistribution applied. The public capture includes 1,122 FY25 spending and11
FY25 summary rows, which this FY26 source QA explicitly does **not** certify as
independently extracted FY25 data.

The existing frontend service/model/config blobs were verified against GitHub
and executed under Node24.22.1 against captured public CSV values. Its actual
CSV parser, normalization, year filter, sums and prior-release control evaluator
accepted the documented rows with zero warnings. This is a **function-contract
check**, not browser/DOM/mobile/network-production validation. The prior feed's
release gate is true; the **new candidate's publication authority remains false**.
No frontend source was changed or deployed.

No separate dependency vulnerability scan, load benchmark or production security
test was performed; these are scoped offline validation tools.

### 5. 🧪 AUTOMATED TEST CASE SEPARATION

#### 🔸 RUNTIME EVALUATION (TESTS ACTUALLY RUN)

- Prior unique suite182 +10 new compatibility +25 new canonical/serving tests = **217/217 PASS**. Final runs:158 SE03 tests and59 SE04 tests. Repeated reviewer runs do not increase the unique total.
- Four reviewer-found regression cases failed before repair (two ID cases, two required-string cases), then passed after. Independent reviewer reran all25 canonical tests and both groups of original probes.
- Actual compatibility CLI exit0:2,912-row exact shared-field parity; eight transforms; physical source preserved; output SHA256 `35c598e6673416894cf6062097cbd17caad91e52eb6287cd0b51d640fdd61ebe`.
- Actual final canonical/serving CLI exit0: `CANONICAL_REPLAY_AND_SERVING_QA_REVIEW_ONLY`, 2,912 rows/33-field replay equality, valid foreign keys/parents, scope cohorts, exact frozen/public FY26 serving amounts and metadata.
- Existing frontend function-contract harness PASS:2,256/22 accepted overall;1,134/11 selected FY26; exact net and30 AIA;0 warnings. No DOM or browser claim.
- Review CI updated to run these synthetic tests. Completed hosted CI acceptance is **not claimed**.

Reproducible operator steps (explicit local inputs only):

```bash
# In se-03-extract-normalize
python3 -m unittest -q test_se03_frozen_v1_compat
python3 se03_frozen_v1_compat.py --candidate-jsonl /private/source_records_LOCAL_ONLY.jsonl \
  --frozen-csv /private/frozen_FACT.csv --out-dir /private/new-compat-directory
# In se-04-reconcile-qa
python3 -m unittest -q test_se04_canonical_serving
python3 se04_canonical_serving.py --input-manifest /private/input_manifest.json \
  --manifest-sha256 EXACT_MANIFEST_SHA256 --out-dir /private/new-qa-directory
```

The manifest maps each required input name to a relative local `file` and exact
`sha256`. Required names: `compat`, `frozen`, the12 dimension/catalogue tables in
`DIM_IDS`, `MAP_Public_Categories`, frozen `DS_SpendingExplorer`/`DS_Every100`,
`public_spending`/`public_every100`, and `op_subprogramme`/`op_activity`. Keep the
manifest and files private. Full exact code/input pins, captured results and
frontend blob identities are in `SE04_COMPAT_SERVING_RECEIPT_20261109.json`.

#### 🔸 GENERATED TEST CASES (PROPOSED)

All35 newly authored test methods were executed. No unexecuted test is counted
as passed. Future changed sources, candidate batches and approved mappings need
their own versioned fixtures/profile; this fixed-baseline command is not yet a
general autonomous source-update pipeline.

**Acceptance boundaries and next action**

| Gate | Current disposition / required next evidence |
| --- | --- |
| Eight equal-amount identity differences | Owner-approved compatibility path implemented and tested; raw difference receipt preserved; no Activity-grain model adoption |
| FY26 canonical and serving replay | Local review evidence passes as described; three old provenance references explicitly inherited |
| Independent FY25 source | Still open; previous financial/model checks and frontend row acceptance do not replace source extraction |
| Historical source diagnostic worklists | Preserve originals; formally cross-reference each to the new source evidence before declaring individual closure |
| Production workflow acceptance | Hosted CI, SE02/SCAN01, durable human decisions, shadow/readback/rollback and explicit release authorization remain open |

Original Approved CSV stays rejected as incomplete; Presented is supporting
only. No frozen/operational/public workbook, source values, active workflow,
scanner or production state changed. EAA and corrected CheckpointC remain
paused. PR42 stays draft/unmerged; automatic pipeline production NO-GO.

```text
[CROSS_AGENT_HANDOFF]
NEXT_AGENT: source-driven-dev
ROUTE_STATE: [IN PROGRESS]
INSTRUCTION: Prepare independent FY25 source reconstruction and explicit historical-worklist closure using the preserved source lineage; retain the fixed FY26 compatibility profile and pending human/release gates. Do not merge, publish, alter models or activate workflows.
CONTEXT: Draft PR42; FY26 source-only candidate preserved, eight owner-approved v1 compatibility rules,2,912-row replay and1,134/11 frozen/public serving QA pass. Three provenance fields are inherited baseline references. EAA/CheckpointC paused.
EVIDENCE: SE04_COMPAT_SERVING_RECEIPT_20261109.json;217 unique local tests; two scoped reviews and verified repairs; frontend function-contract check without browser/production claim.
[/CROSS_AGENT_HANDOFF]
```
