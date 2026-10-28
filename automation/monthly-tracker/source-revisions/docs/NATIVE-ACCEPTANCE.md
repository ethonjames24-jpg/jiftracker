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
