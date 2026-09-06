import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalogUrl = new URL("../config/source-catalog.v1.json", import.meta.url);

test("catalog exposes no private workbooks, credentials or mutation path", async () => {
  const text = await readFile(catalogUrl, "utf8");
  const catalog = JSON.parse(text);
  assert.equal(catalog.status, "INACTIVE_READ_ONLY");
  assert.equal(catalog.network.method, "GET");
  assert.equal(Number.isInteger(catalog.network.maxRedirects), true);
  assert.equal(catalog.network.maxRedirects <= 5, true);
  assert.equal(catalog.outputContract.persistence, "NONE");
  assert.equal(catalog.outputContract.notification, "NONE");
  assert.equal(catalog.outputContract.downstreamExecution, "NONE");
  assert.doesNotMatch(text, /docs\.google\.com\/spreadsheets|service[_-]?account|[?&](token|key|secret)=/i);
  for (const source of [catalog.discovery, ...catalog.artifacts]) {
    assert.match(source.url, /^https:\/\/(www\.)?mof\.gov\.jm\//);
  }
});
