import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("keeps the compact subscription CTA before results and the full form after methodology", async () => {
  const source = await readSource("../App.jsx");
  const compactIndex = source.indexOf("<CompactSubscribeCta />");
  const tableIndex = source.indexOf("<KpiTable");
  const methodologyIndex = source.indexOf("<MethodologySection");
  const subscriptionIndex = source.indexOf("<SubscriptionSection");

  assert.ok(compactIndex > -1 && compactIndex < tableIndex);
  assert.ok(methodologyIndex > tableIndex && methodologyIndex < subscriptionIndex);
  assert.equal(source.includes("<SummaryCards"), false);
});

test("keeps one sticky-anchor offset and the mobile KPI scanning contract", async () => {
  const source = await readSource("../styles.css");

  assert.match(source, /html \{[^}]*scroll-padding-top: var\(--sticky-offset\)/);
  assert.match(source, /\.section-band\[id\] \{ scroll-margin-top: 0; \}/);
  assert.match(source, /\.table-card th:first-child, \.table-card td:first-child \{ position: sticky;/);
  assert.match(source, /\.app :is\(a, button, input, select\):focus-visible/);
  assert.match(source, /--header-height: 118px; --section-nav-height: 58px;/);
});
