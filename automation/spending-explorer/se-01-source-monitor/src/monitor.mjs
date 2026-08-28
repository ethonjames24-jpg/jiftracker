import { createHash } from "node:crypto";

const RECEIPT_SCHEMA_VERSION = "1.0.0";

export function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function contentTypeOnly(value = "") {
  return value.split(";", 1)[0].trim().toLowerCase();
}

function canonicalHost(hostname) {
  return hostname.toLowerCase().replace(/\.$/, "");
}

export function normalizePublicUrl(rawUrl, baseUrl) {
  const parsed = new URL(rawUrl, baseUrl);
  parsed.hash = "";
  parsed.search = "";
  parsed.hostname = canonicalHost(parsed.hostname);
  if (parsed.hostname === "mof.gov.jm") parsed.hostname = "www.mof.gov.jm";
  return parsed.toString();
}

export function validateCatalog(catalog) {
  const failures = [];
  if (catalog?.workflowId !== "SE-01") failures.push("workflowId must be SE-01");
  if (catalog?.status !== "INACTIVE_READ_ONLY") {
    failures.push("catalog status must be INACTIVE_READ_ONLY");
  }
  if (catalog?.network?.method !== "GET") failures.push("network method must be GET");
  if (catalog?.outputContract?.persistence !== "NONE") {
    failures.push("output persistence must be NONE");
  }
  if (catalog?.outputContract?.notification !== "NONE") {
    failures.push("notifications must be NONE");
  }
  if (catalog?.outputContract?.downstreamExecution !== "NONE") {
    failures.push("downstream execution must be NONE");
  }

  const allowedHosts = new Set((catalog?.allowedHosts ?? []).map(canonicalHost));
  const sources = [catalog?.discovery, ...(catalog?.artifacts ?? [])].filter(Boolean);
  if (sources.length < 2) failures.push("catalog must include discovery and artifact sources");

  const ids = new Set();
  for (const source of sources) {
    if (!source.id) failures.push("every source requires an id");
    if (ids.has(source.id)) failures.push(`duplicate source id: ${source.id}`);
    ids.add(source.id);

    try {
      const parsed = new URL(source.url);
      if (parsed.protocol !== "https:") failures.push(`${source.id}: URL must use HTTPS`);
      if (parsed.username || parsed.password) {
        failures.push(`${source.id}: credentials are prohibited in URLs`);
      }
      if (!allowedHosts.has(canonicalHost(parsed.hostname))) {
        failures.push(`${source.id}: host is not allowlisted`);
      }
    } catch {
      failures.push(`${source.id}: invalid URL`);
    }

    if (!Array.isArray(source.expectedContentTypes) || source.expectedContentTypes.length === 0) {
      failures.push(`${source.id}: expectedContentTypes is required`);
    }
  }

  for (const artifact of catalog?.artifacts ?? []) {
    if (!/^[a-f0-9]{64}$/.test(artifact.expectedSha256 ?? "")) {
      failures.push(`${artifact.id}: expectedSha256 must be a lowercase SHA-256 digest`);
    }
  }

  const discoveryDigest = catalog?.discovery?.linkInventory?.expectedSha256 ?? "";
  if (!/^[a-f0-9]{64}$/.test(discoveryDigest)) {
    failures.push("discovery linkInventory expectedSha256 is invalid");
  }

  if (failures.length) {
    const error = new Error(failures.join("; "));
    error.code = "INVALID_CATALOG";
    throw error;
  }
  return true;
}

export function extractRelevantLinks(html, discovery, allowedHosts) {
  const hrefPattern = /href\s*=\s*["']([^"']+)["']/giu;
  const results = new Set();
  const allowed = new Set(allowedHosts.map(canonicalHost));
  const rules = discovery.linkInventory;
  let match;

  while ((match = hrefPattern.exec(html)) !== null) {
    let normalized;
    try {
      normalized = normalizePublicUrl(match[1], discovery.url);
    } catch {
      continue;
    }
    const parsed = new URL(normalized);
    const searchable = `${parsed.pathname}${parsed.search}`.toLowerCase();
    if (!allowed.has(canonicalHost(parsed.hostname))) continue;
    if (!parsed.pathname.startsWith(rules.requiredPathPrefix)) continue;
    if (!rules.fiscalYearTokens.some((token) => searchable.includes(token.toLowerCase()))) {
      continue;
    }
    if (!rules.includeTokens.some((token) => searchable.includes(token.toLowerCase()))) {
      continue;
    }
    if (rules.excludeTokens.some((token) => searchable.includes(token.toLowerCase()))) {
      continue;
    }
    results.add(normalized);
  }

  return [...results].sort();
}

function inspectBytes(bytes, source, responseContentType) {
  const contentType = contentTypeOnly(responseContentType);
  const allowedTypes = source.expectedContentTypes.map((value) => value.toLowerCase());
  if (!allowedTypes.includes(contentType)) {
    throw Object.assign(
      new Error(`unexpected content type ${contentType || "<missing>"}`),
      { code: "CONTENT_TYPE_MISMATCH" },
    );
  }

  const minimum = source.minimumBytes ?? 1;
  const maximum = source.maximumBytes ?? Number.MAX_SAFE_INTEGER;
  if (bytes.length < minimum || bytes.length > maximum) {
    throw Object.assign(
      new Error(`byte length ${bytes.length} is outside ${minimum}-${maximum}`),
      { code: "BYTE_LENGTH_OUT_OF_RANGE" },
    );
  }

  if (source.requiredMagicHex) {
    const magic = bytes.subarray(0, source.requiredMagicHex.length / 2).toString("hex");
    if (magic.toLowerCase() !== source.requiredMagicHex.toLowerCase()) {
      throw Object.assign(new Error("required file signature is missing"), {
        code: "FILE_SIGNATURE_MISMATCH",
      });
    }
  }

  if (source.requiredTextTokens?.length) {
    const sample = bytes.subarray(0, Math.min(bytes.length, 128 * 1024)).toString("utf8");
    const missing = source.requiredTextTokens.filter((token) => !sample.includes(token));
    if (missing.length) {
      throw Object.assign(new Error(`required text tokens missing: ${missing.join(", ")}`), {
        code: "CONTENT_SIGNATURE_MISMATCH",
      });
    }
  }

  return contentType;
}

async function fetchSourceBytes(source, network, fetchFn) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), network.timeoutMs);
  try {
    const response = await fetchFn(source.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: source.expectedContentTypes.join(", "),
        "User-Agent": network.userAgent,
      },
    });
    if (!response.ok) {
      throw Object.assign(new Error(`HTTP ${response.status}`), { code: "HTTP_FAILURE" });
    }

    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    const maximum = Math.min(
      source.maximumBytes ?? Number.MAX_SAFE_INTEGER,
      network.maxBytesPerSource,
    );
    if (declaredLength > maximum) {
      throw Object.assign(new Error(`declared byte length ${declaredLength} exceeds ${maximum}`), {
        code: "SOURCE_TOO_LARGE",
      });
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maximum) {
      throw Object.assign(new Error(`received byte length ${bytes.length} exceeds ${maximum}`), {
        code: "SOURCE_TOO_LARGE",
      });
    }
    return {
      bytes,
      contentType: response.headers.get("content-type") ?? "",
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
      finalUrl: normalizePublicUrl(response.url || source.url, source.url),
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw Object.assign(new Error(`source request exceeded ${network.timeoutMs}ms`), {
        code: "SOURCE_TIMEOUT",
      });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function failureResult(source, error) {
  return {
    sourceId: source.id,
    sourceClass: source.sourceClass,
    url: source.url,
    outcome: "FAILED",
    errorCode: error.code ?? "UNEXPECTED_FAILURE",
    errorMessage: error.message,
  };
}

function artifactResult(source, fetched) {
  const contentType = inspectBytes(fetched.bytes, source, fetched.contentType);
  const observedSha256 = sha256Hex(fetched.bytes);
  const changed = observedSha256 !== source.expectedSha256;
  return {
    sourceId: source.id,
    sourceClass: source.sourceClass,
    url: source.url,
    finalUrl: fetched.finalUrl,
    outcome: changed ? "CHANGED" : "UNCHANGED",
    expectedSha256: source.expectedSha256,
    observedSha256,
    expectedBytes: source.expectedBytes ?? null,
    observedBytes: fetched.bytes.length,
    contentType,
    etag: fetched.etag,
    lastModified: fetched.lastModified,
    changeReason: changed ? "SOURCE_BYTES_CHANGED" : null,
  };
}

function discoveryResult(catalog, fetched) {
  const source = catalog.discovery;
  const contentType = inspectBytes(fetched.bytes, source, fetched.contentType);
  const html = fetched.bytes.toString("utf8");
  const links = extractRelevantLinks(html, source, catalog.allowedHosts);
  const observedSha256 = sha256Hex(links.join("\n"));
  const changed = observedSha256 !== source.linkInventory.expectedSha256;
  const expected = new Set(source.linkInventory.expectedUrls);
  const observed = new Set(links);
  return {
    sourceId: source.id,
    sourceClass: source.sourceClass,
    url: source.url,
    finalUrl: fetched.finalUrl,
    outcome: changed ? "CHANGED" : "UNCHANGED",
    expectedSha256: source.linkInventory.expectedSha256,
    observedSha256,
    observedBytes: fetched.bytes.length,
    contentType,
    etag: fetched.etag,
    lastModified: fetched.lastModified,
    expectedLinks: [...expected].sort(),
    observedLinks: links,
    addedLinks: links.filter((url) => !expected.has(url)),
    missingLinks: [...expected].filter((url) => !observed.has(url)).sort(),
    changeReason: changed ? "DISCOVERY_INVENTORY_CHANGED" : null,
  };
}

function buildReceipt(catalog, results, checkedAt) {
  const failed = results.filter((result) => result.outcome === "FAILED").length;
  const changed = results.filter((result) => result.outcome === "CHANGED").length;
  const unchanged = results.filter((result) => result.outcome === "UNCHANGED").length;
  let state = "MONITORED_NO_CHANGE";
  let nextAction = "No action. Retain the receipt and wait for the next authorized check.";
  if (failed > 0) {
    state = "FAILED_CLOSED";
    nextAction =
      "Stop. Preserve the receipt and investigate the source, network, allowlist or content failure. Do not open a release case.";
  } else if (changed > 0) {
    state = "SOURCE_CHANGE_DETECTED";
    nextAction =
      "Open a human source-review case. Do not acquire, extract, stage, approve or publish from this receipt alone.";
  }

  return {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    workflowId: catalog.workflowId,
    workflowName: catalog.workflowName,
    catalogVersion: catalog.catalogVersion,
    fiscalYear: catalog.fiscalYear,
    checkedAt: checkedAt.toISOString(),
    inactive: true,
    readOnly: true,
    state,
    summary: {
      sourcesChecked: results.length,
      unchanged,
      changed,
      failed,
    },
    results,
    nextAction,
  };
}

export async function monitorSources(catalog, options = {}) {
  const fetchFn = options.fetchFn ?? globalThis.fetch;
  const checkedAt = options.now instanceof Date ? options.now : new Date();
  try {
    validateCatalog(catalog);
  } catch (error) {
    return buildReceipt(
      {
        workflowId: "SE-01",
        workflowName: catalog?.workflowName ?? "JIF | SE-01 Spending Explorer Source Monitor",
        catalogVersion: catalog?.catalogVersion ?? "UNKNOWN",
        fiscalYear: catalog?.fiscalYear ?? "UNKNOWN",
      },
      [
        {
          sourceId: "source_catalog",
          sourceClass: "control",
          url: null,
          outcome: "FAILED",
          errorCode: error.code ?? "INVALID_CATALOG",
          errorMessage: error.message,
        },
      ],
      checkedAt,
    );
  }

  const results = [];
  const sources = [catalog.discovery, ...catalog.artifacts];
  for (const source of sources) {
    try {
      const fetched = await fetchSourceBytes(source, catalog.network, fetchFn);
      results.push(
        source.id === catalog.discovery.id
          ? discoveryResult(catalog, fetched)
          : artifactResult(source, fetched),
      );
    } catch (error) {
      results.push(failureResult(source, error));
    }
  }
  return buildReceipt(catalog, results, checkedAt);
}
