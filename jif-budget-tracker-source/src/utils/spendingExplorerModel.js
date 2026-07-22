export const EMPTY_EXPLORER_FILTERS = {
  public_category_id: "",
  function_id: "",
  organisation_id: "",
  programme_id: "",
  economic_id: "",
  recurrent_or_capital: "",
  measure_type: "",
};

const FILTER_QUERY_KEYS = {
  public_category_id: "category",
  function_id: "function",
  organisation_id: "organisation",
  programme_id: "programme",
  economic_id: "economic",
  recurrent_or_capital: "budget",
  measure_type: "measure",
};

export const explorerFiltersFromSearch = (search = "") => {
  const params = new URLSearchParams(search);
  return Object.fromEntries(Object.entries(FILTER_QUERY_KEYS)
    .map(([field, queryKey]) => [field, params.get(queryKey) || ""]));
};

export const explorerFiscalYearFromSearch = (search = "") => new URLSearchParams(search).get("fy") || "";

export const searchWithExplorerFilters = (search = "", filters = EMPTY_EXPLORER_FILTERS, fiscalYear = "") => {
  const params = new URLSearchParams(search);
  params.set("view", "spending");
  Object.entries(FILTER_QUERY_KEYS).forEach(([field, queryKey]) => {
    const value = filters[field] || "";
    if (value) params.set(queryKey, value);
    else params.delete(queryKey);
  });
  if (fiscalYear) params.set("fy", fiscalYear);
  else params.delete("fy");
  return `?${params.toString()}`;
};

export const filterRowsByFiscalYear = (rows, fiscalYear) => (
  fiscalYear ? rows.filter((row) => row.fiscal_year === fiscalYear) : rows
);

const fiscalYearStart = (fiscalYear) => {
  const year = Number.parseInt(String(fiscalYear || "").slice(0, 4), 10);
  return Number.isFinite(year) ? year : 0;
};

export const selectLatestAnnualComparison = (rows = []) => {
  const comparisons = new Map();

  rows.forEach((row) => {
    if (!row.current_fiscal_year || !row.prior_fiscal_year) return;
    const key = `${row.current_fiscal_year}|${row.prior_fiscal_year}`;
    const comparison = comparisons.get(key) || {
      currentFiscalYear: row.current_fiscal_year,
      priorFiscalYear: row.prior_fiscal_year,
      rows: [],
    };
    comparison.rows.push(row);
    comparisons.set(key, comparison);
  });

  return Array.from(comparisons.values()).sort((a, b) => (
    fiscalYearStart(b.currentFiscalYear) - fiscalYearStart(a.currentFiscalYear)
      || fiscalYearStart(b.priorFiscalYear) - fiscalYearStart(a.priorFiscalYear)
      || b.rows.length - a.rows.length
  ))[0] || { currentFiscalYear: "", priorFiscalYear: "", rows: [] };
};

const CSV_COLUMNS = [
  ["Fiscal year", "fiscal_year"],
  ["Organisation", "organisation_name"],
  ["Function", "function_name"],
  ["Programme", "programme_name"],
  ["Economic classification", "economic_name"],
  ["Public category", "public_category_name"],
  ["Budget type", "recurrent_or_capital"],
  ["Measure", "measure_type"],
  ["Amount JMD", "amount_jmd"],
  ["Share of net total (%)", "share_of_total_pct"],
  ["Official source", "source_url"],
];

const csvCell = (value) => {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = typeof value === "number" || !/^[=+@]/.test(raw) ? raw : `'${raw}`;
  return `"${safe.replaceAll('"', '""')}"`;
};

export const buildSpendingCsv = (rows) => [
  CSV_COLUMNS.map(([label]) => csvCell(label)).join(","),
  ...rows.map((row) => CSV_COLUMNS.map(([, field]) => csvCell(row[field])).join(",")),
].join("\r\n");

const labelFor = (row, idField) => row[idField.replace(/_id$/, "_name")] || row[idField] || "Not classified";

export const filterSpendingRows = (rows, filters) => rows.filter((row) => (
  Object.entries(filters).every(([field, selected]) => !selected || row[field] === selected)
));

export const buildFilterOptions = (rows, idField) => {
  const options = new Map();
  rows.forEach((row) => {
    const value = row[idField];
    if (value && !options.has(value)) options.set(value, labelFor(row, idField));
  });
  return Array.from(options, ([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const groupSpendingRows = (rows, idField, nameField) => {
  const grouped = new Map();
  rows.forEach((row) => {
    const id = row[idField] || "UNCLASSIFIED";
    const current = grouped.get(id) || {
      id,
      name: row[nameField] || "Not classified",
      amount_jmd: 0,
      row_count: 0,
    };
    current.amount_jmd += row.amount_jmd;
    current.row_count += 1;
    grouped.set(id, current);
  });

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.amount_jmd < 0 && b.amount_jmd >= 0) return 1;
    if (b.amount_jmd < 0 && a.amount_jmd >= 0) return -1;
    return Math.abs(b.amount_jmd) - Math.abs(a.amount_jmd);
  });
};

export const sumSpendingRows = (rows) => rows.reduce((total, row) => total + row.amount_jmd, 0);

export const formatJmd = (value, compact = false) => {
  const amount = Number(value || 0);
  const sign = amount < 0 ? "−" : "";
  const absolute = Math.abs(amount);

  if (compact) {
    const units = [
      { value: 1_000_000_000_000, suffix: "tn" },
      { value: 1_000_000_000, suffix: "bn" },
      { value: 1_000_000, suffix: "m" },
    ];
    const unit = units.find((candidate) => absolute >= candidate.value);
    if (unit) {
      const scaled = absolute / unit.value;
      const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
      return `${sign}J$${scaled.toFixed(digits)}${unit.suffix}`;
    }
  }

  return `${sign}J$${new Intl.NumberFormat("en-JM", { maximumFractionDigits: 0 }).format(absolute)}`;
};

export const formatPercent = (value, maximumFractionDigits = 1) => {
  const amount = Number(value || 0);
  const sign = amount < 0 ? "−" : "";
  return `${sign}${new Intl.NumberFormat("en-JM", { maximumFractionDigits }).format(Math.abs(amount))}%`;
};

export const measureTypeLabel = (value) => ({
  AUTHORIZED_BY_LAW: "Authorized by law",
  VOTED_ESTIMATE: "Voted estimate",
  APPROPRIATIONS_IN_AID: "Appropriations-in-Aid",
}[value] || String(value || "").replaceAll("_", " "));
