const cleanText = (value) => String(value || "").trim();

const ensureTerminalPunctuation = (value) => {
  const text = cleanText(value);
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
};

export const editorialHeadlineFor = (currentMonth = {}) => {
  const approvedHeadline = cleanText(
    currentMonth.monthly_editorial_headline
      || currentMonth.what_changed_headline
      || currentMonth.approved_tracker_summary_headline,
  );

  if (approvedHeadline) return ensureTerminalPunctuation(approvedHeadline);

  const month = cleanText(currentMonth.month_label);
  const status = cleanText(currentMonth.status_headline || currentMonth.tracker_state);
  if (month && status) return ensureTerminalPunctuation(`${month}: ${status}`);
  if (status) return ensureTerminalPunctuation(status);
  return "JIF Budget Tracker";
};

export const receiptsCheckApproved = (currentMonth = {}) => {
  const status = cleanText(
    currentMonth.receipts_check_status
      || currentMonth.receipts_checked_status
      || currentMonth.receipts_checked_approved,
  ).toUpperCase();

  return ["APPROVED", "TRUE", "YES", "RECEIPTS_CHECKED"].includes(status);
};
