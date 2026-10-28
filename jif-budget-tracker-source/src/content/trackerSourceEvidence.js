// Pinned October 28, 2026 reconciliation; see docs/source-methodology-2026-10-28.
// These are source records, never inferred first-publication dates or scoring inputs.
const BASE = 'https://www.mof.gov.jm/wp-content/uploads/';
export const CGO_LISTING_URL = 'https://www.mof.gov.jm/central-government-operations-tables/';
const RECORDS = {
  "2026-04": {
    "file": "Copy-of-CGO-April-2026.xlsx",
    "sha256": "b6c8139f3aba0b2b8a2f89694254e595db5e38e3c08fda27a747e917bfcd742d",
    "fileRecordDate": "May 29, 2026",
    "listingDate": "June 3, 2026",
    "listedFile": "Copy-of-CGO-April-2026-1.xlsx",
    "listedSha256": "ac3cde66886a7c31bdb9bcd53568571ba40405bc60463d1e600e04598257410c",
    "note": "The later workbook revises expenditure and raises both Primary and Fiscal Balance actuals by J$117.187 million. Their gaps would be 26.1% and 39.2% below budget, compared with the published 26.5% and 40.1%. Both remain Under Pressure.",
    "reviewedKpis": [
      [
        "Tax Revenue",
        "97578.098",
        "109930.507",
        "Under Pressure"
      ],
      [
        "Non-Tax Revenue",
        "2195.809",
        "3104.208",
        "Under Pressure"
      ],
      [
        "Total Revenue & Grants",
        "99791.472",
        "113431.036",
        "Under Pressure"
      ],
      [
        "Primary Balance",
        "18398.725",
        "25048.922",
        "Under Pressure"
      ],
      [
        "Fiscal Balance",
        "7830.405",
        "13073.644",
        "Under Pressure"
      ],
      [
        "Compensation of Employees",
        "45980.192",
        "46233.578",
        "On Track"
      ],
      [
        "Capital Expenditure",
        "4555.100",
        "6548.036",
        "Under Pressure"
      ],
      [
        "Interest",
        "10568.321",
        "11975.278",
        "On Track"
      ]
    ]
  },
  "2026-05": {
    "file": "Copy-of-CGO-May-2026-Revised.xlsx",
    "sha256": "7ae13521e8191107192793212ec675e087efe3e442718f18ff323bd2741238d1",
    "fileRecordDate": "July 2, 2026",
    "listingDate": "July 21, 2026",
    "listedFile": "Copy-of-CGO-May-2026_.xlsx",
    "listedSha256": "e2b2b491e700f6555c7deb30e5e924e0365c70d88625317bce604b35076e4b4a",
    "note": "The later workbook repairs five comparison formulas. JIF already calculated Interest and Capital Expenditure from the correct YTD inputs, giving gaps of 15.7% and 15.1% below budget. The published KPI figures and statuses therefore do not change.",
    "reviewedKpis": [
      [
        "Tax Revenue",
        "163742.951",
        "185745.581",
        "Under Pressure"
      ],
      [
        "Non-Tax Revenue",
        "7627.689",
        "6340.991",
        "On Track"
      ],
      [
        "Total Revenue & Grants",
        "172112.803",
        "192482.892",
        "Under Pressure"
      ],
      [
        "Primary Balance",
        "6672.641",
        "19843.439",
        "Under Pressure"
      ],
      [
        "Fiscal Balance",
        "-19721.039",
        "-11459.780",
        "Under Pressure"
      ],
      [
        "Compensation of Employees",
        "88361.974",
        "88399.500",
        "On Track"
      ],
      [
        "Capital Expenditure",
        "9926.225",
        "11693.377",
        "Watch"
      ],
      [
        "Interest",
        "26393.680",
        "31303.219",
        "On Track"
      ]
    ]
  },
  "2026-06": {
    "file": "Copy-of-CGO-June-2026.xlsx",
    "sha256": "e4e793777b1e62e1ee9dc45d7a25a88653d55c391804e81f7345591e89c80b18",
    "fileRecordDate": "July 31, 2026",
    "listingDate": "July 31, 2026",
    "listedFile": "Copy-of-CGO-June-2026-1.xlsx",
    "listedSha256": "cc6d26e59e8dd4eb036d4f45df1cb6f46e2a03546e2c01f02f9aef23ee69c774",
    "note": "The later workbook raises the expenditure budget by J$40,334.236 million. The Fiscal Balance budget changes from a planned surplus to a planned deficit; its shortfall would be 63.6%, compared with the published 192.1%. The Primary Balance shortfall would be 43.8%, compared with 75.2%. Both remain Under Pressure. These are revision comparisons, not restated tracker results.",
    "reviewedKpis": [
      [
        "Tax Revenue",
        "253893.782",
        "272688.443",
        "Watch"
      ],
      [
        "Non-Tax Revenue",
        "9772.851",
        "20268.198",
        "Under Pressure"
      ],
      [
        "Total Revenue & Grants",
        "264767.961",
        "293489.196",
        "Under Pressure"
      ],
      [
        "Primary Balance",
        "17930.293",
        "72247.032",
        "Under Pressure"
      ],
      [
        "Fiscal Balance",
        "-23762.005",
        "25806.573",
        "Under Pressure"
      ],
      [
        "Compensation of Employees",
        "130688.775",
        "131093.892",
        "On Track"
      ],
      [
        "Capital Expenditure",
        "13727.748",
        "17601.696",
        "Under Pressure"
      ],
      [
        "Interest",
        "41692.298",
        "46440.459",
        "On Track"
      ]
    ]
  },
  "2026-07": {
    "file": "Copy-of-CGO-July-2026.xlsx",
    "fileRecordDate": "September 1, 2026",
    "listingDate": "August 31, 2026",
    "listedFile": "Copy-of-CGO-July-2026.xlsx"
  },
  "2026-08": {
    "file": "Copy-of-CGO-August-2026.xlsx",
    "fileRecordDate": "September 30, 2026",
    "listingDate": "September 30, 2026",
    "listedFile": "Copy-of-CGO-August-2026.xlsx"
  }
};
const amount = value => Number(String(value ?? '').replace(/[$,]/g, ''));
export const sourceEvidenceFor = (month, kpis = []) => {
  const record = RECORDS[month?.month_sort];
  if (!record || month.source_document_1_url !== BASE + record.file) return null;
  const matchesReviewedFigures = record.reviewedKpis && kpis.length === 8
    && record.reviewedKpis.every(([label, actual, budget, status]) => {
      const rows = kpis.filter(kpi => kpi.kpi_label === label);
      return rows.length === 1 && amount(rows[0].monthly_outturn_value) === Number(actual)
        && amount(rows[0].annual_baseline_value) === Number(budget) && rows[0].status === status;
    });
  return {
    ...record,
    listedUrl: BASE + record.listedFile,
    // Any later feed revision suppresses the old financial-impact narrative.
    revisionNote: matchesReviewedFigures ? record.note : null,
    checkedDate: 'October 28, 2026',
  };
};
