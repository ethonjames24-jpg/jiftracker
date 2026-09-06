import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const catalogPath = resolve(packageRoot, "config/source-catalog.v1.json");
const outputPath = resolve(
  packageRoot,
  "workflows/JIF_SE01_Spending_Explorer_Source_Monitor_INACTIVE.json",
);
const catalogText = await readFile(catalogPath, "utf8");
const catalog = JSON.parse(catalogText);
const catalogDigest = createHash("sha256").update(catalogText).digest("hex");

const loadCatalogCode = `const catalog = ${JSON.stringify(catalog)};
const sources = [
  { ...catalog.discovery, kind: 'discovery' },
  ...catalog.artifacts.map((source) => ({ ...source, kind: 'artifact' })),
];
return sources.map((source) => ({ json: {
  ...source,
  workflowId: catalog.workflowId,
  workflowName: catalog.workflowName,
  catalogVersion: catalog.catalogVersion,
  fiscalYear: catalog.fiscalYear,
  allowedHosts: catalog.allowedHosts,
  readOnly: true,
  inactive: true,
} }));`;

const fingerprintCode = `const sourceItems = $('Load Approved Catalog').all();
const fetchedItems = $input.all();
const fail = (code, message = code) => {
  throw Object.assign(new Error(message), { code });
};
const sha256 = async (bytes) => {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
};
const normalizeUrl = (raw, base) => {
  const url = new URL(raw, base);
  url.hash = '';
  url.search = '';
  if (url.hostname === 'mof.gov.jm') url.hostname = 'www.mof.gov.jm';
  return url.toString();
};
const results = [];
for (let index = 0; index < sourceItems.length; index += 1) {
  const source = sourceItems[index].json;
  try {
    const fetchedItem = fetchedItems[index];
    if (!fetchedItem) fail('SOURCE_RESPONSE_MISSING');
    const responseError = fetchedItem.json?.error;
    if (responseError) {
      const message = typeof responseError === 'string'
        ? responseError
        : responseError.message || JSON.stringify(responseError);
      fail('HTTP_REQUEST_FAILED', message);
    }
    const statusCode = Number(fetchedItem.json?.statusCode || 0);
    if (!Number.isInteger(statusCode) || statusCode < 100) fail('HTTP_STATUS_MISSING');
    if (statusCode < 200 || statusCode >= 300) fail('HTTP_FAILURE', 'HTTP ' + statusCode);
    const responseHeaders = fetchedItem.json?.headers || {};
    const contentTypeHeader = Object.entries(responseHeaders)
      .find(([name]) => name.toLowerCase() === 'content-type')?.[1];
    const contentType = String(contentTypeHeader || '')
      .split(';', 1)[0]
      .trim()
      .toLowerCase();
    const expectedContentTypes = (source.expectedContentTypes || [])
      .map((value) => String(value).toLowerCase());
    if (!contentType || !expectedContentTypes.includes(contentType)) {
      fail('CONTENT_TYPE_MISMATCH', 'Unexpected content type: ' + (contentType || '<missing>'));
    }
    const bytes = await this.helpers.getBinaryDataBuffer(index, 'data');
    if (!bytes || bytes.length < (source.minimumBytes || 1)) fail('SOURCE_BYTES_MISSING_OR_TOO_SMALL');
    if (bytes.length > (source.maximumBytes || 50000000)) fail('SOURCE_TOO_LARGE');
    if (source.requiredMagicHex) {
      const magic = bytes.subarray(0, source.requiredMagicHex.length / 2).toString('hex');
      if (magic.toLowerCase() !== source.requiredMagicHex.toLowerCase()) fail('FILE_SIGNATURE_MISMATCH');
    }
    const sample = bytes.subarray(0, Math.min(bytes.length, 131072)).toString('utf8');
    for (const token of source.requiredTextTokens || []) {
      if (!sample.includes(token)) fail('CONTENT_SIGNATURE_MISMATCH');
    }
    if (source.kind === 'discovery') {
      const discoveryHtml = bytes.toString('utf8');
      const rules = source.linkInventory;
      const allowed = new Set(source.allowedHosts.map((host) => host === 'mof.gov.jm' ? 'www.mof.gov.jm' : host));
      const links = new Set();
      for (const match of discoveryHtml.matchAll(/href\\s*=\\s*["']([^"']+)["']/giu)) {
        try {
          const normalized = normalizeUrl(match[1], source.url);
          const parsed = new URL(normalized);
          const searchable = parsed.pathname.toLowerCase();
          if (!allowed.has(parsed.hostname)) continue;
          if (!parsed.pathname.startsWith(rules.requiredPathPrefix)) continue;
          if (!rules.fiscalYearTokens.some((token) => searchable.includes(token.toLowerCase()))) continue;
          if (!rules.includeTokens.some((token) => searchable.includes(token.toLowerCase()))) continue;
          if (rules.excludeTokens.some((token) => searchable.includes(token.toLowerCase()))) continue;
          links.add(normalized);
        } catch {}
      }
      const observedLinks = [...links].sort();
      const observedSha256 = await sha256(new TextEncoder().encode(observedLinks.join('\\n')));
      results.push({ json: {
        sourceId: source.id,
        sourceClass: source.sourceClass,
        url: source.url,
        outcome: observedSha256 === rules.expectedSha256 ? 'UNCHANGED' : 'CHANGED',
        expectedSha256: rules.expectedSha256,
        observedSha256,
        expectedLinks: rules.expectedUrls,
        observedLinks,
        addedLinks: observedLinks.filter((url) => !rules.expectedUrls.includes(url)),
        missingLinks: rules.expectedUrls.filter((url) => !observedLinks.includes(url)),
        observedBytes: bytes.length,
        contentType,
        statusCode,
      } });
    } else {
      const observedSha256 = await sha256(bytes);
      results.push({ json: {
        sourceId: source.id,
        sourceClass: source.sourceClass,
        url: source.url,
        outcome: observedSha256 === source.expectedSha256 ? 'UNCHANGED' : 'CHANGED',
        expectedSha256: source.expectedSha256,
        observedSha256,
        expectedBytes: source.expectedBytes,
        observedBytes: bytes.length,
        contentType,
        statusCode,
      } });
    }
  } catch (error) {
    results.push({ json: {
      sourceId: source.id,
      sourceClass: source.sourceClass,
      url: source.url,
      outcome: 'FAILED',
      errorCode: error.code || 'FAILED_CLOSED',
      errorMessage: error.message || 'FAILED_CLOSED',
    } });
  }
}
return results;`;

const receiptCode = `const results = $input.all().map((item) => item.json);
const failed = results.filter((result) => result.outcome === 'FAILED').length;
const changed = results.filter((result) => result.outcome === 'CHANGED').length;
const unchanged = results.filter((result) => result.outcome === 'UNCHANGED').length;
const state = failed > 0 ? 'FAILED_CLOSED' : changed > 0 ? 'SOURCE_CHANGE_DETECTED' : 'MONITORED_NO_CHANGE';
const nextAction = state === 'MONITORED_NO_CHANGE'
  ? 'No action. Retain the receipt and wait for the next authorized check.'
  : state === 'SOURCE_CHANGE_DETECTED'
    ? 'Open a human source-review case. Do not acquire, extract, stage, approve or publish from this receipt alone.'
    : 'Stop. Investigate the source or content failure. Do not open a release case.';
return [{ json: {
  schemaVersion: '1.0.0',
  workflowId: 'SE-01',
  workflowName: 'JIF | SE-01 Spending Explorer Source Monitor | INACTIVE',
  catalogVersion: '${catalog.catalogVersion}',
  catalogDigest: '${catalogDigest}',
  fiscalYear: '${catalog.fiscalYear}',
  checkedAt: new Date().toISOString(),
  inactive: true,
  readOnly: true,
  state,
  summary: { sourcesChecked: results.length, unchanged, changed, failed },
  results,
  nextAction,
} }];`;

const workflow = {
  name: catalog.workflowName,
  nodes: [
    {
      parameters: {},
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a001",
      name: "Manual Review Trigger",
      type: "n8n-nodes-base.manualTrigger",
      typeVersion: 1,
      position: [-760, 120],
    },
    {
      parameters: {
        rule: {
          interval: [{ field: "days", daysInterval: 1, triggerAtHour: 9, triggerAtMinute: 15 }],
        },
      },
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a002",
      name: "Daily Schedule — INACTIVE",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.2,
      position: [-760, -60],
    },
    {
      parameters: { mode: "runOnceForAllItems", jsCode: loadCatalogCode },
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a003",
      name: "Load Approved Catalog",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [-500, 20],
      notesInFlow: true,
      notes: "Public MOFPS URLs only. No credentials, private workbook IDs or write targets.",
    },
    {
      parameters: {
        method: "GET",
        url: "={{ $json.url }}",
        options: {
          allowUnauthorizedCerts: false,
          redirect: { redirect: { followRedirects: false } },
          response: {
            response: {
              fullResponse: true,
              neverError: true,
              responseFormat: "file",
              outputPropertyName: "data",
            },
          },
          timeout: 90000,
        },
      },
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a004",
      name: "GET Official Source Bytes",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [-240, 20],
      notesInFlow: true,
      notes:
        "Read-only GET. Redirects are not followed. Status, type or request failures continue only to the FAILED_CLOSED receipt.",
      alwaysOutputData: true,
      onError: "continueRegularOutput",
    },
    {
      parameters: { mode: "runOnceForAllItems", jsCode: fingerprintCode },
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a005",
      name: "Fingerprint and Compare",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [20, 20],
    },
    {
      parameters: { mode: "runOnceForAllItems", jsCode: receiptCode },
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a006",
      name: "Return Read-Only Receipt",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [280, 20],
      notesInFlow: true,
      notes: "Terminal node. No persistence, notification, downstream execution or publication node follows.",
    },
  ],
  connections: {
    "Manual Review Trigger": { main: [[{ node: "Load Approved Catalog", type: "main", index: 0 }]] },
    "Daily Schedule — INACTIVE": {
      main: [[{ node: "Load Approved Catalog", type: "main", index: 0 }]],
    },
    "Load Approved Catalog": {
      main: [[{ node: "GET Official Source Bytes", type: "main", index: 0 }]],
    },
    "GET Official Source Bytes": {
      main: [[{ node: "Fingerprint and Compare", type: "main", index: 0 }]],
    },
    "Fingerprint and Compare": {
      main: [[{ node: "Return Read-Only Receipt", type: "main", index: 0 }]],
    },
  },
  pinData: {},
  active: false,
  settings: {
    executionOrder: "v1",
    timezone: "America/Jamaica",
    saveManualExecutions: true,
  },
  versionId: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a000",
  meta: {
    packageStatus: "INACTIVE_READ_ONLY",
    sourceCatalogDigest: catalogDigest,
    importAuthorized: false,
    activationAuthorized: false,
  },
  tags: [],
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(workflow, null, 2)}\n`, "utf8");
process.stdout.write(`${outputPath}\n`);
