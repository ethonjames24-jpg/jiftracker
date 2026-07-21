import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSpendingCsv,
  EMPTY_EXPLORER_FILTERS,
  explorerFiltersFromSearch,
  filterSpendingRows,
  formatJmd,
  groupSpendingRows,
  searchWithExplorerFilters,
  sumSpendingRows,
} from "./spendingExplorerModel.js";

const rows = [
  { public_category_id: "CAT_HEALTH", public_category_name: "Health", function_id: "FUNC_7", amount_jmd: 120 },
  { public_category_id: "CAT_HEALTH", public_category_name: "Health", function_id: "FUNC_7", amount_jmd: 30 },
  { public_category_id: "CAT_AIA", public_category_name: "Appropriations-in-Aid", function_id: "FUNC_1", amount_jmd: -20 },
];

test("filters combine with AND semantics and an empty filter means all", () => {
  assert.equal(filterSpendingRows(rows, EMPTY_EXPLORER_FILTERS).length, 3);
  assert.equal(filterSpendingRows(rows, { ...EMPTY_EXPLORER_FILTERS, public_category_id: "CAT_HEALTH", function_id: "FUNC_7" }).length, 2);
  assert.equal(filterSpendingRows(rows, { ...EMPTY_EXPLORER_FILTERS, public_category_id: "CAT_HEALTH", function_id: "FUNC_1" }).length, 0);
});

test("signed aggregation preserves negative offsets", () => {
  assert.equal(sumSpendingRows(rows), 130);
  const grouped = groupSpendingRows(rows, "public_category_id", "public_category_name");
  assert.deepEqual(grouped.map((group) => [group.id, group.amount_jmd]), [
    ["CAT_HEALTH", 150],
    ["CAT_AIA", -20],
  ]);
});

test("JMD formatting keeps the negative sign and J$ prefix", () => {
  assert.equal(formatJmd(-48_730_045_000, true), "−J$48.7bn");
  assert.equal(formatJmd(1_441_781_354_000, true), "J$1.44tn");
});

test("Explorer filters round-trip through shareable query parameters", () => {
  const filters = { ...EMPTY_EXPLORER_FILTERS, public_category_id: "CAT_HEALTH", recurrent_or_capital: "RECURRENT" };
  const search = searchWithExplorerFilters("?view=spending&utm_source=press", filters);
  assert.equal(search, "?view=spending&utm_source=press&category=CAT_HEALTH&budget=RECURRENT");
  assert.deepEqual(explorerFiltersFromSearch(search), filters);
});

test("CSV export includes approved fields and safely escapes spreadsheet formulas", () => {
  const csv = buildSpendingCsv([{
    fiscal_year: "2026/27",
    organisation_name: '=HYPERLINK("bad")',
    amount_jmd: -20,
    source_url: "https://example.com/source.pdf",
  }]);
  assert.match(csv, /"Fiscal year","Organisation"/);
  assert.match(csv, /"'=HYPERLINK\(""bad""\)"/);
  assert.match(csv, /,"-20",/);
});
