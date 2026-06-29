import { SHEET_ID, SHEET_TABS } from "../config.js";

const FALLBACK_DISPLAY_ORDER = 999;
const CSV_BASE_URL = "https://docs.google.com/spreadsheets/d";

const csvUrlForTab = (tabName) => `${CSV_BASE_URL}/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;

const cleanValue = (value) => (value === null || value === undefined ? "" : String(value).trim());

const toInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value || "").replaceAll(",", ""), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isTruthy = (value) => ["true", "1", "yes", "y", "on"].includes(cleanValue(value).toLowerCase());

const parseCsv = (text) => {
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

const rowsToObjects = (rows) => {
  if (!rows.length) return [];
  const headers = rows[0].map((header, index) => cleanValue(header) || `unused_${index}`);

  return rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (!header.startsWith("unused_")) record[header] = cleanValue(row[index]);
    });
    return record;
  }).filter((record) => Object.values(record).some(Boolean));
};

const fetchSheetTab = async (tabName) => {
  const response = await fetch(csvUrlForTab(tabName));
  if (!response.ok) throw new Error(`Could not load Google Sheet tab: ${tabName}`);
  return rowsToObjects(parseCsv(await response.text()));
};

const fetchOptionalSheetTab = async (tabName) => {
  try {
    return await fetchSheetTab(tabName);
  } catch (error) {
    console.warn(`Optional Google Sheet tab could not be loaded: ${tabName}`, error);
    return [];
  }
};

const firstPresent = (row, keys) => {
  const firstKey = keys.find((key) => cleanValue(row[key]));
  return firstKey ? cleanValue(row[firstKey]) : "";
};

const displayMonthLabel = (value) => cleanValue(value).replaceAll("-", " ");

const deriveYear = (row) => {
  const explicitYear = firstPresent(row, ["year", "Year", "fiscal_year", "Fiscal Year"]);
  if (explicitYear) return explicitYear;
  const monthSort = cleanValue(row.month_sort);
  const yearMatch = monthSort.match(/^(\d{4})/);
  return yearMatch ? yearMatch[1] : "";
};

const normaliseArchiveRow = (row) => ({
  month_label: displayMonthLabel(firstPresent(row, ["month_label", "Month", "month"])),
  month_sort: row.month_sort || "",
  tracker_state: firstPresent(row, ["tracker_state", "Tracker Status"]),
  status: firstPresent(row, ["status_headline", "Status"]),
  note: firstPresent(row, ["short_note", "Note"]),
  year: deriveYear(row),
  fiscal_year: firstPresent(row, ["fiscal_year", "Fiscal Year"]),
});

const isMonthAnchor = (row) => Boolean(row.month_label) || toInt(row.display_order, FALLBACK_DISPLAY_ORDER) === 1;

const nextMonthContext = (row, context) => {
  if (!isMonthAnchor(row)) return context;
  return {
    month_label: row.month_label || context.month_label || row.month_sort || "",
    month_sort: row.month_sort || context.month_sort,
  };
};

const validTrackerRows = (rows) => {
  const validRows = [];
  let context = { month_label: "", month_sort: "" };

  rows.forEach((sourceRow) => {
    if (!sourceRow.kpi_label) return;
    context = nextMonthContext(sourceRow, context);
    const trackerRow = {
      ...sourceRow,
      month_label: sourceRow.month_label || context.month_label,
      month_sort: context.month_sort || sourceRow.month_sort || "",
    };
    if (trackerRow.month_sort) validRows.push(trackerRow);
  });

  return validRows;
};

const buildMonthGroups = (rows) => {
  const grouped = rows.reduce((accumulator, row) => {
    const key = row.month_label || row.month_sort;
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(row);
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([label, groupRows]) => {
      const firstOrderRow = groupRows.find((row) => toInt(row.display_order) === 1) || groupRows[0];
      return { month_label: label, month_sort: firstOrderRow.month_sort || groupRows[0].month_sort, rows: groupRows };
    })
    .sort((a, b) => a.month_sort.localeCompare(b.month_sort));
};

const dedupeAndSortKpis = (rows) => {
  const deduped = new Map();
  rows.forEach((row) => {
    const key = cleanValue(row.kpi_label).toLowerCase();
    if (key && !deduped.has(key)) deduped.set(key, row);
  });
  return Array.from(deduped.values()).sort((a, b) => toInt(a.display_order, FALLBACK_DISPLAY_ORDER) - toInt(b.display_order, FALLBACK_DISPLAY_ORDER));
};

const calculateCounts = (kpis, firstRow) => ({
  kpis_tracked: Math.max(toInt(firstRow.kpi_count, 0), kpis.length),
  on_track: kpis.filter((row) => isTruthy(row.is_on_track) || row.status === "On Track").length,
  watch: kpis.filter((row) => isTruthy(row.is_watch) || row.status === "Watch").length,
  under_pressure: kpis.filter((row) => isTruthy(row.is_under_pressure) || row.status === "Under Pressure").length,
});

const selectMonthGroup = (groups, requestedMonth) => groups.find((group) => group.month_sort === requestedMonth) || groups[groups.length - 1];

const findMonthlyExtras = (rows, monthSort) => rows.find((row) => cleanValue(row.month_sort) === cleanValue(monthSort)) || {};

const preferExtras = (extras, row, keys, fallback = "") => firstPresent(extras, keys) || firstPresent(row, keys) || fallback;

const normaliseStatus = (value) => cleanValue(value).toLowerCase();

const statusRank = (status) => {
  const normalised = normaliseStatus(status);
  if (normalised === "under pressure") return 0;
  if (normalised === "watch") return 1;
  if (normalised === "on track") return 2;
  return null;
};

const normaliseKpiLabel = (value) => cleanValue(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const monthSummary = (group) => {
  if (!group?.rows?.length) return null;
  const kpis = dedupeAndSortKpis(group.rows);
  const first = kpis[0] || group.rows[0] || {};

  return {
    month_label: group.month_label || first.month_label || group.month_sort,
    month_sort: group.month_sort,
    status_headline: first.status_headline || "",
    tracker_state: first.tracker_state || "",
    counts: calculateCounts(kpis, first),
    kpis,
  };
};

const formatDelta = (delta) => {
  if (delta > 0) return `+${delta}`;
  return String(delta);
};

const buildKpiMovements = (selectedKpis, previousKpis) => {
  const previousByLabel = new Map();
  previousKpis.forEach((kpi) => {
    const key = normaliseKpiLabel(kpi.kpi_label);
    if (key && !previousByLabel.has(key)) previousByLabel.set(key, kpi);
  });

  const movements = { improved: [], worsened: [], unchanged: [] };
  let comparableCount = 0;

  selectedKpis.forEach((currentKpi) => {
    const key = normaliseKpiLabel(currentKpi.kpi_label);
    const previousKpi = key ? previousByLabel.get(key) : null;
    const currentRank = statusRank(currentKpi.status);
    const previousRank = statusRank(previousKpi?.status);

    if (!previousKpi || currentRank === null || previousRank === null) return;

    comparableCount += 1;
    const item = {
      label: cleanValue(currentKpi.kpi_label),
      current_status: cleanValue(currentKpi.status),
      previous_status: cleanValue(previousKpi.status),
    };

    if (currentRank > previousRank) movements.improved.push(item);
    else if (currentRank < previousRank) movements.worsened.push(item);
    else movements.unchanged.push(item);
  });

  const requiredComparableCount = Math.max(1, Math.ceil(Math.min(selectedKpis.length, previousKpis.length) * 0.6));
  const isReliable = comparableCount >= requiredComparableCount;

  return {
    ...movements,
    comparable_count: comparableCount,
    is_reliable: isReliable,
    note: isReliable ? "" : "KPI-by-KPI status comparison is not shown because indicator names differ between months.",
  };
};

const buildMonthComparison = (monthGroups, selectedGroup) => {
  const selectedIndex = monthGroups.findIndex((group) => group.month_sort === selectedGroup.month_sort);
  const previousGroup = selectedIndex > 0 ? monthGroups[selectedIndex - 1] : null;

  if (!previousGroup) {
    return {
      has_previous_month: false,
      message: "No previous tracker month is available yet for comparison.",
    };
  }

  const selectedMonth = monthSummary(selectedGroup);
  const previousMonth = monthSummary(previousGroup);
  const underPressureDelta = (selectedMonth.counts.under_pressure || 0) - (previousMonth.counts.under_pressure || 0);
  const summaryText = underPressureDelta > 0
    ? "More KPIs under pressure"
    : underPressureDelta < 0
      ? "Fewer KPIs under pressure"
      : "No major status movement";

  return {
    has_previous_month: true,
    selected_month: selectedMonth,
    previous_month: previousMonth,
    summary_text: summaryText,
    under_pressure_delta: underPressureDelta,
    under_pressure_delta_text: `${formatDelta(underPressureDelta)} Under Pressure KPIs compared with ${previousMonth.month_label}.`,
    movements: buildKpiMovements(selectedMonth.kpis, previousMonth.kpis),
  };
};

const sentenceJoin = (items) => {
  const cleanItems = items.map(cleanValue).filter(Boolean);
  if (cleanItems.length <= 1) return cleanItems[0] || "";
  if (cleanItems.length === 2) return `${cleanItems[0]} and ${cleanItems[1]}`;
  return `${cleanItems.slice(0, -1).join(", ")}, and ${cleanItems.at(-1)}`;
};

const findKpiLabels = (kpis, status, patterns) => kpis
  .filter((kpi) => normaliseStatus(kpi.status) === normaliseStatus(status))
  .map((kpi) => cleanValue(kpi.kpi_label))
  .filter((label) => patterns.some((pattern) => pattern.test(label)));

const buildGeneratedWhatChanged = (selectedGroup, first, counts, kpis) => {
  const month = selectedGroup.month_label || first.month_label || selectedGroup.month_sort || "This month";
  const headlineState = first.tracker_state || first.status_headline;
  const bullets = [];

  if (headlineState) bullets.push(`${month} opened ${headlineState}.`);

  const tracked = counts.kpis_tracked || kpis.length;
  const pressure = counts.under_pressure || 0;
  const onTrack = counts.on_track || 0;
  if (tracked) bullets.push(`${pressure} of ${tracked} KPIs were Under Pressure, while ${onTrack} were On Track.`);

  const pressureAreas = findKpiLabels(kpis, "Under Pressure", [/revenue/i, /fiscal/i, /balance/i]);
  if (pressureAreas.length) bullets.push(`${sentenceJoin(pressureAreas)} ${pressureAreas.length === 1 ? "was" : "were"} the main pressure ${pressureAreas.length === 1 ? "area" : "areas"}.`);

  const baselineAreas = findKpiLabels(kpis, "On Track", [/compensation/i, /employees/i, /interest/i]);
  if (baselineAreas.length) bullets.push(`${sentenceJoin(baselineAreas)} ${baselineAreas.length === 1 ? "was" : "were"} closer to baseline.`);

  return bullets.join("|");
};

export const fetchTrackerData = async (requestedMonth = "") => {
  const [trackerRows, archiveRows, monthlyExtrasRows] = await Promise.all([
    fetchSheetTab(SHEET_TABS.tracker),
    fetchSheetTab(SHEET_TABS.archive),
    fetchOptionalSheetTab(SHEET_TABS.monthlyExtras),
  ]);

  const validRows = validTrackerRows(trackerRows);
  if (!validRows.length) throw new Error("No tracker rows were found in DS_MonthlyTracker");

  const monthGroups = buildMonthGroups(validRows);
  const selectedGroup = selectMonthGroup(monthGroups, requestedMonth);
  const kpis = dedupeAndSortKpis(selectedGroup.rows);
  const first = kpis[0];
  const counts = calculateCounts(kpis, first);
  const extras = findMonthlyExtras(monthlyExtrasRows, selectedGroup.month_sort);

  return {
    spreadsheet_id: SHEET_ID,
    last_loaded_at: new Date().toISOString(),
    available_months: [...monthGroups].reverse().map((group) => ({ month_sort: group.month_sort, month_label: group.month_label })),
    current_month: {
      month_label: selectedGroup.month_label || first.month_label || selectedGroup.month_sort,
      month_sort: selectedGroup.month_sort,
      tracker_state: first.tracker_state || "",
      status_headline: first.status_headline || "",
      what_changed: preferExtras(extras, first, ["what_changed", "what_changed_used", "public_summary", "public_summary_used", "monthly_note", "approved_tracker_summary", "source_note"]),
      what_changed_headline: preferExtras(extras, first, ["what_changed_headline", "public_summary_headline", "approved_tracker_summary_headline"]),
      what_changed_bullets: preferExtras(extras, first, ["what_changed_bullets", "what_changed_used", "public_summary", "public_summary_used", "approved_tracker_summary"], buildGeneratedWhatChanged(selectedGroup, first, counts, kpis)),
      what_changed_source_note: preferExtras(extras, first, ["what_changed_source_note", "source_note"]),
      approved_email_summary: preferExtras(extras, first, ["approved_email_summary", "public_summary", "public_summary_used", "approved_tracker_summary"]),
      latest_update_status: preferExtras(extras, first, ["latest_update_status", "status_headline"]),
      latest_update_label: preferExtras(extras, first, ["latest_update_label", "month_label"], selectedGroup.month_label || ""),
      latest_update_at: preferExtras(extras, first, ["latest_update_at"]),
      latest_update_note: preferExtras(extras, first, ["latest_update_note", "monthly_note"]),
      data_freshness_state: preferExtras(extras, first, ["data_freshness_state", "tracker_state"]),
      data_quality_status: preferExtras(extras, first, ["data_quality_status"]),
      data_quality_public_note: preferExtras(extras, first, ["data_quality_public_note"]),
      next_review_window: preferExtras(extras, first, ["next_review_window"]),
      receipts_pack_url: preferExtras(extras, first, ["receipts_pack_url"]),
      receipts_pack_label: preferExtras(extras, first, ["receipts_pack_label"]),
      receipts_pack_updated_at: preferExtras(extras, first, ["receipts_pack_updated_at"]),
      source_document_1_url: preferExtras(extras, first, ["source_document_1_url", "source_doc_url"]),
      source_document_1_label: preferExtras(extras, first, ["source_document_1_label", "source_doc_title"]),
      source_document_2_url: preferExtras(extras, first, ["source_document_2_url", "budget_source_url"]),
      source_document_2_label: preferExtras(extras, first, ["source_document_2_label", "budget_source_title"]),
      monthly_note: first.monthly_note || "",
      monthly_outturn_source: first.monthly_outturn_source || "",
      budget_baseline_source: first.budget_baseline_source || "",
      supporting_fiscal_context: first.supporting_fiscal_context || "",
      counts,
    },
    kpis,
    month_comparison: buildMonthComparison(monthGroups, selectedGroup),
    archive: archiveRows.map(normaliseArchiveRow),
  };
};