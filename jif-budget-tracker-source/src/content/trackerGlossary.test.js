import assert from "node:assert/strict";
import test from "node:test";
import { definitionForKpi, KPI_DEFINITIONS, TRACKER_TERMS } from "./trackerGlossary.js";

test("provides a definition for every tracked KPI", () => {
  assert.equal(Object.keys(KPI_DEFINITIONS).length, 8);

  [
    "Tax Revenue",
    "Non-Tax Revenue",
    "Total Revenue & Grants",
    "Primary Balance",
    "Fiscal Balance",
    "Compensation of Employees",
    "Capital Expenditure",
    "Interest",
  ].forEach((label) => assert.ok(definitionForKpi(label), `${label} should have a definition`));
});

test("matches KPI labels without depending on case or surrounding spaces", () => {
  assert.equal(definitionForKpi("  FISCAL BALANCE  "), KPI_DEFINITIONS["fiscal balance"]);
  assert.equal(definitionForKpi("Unknown measure"), "");
});

test("explains the core terms used in the public table", () => {
  const terms = TRACKER_TERMS.map(({ term }) => term);

  assert.ok(terms.includes("Key performance indicator (KPI)"));
  assert.ok(terms.includes("Year-to-date (YTD)"));
  assert.ok(terms.includes("Budget baseline"));
  assert.ok(terms.includes("Outturn"));
  assert.ok(terms.includes("How it compares"));
});
