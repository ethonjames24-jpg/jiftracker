# JIF SE-03 — sample context review of uploaded economic report

**2026-10-28. Review only. No financial acceptance or release.**

The uploaded economic report (2,061 bytes) repeats the native 2,912-row classification and original hashes, but contains only five sample FACT IDs per status. It does not contain full 419/258/10 case lists or PDF word coordinates. The user-uploaded 716-page inventory and read-only bounded current-sheet FACT sample inspection were cross-checked without disclosing amounts.

| Cohort | Sample FACT | PDF page | Evidence and unresolved scope |
| --- | --- | ---: | --- |
| Multiple candidates | FACT_EOE_AP_00001–00005 | 13 | Head 01000; Programme 163, Activity 10001; authorized-by-law ECON 21/22/24/25/32. Multiple numeric cells require PDF Y geometry |
| Multi-section | FACT_EOE_AP_00025–00029 | 19 | Head 02000; Programme 164; printed Sub Programmes 20 and 21 BOTH present, Activity 10354 appears under both in FACT. Cannot resolve from numeric match alone |
| No bounding-box match | FACT_EOE_AP_00179 | 69 | Recurrent Activity 10005; Head 15000, Programme 437, ECON 25. No candidate is NOT a missing budget line |
| No bounding-box match | FACT_EOE_AP_00494 | 177 | Capital **Project 29555** under 19000C; ECON 32. The model calls this Activity; preserve official label distinction |
| No bounding-box match | FACT_EOE_AP_00701/00702 | 238 | Recurrent Activity 10099, Head 20000, Programme 137, ECON 21/99 |
| No bounding-box match | FACT_EOE_AP_00883 | 300 | Recurrent Activity 10313, Head 20019, Programme 136, ECON 28 |
| Programme | FACT_EOE_AP_02802–02806 | 61 | Programme 001 Head 15000; page also includes Activity 10002. Separate Programme source method |
| Vote AIA | FACT_EOE_AP_02883–02887 | 12/26/59/108/116 | Head-scope examples 01000/05000/15000/15039/15063. Head presence is not amount verification |

**Accepted classification:** 2,114 unique Activity numeric candidates (review only), 419 multiple, 258 multi-heading context, 10 absent within current bounding boxes, 81 Programme, 30 Vote AIA. Activity geometry: 2,364 one, 427 multiple, 10 none; 250 of the one-candidate cases and 8 multi-candidate cases withheld because of section context. No canonical source-derived record accepted.

**Next bounded work:** a local-only, source-pinned geometry diagnostic has been packaged in the conversation as jif_se03_pdf_geometry_probe_20261028.zip. Source SHA-1 Git blob f710b5c25afd20b4e1d7cab5d00054d6f500b285; ten local synthetic tests PASS, test blob da01e595835185e1deb8c7a90a8c875a5d590650. Bash syntax PASS. It records candidate Y coordinates and printed heading-code locations for the full **798-case** non-unique/separate-method cohort, full case queue stays local. Sanitized report includes at most eight examples/status; no amounts. Code is a conversation artifact, not yet merged or PR-versioned, and native real-PDF operation is pending.

**Open:** all 2,912 canonical 33-field source reconstructions; historic 112/67/24/30 exception lists; Programme/AIA source methods; serving QA/CI; PR #42 remains draft/unmerged; no model/public Sheet write or production authorization.
