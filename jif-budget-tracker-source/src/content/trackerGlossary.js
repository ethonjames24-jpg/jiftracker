export const TRACKER_TERMS = [
  {
    term: "Key performance indicator (KPI)",
    definition: "One of the eight budget measures the Tracker follows each month.",
  },
  {
    term: "Financial year (FY)",
    definition: "Jamaica’s government financial year runs from April through the following March.",
  },
  {
    term: "Year-to-date (YTD)",
    definition: "The cumulative total from the start of the financial year in April through the selected month.",
  },
  {
    term: "Budget baseline",
    definition: "The Government’s planned amount for the same period, drawn from the approved budget and supporting fiscal documents.",
  },
  {
    term: "Outturn",
    definition: "The result the official monthly tables report was actually collected, spent or recorded during the period.",
  },
  {
    term: "How it compares",
    definition: "The difference between the reported result and the budget baseline. Whether a higher or lower result is favorable depends on the measure.",
  },
];

export const KPI_DEFINITIONS = {
  "tax revenue": "Money central government collects through taxes.",
  "non-tax revenue": "Government income from fees, charges, dividends and other sources that are not taxes.",
  "total revenue & grants": "All tax revenue, non-tax revenue and grants received by central government.",
  "primary balance": "Revenue and grants minus spending before interest costs.",
  "fiscal balance": "Revenue and grants minus all spending, including interest; a negative result is a deficit.",
  "compensation of employees": "Wages, salaries and employer contributions for central government employees.",
  "capital expenditure": "Spending on public assets and investment projects intended to provide benefits over time.",
  interest: "The cost of interest on government debt during the period.",
};

const normaliseKpiLabel = (value) => String(value || "").trim().toLowerCase();

export const definitionForKpi = (label) => KPI_DEFINITIONS[normaliseKpiLabel(label)] || "";
