**SE-03 source-only financial candidate — November 8, 2026**

### 1. 🎯 ARCHITECTURAL SUMMARY

Base: `a8739d550f08878f25a58263aaac4dcad369e8ee`, draft PR42.
State: **IN PROGRESS / REVIEW ONLY / NO PRODUCTION RELEASE**.

The source-only extractor reads the previously accepted official As Passed PDF,
not a staging/FACT amount list. PDF pin: SHA256
`32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6`,
23,172,267 bytes, 716 pages. Source archive:
https://drive.google.com/file/d/1MJGhYxeIaaChVEjFJ01qk2snLbh10aiq/view .
No new live-source acquisition or scanner bypass occurred. Runtime:
Python version and PyMuPDF 1.26.6 recorded in the accompanying aggregate receipt.

**Locked scope:** source-only financial observations; explicit hierarchy and
adjacent-page continuity; review-only arithmetic Programme residuals; signed
AIA once per vote; separate comparison to the existing frozen model. No private
model or output rows committed, no new automatic approval, merge, deployment,
Sheet mutation, n8n execution or activation.

| Source-run control | Observed |
| --- | ---: |
| Candidate records | 2,912 |
| Activity/Project detail | 2,809 |
| Derived Programme residuals | 73 |
| Vote AIA offsets | 30 |
| Authorized / voted / AIA measures | 61 / 2,821 / 30 |
| Gross JMD | 1,490,511,399,000 |
| Signed AIA JMD | -48,730,045,000 |
| Net JMD | 1,441,781,354,000 |
| Programme/economic summary cells read | 1,104 |
| Printed AIA occurrences | 60, reconciled to 30 offsets |

The extractor takes only the PDF. Totals are rejection controls applied after
reading source cells, not used to select values or fill gaps. Candidate records
retain physical page, Y position, printed column bounds and word bounding box.
Programme residuals preserve summary amount, sum of source detail and references
to the subtracted source cells. They are explicitly **derived arithmetic** and
must not be labeled as directly printed Activity amounts.

The comparator runs afterwards on a SHA-pinned candidate and frozen capture.
**2,904 exact matches on the nine shared fields; eight extra/missing signatures.**
All **1,134 Programme/economic financial groups** agree. These groups include
AIA; this does not independently verify public DS metadata or mappings.
Comparator result `SOURCE_TOTALS_MATCH_IDENTITY_REVIEW_REQUIRED`, exit **2**.

**Eight-row exception pack for human review**

| Source scope | Source physical page | Frozen representation | Economic classes | Rows |
| --- | ---: | --- | --- | ---: |
| Head 40000, Function04/SubFunction02, Programme001, SubProgramme01, Activity10005 | 446 | Programme residual, physical page445 | 21,22,23,24,25,29,32 | 7 |
| Head 41051, Function10/SubFunction04, Programme326, SubProgramme24, Activity12816 | 534 | Programme residual, physical page532 | 27 | 1 |

Each pair has the same amount. The candidate has eight more Activity rows and
eight fewer Programme rows than frozen FACT; neither total changes. Printed
detail on pages446/534 was rendered and visually inspected; source context and
summary pages445/532 were read. The record difference is grain and lineage,
**not evidence of missing expenditure or an official accounting error**.

Possible dispositions, neither applied: (A) retain frozen v1 and design an
explicit reviewed compatibility projection, preserving new source-detail
lineage separately; or (B) adopt Activity grain in a new controlled model version
and review foreign keys, serving mappings and historical comparability. No
silent source rekeying, old page substitution or frozen-model rewrite is allowed.

### 2. 🐇 CODERABBIT CHAT & LINE-BY-LINE REVIEW

Two independent review passes covered the four new code/test files and relevant
comparator dependencies. One reviewer also executed actual candidate comparison;
the boundary reviewer independently verified both repairs below. Neither review
claims every printed PDF cell was visually rechecked or production acceptance.

- **File:** `se03_pdf_source_extract.py`
- **Line/Chunk:** `read_cell`, complete-word selection
- **Issue:** [Medium, repaired] A crossing numeric token was ignored when another token fit fully inside the cell. A synthetic probe selected the contained amount despite the ambiguous crossing number.
- **Suggested Fix:** Reject intersecting numeric/dash tokens that cross either boundary before choosing a complete token. Parent regression failed before repair and passes afterwards; independent reproducer now raises the expected error.

```python
if crossing:
    raise SourceRejected("PRINTED_NUMERIC_TOKEN_CROSSES_COLUMN_BOUNDARY")
```

- **File:** `se03_pdf_source_extract.py`
- **Line/Chunk:** Sub Programme transition
- **Issue:** [Medium, repaired] New Sub Programme updated context without clearing the previous active Activity tuple; orphan economic rows could inherit the old Activity/sub-programme.
- **Suggested Fix:** Clear active Activity whenever an explicit Sub Programme heading arrives. Parent regression failed before repair and passes afterwards; independently reproduced and verified.

```python
if kind == "sub":
    subprogramme = code
    active = None
```

The initial full-source run also stopped at page171 because that page repeats
identical fiscal-year headers. The corrected rule accepts repeated observations
only when their column geometry agrees; conflicting geometry remains a blocker.
Both repeated-agreement and conflicting-layout tests were executed. No source
financial count or amount guard was relaxed.

### 3. 🛑 AI "SLOP" & BLOAT DETECTION

No LLM is used for financial extraction or arithmetic. No fallback to FACT
amounts, As Presented values, guessed sub-programmes or an expected-total plug.
The full-PDF extractor uses the already employed PyMuPDF library and pins its
geometry runtime to 1.26.6. Synthetic tests do not require it. An unused test
import identified during review was removed. No speculative publisher/UI work.

### 4. 🛡️ SECURITY & PERFORMANCE AUDIT

All extraction/comparison code is local/offline. Original accepted Drive source
bytes were recovered read-only and exact-hash checked before parsing. New
automatic intake remains governed by SCAN-01/SE-02; this is the previously
approved archived fixture, not a live unscanned acquisition.

Source financial rows, PDF bytes, raw/frozen capture, comparison rows and rendered
PDF pages remain local; only aggregate receipt and source-method notes enter
GitHub. No credentials, subscribers, n8n or production paths are accessed by the
commands. Both source identity and PyMuPDF version are strict gates.

Current-year cell bounds are derived from the centers of printed 2026-2027 and
2027-2028 year labels; the law column is the immediately preceding same-width
cell. Numeric words must fit completely. The prior fixed left-edge window could
include the next year or exclude wide current-year values. That old locator is
not used by this extractor. Page69 was rendered and inspected to corroborate the
column finding. Future different source versions/layouts require new validation.

Page context must be explicit; cross-page state carries only over consecutive
physical pages with identical Head/Budget/Function/SubFunction/Programme. Head C
suffix and Budget6 must agree. Capital Sub Programme headings without a dash are
parsed as explicit headings, not invented carry-forward values.

Programmes are reconciled by source context, economic class and measure. A
negative residual, repeated summary key, detail without summary, missing unit,
ambiguous cell or disagreeing AIA copies fails closed. Two printed AIA copies
must agree; three votes span two physical pages, with the earliest occurrence
used as canonical source page and both retained in lineage. AIA is never added
twice or redistributed.

No new dependency vulnerability scan, timing benchmark or production penetration
test was performed. This review covers the pinned source and scoped offline code.

### 5. 🧪 AUTOMATED TEST CASE SEPARATION

#### 🔸 RUNTIME EVALUATION (TESTS ACTUALLY RUN)

- New extractor synthetic suite: **30/30 PASS**.
- New source comparison suite: **7/7 PASS**.
- Prior SE03 synthetic suites: **111/111 PASS**.
- Existing SE04 suites: **34/34 PASS**.
- Total unique final tests: **182/182 PASS**. Independent repeated test runs are not added to this total.
- Final actual PDF CLI: `SOURCE_FINANCIAL_EXTRACTION_REVIEW_ONLY`, exit0; source-only 2,912-record controls pass. Final guarded rerun yields the same candidate SHA256 as the preceding successful run.
- Final actual comparison CLI: `SOURCE_TOTALS_MATCH_IDENTITY_REVIEW_REQUIRED`, exit2, 2,904 exact matches / eight classified grain/page differences / zero unclassified differences / zero differing Programme-economic financial groups. **Exit2 is expected unresolved parity, not a passing parity gate.**
- Initial source attempt failed closed on repeated headers; two review-found guard regressions failed before repair. These failures are preserved here rather than omitted.

Commands: `python3 -m unittest -q` with existing seven SE03 modules plus
`test_se03_pdf_source_extract test_se03_pdf_source_compare`; separate existing
`test_se04_multiyear test_se04_reconcile`. Source and comparison CLI forms are
in README. Exact source/candidate/frozen/code hashes, interpreter and receipts
are in `SE03_SOURCE_PDF_FINANCIAL_RECEIPT_20261108.json`.

#### 🔸 GENERATED TEST CASES (PROPOSED)

All 37 newly authored test methods were executed; no proposed test is counted
as passed. Future compatibility/adoption mapping and full canonical metadata
contract require their own review fixtures and human disposition. No source
row fixture containing private model data was committed.

**Remaining acceptance boundaries**

| Identified Blocker | Workflow | Required remediation |
| --- | --- | --- |
| Eight source Activity vs frozen Programme identities | Source/model reconciliation | Human disposition, followed by separately versioned compatibility or adoption implementation; keep original facts unchanged |
| Full 33-field canonical metadata/FK contract | Canonical reconciliation | Map source business fields and governed non-source provenance fields explicitly; do not manufacture absent official fields |
| Historical exception closure and serving parity | Reconciliation | Cross-reference prior diagnostic worklists to new source evidence; rerun year-scoped QA and actual public-field/category mapping |
| FY25 source reconstruction | Source verification | Independently extract the approved FY25 source; FY26 success does not cover it |
| Hosted CI and production workflow gates | Release | Obtain current-head hosted test evidence, SE02/SCAN01 qualification, durable human decisions, shadow/readback/rollback and explicit release approval |

The new source-only run supersedes the earlier lack of a direct financial parser;
it does **not** erase historical 579+1/10/3/2 diagnostic records or automatically
close every historical worklist. The original Approved CSV remains incomplete
and rejected; As Presented is supporting only. EAA and corrected Checkpoint C
remain paused. No frozen/operational/public data, scanner/n8n or production
change. PR42 remains draft/unmerged and automatic pipeline production NO-GO.

```text
[CROSS_AGENT_HANDOFF]
NEXT_AGENT: code-review-quality
ROUTE_STATE: [IN PROGRESS]
INSTRUCTION: Review the eight equal-amount source Activity/frozen Programme grain and page differences in this exception pack; choose an explicit versioned compatibility or adoption path before further canonicalization. Do not edit frozen/public models.
CONTEXT: Draft PR42; pinned source-only PDF candidate has 2,912 records and exact controls; 2,904 nine-field matches; full 33-field/serving/FY25/scanner/release gates still open. EAA and Checkpoint C paused.
EVIDENCE: Aggregate source receipt, 182 final local tests, two independent scoped reviews and verified guard repairs; comparator deliberately exits2 for unresolved identity.
[/CROSS_AGENT_HANDOFF]
```
