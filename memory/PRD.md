# Jamaica In Focus Budget Performance Tracker PRD

## Original Problem Statement
Create a professional live web dashboard for the Jamaica In Focus Budget Performance Tracker. The dashboard must connect to the same Google Sheets workbook currently used for the tracker, read live data from the Google Sheet, update whenever the sheet is updated, and remain read-only. The dashboard should use Jamaica In Focus civic accountability styling with yellow/gold, black, white, deep green accents, and red warnings. Required sections include current month overview, KPI summary cards, KPI breakdown table, source documents, archive, methodology, and footer branding.

Google Sheets workbook: https://docs.google.com/spreadsheets/d/13npg-j5jjMzE115EOkkBdq7Rav1L5-RUPl1rza5e_v0/edit?usp=sharing

User choices:
- Use public CSV export / published Google Sheet method first, read-only only.
- Use the provided Jamaica In Focus logo in header and footer.

## Architecture Decisions
- Frontend: React app with responsive component-based dashboard sections.
- Backend: FastAPI endpoint `/api/tracker` fetches public Google Sheets CSV exports server-side and returns cleaned JSON.
- Data source: Google Sheets `DS_MonthlyTracker` and `archive` tabs via read-only public CSV export.
- No sheet write, edit, delete, authentication, or credential-exposing functionality was added.
- Backend groups DS_MonthlyTracker rows by displayed month label and uses the first display-order row as the selectable month key to handle the sheet’s current April layout.
- Archive month labels are normalized for public display, e.g. `Apr-2026` becomes `Apr 2026`.

## User Personas
- Public readers who want a clear, mobile-friendly explanation of Jamaica’s monthly fiscal performance.
- Jamaica In Focus editors/publishers who need a polished dashboard that updates from the approved tracker sheet.
- Civic/accountability audiences comparing monthly outturns against budget baselines.

## Core Requirements
- Display latest available month by default.
- Show current month, tracker state, overall status, KPI count, On Track count, Watch count, and Under Pressure count.
- Display `what_changed` and `monthly_note` summary cards.
- Display KPI table sorted by `display_order` with KPI, annual baseline, monthly outturn, read/variance, and status.
- Use status-colored badges: green On Track, amber Watch, red Under Pressure.
- Display source documents and source basis text.
- Display archive records from the `archive` tab.
- Include static methodology, indicators, status category explanations, and disclaimer.
- Include Jamaica In Focus logo/branding in header and footer.
- Stay read-only and public, without login.
- Handle loading, error, blank fields, duplicates, and mobile responsiveness.

## Implemented — 2026-05-31
- Built live FastAPI `/api/tracker` feed connected to the public Google Sheets CSV export.
- Built polished Jamaica In Focus dashboard UI with header, logo, month selector, overview, KPI summary cards, KPI table, sources, archive, methodology, and footer.
- Added robust data cleanup: duplicate avoidance, KPI sorting, count calculations, archive normalization, and graceful missing-field display.
- Verified April 2026 expected values: Under Pressure, 8 KPIs, 2 On Track, 0 Watch, 6 Under Pressure.
- Verified all 8 KPI statuses match requirements.
- Verified desktop and mobile layouts, production build, and backend regression tests.

## Test Results
- Backend API curl verified live sheet data and expected counts.
- Frontend screenshots verified desktop and mobile render with no horizontal overflow.
- `yarn build` completed successfully.
- Backend regression tests: 6 passed.
- Focused archive UI check confirmed `Apr 2026` and `Under Pressure`.

## Prioritized Backlog
### P0 Remaining
- None for the requested MVP.

### P1 Next Tasks
- Add simple charts for status distribution or KPI pressure mix.
- Add month-over-month comparison once additional months are available.
- Add source-document links if the sheet begins storing URLs.

### P2 Future Enhancements
- Add export/share image card for social distribution.
- Add print-friendly report view.
- Add KPI glossary detail drawer using `kpi_dictionary` tab.

## Next Tasks List
- Review dashboard wording and source labels with Jamaica In Focus editorial team.
- Add charts after more live months are added to the workbook.
- Consider adding public share cards for individual monthly tracker updates.

## Implemented — 2026-05-31 Code Review Fixes
- Refactored backend tracker transformation into smaller helpers for validation, grouping, KPI sorting, counts, archive normalization, and payload construction.
- Hardened CSV row handling to avoid stale/undefined row references and handle sparse repeated month fields safely.
- Fixed React hook dependencies in App and toast hook, removed nested ternary styling logic, and replaced magic timing values with named constants.
- Re-verified live API values, backend tests, frontend lint, production build, and dashboard screenshot.

## Implemented — 2026-05-31 Additional Code Review Cleanup
- Moved tracker data loading into a dedicated React hook to reduce App component complexity and keep hook dependencies explicit.
- Simplified toast reducer responsibilities into focused helper functions and removed the extra subscription callback closure.
- Further decomposed backend tracker row validation into month-context helper functions.
- Added type hints to tracker API tests.
- Re-verified Python lint, JavaScript lint, backend tests, production build, and live dashboard screenshot.

## Implemented — 2026-05-31 Final Code Review Cleanup
- Converted tracker helper functions into hook-scoped callbacks so dependency arrays are explicit and warning-free.
- Removed production console warning from CRACO optional visual-edit fallback.
- Replaced remaining literal timeout with named time-unit constants and preserved named summary-card animation timing.
- Adjusted backend value cleanup to avoid the reported literal identity-comparison pattern.
- Re-verified JavaScript lint, Python lint, backend tests, production build, and live dashboard screenshot.

## Implemented — 2026-05-31 Standalone Source Package
- Created independent React/Vite source package at `/app/jif-budget-tracker-source`.
- Added package-lock, README, setup/build/deployment instructions, local logo asset, and public CSV Google Sheets connection docs.
- Verified `npm install`, `npm run dev`, live data loading, and `npm run build`.
- Created downloadable ZIP at `/app/jamaica-in-focus-budget-tracker-source.zip`.
