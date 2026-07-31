export const sortArchiveNewestFirst = (archive = []) => [...archive].sort((a, b) => {
  const monthComparison = String(b?.month_sort || "").localeCompare(String(a?.month_sort || ""));
  if (monthComparison !== 0) return monthComparison;
  return String(b?.month_label || "").localeCompare(String(a?.month_label || ""));
});
