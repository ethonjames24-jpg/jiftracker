#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { monitorSources, validateCatalog } from "../src/monitor.mjs";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const defaultCatalog = resolve(packageRoot, "config/source-catalog.v1.json");

function parseArgs(argv) {
  const options = { catalog: defaultCatalog, checkCatalogOnly: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--catalog") options.catalog = resolve(argv[++index]);
    else if (argument === "--check-catalog-only") options.checkCatalogOnly = true;
    else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  process.stdout.write(
    "Usage: node bin/run-monitor.mjs [--catalog PATH] [--check-catalog-only]\n" +
      "Read-only: prints a JSON receipt to stdout and performs no writes or notifications.\n",
  );
  process.exit(0);
}

const catalog = JSON.parse(await readFile(options.catalog, "utf8"));
if (options.checkCatalogOnly) {
  validateCatalog(catalog);
  process.stdout.write(
    `${JSON.stringify({ ok: true, workflowId: "SE-01", inactive: true, readOnly: true })}\n`,
  );
  process.exit(0);
}

const receipt = await monitorSources(catalog);
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
process.exitCode = receipt.state === "MONITORED_NO_CHANGE" ? 0 : receipt.state === "SOURCE_CHANGE_DETECTED" ? 10 : 20;
