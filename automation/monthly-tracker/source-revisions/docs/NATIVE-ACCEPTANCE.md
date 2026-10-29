# Native acceptance — current disposition, October 29, 2026

Route: shipping-launch. State: IN PROGRESS. Scope: Monthly Tracker source revisions only; Spending Explorer excluded. Native evidence was supplied by the owner, not run by the assistant.

Current authoritative checkpoint follows. The dated earlier checkpoints at the end are historical; their open/NOT STARTED statements are superseded where explicitly resolved below. Operational restrictions and recovery: SERIAL-OPERATIONS.md and ROLLBACK.md. Release tracking: RELEASE-CLOSEOUT.md.

## Native closeout checkpoint — 21:42 New York, October 28, 2026

Supersedes earlier NOT STARTED statements for the isolated acceptance kit. User receipts establish NORMAL April/May/June, MISSING_BASELINE, DOWNLOAD_FAILURE, ARCHIVE_HASH_MISMATCH and POST_ARCHIVE_FAILURE outcomes. Native version is 2.25.7, self hosted, filesystem binary mode. May #2745 and June #2746 were sequential; no native overlap is demonstrated. June case: be08185eb3948e1dd73d2b14d1a969640d5198f1b22c489f510dd506c64a23c6.

The test run at 21:27:48 was canceled after 1.721s. Replay #2750 at 21:28:05 succeeded in 18.595s, one source/one change, complete baseline coverage, zero failures/public writes/subscriber sends, no financial adoption. Existing archive reuse branch ran. Cancellation during an archive write is not established; the separate injected post-archive failure tests that deterministic boundary.

Automatic real-monitor failure #2751 at 21:40:54 stopped in 20ms at the isolated intentional-error node. Owner Telegram screenshot shows notifications for #2751 and #2753, consistent with two runs of the temporary minute schedule. Automatic owner delivery is evidenced; the link target and handler execution internals were not inspected. UNCLASSIFIED is expected for this test error. Owner confirmed unpublishing.

Restored native export SHA-256 ce4bb33acf4a01200ac5ec1060286794c8f77f92076eff760a683c2139259b5b has 22 nodes, no test-error node, original graph/parameters restored, no pinned data, active=false, disabled cron 0 0 8 * * *, America/Jamaica timezone, timeout 1200, all execution saving enabled and errorWorkflow W6NTH8TqleF7lLll. Private snapshot: https://drive.google.com/file/d/1wGI2Y82b53gVXYCWercxceK0ghviMa2z/view . Do not commit credential-bearing native exports.

Before final activation, review SERIAL-OPERATIONS.md and consolidate package/Drive documentation. Actual daily scheduled source-check evidence remains outstanding. Temporary alert-test publication is not normal monitor activation. Financial adoption of later April–June variants remains PENDING.

## Historical checkpoints (superseded status; retained provenance)

# Native acceptance progress — October 28, 2026

Route: debug-error-recovery. Registry: IN PROGRESS. Scope: new Monthly Tracker source-revision workflow only. PR #41 website release, existing monthly chain and Spending Explorer remain untouched.

## Provenance and exact configured export

Ethon supplied the native workflow export and execution/table screenshots. These are user-run native results, not assistant-run n8n sessions. Native workflow ID: v407uw3UAd050cn0. Version ID: 6352dc0b-0b60-4c77-b204-1ebe45558056. Export SHA-256: 64a0eec56ca63b684edb8847a586273a7f75d1429ab08c366e806f8dfc9dfe56 (57,594 bytes).

Exact export is retained privately: https://drive.google.com/file/d/1P6XgIrwirfrUYVOhp61Zs3uFoSZyAKli/view . It contains credential references and configured table IDs, not credential secrets; do not commit it to the public repository or use it as a portable template. The generic JSON remains inactive, unbound and REPORT_ONLY. Do not reimport the generic template over the configured native workflow.

The export has 22 nodes, active=false, a disabled daily schedule, empty pinData, and exactly two credential-bound nodes (archive upload/download). Connections and every non-configuration Code body match the generator. Native exports omit default-valued parameters; this is not a behavioral code change.

## Observed results

| Check | Evidence | Disposition |
| --- | --- | --- |
| Setup gate | CONFIGURATION_REQUIRED, check_complete=false, zero public writes/sends | Observed pass |
| First OBSERVE | 8 checks, 5 unchanged, 3 changed, full coverage, 0 failed | Observed pass |
| Sequential replay | Same receipt; table total stays 8; first_seen 20:51:10.891Z preserved; last_seen 21:09:41.461Z advances | Observed pass |
| Evidence reuse | Three changed-row file IDs visibly preserved; assistant Drive listing shows exactly three XLSX files created before replay; independent readback verifies all three exact hashes and sizes | Observed pass for this serial replay |
| Publication boundary | Zero public_rows_written, zero subscriber_sends, financial_adoption_authorized=false; no writer graph | Preserved |
| Concurrent/recovery behavior | No native adverse-path evidence yet | Outstanding |
| Scheduling | Workflow inactive, daily trigger disabled | Outstanding |

All times above are UTC on October 28. Screenshot and export digests are in evidence/NATIVE-ACCEPTANCE-20261028.json. The full execution IDs and actual native n8n version were not supplied.

## Confirmed corrections

1. Google export returned HTTP 307 when redirects were disabled. Only the two anonymous Google CSV reads follow redirects, capped at 3. GET remains read-only and Never Error stays off. Ministry listing and exact workbook redirects remain disabled.
2. Five baseline input items caused the observation read to emit 5 × 8 = 40 rows and fan out subsequent HTTP requests. Execute Once is enabled on the observation read and all three pre-loop text HTTP reads. The reusable template also sets it on the baseline read for an explicit singleton boundary. Preserve Always Output Data on both table reads for initial empty tables. Expected current outputs: 5 baseline rows → 8 prior rows → one CSV response → one extras response → one listing response → 8 source tasks.
3. No per-source workbook/download/archive/upsert node is set Execute Once. The loop remains batchSize=1. Do not suppress native errors or enable global continue-on-error to obtain a success indicator.

## Next operator steps

1. On the original inactive workflow, open its upper-right menu → Settings. Explicitly set/verify timezone America/Jamaica and workflow timeout 1200 seconds (20 minutes). Save without enabling the daily trigger or publishing. The uploaded export has neither timezone nor executionTimeout, so defaults cannot establish the approved schedule. Record native n8n version and execution IDs.
2. Inspect instance execution retention and the actual existing owner-failure handler identity. No handler or notification was configured by this package. Before any daily operation, document how failed executions are noticed.
3. Test negative paths on a NEW inactive acceptance copy with separate test tables and a separate private test evidence folder. Do not delete/corrupt the eight accepted observation rows or three retained candidate files. The fixed evidence-folder guard must be changed consistently in Configuration and Validate Configuration only on that isolated copy if a test folder is used. Never publish the copy. Detailed cases are in INSTALL.md: missing baseline, failed download, invalid listing, bad mappings/permissions, corrupt readback, duplicate rows, concurrent runs and interrupted archive/table writes. Each case must stop or flag attention rather than report a complete no-change check.
4. Resolve overlap/recovery behavior before activating; current logical serial deduplication is not distributed exactly-once creation. Lost existing archives require operator repair. Preserve human decisions separately from observation data.
5. Once native acceptance is documented, enable only this workflow’s Daily Revision Check, confirm cron 0 0 8 * * * and timezone America/Jamaica, then publish/activate it. Verify an actual scheduled 08:00 Jamaica execution; a manual run is not schedule evidence.

## Known constraints retained

New months need one verified baseline intake from their frozen publication package/receipt. The first Ministry download must not become a silent as-published baseline. April–June financial adoption is still PENDING. This package does not connect the private register to a new public site section, rewrite published links/dates, change the publisher or send subscriber messages.

## Latest saved configuration and owner-alert review (17:41 New York)

Latest configured monitor export SHA-256: 74737dbdf8f2cfdb543211a0dc7140caaa75a6cb8440eaea2c1c76a6563ee666; native version 64a3a144-aa93-4664-8515-32894e647075. Private snapshot: https://drive.google.com/file/d/1BzGZPjKnIPD-adNZDbhI5GOjkmnWUulM/view . It confirms active=false, disabled daily trigger, restored Ministry listing expression, America/Jamaica timezone, executionTimeout=1200, saved manual/success/error executions and errorWorkflow=W6NTH8TqleF7lLll. This supersedes the earlier missing-settings finding. It does not change scheduling acceptance.

User-run invalid-host test stopped at the listing node before planning, archive or upsert. After restoring the listing expression, the next native receipt again has 8 checks, 5 unchanged, 3 changed, zero failures, full coverage and no public writes/sends; last_seen advances to 21:24:54.868Z. This establishes fail-fast source-listing behavior and recovery, not archive-write interruption recovery.

Owner handler latest private export: https://drive.google.com/file/d/1C_hRaK4DiV_-ax-pHnDLyiEOwVyWppDl/view ; SHA-256 8dd1242075dd38495bda9ab7f084a2feade84708249cbf6affefb8b6f1f492ac. Exact before snapshot: https://drive.google.com/file/d/115AOBGK1IW2Db2xdRRduPFM-PRMUsvtZ/view . The only node change is the new monitor ID in the allowed-workflow object and rejection wording from four to approved workflows. All other nodes/connections are identical; 20 old-workflow/category VM cases produce identical output. The handler export is active, and the user was instructed to publish the update, but export activeVersionId is absent/null and automatic native alert delivery is still unverified. The handler has one fixed owner Telegram destination and no publisher, subscriber, Google writer, guard mutation, subworkflow or retry action. No message was sent by the assistant. Do not run a manual monitor failure and claim it tested Error Trigger.

The supported shared-handler amendment is an explicit exception to the earlier no-existing-workflow-change boundary: only one monitor ID is added; the original four monthly workflow behavior is preserved. Spending Explorer remains excluded.

### Isolated acceptance kit

Use acceptance/README.md and acceptance/JIF_Source_Revisions_ISOLATED_ACCEPTANCE_INACTIVE.json as a NEW manual-only test copy, not a replacement for the configured monitor. Private kit folder: https://drive.google.com/drive/folders/17_yAzffzA8x8EShGdwBtbmUT5AS29Lj7 . Test archive destination: https://drive.google.com/drive/folders/1_tjDf3qSRxTFHIH_rVh9ErfdQwJksdtX . The gate rejects both accepted table IDs and requires two distinct new test tables. No schedule, error-handler binding, credentials or sender is embedded. Six additional local VM/configuration test methods pass (19 JavaScript methods total); native kit execution is NOT STARTED. Negative and overlap/interrupted-write gates stay IN PROGRESS. The kit checks only one selected listed candidate at a time; a one-source test receipt must not be confused with the eight-source real monitor receipt.
