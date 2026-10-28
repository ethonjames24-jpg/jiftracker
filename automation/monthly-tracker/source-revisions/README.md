# JIF Monthly Tracker — Official Source Revision Monitor v1.0.1

New, isolated monthly-tracker package. Existing CGO/preparation/review/publication workflows and Spending Explorer are unchanged.

Import `workflows/JIF_Monthly_Tracker_Source_Revision_Monitor_INACTIVE.json` as a **new** workflow. It has 22 nodes, no workflow ID or credentials, active=false, a disabled daily trigger and default REPORT_ONLY configuration. Manual execution in that default mode returns CONFIGURATION_REQUIRED with no network, archive or table writes. This reusable template is not an installed or scheduled monitor. The separately retained user-supplied native export is configured and inactive; its first OBSERVE and sequential replay are evidenced in docs/NATIVE-ACCEPTANCE.md.

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

Local fixture and VM checks validate the generated code/topology. They do not by themselves prove native behavior. User-supplied native export/screenshots now establish import, configuration-only execution, first OBSERVE, and sequential replay with eight stored rows and preserved first_seen/evidence IDs. Native acceptance remains IN PROGRESS: negative/recovery/concurrency tests, settings/retention, activation and scheduling remain open. No assistant n8n session was used; no existing workflow was changed or executed.

Case IDs are stable for a period/URL/observed hash. Repeat sequential checks preserve first_seen and reuse an archived evidence ID. This is logical deduplication, not a claimed distributed exactly-once guarantee. Do not overlap scheduled/manual runs until the native concurrency test is accepted. Duplicate stored observation identities fail closed on the next read. Observations contain no editorial decision fields; the separate review register controls adoption decisions.

## Native transport corrections

Version 1.0.1 fixes the October 28 setup findings: only the two anonymous Google CSV reads follow redirects (maximum 3); both table reads and all three pre-loop text requests execute once so incoming baseline/observation rows cannot fan out requests. Workbook redirects remain disabled, the loop remains serial, and the publisher boundary is unchanged. Do not reimport the setup-gated template over the configured native workflow. Verify native workflow timezone America/Jamaica and timeout 1200 seconds explicitly; the user export omitted them.
