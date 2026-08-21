import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { editorialHeadlineFor, receiptsCheckApproved } from "./brandContent.js";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("keeps the approved JIF v1.0 developer tokens and typography", async () => {
  const styles = await readSource("../styles.css");

  assert.match(styles, /--jif-gold: #f4c400;/);
  assert.match(styles, /--jif-black: #090909;/);
  assert.match(styles, /--jif-civic-navy: #0a2c43;/);
  assert.match(styles, /--jif-paper-white: #f7f5ef;/);
  assert.match(styles, /--jif-digital-white: #ffffff;/);
  assert.match(styles, /--status-on-track: #247a4a;/);
  assert.match(styles, /--status-watch: #d99000;/);
  assert.match(styles, /--status-under-pressure: #c92a2a;/);
  assert.match(styles, /family=Barlow\+Condensed/);
  assert.match(styles, /family=Inter/);
});

test("keeps status colors out of decorative and Explorer accent roles", async () => {
  const styles = await readSource("../styles.css");

  assert.equal(styles.includes("--explorer-green"), false);
  assert.equal(styles.includes("var(--green)"), false);
  assert.equal(styles.includes("var(--amber)"), false);
  assert.equal(styles.includes("var(--red)"), false);
  assert.match(styles, /\.status-green[^}]*var\(--status-on-track\)/);
  assert.match(styles, /\.status-amber[^}]*var\(--status-watch\)/);
  assert.match(styles, /\.status-red[^}]*var\(--status-under-pressure\)/);
});

test("uses the approved master assets through one endorsed product-lockup component", async () => {
  const config = await readSource("../config.js");
  const lockup = await readSource("../components/JifProductLockup.jsx");
  const header = await readSource("../components/Header.jsx");
  const footer = await readSource("../components/PublicToolsFooter.jsx");
  const explorer = await readSource("../components/spending/SpendingExplorerPage.jsx");

  assert.match(config, /jif-horizontal-light-background-wordmark-web-v1\.png/);
  assert.match(config, /jif-compact-monogram-web-v1\.png/);
  assert.match(config, /jif-b1-b1-master-badge-web-v1\.png/);
  assert.match(lockup, /data-brand-role="endorsed-product-lockup"/);
  assert.match(lockup, /HORIZONTAL_WORDMARK_URL/);
  assert.match(lockup, /COMPACT_MONOGRAM_URL/);
  assert.match(header, /<JifProductLockup/);
  assert.match(header, /productName="Budget Tracker"/);
  assert.match(explorer, /<JifProductLockup/);
  assert.match(explorer, /productName="Spending Explorer"/);
  assert.match(footer, /MASTER_BADGE_URL/);

  for (const asset of [
    "../../public/brand/jif-horizontal-light-background-wordmark-web-v1.png",
    "../../public/brand/jif-compact-monogram-web-v1.png",
    "../../public/brand/jif-b1-b1-master-badge-web-v1.png",
  ]) {
    const bytes = await readFile(new URL(asset, import.meta.url));
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }

  const wordmarkBytes = await readFile(new URL("../../public/brand/jif-horizontal-light-background-wordmark-web-v1.png", import.meta.url));
  assert.equal(wordmarkBytes.readUInt32BE(16), 1440);
  assert.equal(wordmarkBytes.readUInt32BE(20), 268);
});

test("uses only the current product names and monthly editorial hero headline", async () => {
  const overview = await readSource("../components/Overview.jsx");
  const capture = await readSource("../components/CaptureViews.jsx");
  const methodology = await readSource("../components/MethodologySection.jsx");
  const subscription = await readSource("../components/SubscriptionSection.jsx");
  const readme = await readSource("../../README.md");
  const combined = [overview, capture, methodology, subscription, readme].join("\n");

  assert.equal(combined.includes("Jamaica Budget Performance Tracker"), false);
  assert.equal(combined.includes("Jamaica In Focus Budget Performance Tracker"), false);
  assert.match(overview, /editorialHeadlineFor\(currentMonth\)/);
  assert.match(capture, /editorialHeadlineFor\(currentMonth\)/);
  assert.equal(editorialHeadlineFor({ what_changed_headline: "Central Government Under Pressure" }), "Central Government Under Pressure.");
  assert.equal(editorialHeadlineFor({ month_label: "June 2026", status_headline: "Under Pressure" }), "June 2026: Under Pressure.");
});

test("requires an explicit approval field before showing Receipts Checked", async () => {
  const source = await readSource("../components/SourceSection.jsx");
  const loader = await readSource("../services/googleSheets.js");

  assert.equal(receiptsCheckApproved({ receipts_pack_url: "https://example.com/pack.pdf" }), false);
  assert.equal(receiptsCheckApproved({ receipts_check_status: "APPROVED" }), true);
  assert.match(source, /isReceiptsChecked \? "Receipts Checked" : "Official source record"/);
  assert.match(loader, /receipts_check_status/);
});

test("keeps Explorer changes neutral, signed, and fully contextualized", async () => {
  const explorer = await readSource("../components/spending/SpendingExplorerPage.jsx");

  assert.equal(explorer.includes('className={row.amount_change_jmd < 0 ? "is-down" : "is-up"}'), false);
  assert.match(explorer, /className="is-signed-change"/);
  assert.match(explorer, /FY \{fiscalYear\} Estimates As Passed, using net approved expenditure after Appropriations-in-Aid/);
  assert.match(explorer, /All approved FY \$\{activeFiscalYear\} records/);
  assert.equal(explorer.includes("{activeFilterCount > 0 && ("), false);
});

test("publishes complete source metadata and a truthful plain-text developer credit", async () => {
  const source = await readSource("../components/SourceSection.jsx");
  const loader = await readSource("../services/googleSheets.js");
  const footer = await readSource("../components/PublicToolsFooter.jsx");

  for (const label of ["Source owner", "Publication date", "Period covered", "Used for tracker month", "Verification status"]) {
    assert.match(source, new RegExp(label));
  }
  for (const field of ["source_document_1_owner", "source_document_1_publication_date", "source_document_1_period", "source_document_2_owner", "source_document_2_publication_date", "source_document_2_period"]) {
    assert.match(loader, new RegExp(field));
  }
  assert.match(footer, /data-testid="developer-credit">Built by Crypten Technologies<\/span>/);
  assert.equal(footer.includes("CRYPTEN_URL"), false);
  assert.equal(footer.includes(">Built by Crypten Technologies</a>"), false);
});

test("removes retired logo configuration and keeps the glossary unique", async () => {
  const readme = await readSource("../../README.md");
  const env = await readSource("../../.env.example");
  const explorer = await readSource("../components/spending/SpendingExplorerPage.jsx");

  assert.equal(readme.includes("VITE_LOGO_URL"), false);
  assert.equal(readme.includes("/jif-logo.png"), false);
  assert.equal(env.includes("VITE_LOGO_URL"), false);
  assert.equal(explorer.includes("<dt>Public debt</dt>"), false);
  assert.equal((explorer.match(/<dt>Appropriations-in-Aid<\/dt>/g) || []).length, 1);
});
