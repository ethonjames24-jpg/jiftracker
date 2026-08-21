import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("uses one accessible loading line and value-free skeleton structure", async () => {
  const states = await readSource("../components/States.jsx");
  const app = await readSource("../App.jsx");

  assert.match(states, /className="loading-line"/);
  assert.match(states, /Updating this view/);
  assert.match(states, /aria-busy="true"/);
  assert.match(states, /Array\.from\(\{ length: 4 \}/);
  assert.match(app, /<LoadingLine active=\{loading\} \/>/);
});

test("keeps Explorer filter motion brief and separate from data loading", async () => {
  const explorer = await readSource("../components/spending/SpendingExplorerPage.jsx");
  const styles = await readSource("../styles.css");

  assert.match(explorer, /setIsFilterTransitioning\(true\)/);
  assert.match(explorer, /setTimeout\(\(\) => setIsFilterTransitioning\(false\), 220\)/);
  assert.match(explorer, /is-filter-transitioning/);
  assert.match(styles, /--motion-standard: 220ms;/);
  assert.match(styles, /@keyframes explorer-result-settle/);
  assert.match(styles, /translateY\(6px\)/);
});

test("marks all existing capture routes ready and removes capture motion", async () => {
  const capture = await readSource("../components/CaptureViews.jsx");
  const styles = await readSource("../styles.css");

  for (const mode of ["hero", "kpi", "sources"]) {
    assert.match(capture, new RegExp(`data-capture-mode="${mode}" data-capture-ready="true"`));
  }

  assert.match(styles, /\.capture-page, \.capture-page \*/);
  assert.match(styles, /animation: none !important; transition: none !important; scroll-behavior: auto !important;/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("preserves protected public-finance language", async () => {
  const explorer = await readSource("../components/spending/SpendingExplorerPage.jsx");

  assert.match(explorer, /Estimates As Passed—not actual spending/);
  assert.match(explorer, /planned allocations—not reports of money already spent/);
});
