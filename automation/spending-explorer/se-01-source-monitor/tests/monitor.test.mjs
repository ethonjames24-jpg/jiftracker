import assert from "node:assert/strict";
import test from "node:test";
import { extractRelevantLinks, monitorSources, sha256Hex } from "../src/monitor.mjs";

function baseCatalog() {
  const artifactBytes = Buffer.from("Coding Block,Org Desc,2026-2027\n1,Example,10\n");
  const expectedLinks = [
    "https://www.mof.gov.jm/wp-content/uploads/2026-2027-Approved-Estimates.csv",
    "https://www.mof.gov.jm/wp-content/uploads/2026-2027-Estimates-of-Expenditure-As-Passed.pdf",
  ];
  return {
    catalogVersion: "1.0.0",
    workflowId: "SE-01",
    workflowName: "JIF | SE-01 Spending Explorer Source Monitor | INACTIVE",
    status: "INACTIVE_READ_ONLY",
    fiscalYear: "2026-2027",
    allowedHosts: ["www.mof.gov.jm", "mof.gov.jm"],
    network: {
      method: "GET",
      timeoutMs: 1000,
      maxBytesPerSource: 100000,
      userAgent: "SE-01-Test",
    },
    discovery: {
      id: "discovery",
      sourceClass: "primary_discovery",
      url: "https://www.mof.gov.jm/resources-annual-and-supplementary-estimates/",
      expectedContentTypes: ["text/html"],
      minimumBytes: 20,
      requiredTextTokens: ["Annual and Supplementary Estimates"],
      linkInventory: {
        requiredPathPrefix: "/wp-content/uploads/",
        fiscalYearTokens: ["2026-2027", "2026-27"],
        includeTokens: ["estimates", "supplementary"],
        excludeTokens: ["public-sector", "consolidated", "public-bodies", "revenue"],
        expectedUrls: expectedLinks,
        expectedSha256: sha256Hex(expectedLinks.sort().join("\n")),
      },
    },
    artifacts: [
      {
        id: "approved_csv",
        sourceClass: "primary_machine_readable",
        url: expectedLinks[0],
        expectedContentTypes: ["text/csv"],
        minimumBytes: 20,
        maximumBytes: 100000,
        requiredTextTokens: ["Coding Block", "Org Desc", "2026-2027"],
        expectedBytes: artifactBytes.length,
        expectedSha256: sha256Hex(artifactBytes),
      },
    ],
    outputContract: {
      allowedStates: ["MONITORED_NO_CHANGE", "SOURCE_CHANGE_DETECTED", "FAILED_CLOSED"],
      persistence: "NONE",
      notification: "NONE",
      downstreamExecution: "NONE",
    },
    prohibitedCapabilities: ["writes"],
  };
}

function discoveryHtml(extraLink = "") {
  return Buffer.from(`
    <html><title>Annual and Supplementary Estimates</title>
      <a href="/wp-content/uploads/2026-2027-Approved-Estimates.csv">Approved</a>
      <a href="/wp-content/uploads/2026-2027-Estimates-of-Expenditure-As-Passed.pdf">As Passed</a>
      ${extraLink}
    </html>
  `);
}

function fakeFetch(responses) {
  return async (url) => {
    const response = responses.get(url);
    if (!response) return new Response("not found", { status: 404 });
    return new Response(response.body, {
      status: response.status ?? 200,
      headers: { "content-type": response.contentType, ...(response.headers ?? {}) },
    });
  };
}

function noChangeResponses(catalog) {
  return new Map([
    [catalog.discovery.url, { body: discoveryHtml(), contentType: "text/html; charset=UTF-8" }],
    [
      catalog.artifacts[0].url,
      { body: Buffer.from("Coding Block,Org Desc,2026-2027\n1,Example,10\n"), contentType: "text/csv" },
    ],
  ]);
}

test("returns MONITORED_NO_CHANGE for an identical official source set", async () => {
  const catalog = baseCatalog();
  const receipt = await monitorSources(catalog, {
    fetchFn: fakeFetch(noChangeResponses(catalog)),
    now: new Date("2026-08-28T12:00:00Z"),
  });
  assert.equal(receipt.state, "MONITORED_NO_CHANGE");
  assert.deepEqual(receipt.summary, { sourcesChecked: 2, unchanged: 2, changed: 0, failed: 0 });
  assert.equal(receipt.inactive, true);
  assert.equal(receipt.readOnly, true);
});

test("detects changed artifact bytes without acquiring or staging them", async () => {
  const catalog = baseCatalog();
  const responses = noChangeResponses(catalog);
  responses.set(catalog.artifacts[0].url, {
    body: Buffer.from("Coding Block,Org Desc,2026-2027\n1,Example,11\n"),
    contentType: "text/csv",
  });
  const receipt = await monitorSources(catalog, { fetchFn: fakeFetch(responses) });
  assert.equal(receipt.state, "SOURCE_CHANGE_DETECTED");
  assert.equal(receipt.summary.changed, 1);
  assert.equal(receipt.results[1].changeReason, "SOURCE_BYTES_CHANGED");
});

test("detects a new in-scope supplementary estimate link", async () => {
  const catalog = baseCatalog();
  const responses = noChangeResponses(catalog);
  responses.set(catalog.discovery.url, {
    body: discoveryHtml(
      '<a href="/wp-content/uploads/2026-2027-First-Supplementary-Estimates.pdf">New</a>',
    ),
    contentType: "text/html",
  });
  const receipt = await monitorSources(catalog, { fetchFn: fakeFetch(responses) });
  assert.equal(receipt.state, "SOURCE_CHANGE_DETECTED");
  assert.deepEqual(receipt.results[0].addedLinks, [
    "https://www.mof.gov.jm/wp-content/uploads/2026-2027-First-Supplementary-Estimates.pdf",
  ]);
});

test("fails closed for a non-allowlisted host", async () => {
  const catalog = baseCatalog();
  catalog.artifacts[0].url = "https://example.com/2026-2027-Approved-Estimates.csv";
  const receipt = await monitorSources(catalog, { fetchFn: fakeFetch(new Map()) });
  assert.equal(receipt.state, "FAILED_CLOSED");
  assert.equal(receipt.results[0].errorCode, "INVALID_CATALOG");
});

test("fails closed for an unavailable official source", async () => {
  const catalog = baseCatalog();
  const responses = noChangeResponses(catalog);
  responses.set(catalog.artifacts[0].url, {
    body: Buffer.from("unavailable"),
    contentType: "text/plain",
    status: 503,
  });
  const receipt = await monitorSources(catalog, { fetchFn: fakeFetch(responses) });
  assert.equal(receipt.state, "FAILED_CLOSED");
  assert.equal(receipt.results[1].errorCode, "HTTP_FAILURE");
});

test("discovery excludes consolidated and unrelated-year links", () => {
  const catalog = baseCatalog();
  const html = `${discoveryHtml()}
    <a href="/wp-content/uploads/2026-2027-Public-Sector-Consolidated-Estimates.pdf">No</a>
    <a href="/wp-content/uploads/2025-2026-First-Supplementary-Estimates.pdf">No</a>`;
  assert.deepEqual(
    extractRelevantLinks(html, catalog.discovery, catalog.allowedHosts),
    catalog.discovery.linkInventory.expectedUrls,
  );
});
