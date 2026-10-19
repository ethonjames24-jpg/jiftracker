# SE-01 n8n 2.25.7 compatibility candidate

Prepared 2026-10-18. Package version 1.0.3. Status: LOCAL CHECKS PASS; revised serial-download
native check pending. The preceding v1.0.2 candidate was imported and run manually;
see the native feedback below. The schedule has not been activated.
PR #30's accepted v1.0.1 catalogue remains authoritative and unchanged.

## Problem and change

The older generated fingerprint node calls `crypto.subtle.digest` and `new URL`.
n8n 2.25.7's `JsTaskRunner.getNativeVariables()` exposes Buffer and TextEncoder,
but neither crypto nor URL. Its secure `buildContext()` constructs the VM from
that explicit set, workflow data and RPC helpers. With the earlier code, missing
globals would become failed-source results even for otherwise valid downloads.

This candidate serializes two dependency-free helpers into the generated Code
nodes: SHA-256 over Buffer bytes, and a narrowly scoped HTTPS MOFPS link resolver.
The hash processes the original buffer in blocks and allocates only a 64/128-byte
tail plus a 64-word schedule, rather than copying a large PDF into a JS byte array.
The link resolver supports the absolute, protocol-relative, root-relative and
relative MOFPS forms covered by tests; it is not a general URL-library replacement.
The required discovery path, fiscal-year filtering and source exclusions remain.

The catalogue loader checks the existing read-only status, GET method, five-source
count and official source authority before the HTTP node runs. The terminal
receipt now fails closed for empty, duplicate, unknown or incomplete source result
sets instead of allowing an empty set to be called no-change. HTTP uses supported
node version 4.4, GET with no authentication/body, no redirects and no retries.
The existing daily schedule node is explicitly disabled as well as active=false.
All six original template node IDs remain; a seventh Loop Official Sources node
serializes the requests. The native profile overrides the catalogue CLI timeout
with a bounded 180,000 ms per request; the catalogue bytes/hashes remain unchanged.

## Verification actually run

- `npm test`: 25/25 local SE-01 tests PASS (13 retained, 12 added).
- Generated catalogue, fingerprint and receipt Code nodes executed in local VM
  contexts with n8n-shaped inputs and binary helpers, without crypto or URL.
- No-change fixture; changed artifact and supplementary-link fixtures; HTTP,
  content-type, missing-body, size and incomplete-result failure cases.
- SHA-256 compared with Node crypto on padding boundaries, random and UTF-8 bytes,
  and a synthetic 30 MiB artifact (about 0.68 seconds on this local runtime).
- Supported MOFPS link normalization compared with Node's WHATWG URL implementation.
- `git diff --check` PASS; catalogue byte hash unchanged.

All new local cases use fixtures. No additional native rerun, Google write, Telegram
message, schedule activation or public-data change was performed by the package builder.
Frontend tests/build were not repeated because no frontend code changed.
The owner-supplied v1.0.2 native result verifies two sources only; no claim is made
that all five official files remain unchanged today.

## Concrete inactive import step

Use `workflows/JIF_SE01_Spending_Explorer_Source_Monitor_INACTIVE.json` from this
candidate, not the older v1.0.1 export. For the existing unactivated candidate, retain its workflow identity: select all
canvas nodes and replace them once using this full export, then save without
executing or publishing. Do not append onto the six-node canvas or create a
second SE-01 monitor. Expect seven nodes and seven edges: Manual
Review Trigger; Daily Schedule — INACTIVE (disabled); Load Approved Catalog;
Loop Official Sources; GET Official Source Bytes; Fingerprint and Compare;
Return Read-Only Receipt. The loop done port goes to Fingerprint and Compare; its
loop port goes to GET Official Source Bytes, which returns to the loop input.
Only the completed aggregate reaches comparison.
There are zero credentials to select. Preserve the template names for Code-node
lookups. Record the assigned workflow ID/version and inactive posture.

After import inspection, one separately authorized manual check will establish
native compatibility and current official-source observations. It downloads four
large artifacts and the index, so allow finite HTTP timeouts to complete. A changed
or failed receipt must be investigated; do not replace baseline hashes merely to
produce no-change. Keep the schedule disabled until a separate activation decision.

SE-02–SE-07, Drive/Sheets persistence, Telegram notifications, monthly CGO updates
and publication are outside this candidate. Corrected Checkpoint C remains paused.

## Version-specific primary sources inspected

- [n8n 2.25.7 JsTaskRunner](https://github.com/n8n-io/n8n/blob/n8n@2.25.7/packages/@n8n/task-runner/src/js-task-runner/js-task-runner.ts): `getNativeVariables`, `buildContext`, secure VM execution.
- [n8n 2.25.7 HTTP Request description](https://github.com/n8n-io/n8n/blob/n8n@2.25.7/packages/nodes-base/nodes/HttpRequest/V3/Description.ts): fixed request-body toggle and full/file-response controls.

## Native feedback: v1.0.2 partial result, 2026-10-18

Owner supplied a terminal receipt checkedAt 2026-10-18T18:15:18.695Z:
FAILED_CLOSED; five checked, two unchanged, zero changed, three failed. The index
inventory and 23,172,267-byte As Passed PDF matched their approved SHA-256 values.
Approved CSV, As Presented PDF and As Presented CSV returned HTTP_REQUEST_FAILED /
"aborted". The assigned n8n workflow and execution IDs were not supplied. The
six-node import screenshot showed the daily schedule deactivated. No source
acceptance or schedule activation follows from this partial result.

Version-specific HTTP Request source confirms the former five-item input starts
multiple request promises before awaiting their completion. Its Batching option
paces starts with sleep; it does not await the preceding download and therefore
cannot guarantee one in-flight source. This v1.0.3 candidate uses the native
SplitInBatches v3 loop instead. Official v3 source confirms that done returns the
collected processed items, preserving source order for the comparison node. The
longer finite HTTP timeout and serialized graph are a controlled transport
correction, not proof of the exact cause of each aborted response. Native rerun
must verify all five sources before any complete acceptance claim.

Additional sources inspected:
- [n8n HTTP Request execution](https://github.com/n8n-io/n8n/blob/n8n@2.25.7/packages/nodes-base/nodes/HttpRequest/V3/HttpRequestV3.node.ts).
- [n8n SplitInBatches v3 execution](https://github.com/n8n-io/n8n/blob/n8n@2.25.7/packages/nodes-base/nodes/SplitInBatches/v3/SplitInBatchesV3.node.ts).

The hash/link runtime paths have native evidence for two sources. Full five-source
and new serial-download native acceptance remain pending.
