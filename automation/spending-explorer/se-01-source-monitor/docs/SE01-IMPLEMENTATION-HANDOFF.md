# JIF SE-01 — Spending Explorer Source Monitor Implementation Handoff

Version 1.0.0  
Implementation state: Built and verified locally; inactive; not imported; not activated  
Owner: Jamaica in Focus  
Public product: JIF Government Spending Explorer and Every J$100

## 1. Purpose

SE-01 detects whether an approved official Spending Explorer source has changed. It monitors the
Ministry of Finance & Public Service annual and supplementary Estimates page plus the four
FY2026/27 Central Government source artifacts that support the current As Presented/As Passed
comparison.

The monitor fingerprints bytes, not filenames or page timestamps. The discovery-page comparison
uses a normalized inventory of in-scope FY2026/27 source links so unrelated website furniture does
not create false change cases.

## 2. Decision boundary

SE-01 may:

- perform HTTPS `GET` requests to allowlisted public MOFPS locations;
- enforce type, size and basic content-signature controls;
- calculate SHA-256 fingerprints;
- compare observations with the approved catalogue;
- return a no-change, source-change or failed-closed receipt.

SE-01 may not:

- write to Google Drive, Google Sheets, a database or an archive;
- update the frozen model, operational workbook or public feed;
- acquire a candidate for SE-02;
- extract or normalize Spending Explorer rows;
- create mappings, approvals or public release records;
- execute another workflow;
- send email, Telegram or social content;
- capture or publish video;
- activate itself.

## 3. Source classes

1. **Primary controlling:** FY2026/27 Estimates of Expenditure As Passed PDF.
2. **Primary machine-readable:** FY2026/27 Approved Estimates CSV.
3. **Supporting active:** FY2026/27 Estimates of Expenditure As Presented PDF.
4. **Supporting machine-readable:** FY2026/27 As Presented Estimates CSV.
5. **Primary discovery:** Annual and Supplementary Estimates index page.

Public Sector Consolidated Estimates, Public Bodies estimates, revenue estimates, news articles,
social posts, mirrors and unrelated fiscal years are excluded.

## 4. Processing sequence

1. Validate that the catalogue is explicitly `INACTIVE_READ_ONLY`.
2. Reject non-HTTPS or non-allowlisted source URLs.
3. Fetch each public source with `GET` only and a finite timeout/byte limit.
4. Fail closed on HTTP, type, size, signature or required-token errors.
5. For artifact files, hash the exact response bytes and compare the approved SHA-256 value.
6. For the discovery page, normalize and filter relevant FY2026/27 upload links, sort them and hash
   the newline-separated inventory.
7. Return exactly one terminal receipt with no downstream connection.

## 5. State rules

- `MONITORED_NO_CHANGE`: every source passed validation and every fingerprint matched.
- `SOURCE_CHANGE_DETECTED`: validation passed, but at least one valid artifact fingerprint or the
  relevant discovery-link inventory changed.
- `FAILED_CLOSED`: any catalogue, network, authority, type, size or content-signature control
  failed. Failure overrides a simultaneous change.

A change result is not source acceptance. A human must inspect the official release identity,
fiscal period, As Presented/As Passed status, completeness and scope before SE-02 can ever be
authorized.

## 6. n8n package

The generated workflow is named:

`JIF | SE-01 Spending Explorer Source Monitor | INACTIVE`

It contains only:

- an inactive daily schedule trigger;
- a manual review trigger;
- a catalogue-loading Code node;
- one read-only HTTP Request node using `GET`;
- fingerprint/comparison Code;
- one terminal receipt Code node.

There are no credentials and no Google Sheets, Drive, Telegram, webhook, Execute Workflow,
subscriber, social, capture or publishing nodes. The workflow export sets `active: false`,
`importAuthorized: false` and `activationAuthorized: false`.

Runtime compatibility note: the fingerprint node uses Web Crypto plus n8n binary-data helpers.
Before any import is authorized, the exact production n8n version must be checked in an isolated
inactive import and the workflow must remain disconnected from every later SE workflow.

## 7. Verification gates completed locally

- catalogue boundary validation;
- no-change receipt test;
- changed-byte detection test;
- new supplementary-link detection test;
- non-allowlisted host rejection;
- unavailable-source failed-closed test;
- Central Government scope filtering;
- n8n inactive-state and node allowlist test;
- credential and prohibited-integration scan;
- generated workflow/catalog parity test;
- live public-source comparison against the approved baseline.

## 8. Future gated deployment sequence

This sequence is documented but not authorized:

1. Review the branch and package hashes.
2. Confirm the source catalogue and baseline evidence.
3. Inspect the workflow JSON for `active: false`, allowed nodes and no credentials.
4. Import into n8n as inactive only after explicit approval.
5. Inspect the imported workflow ID/version without executing it.
6. Run one separately authorized manual no-change check.
7. Confirm the receipt and verify zero external writes/messages.
8. Decide separately whether schedule activation is appropriate.

There is no automatic promotion from SE-01 to SE-02.

## 9. Rollback and incident handling

Before import, rollback is deletion of the unactivated imported candidate while retaining the
reviewed export and evidence. After any future activation, disable SE-01 first, preserve the last
receipt and n8n execution evidence, and investigate. Never change the expected checksum merely to
silence a detected difference.

## 10. Acceptance result

SE-01 is implementation-complete for local and code-review purposes. It remains operationally
inactive and non-production. SE-02 — Acquire and Archive remains unbuilt and unauthorized.
