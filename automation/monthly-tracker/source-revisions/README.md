# JIF Monthly Tracker — Official Source Revision Monitor v1.0

New, isolated monthly-tracker package. Existing CGO/preparation/review/publication workflows and Spending Explorer are unchanged.

Import `workflows/JIF_Monthly_Tracker_Source_Revision_Monitor_INACTIVE.json` as a **new** workflow. It has 22 nodes, no workflow ID or credentials, active=false, a disabled daily trigger and default REPORT_ONLY configuration. Manual execution in that default mode returns CONFIGURATION_REQUIRED with no network, archive or table writes. It is not an installed or scheduled monitor yet.

After setup, OBSERVE mode reads the anonymous published tracker/extras, the official CGO listing and two new private n8n Data Tables. It serially fetches original/published/listed XLSX URLs, compares exact bytes, archives new candidates to the dedicated private Drive folder, reads the saved bytes back and checks SHA-256, then upserts observation rows. No workflow calls, public-feed writers, Google Sheets nodes, subscriber sends or financial adoption exist in this graph.

The default schedule is 08:00 America/Jamaica, disabled pending native manual acceptance. Manual Prepublication Check uses the same graph before a new monthly release. Current financial year is April–March, derived from the check date. Each published month must contain all eight expected KPIs and an unambiguous original/listed source. Ambiguous/missing/failed sources fail closed. The current listing's dates are not treated as first-publication dates.

## Files

- `docs/INSTALL.md`: exact native setup, tests, concurrency and rollback.
- `docs/CONTRACT.md`: states, limits, identity and future-month intake.
- `docs/EXISTING-WORKFLOWS.md`: Drive source inventory and preserved integration boundaries.
- `config/BASELINES-SEED.csv`: five verified source baselines for import into a NEW table.
- `config/OBSERVATIONS-EMPTY.csv`: new observation-table column names; create all columns as String, no seed rows.
- `config/REVISION-REGISTER.json`: manually seeded April–June review records; none adopts later figures.
- `scripts/reconcile-workbooks.py`: restricted, read-only worksheet-A financial reconciliation for review.
- `fixtures/`: exact audited workbook bytes and listing snapshot, not replacement public receipts.

## Local checks

Run `npm test` and `npm run build` in this package. Python semantic tests: `python tests/workbooks_test.py`. Offline evaluator dependency: `openpyxl==3.1.5` (in requirements.txt). No new dependency is installed in the website or native n8n runtime.

`python scripts/reconcile-workbooks.py 2026-06 fixtures/Copy-of-CGO-June-2026.xlsx fixtures/Copy-of-CGO-June-2026-1.xlsx` prints the 8-KPI diff. It does not run Excel/macros, write a workbook, publish data or access a network. Unsupported formula/layout/FY/units/zero-baseline cases stop for review. Stored caches are checked against the restricted evaluator, not accepted as proof by themselves. This is not a general Excel recalculation engine.

## Native evidence boundary

Local fixture and VM checks validate the generated code/topology. They do not prove native n8n import, task-runner behavior, credentials, Drive access, table mappings, durable retries/concurrency or daily scheduling. The JSON is a concrete import candidate; native acceptance is still required. No connection to the live n8n service was available in this build, and no existing workflow was changed or executed.

Case IDs are stable for a period/URL/observed hash. Repeat sequential checks preserve first_seen and reuse an archived evidence ID. This is logical deduplication, not a claimed distributed exactly-once guarantee. Do not overlap scheduled/manual runs until the native concurrency test is accepted. Duplicate stored observation identities fail closed on the next read. Observations contain no editorial decision fields; the separate review register controls adoption decisions.
