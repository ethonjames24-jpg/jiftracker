# FY2025/26 independent source extraction — identity review required

**Checkpoint:** JIF-SE03-FY25-SOURCE-IDENTITY-REVIEW-20261109  
**State:** BLOCKED for historical row acceptance; financial extraction verified, review only.  
**PR:** #42 remains draft and unmerged. Automatic pipeline production NO-GO.

## Verified result

The FY2025/26 As Passed PDF independently yields all 2,900 financial records,
without FACT, staging, crosswalk or baseline amounts as extraction inputs.
All 694 physical pages were examined under PyMuPDF 1.26.6. The 2,869 printed
Activity/Project records and 31 signed vote AIA offsets reconcile exactly:

| Control | JMD / count |
| --- | ---: |
| Authorized by law records | 64 |
| Voted estimate records | 2,805 |
| AIA records | 31 |
| Gross expenditure | 1,309,182,355,000 |
| AIA | -49,133,377,000 |
| Net expenditure | 1,260,048,978,000 |
| Derived Programme residual records | 0 |
| Printed agreeing AIA occurrences | 62 |

Separate comparison against the existing FY25 operational FACT capture gives:

| Nine-field comparison | Count |
| --- | ---: |
| Exact shared signatures | 2,773 |
| Different printed sub-programme code | 95 |
| Different printed activity code | 1 |
| Baseline AIA physical page omitted | 31 |
| Unclassified differences | 0 |
| Programme/economic financial groups compared | 1,122 |
| Financial groups differing | 0 |
| Baseline duplicate financial identities | 1 |

The identity collision is part of the one activity-code discrepancy, not a
128th difference or a duplicate FACT ID. On physical page 579 the source prints
Activity 12303, while the corresponding historical record is assigned to
Activity 10005. Another historical line already uses that activity/economic/
measure/budget identity. Different amounts and unique FACT IDs do not make the
financial identities unique. The source candidate has zero such collisions.

The final comparison therefore deliberately returns **FAILED_CLOSED, exit 2**
while retaining its diagnostics. Financial equality does not approve row identity,
any compatibility rule, a correction to the frozen/operational model, or release.
No FY25 mapping has been applied. This is not independent reconstruction of all
33 governed metadata fields, FY25 canonical replay, or public serving certification.

## Source and byte identities

The existing archived PDF is Drive file `1-Pn-5hk4ieRk1f80rKf54R6gGVO9AlDf`,
27,466,667 bytes, 694 pages. The operational Source_Catalog identifies it as
`SRC_EOE_2025_26_PASSED`, publication date 2025-04-02, with official URL
`https://www.mof.gov.jm/wp-content/uploads/2025-2026-Estimates-of-Expenditure_AS-PASSED-1.pdf`.

Its SHA-256, **first recorded in this work on November 9**, is
`3b198b92fe575454fa22ce20c6e7da7bf55d713f8c5bef506bc3ff08301276aa`.
No earlier independently stored cryptographic pin was found; this does not claim
a match to one. Reading this archive is not a new live acquisition or scanner PASS.

Source candidate SHA-256:
`0522476ddf8cbbc95ea9e5ad6f56c9d5199169f9dff69e9b1c20ea00fb25d627`.
Operational capture SHA-256:
`7b2817004d54e3a321dd4fe11c67bbfc6f5b2901342beb5439b83f20bdaf172a`.
The latter pins locally serialized bounded connected reads, not native export
bytes or an atomic cross-workbook snapshot. Raw captures, per-row differences
and source records stay outside GitHub.

## Implementation and regression boundary

`se03_pdf_source_fy25.py` isolates FY25 printed year headers, source identity,
financial controls and historical Project/AIA grammar. The original FY26 FACT
grammar remains strict. Shared summary labels may align by printed row centers
when numeric and label fonts differ; ambiguous cells still reject. An explicit
FY25 explanatory-subtable option prevents an internal short “Total Activity”
label from closing the following main economic table. FY26 keeps its original
section-boundary profile.

The full FY26 source extraction was rerun: 2,912 records and identical source
output SHA-256
`b927e1d4488286b19d39399f58f04a7d66b407fe7162cdd4c46fa0e94b1a7896`.
All financial controls remain exact. No existing compatibility rule was changed.

Final local synthetic execution: **187 SE03 + 59 SE04 = 246 unique tests PASS**.
Two independent scoped reviews identified parsed-byte hash binding and natural
financial-identity duplicate guards; both were repaired with regression tests.
The final 24-test FY25 suite and actual pinned comparison were independently
retested after the collision repair; no hosted CI acceptance is claimed.

## Historical queue closure remains separate

The original 112 continuation / 67 economic / 24 Programme / 30 AIA memberships,
and later 579+1 / 10 / 3 / 2 diagnostic memberships, cannot be individually closed
from totals or maximum-five/eight sample IDs. Accessible Extraction_Queue entries
are project tasks, not those complete case lists; QA and RECON tables do not
provide the missing membership ledger. Preserve all historic receipts and FAIL
rows. A new source-wide candidate does not erase them.

Required closure evidence is a private, versioned join from each original case
ID and original queue status to current source page/section/cell evidence,
canonical/compatibility disposition and review decision. Until the complete
original local queue memberships are available and joined, individual closure
remains unverified. Do not add overlapping queue totals or equate the new 127
FY25 differences with those earlier FY26 lists.

## Remaining work and next action

| Work block | Current state / next proof |
| --- | --- |
| FY25 source and historical cases | Financial extraction verified; row identity BLOCKED. Prepare a separately versioned disposition for the 95/1/31 differences and collision, preserving this raw receipt; recover original queue memberships for individual closure |
| Scanner and archive | Acceptance preparation complete in `../SCAN01_SE02_ACCEPTANCE_HANDOFF_20261109.md`; current readiness, native scan/archive/concurrency/recovery tests remain unperformed |
| General new-source/batch pipeline | Integrate source profiles, provenance policy, deterministic IDs and SE01–04 handoff; current tools remain bounded offline review implementations |
| Durable human review | Persist reviewer decisions and binding to exact candidate/source hashes; rejection, stale decision and replay checks remain |
| Release | Hosted CI, shadow run, browser/mobile/monthly isolation, readback/rollback evidence and separate production approval remain |

No financial Sheet/public feed write, model correction, n8n/scanner execution,
credential change, merge, deployment, activation or subscriber send occurred.
EAA and corrected Checkpoint C remain paused.
