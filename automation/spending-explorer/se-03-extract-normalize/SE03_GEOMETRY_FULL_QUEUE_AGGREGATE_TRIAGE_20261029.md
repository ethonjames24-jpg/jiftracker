# JIF SE-03 — Full 798-case geometry queue: safe aggregate triage (29 October 2026)

**Authority:** Two user-uploaded local JSONs reviewed in this conversation: sanitized geometry summary and `PRIVATE_LOCAL_ONLY` geometry queue. The complete 798-record queue is NOT committed, copied to Google Drive, or reproduced in this memo. The attached source PDF and private full FACT CSV themselves were **not** independently opened in this runtime. These are **review-only geometric interpretations** and source identifiers, never publication decisions.

## Integrity against accepted operator summary

- Local queue has **798 distinct FACT IDs**, each with a valid 1–716 physical PDF page and one of the five expected non-unique/separate-method statuses; there are no duplicate IDs. Uploaded summary's first eight examples/status agree exactly with first eight queue records/status.
- The summary's **798 queue cases and per-status distinct physical page counts** reproduce from the local queue. **190 distinct PDF pages across the union of all 798 cases**. Per-status page counts are overlapping and non-additive.
- Source PDF SHA claim `32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6`; private FACT SHA claim `8ea4d7ac2b94eb5c8f5831da4b4a989e495e172e23dc6dc5269e6e55555c234c`. These are the same identifiers from native output, **not a new independent PDF/CSV hashing operation**.
- 2,114 separate unique numeric Activity candidates still **review only**; do not equate them with accepted independent monetary source cells.

## Exact geometry/cohort patterns

| Cohort | Cases | Distinct physical PDF pages | Derived geometric breakdown |
| --- | ---: | ---: | --- |
| Multiple amount-conditioned economic candidates | **419** | 111 | 397 recurrent Activity, 22 Capital Project; 418 with two candidate Y locations, one with three |
| Same cohort: one Activity/Project heading, candidate above and below it | **332** | 83 | 310 recurrent, 22 Capital; lower match lies before any subsequent detected section boundary; **geometric triage, NOT a source-correct amount** |
| Same cohort: multiple same-kind Activity headings printed | **87** | 28 | Ambiguous activity instance and programme/sub-programme scope; no source row assignment from queue alone |
| Multiple-section context | **258** | 30 | 250 with one amount-conditioned candidate after an Activity heading; eight with two candidates (one or more may occur before printed Activity) |
| No amount-conditioned bounding-box match | **10** | 8 | Eight recurrent Activity, two Capital Project; absence is not proof that source contains no financial value |
| Programme grain separate method | **81** | 14 | Cannot be reconstructed using Activity-level matcher |
| Vote-level AIA separate method | **30** | 30 | Cannot be reconciled using voted Activity column method |
| **Total non-unique / separate-method queue** | **798** | **190 union** | Exclusive statuses (419+258+10+81+30) |

**Concrete source-heading example, physical page 19**: Sub Programme 20 starts at Y 352.8 and Activity 10354 at Y 368.8, with a numeric candidate Y 413.68. Sub Programme 21 starts at Y 475.2 and Activity 10354 at Y 491.3, with another code/amount candidate Y 541.35. This demonstrates why printed source section bounds are necessary; it is not a completed source-first financial test. **Physical page 13**: sample candidate Y 337.47 and 585.87 straddles printed Activity 10001 Y 479.3; a matched number before an Activity heading must not be assigned to it. A capital no-bounding-box case is official **Project 29555** on physical page 177.

## Fundamental methodological caveat / next gate

The earlier `economic_candidate_count` and `candidate_ys` utilities search for PDF word values **equal to the canonical FACT normalized amount**. Consequently, unique candidate detection is conditional on the model being checked. It is a **location/consistency diagnostic**, not independent source-based extraction. This must be corrected before financial acceptance and should be reflected wherever the figure 2,114 is quoted.

**Source-first local prototype prepared, not yet native-source-executed:** extract printed economic code and one numeric text token from the official As Passed PDF without consulting the FACT amount, require exact on-page Head/Budget/Programme, source Activity-vs-Capital Project heading and bounded position, and only *then* compare the independently extracted PDF text against FACT. Return aggregate statuses without monetary values and with `financial_line_parity_accepted=false`. Distinct Programme/AIA and page-continuation methods remain open. Locally tested **17/17 isolated synthetic tests PASS**. Source Git-style blob `0d8079fada40a220b83c0a7900b26d1bfee341e9`, test blob `ff1b6efddf15f6fe4c845642323fabe6b5248126`; source-first prototype remains a conversation-local ZIP pending real Mac execution and subsequent controlled PR review, not an accepted release implementation.

**All held:** 2,912 complete 33-field canonical source facts, historic 112 continuation / 67 economic / 24 programme / 30 vote AIA worklists, year-scoped QA/serving parity/hosted CI and owner production release gates. PR #42 stays draft and unmerged. No frozen or public Sheet, source archive or workflow change.
