import test from "node:test";
import assert from "node:assert/strict";
import { fetchTrackerData } from "./googleSheets.js";

const csv = (rows) => {
  const headers = [...new Set(rows.flatMap(Object.keys))];
  const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((row) => row.map(cell).join(",")).join("\n");
};
const indicators = ["Tax Revenue", "Non-Tax Revenue", "Total Revenue & Grants", "Primary Balance", "Fiscal Balance", "Compensation of Employees", "Capital Expenditure", "Interest"];
const statuses = ["Watch", "Under Pressure", "Watch", "Under Pressure", "On Track", "On Track", "Watch", "On Track"];
const monthRows = (key, label) => indicators.map((kpi_label, index) => ({
  month_sort: key, month_label: label, kpi_label, display_order: index + 1,
  status: statuses[index], status_headline: "Watch", tracker_state: "Watch",
}));
const receipt = "https://tracker.infocusja.com/receipts-packs/2026-08-jif-receipts-pack.pdf";
const fixtures = (extraMonth = false) => ({
  "366568461": csv([...monthRows("2026-07", "Jul 2026"), ...monthRows("2026-08", "Aug 2026"), ...(extraMonth ? monthRows("2026-09", "Sep 2026") : [])]),
  "1176061617": csv([{ month_sort: "2026-07", month_label: "Jul 2026" }, { month_sort: "2026-08", month_label: "Aug 2026" }]),
  "1322269186": csv([{ month_sort: "2026-07", month_label: "Jul 2026", monthly_note: "July" }, { month_sort: "2026-08", month_label: "Aug 2026", receipts_pack_url: receipt, what_changed: 'August: "approved", with receipts.\nSecond line.' }]),
});
const fakeFetch = (data) => async (input) => {
  const url = new URL(input);
  // Keep the real monthly loader on the feed that preserves displayed month cells.
  assert.equal(url.pathname.endsWith("/export"), true, "monthly data must use the direct CSV export");
  assert.equal(url.searchParams.get("format"), "csv");
  const body = data[url.searchParams.get("gid")];
  assert.notEqual(body, undefined, "the requested public tab must exist");
  return { ok: true, text: async () => body };
};

test("latest approved text month displays with eight KPIs, status counts, and matching receipts", async () => {
  const data = await fetchTrackerData("", fakeFetch(fixtures()));
  assert.equal(data.current_month.month_sort, "2026-08");
  assert.equal(data.current_month.month_label, "Aug 2026");
  assert.equal(data.kpis.length, 8);
  assert.deepEqual(data.current_month.counts, { kpis_tracked: 8, on_track: 3, watch: 3, under_pressure: 2 });
  assert.equal(data.current_month.receipts_pack_url, receipt);
  assert.equal(data.current_month.what_changed, 'August: "approved", with receipts.\nSecond line.');
  assert.deepEqual(data.available_months.map((month) => month.month_sort), ["2026-08", "2026-07"]);
  assert.equal(data.archive[1].month_label, "Aug 2026");
});

test("historical selection stays on July without borrowing August receipts", async () => {
  const data = await fetchTrackerData("2026-07", fakeFetch(fixtures()));
  assert.equal(data.current_month.month_sort, "2026-07");
  assert.equal(data.current_month.month_label, "Jul 2026");
  assert.equal(data.current_month.receipts_pack_url, "");
  assert.equal(data.requested_month_missing, false);
});

test("a later publication becomes the default without a frontend month change", async () => {
  const fetchImpl = fakeFetch(fixtures(true));
  const latest = await fetchTrackerData("", fetchImpl);
  assert.equal(latest.current_month.month_sort, "2026-09");
  const august = await fetchTrackerData("2026-08", fetchImpl);
  assert.equal(august.current_month.receipts_pack_url, receipt);
  const missing = await fetchTrackerData("2026-10", fetchImpl);
  assert.equal(missing.current_month.month_sort, "2026-09");
  assert.equal(missing.requested_month_missing, true);
});
