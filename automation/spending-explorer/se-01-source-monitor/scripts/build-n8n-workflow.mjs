import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256Bytes, canonicalMofUrl } from "../src/n8n-runtime-compat.mjs";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const catalogPath = resolve(packageRoot, "config/source-catalog.v1.json");
const outputPath = resolve(
  packageRoot,
  "workflows/JIF_SE01_Spending_Explorer_Source_Monitor_INACTIVE.json",
);
const catalogText = await readFile(catalogPath, "utf8");
const catalog = JSON.parse(catalogText);
const catalogDigest = createHash("sha256").update(catalogText).digest("hex");

const loadCatalogCode = `${canonicalMofUrl.toString()}\nconst catalog = ${JSON.stringify(catalog)};
const sources = [
  { ...catalog.discovery, kind: 'discovery' },
  ...catalog.artifacts.map((source) => ({ ...source, kind: 'artifact' })),
];
if(catalog.status!=="INACTIVE_READ_ONLY"||catalog.network.method!=="GET"||sources.length!==5)throw new Error("SE01_CATALOG_INVALID");
for(const source of sources) canonicalMofUrl(source.url, source.url);
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

const fingerprintCode = `${sha256Bytes.toString()}
${canonicalMofUrl.toString()}
const sourceItems = $('Load Approved Catalog').all();
const fetchedItems = $input.all();
const fail = (code, message = code) => {
  throw Object.assign(new Error(message), { code });
};
const sha256 = async (bytes) => sha256Bytes(bytes);
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
          const parsed = canonicalMofUrl(match[1].replace(/&amp;/g, "&"), source.url);
          const normalized = parsed.url;
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
const expectedIds = ${JSON.stringify([catalog.discovery.id, ...catalog.artifacts.map(s => s.id)])};
if(results.length!==expectedIds.length||new Set(results.map(r=>r.sourceId)).size!==expectedIds.length||results.some(r=>!expectedIds.includes(r.sourceId)||!['UNCHANGED','CHANGED','FAILED'].includes(r.outcome))){
  results.push({sourceId:'receipt_contract',outcome:'FAILED',errorCode:'SOURCE_RESULT_SET_INVALID',errorMessage:'Expected exactly one recognized result for each approved source'});
}
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
      position: [-860, 120],
    },
    {
      parameters: {
        rule: {
          interval: [{ field: "days", daysInterval: 1, triggerAtHour: 9, triggerAtMinute: 15 }],
        },
      },
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a002",
      name: "Daily Schedule — INACTIVE",
      disabled: true,
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.2,
      position: [-860, -60],
    },
    {
      parameters: { mode: "runOnceForAllItems", jsCode: loadCatalogCode },
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a003",
      name: "Load Approved Catalog",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [-600, 20],
      notesInFlow: true,
      notes: "Public MOFPS URLs only. No credentials, private workbook IDs or write targets.",
    },
    {
      parameters: { batchSize: 1, options: { reset: false } },
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a007",
      name: "Loop Official Sources",
      type: "n8n-nodes-base.splitInBatches",
      typeVersion: 3,
      position: [-350, 20],
      notesInFlow: true,
      notes: "One in-flight public source request. Done collects all five results, including failures, before comparison.",
    },
    {
      parameters: {
        method: "GET",
        sendBody: false,
        authentication: "none",
        url: "={{ $json.url }}",
        options: {
          allowUnauthorizedCerts: false,
          redirect: { redirect: { followRedirects: false, maxRedirects: 0 } },
          response: {
            response: {
              fullResponse: true,
              neverError: true,
              responseFormat: "file",
              outputPropertyName: "data",
            },
          },
          timeout: 180000,
        },
      },
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a004",
      name: "GET Official Source Bytes",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.4,
      position: [-100, 100],
      notesInFlow: true,
      notes:
        "Read-only GET. Redirects are not followed. Status, type or request failures continue only to the FAILED_CLOSED receipt.",
      retryOnFail: false,
      alwaysOutputData: true,
      onError: "continueRegularOutput",
    },
    {
      parameters: { mode: "runOnceForAllItems", jsCode: fingerprintCode },
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a005",
      name: "Fingerprint and Compare",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [160, -80],
    },
    {
      parameters: { mode: "runOnceForAllItems", jsCode: receiptCode },
      id: "0a4f32d1-1fe4-42c5-a2f7-20158ef3a006",
      name: "Return Read-Only Receipt",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [420, -80],
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
      main: [[{ node: "Loop Official Sources", type: "main", index: 0 }]],
    },
    "Loop Official Sources": {
      main: [
        [{ node: "Fingerprint and Compare", type: "main", index: 0 }],
        [{ node: "GET Official Source Bytes", type: "main", index: 0 }],
      ],
    },
    "GET Official Source Bytes": {
      main: [[{ node: "Loop Official Sources", type: "main", index: 0 }]],
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
    runtimeCompatibility: {candidateVersion: "1.0.3", target: "n8n 2.25.7", nativeTested: false},
    activationAuthorized: false,
  },
  tags: [],
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(workflow, null, 2)}\n`, "utf8");
process.stdout.write(`${outputPath}\n`);
