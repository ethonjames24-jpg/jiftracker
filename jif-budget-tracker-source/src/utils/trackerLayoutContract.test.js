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
  assert.match(source, /--header-height: 126px; --section-nav-height: 58px;/);
});

test("keeps the floating subscription prompt clear of Back to Top", async () => {
  const app = await readSource("../App.jsx");
  const component = await readSource("../components/SubscriptionSection.jsx");
  const styles = await readSource("../styles.css");

  assert.match(app, /<FloatingSubscribeButton \/>/);
  assert.match(component, /hasPassedInvitation && !isFormVisible/);
  assert.match(component, /emailInput\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(component, /pending_confirmation/);
  assert.match(styles, /\.floating-subscribe-button \{[^}]*bottom: 84px;/);
  assert.match(styles, /\.back-to-top-button \{[^}]*bottom: 24px;/);
  assert.match(styles, /\.floating-subscribe-button \{ left: 16px; right: 16px; bottom: 16px;/);
  assert.match(styles, /\.back-to-top-button \{ right: 16px; bottom: 78px;/);
});
