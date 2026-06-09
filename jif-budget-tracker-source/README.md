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
- Webhook-only subscription form documentation

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
VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL=
```

`VITE_GOOGLE_SHEET_ID` and `VITE_LOGO_URL` are public. `VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL` is the public n8n webhook endpoint that receives subscription requests. No private Google Sheets credentials are required for the default setup. The logo is bundled locally at `public/jif-logo.png`, so the dashboard does not depend on the original upload URL.

If `VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL` is blank, the subscription form shows a controlled configuration message and does not submit anywhere.

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

## Subscription form architecture

The site includes one subscription form with:

- Email address field
- Required consent checkbox
- `NOTIFY ME` button
- Small privacy notice
- Mobile `GET MONTHLY UPDATES` button that scrolls to the form

Subscriber submissions are sent only to:

```text
VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL
```

The browser sends this payload to the configured n8n webhook:

```json
{
  "email": "reader@example.com",
  "consent": true,
  "source": "jamaica_in_focus_budget_tracker_public_site",
  "consent_at": "ISO timestamp"
}
```

The n8n workflow is responsible for validation and subscriber storage. The public website must only receive one of these controlled statuses from the webhook:

- `pending_confirmation`
- `already_subscribed`
- `validation_error`
- `server_error`

Privacy and security rules enforced by this frontend:

- The public website does not read the private subscriber workbook.
- The public website does not write to the private subscriber workbook.
- The private workbook URL and spreadsheet ID are not included in the source code.
- Google Sheets credentials are not included.
- Subscriber records are never requested or displayed.
- Subscriber information is not stored in `localStorage` or `sessionStorage`.

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
VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL
```

For Cloudflare Pages, configure `VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL` separately in both:

- **Settings → Environment variables → Production**
- **Settings → Environment variables → Preview**

Use the production n8n webhook in Production and, if desired, a separate test n8n webhook in Preview. Do not put private Google Sheets credentials in Cloudflare Pages environment variables for this frontend.

6. Deploy.

## Netlify deployment

1. Push this folder to GitHub.
2. Create a new Netlify site from Git.
3. Use these build settings:

```text
Build command: npm run build
Publish directory: dist
```

4. Add environment variables in **Site configuration → Environment variables** if needed, including `VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL`.
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

5. Add environment variables if needed, including `VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL`.
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
│   │   ├── SubscriptionSection.jsx
│   │   └── SummaryCards.jsx
│   ├── hooks
│   │   └── useTrackerData.js
│   └── services
│       ├── googleSheets.js
│       └── subscribe.js
└── README.md
```

## Notes

- This is a public, read-only dashboard.
- No private credentials are included.
- The private subscriber workbook is intentionally not referenced anywhere in the frontend package.
- No Emergent-only hosting features are required.
- The dashboard can be deployed as a normal static site.