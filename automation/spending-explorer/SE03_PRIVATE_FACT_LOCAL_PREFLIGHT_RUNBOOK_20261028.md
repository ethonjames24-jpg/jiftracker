# SE-03 private FACT export and local-only preflight

**Approved status:** local proof-of-concept preflight built and **10/10 synthetic tests PASS**; not run on the user's private FY26 CSV, and source-to-budget value matches are **NOT** certified. Report-only, no production release. This is a staging/operational runbook; the preflight code is distributed as a standalone ChatGPT conversation artifact, not yet merged or installed in an n8n workflow.

## Grounded source and workbook contract

Connected governed workbook (read only): `1xaNCRt_vMPxBjB56SuqoUKOyXRpsHnd5lX6t06hsQX0`, visible tab **FACT_Government_Spending**. Its export has **exactly 33 ordered columns** from `fact_id` through `budget_type`; row grain: 2,912 FY26 FACTs, 2,801 `Activity`, 81 `Programme`, 30 `Vote`/AIA, of which 114 rows are Capital Budget 6. Capital PDF prints `Project 29532` while the canonical source_row text says `Activity 29532`; preserve that distinction and require source evidence. Frozen source `SRC_EOE_2026_27_PASSED`, version `AS_PASSED`.

## Minimal manual operation

1. Open the operational Google Sheet and activate **FACT_Government_Spending** tab, not the whole workbook or monthly tracker.
2. Use File → Download → Comma-separated values (.csv) **for current sheet**. Keep it in private Mac Downloads; do not copy/upload the export to GitHub, public Sheets or chat.
3. Save the provided local `jif_se03_private_fact_preflight_20261028.py` artifact to Downloads. Run:

```bash
python3 "$HOME/Downloads/jif_se03_private_fact_preflight_20261028.py" \
  --fact-csv "$HOME/Downloads/FACT_Government_Spending.csv" \
  --inventory-json "$HOME/Downloads/JIF_SE03_PDF_Page_Review_20261028/se03_pdf_page_inventory_capital_v2_review_only.json" \
  --report "$HOME/Downloads/JIF_SE03_PDF_Page_Review_20261028/se03_fact_private_review_summary.json"
```

If the actual CSV is named differently, replace the `--fact-csv` path with its actual file path. The preflight reads and SHA-256-hashes the private CSV; only a **status-count summary, failure codes and sample FACT identifiers** are printed and written locally. It asserts source PDF inventory hash/page count, exact ordered header, unique IDs, date/source identity, source page, FY26 baseline totals, budget suffix, AIA signed-negative status and review-only printed Activity/Project/Programme grain. It never validates PDF economic-column coordinates or financial row acceptance.

**Expected report outcome:** either `FACT_REVIEW_QUEUE_PREFLIGHT_PASS_REVIEW_ONLY` with unresolved categories, or `FAILED_CLOSED` with exact structural reasons. Both outcomes mean `publication_authorized=false`, `full_2912_row_source_reconstruction_accepted=false`.

4. Return **only the sanitized command output or summary JSON**, not the raw private CSV. If a source-context error occurs, investigate the relevant PDF and row; do not auto-correct. Next phase is independently source-derived 2,912/33-field amount and hierarchy reconciliation and historical 112/67/24/30 worklists.

## Current engineering validation

Local prototype `jif_se03_private_fact_preflight_20261028.py` (169 lines, Git blob SHA-1 `7cf3a77bb58ecada94e8a402dc07f8708a01ab16`) compiled, 10/10 synthetic tests PASS. Synthetic cases: Capital source Project vs canonical Activity, absent Head, Head-vote suffix mismatch, source change, wrong PDF pin, duplicate FACT IDs, positive AIA, wrong 33-column header, NaN amount, and refusal to certify financial reconstruction. **No native real-data execution yet.** Tool script is local conversation artifact; it is not an approved PR code module or a completed CI result. This runbook deliberately does not treat a preflight PASS as full source matching.

## Full project status

Refer to `SE_COMPLETION_GATE_REGISTER_20261028.md`. Three stale `QA_HIER_005–007` failures are scope-based: 316 FY26 subprogrammes + 32 FY25 = 348 all-year, 766 FY26 activity/projects + 74 FY25 = 840 all-year. Historical check statuses still require controlled versioned FY-scoped correction; no live sheet mutation authorized. Draft PR #42 remains unmerged and release NO-GO.

## 2026-10-28 — PR source parity and pinned native launcher added

The exact locally-tested `jif_se03_private_fact_preflight_20261028.py` source has now been committed as `se03_private_fact_preflight.py`, Git blob SHA-1 `7cf3a77bb58ecada94e8a402dc07f8708a01ab16` matching the local 10/10 test run. The 10 synthetic tests were committed as `test_se03_private_fact_preflight.py`, blob SHA-1 `1af6934e64f24412d5e49ef3e3534b0a094971fe`, and retested locally with the exact renamed module: **10/10 PASS**. Read-only CI updated to 70 intended synthetic tests; actual GitHub-hosted run still PENDING.

The versioned `run_se03_private_fact_preflight_native.sh` launcher fetches both files pinned to immutable commit `837ada320e2f54835d2ba66f8656e1acb5a21f16`, checks their exact Git blob identities, runs ten tests and then the private local CSV review. It automatically identifies the CSV only when **exactly one** Downloads filename matches `*FACT_Government_Spending*.csv`; otherwise provide explicit `JIF_SE03_FACT_CSV=/absolute/private/path.csv`. It uses `~/Downloads/JIF_SE03_PDF_Page_Review_20261028/se03_pdf_page_inventory_capital_v2_review_only.json`, generates `se03_fact_private_review_summary.json` locally with `umask 077` and never uploads the private export.

One-step Mac launcher download:
```bash
curl --fail --location --show-error \
  "https://raw.githubusercontent.com/ethonjames24-jpg/jiftracker/2c7c5ccab7bcb91109832e0bbd2796f555f3ab0b/automation/spending-explorer/se-03-extract-normalize/run_se03_private_fact_preflight_native.sh" \
  -o "$HOME/Downloads/jif_se03_fact_preflight_20261028.sh"
bash -n "$HOME/Downloads/jif_se03_fact_preflight_20261028.sh" &&
bash "$HOME/Downloads/jif_se03_fact_preflight_20261028.sh"
```

This corrects the earlier note that code was only a conversation artifact. **Only the preflight program and tests are now PR-versioned; real private operator execution remains pending.** No full source-to-value acceptance should be inferred from a preflight PASS.


## Operator 404 and correction — 28 October 2026

**Owner Mac result:** the first native launcher file downloaded (2,413 bytes) and the command reached the launcher's internal code fetch, but `curl: (56) The requested URL returned error: 404`. This is not a private data or As Passed PDF validation outcome. GitHub connector verification proved the original immutable pin `3b72fc2a09952e4c56868598c577f1b30f37d2d9` contained `se03_private_fact_preflight.py` but **not** `test_se03_private_fact_preflight.py`, which was committed later. This was an engineering pin-order error.

**Corrective action:** `run_se03_private_fact_preflight_native.sh` now pins immutable commit `837ada320e2f54835d2ba66f8656e1acb5a21f16`, independently verified to contain **both** files with the originally expected Git blob IDs `7cf3a77bb58ecada94e8a402dc07f8708a01ab16` and `1af6934e64f24412d5e49ef3e3534b0a094971fe`. Added explicit `FAILED_CLOSED_PINNED_SOURCE_FETCH` with filename and commit if a future fetch fails. The replacement shell script Git blob is `70f779b37bdc86517392a18b1a78c126e438b80a`; an independent local copy is **byte-identical** to the committed source and `bash -n` passed. The 10 source/test synthetic regression cases passed locally; the corrected Mac native execution is **PENDING**.

Current corrected launcher download (the actual script is at commit `4e8a10ed4fa416e8f493846176701494a034d53d`, containing the launcher fix):

```bash
curl -fL --show-error \
  "https://raw.githubusercontent.com/ethonjames24-jpg/jiftracker/4e8a10ed4fa416e8f493846176701494a034d53d/automation/spending-explorer/se-03-extract-normalize/run_se03_private_fact_preflight_native.sh" \
  -o "$HOME/Downloads/jif_se03_fact_preflight_20261028.sh"
bash -n "$HOME/Downloads/jif_se03_fact_preflight_20261028.sh" &&
bash "$HOME/Downloads/jif_se03_fact_preflight_20261028.sh"
```

Operator must still export the private `FACT_Government_Spending` tab as local CSV if absent. **No real-data preflight pass has been observed.** Source-derived 2,912-row reconciliation, the historical 112/67/24/30 queues, GitHub-hosted CI and production release remain open.
