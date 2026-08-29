# SE-01 — Spending Explorer Source Monitor

Status: **inactive, read-only implementation package**

Package version: **1.0.1**

This package implements the first workflow in the controlled JIF Spending Explorer update
system. It checks approved Ministry of Finance & Public Service locations, fingerprints the
official source bytes and relevant source-link inventory, and returns one receipt:

- `MONITORED_NO_CHANGE`
- `SOURCE_CHANGE_DETECTED`
- `FAILED_CLOSED`

It does not acquire an immutable archive, extract data, stage rows, update Google Sheets, open a
public release, notify anyone, call another workflow, or publish anything. A change receipt is a
lead for human source review only; SE-02 and later workflows remain separate and unimplemented.

## Package contents

- `config/source-catalog.v1.json` — approved public source catalogue and baseline fingerprints.
- `src/monitor.mjs` — dependency-free read-only monitor engine.
- `bin/run-monitor.mjs` — CLI that prints a receipt to standard output and writes nothing.
- `workflows/...INACTIVE.json` — generated n8n import candidate with `active: false`.
- `schemas/` — source-catalog and receipt contracts.
- `tests/` — status, allowlist, failure and workflow-boundary checks.
- `docs/SE01-IMPLEMENTATION-HANDOFF.md` — controlled engineering and operator handoff.
- `evidence/SE01-BASELINE-EVIDENCE.md` — authoritative source and checksum evidence.

## Local verification

From this directory:

```bash
npm run build:workflow
npm test
npm run monitor -- --check-catalog-only
```

A live read-only comparison can be run locally with:

```bash
npm run monitor
```

Exit codes are `0` for no change, `10` for a detected change, and `20` for failed closed. The
command prints the full JSON receipt and does not create a file or external record.

Redirect policy is fail-safe. The local verifier follows at most three redirects and validates
every destination as HTTPS on the approved MOFPS allowlist. The inactive n8n candidate follows no
redirects; any redirect, HTTP error, missing response, or unexpected content type is converted to
a terminal `FAILED_CLOSED` receipt.

## Non-authorization notice

Creating this package does not authorize:

- importing it into n8n;
- activating its schedule;
- binding credentials;
- executing it on Hostinger;
- changing the approved source catalogue;
- running SE-02 through SE-07;
- updating `DS_SpendingExplorer`, `DS_Every100` or any active public pointer;
- subscriber, Telegram, social, ad or video publication.

Any future import must start inactive, use the verified package hash, pass an n8n-version
compatibility inspection, and receive a separate owner decision. Any future source change still
requires human source acceptance.
