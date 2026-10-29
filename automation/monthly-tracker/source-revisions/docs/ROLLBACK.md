# Containment rollback and recovery

Scope: only Monthly Tracker revision monitor v407uw3UAd050cn0. No website rollback, financial correction, other workflow change, archive deletion or table rollback is authorized by this procedure.

## Trigger conditions

Unpublish immediately if overlapping executions are seen, duplicate observation identities appear, archive hashes fail, writes have uncertain outcomes, source/baseline checks fail, or the owner alert stops working. A changed official workbook alone is an expected review case, not a rollback trigger. Preserve the failed execution and evidence before repair.

## Native UI procedure (preferred for the owner)

1. Open the real monitor and choose Unpublish. Confirm it is unpublished; disable Daily Revision Check and save.
2. Open Executions for this workflow. Unpublishing does not establish that an already running/waiting execution has stopped. Inspect it, wait for a terminal state or stop it deliberately, and record the execution ID and outcome. Do not start another run meanwhile.
3. Export the current workflow and affected observation rows to the private handoff. Preserve existing Drive workbooks and their hashes. Reconcile uncertain writes and orphan archives using SERIAL-OPERATIONS.md.
4. Restore only the reviewed node/configuration changes. Do not reimport the generic REPORT_ONLY workflow over the configured instance, restore old observation tables blindly, or remove the shared owner handler.
5. While unpublished, perform one complete manual OBSERVE check after reconciliation. Verify full coverage, zero failed sources, preserved identities and archive hashes; changed-source counts may legitimately differ from October 28. Inspect records, not only the completion badge.
6. Re-enable the reviewed daily schedule only after the cause is resolved. Verify a subsequent scheduled source-check receipt. Keep the test copy unpublished.

## Executable trigger for an engineer

Node 20+; no dependencies. From the package directory:

```bash
node scripts/rollback-monitor.mjs
```

This default dry run is offline. During an authorized incident, an engineer with an existing authorized API key can load it into JIF_N8N_ROLLBACK_API_KEY through their local secret mechanism and run:

```bash
node scripts/rollback-monitor.mjs --apply
```

Never paste the key into chat, source files, command arguments or evidence. The script hardcodes the verified HTTPS origin and workflow ID, rejects redirects, times out each request after 15 seconds, performs GET → POST /deactivate (only when active) → GET, and requires active=false on readback. It never publishes, retries, edits node configuration, stops executions, sends messages or writes financial/observation data. On a lost response, inspect native state; do not assume the POST failed. Then complete UI steps 2–6. API access is optional: use the UI procedure if unavailable. No new key or live API call was created during this review.

Official API references checked October 29, 2026: https://docs.n8n.io/api/authentication/ and https://docs.n8n.io/connect/n8n-api/workflow.md . Current documentation retains POST /deactivate as a deprecated compatibility endpoint; newer releases prefer /unpublish. Native 2.25.7 endpoint compatibility has not been exercised by this script. Treat API errors as a reason to use the native UI, not to try other endpoints automatically.

## Verification and limitations

Six local mocked-transport regression tests cover offline default, missing credentials, exact target, inactive no-op, identity/state rejection, denied/uncertain writes and failed readback. These do not prove native API operation. User-run native evidence shows unpublishing after automatic alert tests and restoration to the inactive reviewed export. Cancellation followed by sequential replay #2750 passed. Injected post-archive failure separately demonstrates stopping before upsert. Actual cancellation at the archive-write boundary, distributed locking and automatic recovery remain unverified.

Rollback contains new executions; it does not undo completed writes. No recovery-time objective is claimed. Keep records needed for recovery in Drive because server execution-pruning retention is unknown.
