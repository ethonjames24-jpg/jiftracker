# SE-02 v0.1 validation boundary

Prepared 2026-10-19. Local fixture tests only; no native n8n import/run or live archive acceptance yet.

Covered:
- Report-only reaches the terminal node with zero native transport calls and no acquired status.
- Exact input/catalogue/FY/changed-artifact identity, malformed or stale/future receipt rejection, failed/no-change source rejection, URL and byte/type/signature/token gates.
- Clean scan bound to exact byte/hash identity; infected/mismatched/unconfigured scan blocks upload.
- One reservation and one folder/source/manifest per batch; completed replay makes zero further downloads/scans/allocations/inserts/creates.
- Same-title changed bytes create a distinct immutable revision.
- Lost write acknowledgment and lost reservation acknowledgment reconciliation; unreconciled reservation retains the guard without a second insert.
- Local interleaved guard contenders, exact-owner release, metadata and stored-byte corruption, duplicate reservations and preserved release prohibitions.
- PDF and CSV byte preservation; resumable source session/full PUT, disallowed upload-session host, missing session acknowledgment.
- Generated 24-node graph, disabled native transports, fixed binary-body toggles, no redirects/retries/credential bindings/schedule/send/promotion nodes.
- Generated Code wrappers in a VM without crypto/URL, including a synthetic 1 MB PDF transferred through simulated filesystem binary references across native-table response contexts. State contains metadata, not source base64.

Not yet proven:
- Installed workflow graph/ID, report-only execution, live Data Table filter/CAS/insert semantics and actual same-run binary references.
- Drive authorization, real resumable upload completion/readback, native concurrent executions or stopped-run recovery.
- Scanner service existence, current signatures or real scan effectiveness.
- Genuine new-source handoff, two observed change/no-change cycles, SE-03–SE-07 or unattended operation.

The earlier SE-01 25 local checks and five-source native MONITORED_NO_CHANGE receipt remain valid and are not repeated by this package.
