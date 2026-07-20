import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_EXPLORER_FILTERS,
  filterSpendingRows,
  formatJmd,
  groupSpendingRows,
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
