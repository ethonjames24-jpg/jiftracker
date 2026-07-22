# JIF Budget Tracker and Spending Explorer Engineering Handoff

Last reviewed: 2026-07-22

This is the current operational handoff for the public Jamaica In Focus Budget Tracker and Government Spending Explorer. It is authoritative for the standalone Vite application in `jif-budget-tracker-source/`. The older `memory/PRD.md` records useful project history, but some early FastAPI references there describe a retired prototype rather than the current production architecture.

## 1. Production scope

- Public site: `https://tracker.infocusja.com`
- Cloudflare Pages project: `jiftracker`
- Production branch: `main`
- Application: static React/Vite frontend; there is no required application backend.
- Monthly Tracker route: `/` or `/?month=YYYY-MM`
- Government Spending Explorer route: `/?view=spending`
- Admin checklist route: `/?admin=checklist&month=YYYY-MM`
- Capture routes: `/?month=YYYY-MM&capture=hero|kpi|sources`

Route precedence is intentional: capture and admin views take priority over the additive Spending Explorer query. Do not change that ordering without regression tests for every public route.

## 2. Data and system boundaries

The public application is read-only.

### Monthly Tracker

- Workbook setting: `VITE_GOOGLE_SHEET_ID`
- Public tabs: `DS_MonthlyTracker`, `DS_PublicMonthlyExtras`, and `archive`
- Loader: `src/services/googleSheets.js`
- Orchestration: `src/hooks/useTrackerData.js`

### Spending Explorer

- Separate workbook setting: `VITE_SPENDING_EXPLORER_SHEET_ID`
- Public tabs: `README_Control_v1_1`, `DS_SpendingExplorer_v1_1`, `DS_Every100_v1_1`, `Source_Catalog_v1_1`, and `DS_AnnualComparison`
- Loader: `src/services/spendingExplorer.js`
- Model/filter logic: `src/utils/spendingExplorerModel.js`
- Orchestration: `src/hooks/useSpendingExplorerData.js`

The private model, QA, staging, reconciliation, fact, and subscriber workbooks must never be referenced by the browser bundle. The frontend must never write to a Google Sheet.

### Subscriber workflow

The subscription form sends a restricted payload to `VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL`. n8n owns validation, consent timestamps, confirmation, subscriber storage, and notification history. The frontend does not read the subscriber workbook and does not store subscriber records in browser storage.

The monthly subscriber-send workflow is operationally separate from this site deployment. A frontend failure must not activate, rerun, or mutate an n8n workflow.

## 3. Failure containment

These controls prevent one error from spreading across the platform:

1. **Separate data loaders.** Monthly Tracker and Spending Explorer use separate IDs, tabs, hooks, and model logic.
2. **Fail-closed Explorer release gate.** Explorer serving rows are not requested until the v1.1 controls confirm release authorization, schema, contract, currency, and AIA treatment.
3. **Lazy-loaded Explorer.** Explorer code is loaded only for its route; a bundle or runtime problem in that branch should not be allowed to break the default Tracker route.
4. **Read-only browser access.** No public component has Sheet write credentials or private workbook access.
5. **Optional-data degradation.** Noncritical monthly extras degrade to controlled empty states or warnings; they must not erase already loaded core tracker data.
6. **Manual publication boundaries.** Publishing data and sending subscriber emails remain human-gated operations outside the React application.
7. **Previous deployment remains available.** Do not start duplicate Cloudflare deployments when a build is merely queued or in progress. Wait for a terminal result first.
8. **Small releases and explicit staging.** Stage only intended files, run the complete test/build gate, and verify the live asset after Cloudflare reports success.

## 4. Interaction system

The July 2026 interaction pass brings Monthly Tracker cards in line with the Spending Explorer:

- Major cards lift and receive a stronger shadow on hover.
- Metric tiles, comparison tiles, and KPI table rows receive a scanning highlight.
- Linked source/archive cards also react to keyboard focus through `:focus-within`.
- Hover behavior is restricted to `@media (hover: hover) and (pointer: fine)` so touch devices do not retain sticky hover states.
- Existing reduced-motion rules remain authoritative.
- The behavior is progressive enhancement only. Data loading, calculations, navigation, forms, and publication logic do not depend on it.

The rules live in `src/styles.css` under the comment:

```css
/* Match the Explorer's responsive card treatment across the monthly tracker. */
```

## 5. Required validation gate

Run from `jif-budget-tracker-source/`:

```bash
npm test
npm run build
```

Before committing:

```bash
git diff --check
git status --short --branch
```

Minimum release acceptance:

- All automated tests pass.
- The Vite production build succeeds.
- No private workbook ID, credential, subscriber record, or secret is added.
- Monthly, Explorer, admin, and capture route precedence remains covered.
- Touch and reduced-motion behavior remains safe for visual interaction changes.
- The intended files are the only staged files.

## 6. Deployment and verification

1. Commit the validated change to the approved branch.
2. Push or publish it to GitHub `main` through an authenticated route.
3. Wait for the GitHub `Cloudflare Pages` check for the exact commit to reach a terminal conclusion.
4. Do not create a second deployment while the same commit is still `queued` or `in_progress`.
5. On success, request the public page without relying on a cached browser tab.
6. Confirm that the HTML references the new built asset and that the expected rule or behavior is present in the live asset.
7. Check the Monthly Tracker and Spending Explorer entry routes return successfully.
8. Record the commit, test result, build result, Cloudflare conclusion, and live verification in the release history.

If Cloudflare fails, leave the last successful deployment serving traffic, inspect the failed build logs, correct the smallest responsible change, rerun the local gate, and publish a new commit. Do not change Google Sheets, n8n, DNS, or subscriber records to compensate for a frontend build failure.

## 7. Rollback

Preferred recovery order:

1. If the new deployment never became active, make no production change; diagnose the failed build.
2. If the new deployment is active and defective, use Cloudflare Pages to roll back to the last verified deployment.
3. Revert the responsible Git commit with a new revert commit; do not rewrite shared `main` history.
4. Re-run tests/build and verify the rollback deployment live.

Never use a rollback to alter public data, Google Sheet history, n8n execution history, or subscriber notification records. Those systems require their own reconciliation procedures.

## 8. Current release record

### 2026-07-22 — Tracker interaction parity

- GitHub commit: `385b2cd` — `Match tracker card interactions to Explorer`
- Related documentation commit: `2eeee43` — `Document active Explorer v1.1 feed`
- Scope: `src/styles.css` plus Explorer v1.1 README corrections
- Automated tests: 21 passed, 0 failed
- Production build: passed
- Cloudflare Pages: completed successfully for `385b2cd`
- Live verification: Monthly Tracker and Spending Explorer both served `/assets/index-Ckas2xdc.css`; the fine-pointer hover media query, card lift, and KPI-row highlight rules were confirmed in the production asset
- No changes to Google Sheets data, n8n workflows, subscriber records, DNS, or credentials

## 9. Handoff rule for future work

Every completed work package must update this handoff or an equally specific adjacent runbook with:

- purpose and user-visible behavior;
- files and components changed;
- data contracts and system boundaries affected;
- failure modes and containment;
- tests and build results;
- commit and deployment status;
- live verification;
- rollback or reconciliation steps;
- known limitations and next safe task.

Code is not considered fully handed off when only the implementation exists.
