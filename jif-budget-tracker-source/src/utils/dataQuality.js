const STALE_UPDATE_DAYS = 45;

export const PUBLIC_WARNING_MESSAGES = {
  missingSelectedMonth: "Tracker data for this month is not available yet.",
  missingKpiRows: "KPI rows are missing for this tracker month.",
  missingSourceLinks: "One or more official source links are not available for this month.",
  missingLatestUpdate: "Latest update date is not available.",
};

const clean = (value) => String(value || "").trim();

export const hasValue = (value) => clean(value).length > 0;

export const isValidDate = (value) => {
  if (!hasValue(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const isPublicHttpUrl = (value) => {
  const url = clean(value);
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const hasSourceLinkWarnings = (currentMonth = {}) => {
  const hasOutturn = isPublicHttpUrl(currentMonth.source_document_1_url || currentMonth.source_doc_url);
  const hasBudget = isPublicHttpUrl(currentMonth.source_document_2_url || currentMonth.budget_source_url);
  return !hasOutturn || !hasBudget;
};

export const isCurrentOrPublished = (currentMonth = {}) => {
  const combined = `${currentMonth.tracker_state || ""} ${currentMonth.data_freshness_state || ""}`.toLowerCase();
  return combined.includes("current") || combined.includes("published");
};

export const isLatestUpdateStale = (currentMonth = {}, now = new Date()) => {
  if (!isCurrentOrPublished(currentMonth) || !isValidDate(currentMonth.latest_update_at)) return false;
  const latestUpdate = new Date(currentMonth.latest_update_at);
  const ageDays = (now.getTime() - latestUpdate.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays > STALE_UPDATE_DAYS;
};

export const buildPublicWarnings = (data) => {
  const warnings = [];
  const currentMonth = data?.current_month || {};

  if (data?.requested_month_missing) warnings.push({ key: "missing-selected-month", message: PUBLIC_WARNING_MESSAGES.missingSelectedMonth });
  if (!Array.isArray(data?.kpis) || data.kpis.length === 0) warnings.push({ key: "missing-kpi-rows", message: PUBLIC_WARNING_MESSAGES.missingKpiRows });
  if (!isValidDate(currentMonth.latest_update_at)) warnings.push({ key: "missing-latest-update", message: PUBLIC_WARNING_MESSAGES.missingLatestUpdate });

  return warnings;
};

export const buildAdminWarnings = (data) => {
  const warnings = [];
  const currentMonth = data?.current_month || {};
  const archive = data?.archive || [];

  if (!Array.isArray(data?.kpis) || data.kpis.length === 0) warnings.push("KPI rows are missing for this tracker month.");
  if (hasSourceLinkWarnings(currentMonth)) warnings.push("One or more official source links are missing for this month.");
  if (!isValidDate(currentMonth.latest_update_at)) warnings.push("Latest update date is missing or invalid.");
  if (isLatestUpdateStale(currentMonth)) warnings.push("Latest update is older than 45 days for a current or published month.");
  if (!archive.some((item) => item.month_sort === currentMonth.month_sort)) warnings.push("Archive row is missing for this month.");

  return warnings;
};
