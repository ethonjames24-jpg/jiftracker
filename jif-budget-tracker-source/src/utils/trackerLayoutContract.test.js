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
  assert.match(source, /--header-height: 146px; --section-nav-height: 58px;/);
});

test("keeps the endorsed header readable at desktop, tablet, and mobile widths", async () => {
  const header = await readSource("../components/Header.jsx");
  const styles = await readSource("../styles.css");

  const navStart = header.indexOf('<nav ref={navRef} className="nav-links"');
  const explorerSwitch = header.indexOf('data-testid="government-spending-explorer-link"');
  const navEnd = header.indexOf("</nav>", navStart);

  assert.ok(navStart > -1 && explorerSwitch > navStart && explorerSwitch < navEnd);
  assert.match(header, /if \(activeSection === "overview"\) \{[\s\S]*nav\.scrollTo\(\{ left: 0/);
  assert.match(styles, /--header-height: 124px;/);
  assert.match(styles, /\.header-inner \{[^}]*max-width: 1360px;/);
  assert.match(styles, /\.jif-product-lockup-wordmark \{[^}]*width: 520px;/);
  assert.match(styles, /\.jif-product-lockup-copy strong \{[^}]*font-size: 1\.625rem;/);
  assert.match(styles, /\.jif-product-lockup-copy small \{[^}]*color: var\(--navy\);[^}]*font-size: \.875rem;/);
  assert.match(styles, /@media \(min-width: 901px\) and \(max-width: 1100px\)/);
  assert.match(styles, /\.tracker-product-lockup \.jif-product-lockup-copy small \{ display: block;/);
  assert.equal(styles.includes(".tracker-product-lockup .jif-product-lockup-copy small { display: none; }"), false);
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
