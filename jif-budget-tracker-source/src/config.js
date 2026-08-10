const ENV = import.meta.env || {};

export const SHEET_ID = ENV.VITE_GOOGLE_SHEET_ID || "13npg-j5jjMzE115EOkkBdq7Rav1L5-RUPl1rza5e_v0";

export const MASTER_BADGE_URL = ENV.VITE_MASTER_BADGE_URL
  || "/brand/jif-b1-b1-master-badge-web-v1.png";

export const COMPACT_MONOGRAM_URL = ENV.VITE_COMPACT_MONOGRAM_URL
  || "/brand/jif-compact-monogram-web-v1.png";

export const HORIZONTAL_WORDMARK_URL = ENV.VITE_HORIZONTAL_WORDMARK_URL
  || "/brand/jif-horizontal-master-wordmark-web-v1.png";

export const TRACKER_SUBSCRIBE_WEBHOOK_URL = ENV.VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL || "";

export const SPENDING_EXPLORER_SHEET_ID = ENV.VITE_SPENDING_EXPLORER_SHEET_ID
  || "1SWibIHNJzgkWRPb57YiBvV3QHXKwrRrgXzG0fKdvv80";

export const SHEET_TABS = {
  tracker: "DS_MonthlyTracker",
  archive: "archive",
  monthlyExtras: "DS_PublicMonthlyExtras",
};

export const SPENDING_EXPLORER_SHEET_TABS = {
  controls: "README_Control_v1_1",
  spending: "DS_SpendingExplorer_v1_1",
  every100: "DS_Every100_v1_1",
  sources: "Source_Catalog_v1_1",
  comparison: "DS_AnnualComparison",
};
