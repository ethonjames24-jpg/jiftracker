const ENV = import.meta.env || {};

export const SHEET_ID = ENV.VITE_GOOGLE_SHEET_ID || "13npg-j5jjMzE115EOkkBdq7Rav1L5-RUPl1rza5e_v0";

export const LOGO_URL = ENV.VITE_LOGO_URL || "/jif-logo.png";

export const TRACKER_SUBSCRIBE_WEBHOOK_URL = ENV.VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL || "";

export const SPENDING_EXPLORER_SHEET_ID = ENV.VITE_SPENDING_EXPLORER_SHEET_ID
  || "1SWibIHNJzgkWRPb57YiBvV3QHXKwrRrgXzG0fKdvv80";

export const SHEET_TABS = {
  tracker: "DS_MonthlyTracker",
  archive: "archive",
  monthlyExtras: "DS_PublicMonthlyExtras",
};

export const SPENDING_EXPLORER_SHEET_TABS = {
  controls: "README_Control",
  spending: "DS_SpendingExplorer",
  every100: "DS_Every100",
  sources: "Source_Catalog",
};
