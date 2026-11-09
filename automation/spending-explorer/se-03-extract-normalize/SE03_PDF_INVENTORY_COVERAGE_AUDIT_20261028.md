# JIF SE-03 — 716-page As Passed heading coverage audit (2026-10-28)

**STATUS: REVIEW ONLY.** Source: user's uploaded `se03_pdf_page_inventory_review_only.json`, 362,384 bytes, SHA-256 `198bf38e579aeb8d971c154e6aee3fee0ba8ed066ed67d02bada3006d4466564`. Inventory's original PDF SHA-256 field matches pinned As Passed SHA `32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6`; separate owner native output verified that physical PDF. 716 consecutive, unique physical page records.

## Page heading-detection totals (not source-to-FACT parity)

| Heading | Pages with detected code | Multiple distinct codes on same page |
| --- | ---: | ---: |
| Head | 554 | 0 |
| Budget | 657 | 0 |
| Function | 601 | 18 |
| SubFunction | 528 | 0 |
| Programme | 528 | 0 |
| Sub Programme | 268 | 31 |
| Activity | 366 | 191 |
| Project | 42 | 0 |

408 pages contain at least one Activity/Project heading. 399 pages have one explicitly identified Head + Budget + Programme code. 49 pages have multiple function/subprogramme codes; 19 have zero headings recognized by this parser (pages 1–10, 79, 120, 127, 147, 208, 351, 551, 691, 716). These are detector outcomes, not assertions that the PDF pages lack such content.

**Critical issue:** all **143** pages detected as Budget 6 (Capital) have **zero recognized Head codes**, although 129 of these have Programme and 42 have Project codes. This blocks strict Head/Budget/Programme continuity validation for every Budget 6 page. It may reflect a different capital-page layout or a too-restrictive Head regex. **Root cause is not proven** without independently inspecting those source pages; do not synthesize Head values from adjacent pages.

Three structurally adjacent page pairs pass the strict same-Head/Budget/Programme plus previous Activity and no current Activity/Project preconditions: **292→293, 441→442, 681→682**. No economic-column match was checked for these and they are not equivalent to the **112** historical unresolved continuation records.

The uploaded file contains `queue=[]` and `queue_status_counts={}` because the optional private FACT CSV was never supplied. **Not zero exceptions**.

## Source-frozen FACT row grain (read-only live Google Sheet inspection)

`FACT_Government_Spending` FY2026/27 records 1–2,912 are 2,801 `Activity`, 81 `Programme`, and 30 `Vote` source_row grains. The separate `budget_number` distribution is 2,798 Budget 1 and 114 Budget 6 records. These are FACT records, not source PDF pages and not counts of unresolved mismatches. Particularly, 81 programme-grain records is **not** the 24 historical programme-level exception count.

## Next evidence-gated implementation priorities

1. Examine controlling As Passed PDF physical-page image/text for representative Budget 6 pages; establish source-supported Capital Head identification and write positive/negative tests. Preserve source-date/page and exact head evidence; no inferred default or unchecked carry-forward.
2. Keep a distinct Capital `Project` vs frozen `Activity` source_row mapping rule and separate multiple-function/subprogramme cases before running any FACT-based audit.
3. Use a verified private FY26 FACT export/schema for **local-only** queue analysis (do not commit/upload private data). Independently reconcile per-FACT source page, activity/project/other grain, numeric economic value, and canonical 33 fields against the controlling PDF.
4. Historical exceptions **112 continuation / 67 economic / 24 programme / 30 vote AIA** remain open; 2,912 source-derived FACT and serving model parity, hosted CI, SE05/06/07 release and SCAN01/SE02 live intake gates remain open.

**No edits** to approved frozen model, operational/public Sheets, production workflow, scanner, source archive or public website. PR #42 stays **DRAFT/UNMERGED/NO DEPLOY**. This review audit does not authorize publication.
