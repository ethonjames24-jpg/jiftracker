# Jamaica In Focus Budget Performance Tracker

A standalone React/Vite dashboard for the **Jamaica In Focus Budget Performance Tracker**. It reads approved, public tracker data directly from a Google Sheets workbook using read-only public CSV exports.

## What is included

- Full React frontend source code
- Dashboard components, hooks, services, and styling
- `package.json`
- `.env.example`
- Local setup instructions
- Production build instructions
- Deployment instructions for Cloudflare Pages, Netlify, and Vercel
- Google Sheets connection explanation

## Recommended deployment target

This package is a static **React + Vite** app with no backend requirement. Recommended targets:

1. **Cloudflare Pages** — best fit for a fast public static dashboard
2. **Netlify** — also excellent for static React/Vite apps
3. **Vercel** — works too, though Vercel is more commonly preferred for Next.js

Render/Railway are not needed because this standalone version does not include a backend.

## Requirements

- Node.js 18+
- npm 9+

## Local setup

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

## Production build

```bash
npm run build
```

The production files will be generated in:

```text
dist/
```

Preview the build locally:

```bash
npm run preview
```

## Environment variables

Create a `.env` file by copying `.env.example`:

```bash
cp .env.example .env
```

Variables:

```bash
VITE_GOOGLE_SHEET_ID=13npg-j5jjMzE115EOkkBdq7Rav1L5-RUPl1rza5e_v0
VITE_LOGO_URL=/jif-logo.png
```

Both variables are public. No private credentials are required for the default setup. The logo is bundled locally at `public/jif-logo.png`, so the dashboard does not depend on the original upload URL.

## How the Google Sheets connection works

The app uses Google Sheets' public CSV export endpoint:

```text
https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={TAB_NAME}
```

It reads these tabs:

- `DS_MonthlyTracker`
- `archive`

The app fetches CSV data in the browser, parses it, cleans it, and renders the dashboard.

### Important Google Sheet sharing requirement

The Google Sheet must be shared publicly as read-only:

```text
Anyone with the link → Viewer
```

No write access is used. The dashboard does not edit, delete, append, or modify Google Sheet rows.

## Data behavior

- Defaults to the most recent available tracker month.
- Uses `display_order` to sort KPI rows.
- Uses status fields to calculate On Track, Watch, and Under Pressure counts.
- Handles sparse repeated sheet rows by carrying forward the active month context.
- Handles blank fields gracefully.
- Avoids duplicate KPI rows for a month.

## Cloudflare Pages deployment

1. Push this folder to GitHub.
2. In Cloudflare Pages, select **Create a project**.
3. Connect the repository.
4. Use these build settings:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Node version: 18 or newer
```

5. Add environment variables if you want to override defaults:

```text
VITE_GOOGLE_SHEET_ID
VITE_LOGO_URL
```

6. Deploy.

## Netlify deployment

1. Push this folder to GitHub.
2. Create a new Netlify site from Git.
3. Use these build settings:

```text
Build command: npm run build
Publish directory: dist
```

4. Add environment variables in **Site configuration → Environment variables** if needed.
5. Deploy.

## Vercel deployment

1. Push this folder to GitHub.
2. Import the repository in Vercel.
3. Vercel should detect Vite automatically.
4. Confirm settings:

```text
Build command: npm run build
Output directory: dist
```

5. Add environment variables if needed.
6. Deploy.

## If Google Sheets API access is required later

The current app does **not** need an API key or service account.

If the public CSV method is disabled or blocked, use a backend proxy with either:

### Option A: Google Sheets API key

- Create a Google Cloud project.
- Enable Google Sheets API.
- Create an API key.
- Restrict the key by HTTP referrer and API.
- Use it only for read-only requests.

### Option B: Service account

- Create a service account in Google Cloud.
- Share the Google Sheet with the service account email as Viewer.
- Store the service account JSON only on a backend server.
- Never expose the service account JSON in frontend code.

## Project structure

```text
.
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── public
│   └── jif-logo.png
├── src
│   ├── App.jsx
│   ├── config.js
│   ├── main.jsx
│   ├── styles.css
│   ├── components
│   │   ├── ArchiveSection.jsx
│   │   ├── Header.jsx
│   │   ├── KpiTable.jsx
│   │   ├── MethodologySection.jsx
│   │   ├── Overview.jsx
│   │   ├── SourceSection.jsx
│   │   ├── States.jsx
│   │   ├── StatusBadge.jsx
│   │   └── SummaryCards.jsx
│   ├── hooks
│   │   └── useTrackerData.js
│   └── services
│       └── googleSheets.js
└── README.md
```

## Notes

- This is a public, read-only dashboard.
- No private credentials are included.
- No Emergent-only hosting features are required.
- The dashboard can be deployed as a normal static site.