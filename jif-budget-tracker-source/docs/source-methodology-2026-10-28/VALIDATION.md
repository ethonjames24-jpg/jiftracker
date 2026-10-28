# Source and methodology disclosure — verification

Baseline: production merge `570a2174fc42c472c775414265f5fc320e6ede0c`. Scope: website presentation only. Owner approved retaining as-published history with version-aware notes on October 28, 2026. No later financial variant was adopted. Delivery: reviewable PR, not deployment.

## Result

- `npm test`: 61 tests passed, zero failures/skips. Includes an October 28 public-feed snapshot of all 40 April–August rows and five monthly extras records. Exact financial values, individual and overall statuses/counts, source links, receipt links and JIF update timestamps are preserved. The existing August annual-context link remains unchanged from PR40. Snapshot inputs are not edited by the presentation layer.
- `npm run build`: passed. No dependency or lockfile changes. Bundles are recorded in production-build.txt; build hashes do not authorize deployment.
- `git diff --check`: passed.
- `scripts/run-source-disclosure-check.mjs`: PASS against a detached baseline checkout of the exact production merge. All 40 rendered KPI rows and existing source/budget/receipt links match. All 15 capture-mode/month combinations have identical rendered markup. Five-month source selection, Back/Forward, keyboard Enter on native disclosure, and settled 320/390/768/1440 layouts pass. Both document overflow and clipped source-section content are checked. Zero page errors and zero write requests.
- Existing `scripts/verify-tracker-ui.mjs`: PASS. Five months, Back/Forward, delayed reads, seven unchanged comparisons, four viewport widths, mobile disclosure, focus/invalid-email checks and three mocked subscription responses. Zero real subscription requests.
- Protected-path diff: no edits to automation, .github, services, config.js, hooks, subscriptions, CaptureViews, spending components, public assets/receipts, package manifests or lockfile. CSS additions use `#tracker-main`; source evidence is opt-in to ordinary rendering.

## Behavior and evidence boundaries

Source evidence is pinned to the exact linked URLs and October 28 date review, with SHA-256 for the reconciled April–June snapshots. Date labels distinguish attachment-record creation from the current listing date, name the listed workbook, and show the check date. No new universal publication date is inferred. The old August presentation fallback is replaced by an explicitly labelled record/listing date; actual feed-supplied publication metadata is retained.

April–June financial-impact notes require all eight reviewed KPI amounts/statuses plus the original source URL. Changing an input, status, source URL, duplicating a KPI or selecting an unknown month suppresses the historical financial narrative. The note documents a possible later-version effect and retains original links and receipts. May's five formula repairs leave its published YTD results correct. June's later baseline flips planned surplus to deficit; the note explicitly distinguishes the later comparison from a restatement.

Methodology describes the existing fallback and supplied nonblank overall-status precedence. No scoring function or client status recalculation was added. The October 28 review establishes implementation evidence, not a located standalone historical approval. The website does not claim an earlier approval date for this overall rule.

## Verification repairs and limits

Expanded source filenames/hashes initially caused narrow-card clipping; the public-only wrapping rule fixes it. Browser assertions now check the source section as well as the document, because the existing section hides overflow. Immediate resize checks were transiently unstable; the harness waits at most three seconds for the same bounded-layout conditions before asserting. The final run passes all 20 month/width combinations. Screenshot review confirmed readable wrapped disclosures.

Browser Chromium 153 ran locally with frozen public feed responses, blocked external requests and reduced motion. External brand fonts were blocked, so screenshots show fallback fonts. Header/navigation/floating controls are hidden only during section screenshot capture to avoid overlay artifacts; keyboard and layout checks use the normal UI. Screenshots demonstrate layout, not a live data refresh, native Excel recalculation, full WCAG conformance or subscriber delivery. No production behavior was changed during verification.

## Reproduce

Install the application's existing dependencies in both checkouts. Keep a clean detached baseline at `570a2174fc42c472c775414265f5fc320e6ede0c`. From this branch's application directory:

```sh
npm test
npm run build
git diff --check
BASELINE_ROOT=/absolute/baseline/jif-budget-tracker-source node scripts/run-source-disclosure-check.mjs
```

The harness verifies the baseline SHA and tracked application cleanliness, then starts local Vite servers on 5173/5174 and closes them on completion. Playwright and a compatible Chromium must be available outside project dependencies. Optional PLAYWRIGHT_MODULE, CHROMIUM_PATH and TEST_OUTPUT_DIR select local tooling/artifact paths. To rerun the existing synthetic check, also set JIF_BROWSER_SCRIPT=scripts/verify-tracker-ui.mjs. All subscription responses are mocked and external requests blocked.

The fixture came from the public DS_MonthlyTracker and monthly-extras read on October 28; the archive tab in this harness is derived only for navigation. It does not assert anything about a fresh live archive read. Detailed original source reconciliation and hashes remain in the Drive report linked from PLAN.md.

## Review images

Before/after section images: `before-source-390.png`, `after-source-390.png`, `before-source-1440.png`, `after-source-1440.png`; matching `before-method-*` and `after-method-*` files cover methodology. Full JSON metrics: result.json.

## Rollback and remaining action

Before merge, close the PR to leave production unchanged. After separately approved deployment, revert this focused commit and rebuild/redeploy the prior frontend. There are no data/workflow migrations to reverse. Smoke-test the selected month, source links/dates, methodology and capture views after deployment; confirm the feed remains unchanged. Later workbook adoption/restatement remains a separate owner decision. Spending Explorer remains outside this work.
