import { SPENDING_EXPLORER_SHEET_ID, SPENDING_EXPLORER_SHEET_TABS } from "../config.js";

export const SPENDING_EXPLORER_CONTRACT_VERSION = "v1.0";

const CSV_BASE_URL = "https://docs.google.com/spreadsheets/d";
const PUBLIC_SOURCE_FIELDS = [
  "source_id",
  "source_title",
  "source_type",
  "fiscal_year",
  "publication_date",
  "publisher",
  "source_url",
  "data_scope",
];
const RELEASED_ROW_STATUSES = new Set(["RELEASED", "PUBLIC_RELEASED", "PUBLISHED", "AUTHORIZED"]);

const cleanValue = (value) => (value === null || value === undefined ? "" : String(value).trim());

export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
};

const rowsToObjects = (rows, requiredHeader) => {
  const headerIndex = rows.findIndex((row) => row.map(cleanValue).includes(requiredHeader));
  if (headerIndex < 0) throw new Error(`Missing required spreadsheet header: ${requiredHeader}`);

  const headers = rows[headerIndex].map((header, index) => cleanValue(header) || `unused_${index}`);
  return rows.slice(headerIndex + 1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (!header.startsWith("unused_")) record[header] = cleanValue(row[index]);
    });
    return record;
  }).filter((record) => Object.values(record).some(Boolean));
};

const csvUrlForTab = (tabName, { range = "", query = "" } = {}) => {
  const url = new URL(`${CSV_BASE_URL}/${SPENDING_EXPLORER_SHEET_ID}/gviz/tq`);
  url.searchParams.set("tqx", "out:csv");
  url.searchParams.set("sheet", tabName);
  if (range) url.searchParams.set("range", range);
  if (query) url.searchParams.set("tq", query);
  return url.toString();
};

const fetchSheetRows = async (tabName, requiredHeader, options, fetchImpl) => {
  const response = await fetchImpl(csvUrlForTab(tabName, options));
  if (!response.ok) throw new Error(`Could not load Google Sheet tab: ${tabName}`);
  return rowsToObjects(parseCsv(await response.text()), requiredHeader);
};

export const buildControlMap = (rows) => rows.reduce((controls, row) => {
  const key = cleanValue(row.control_field);
  if (key) controls[key] = cleanValue(row.value);
  return controls;
}, {});

export const evaluateExplorerRelease = (controls = {}) => {
  const checks = {
    publication_released: controls.publication_status === "RELEASED",
    release_authorized: controls.release_authorization_status === "AUTHORIZED",
    model_version_frozen: controls.model_version === "v1.0"
      && cleanValue(controls.schema_status).includes("MODEL_V1_FROZEN"),
    contract_version_supported: controls.frontend_contract_version === SPENDING_EXPLORER_CONTRACT_VERSION,
    aia_treatment_approved: controls.aia_public_treatment === "SEPARATE_NEGATIVE_OFFSET_APPROVED",
    currency_supported: controls.default_currency === "JMD",
  };
  const authorized = Object.values(checks).every(Boolean);

  return {
    authorized,
    checks,
    code: authorized ? "AUTHORIZED" : "NOT_RELEASED",
    message: authorized
      ? "The approved Government Spending Explorer dataset is released."
      : "The Government Spending Explorer is prepared but has not been authorized for public release.",
  };
};

const parseNumber = (value) => {
  const cleaned = cleanValue(value).replaceAll(",", "").replace("%", "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const requiredStringsPresent = (row, fields) => fields.every((field) => cleanValue(row[field]));

export const normalizeEvery100Rows = (rows) => {
  const warnings = [];
  const validRows = rows.flatMap((row) => {
    if (!RELEASED_ROW_STATUSES.has(cleanValue(row.data_status).toUpperCase())) return [];

    const numeric = {
      amount_jmd: parseNumber(row.amount_jmd),
      denominator_amount_jmd: parseNumber(row.denominator_amount_jmd),
      share_pct: parseNumber(row.share_pct),
      per_j100: parseNumber(row.per_j100),
      display_order: parseNumber(row.display_order),
    };
    const stringsValid = requiredStringsPresent(row, [
      "record_id", "fiscal_year", "period_label", "measure_type", "public_category_id",
      "public_category_name", "source_id", "source_url", "data_status", "last_updated",
    ]);
    const numbersValid = Object.values(numeric).every((value) => value !== null);

    if (!stringsValid || !numbersValid) {
      warnings.push(`Excluded malformed DS_Every100 row ${cleanValue(row.record_id) || "without an ID"}.`);
      return [];
    }

    return [{ ...row, ...numeric }];
  });

  return {
    rows: validRows.sort((a, b) => a.display_order - b.display_order),
    warnings,
  };
};

export const normalizeSpendingRows = (rows) => {
  const warnings = [];
  const validRows = rows.flatMap((row) => {
    if (!RELEASED_ROW_STATUSES.has(cleanValue(row.data_status).toUpperCase())) return [];

    const isAppropriationsInAid = cleanValue(row.measure_type).toUpperCase() === "APPROPRIATIONS_IN_AID";

    const numeric = {
      amount_jmd: parseNumber(row.amount_jmd),
      share_of_total_pct: parseNumber(row.share_of_total_pct),
    };
    const stringsValid = requiredStringsPresent(row, [
      "record_id", "fiscal_year", "period_label", "period_type", "measure_type",
      "organisation_id", "organisation_name",
      "economic_id", "economic_name", "public_category_id", "public_category_name",
      "recurrent_or_capital", "source_id", "source_url", "data_status", "last_updated",
    ]) && (isAppropriationsInAid || requiredStringsPresent(row, ["function_id", "function_name"]));
    const numbersValid = Object.values(numeric).every((value) => value !== null);

    if (!stringsValid || !numbersValid) {
      warnings.push(`Excluded malformed DS_SpendingExplorer row ${cleanValue(row.record_id) || "without an ID"}.`);
      return [];
    }

    return [{ ...row, ...numeric }];
  });

  return { rows: validRows, warnings };
};

const whitelistSources = (rows) => rows.map((row) => PUBLIC_SOURCE_FIELDS.reduce((source, field) => {
  source[field] = cleanValue(row[field]);
  return source;
}, {})).filter((source) => source.source_id && source.source_url);

export const fetchSpendingExplorerData = async (fetchImpl = fetch) => {
  const controlRows = await fetchSheetRows(
    SPENDING_EXPLORER_SHEET_TABS.controls,
    "control_field",
    { range: "A3:C100" },
    fetchImpl,
  );
  const controls = buildControlMap(controlRows);
  const release = evaluateExplorerRelease(controls);

  if (!release.authorized) {
    return {
      contract_version: SPENDING_EXPLORER_CONTRACT_VERSION,
      controls,
      release,
      fiscal_year: controls.initial_fiscal_year || "",
      every_100: [],
      spending: [],
      sources: [],
      warnings: [],
    };
  }

  const [every100Source, spendingSource, sourceCatalog] = await Promise.all([
    fetchSheetRows(SPENDING_EXPLORER_SHEET_TABS.every100, "record_id", {}, fetchImpl),
    fetchSheetRows(SPENDING_EXPLORER_SHEET_TABS.spending, "record_id", {}, fetchImpl),
    fetchSheetRows(
      SPENDING_EXPLORER_SHEET_TABS.sources,
      "source_id",
      { query: "select A,B,C,D,G,H,I,K" },
      fetchImpl,
    ),
  ]);

  const every100 = normalizeEvery100Rows(every100Source);
  const spending = normalizeSpendingRows(spendingSource);
  if (!every100.rows.length || !spending.rows.length) {
    throw new Error("The released Explorer dataset did not contain eligible public rows.");
  }

  const usedSourceIds = new Set([...every100.rows, ...spending.rows].map((row) => row.source_id));

  return {
    contract_version: SPENDING_EXPLORER_CONTRACT_VERSION,
    controls,
    release,
    fiscal_year: every100.rows[0]?.fiscal_year || spending.rows[0]?.fiscal_year || controls.initial_fiscal_year || "",
    every_100: every100.rows,
    spending: spending.rows,
    sources: whitelistSources(sourceCatalog).filter((source) => usedSourceIds.has(source.source_id)),
    warnings: [...every100.warnings, ...spending.warnings],
  };
};
