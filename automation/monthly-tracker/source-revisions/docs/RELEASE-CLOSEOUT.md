# Release closeout — October 29, 2026

Primary route: shipping-launch. State: IN PROGRESS. Approval scope: consolidate evidence into PR43/package/Drive and review overlap, recovery and rollback. This closeout does not activate or merge, adopt revised financial values, or change Spending Explorer.

## Current evidence and disposition

| Criterion | Evidence | Disposition |
| --- | --- | --- |
| Real monitor manual checks and replay | Owner receipts: 8 sources, 5 unchanged, 3 changed, 0 failed; eight stored observations and three reused archives | Evidenced for October 28 source snapshot |
| Isolated fault checks | Missing baseline, failed download, readback hash mismatch, injected post-archive failure; NORMAL April–June | Evidenced; do not repeat to obtain another badge |
| Cancellation recovery | Owner canceled run; sequential replay #2750 succeeded and reused evidence | Evidenced; actual cancellation inside upload not demonstrated |
| Owner alert | Automatic failures #2751/#2753 delivered to owner Telegram | Evidenced; original four handler behaviors preserved |
| Restored configuration | Private export SHA ce4bb33acf4a01200ac5ec1060286794c8f77f92076eff760a683c2139259b5b | 22 nodes, no test node/pins, inactive, daily disabled, Jamaica timezone, 1200s timeout, owner handler bound |
| Overlap | May/June runs sequential; no atomic lock | Restricted to operator-enforced serial operation; concurrent correctness UNVERIFIED |
| Recovery / rollback | ROLLBACK.md, SERIAL-OPERATIONS.md; native UI restoration and serial replay; six mocked script tests | Procedure reviewed; script not exercised against native API |
| Execution retention | Owner's read-only `docker exec n8n-n8n-1 printenv | grep '^EXECUTIONS_DATA_'` returned no values on October 29; no execution-data overrides in the running container | Official n8n defaults therefore apply under the documented environment-variable configuration: pruning enabled, maximum age 336 hours (14 days), maximum count 10,000. This is an inference from container environment plus documentation, not a direct n8n internal-setting readout. Preserve durable evidence in Drive before the earlier limit is reached. |
| Normal scheduled source check | No receipt supplied | Pending activation and first actual daily receipt |

## Release boundaries

The monitor detects, archives and records private observations. It cannot publish, send subscriber messages or authorize financial adoption. April–June register decisions remain PENDING. First publication dates and historical source links must not be inferred/replaced from later listing dates. New months need a verified baseline from the frozen approved publication package. Existing public tracker behavior and Spending Explorer remain outside this patch.

One deployed monitor owns its observation table. One daily schedule at 08:00 America/Jamaica with timeout 1200 seconds is the approved operating envelope. No manual run/retry while published, no second workflow using the table, and no parallel maintenance runs. Unpublish and inspect all running/waiting executions before maintenance. These restrictions do not provide runtime atomicity; an atomic guard and native overlap tests are required before expanding the envelope. The unresolved concurrency evidence is recorded, not silently passed.

## Owner / engineer next actions

1. Keep real daily trigger disabled/unpublished and test copy unpublished during this closeout. The saved test export remains OBSERVE/NORMAL/June; return it to REPORT_ONLY for storage when next editing it, without running another test.
2. Retention inspection is complete at the running-container environment boundary. No `EXECUTIONS_DATA_` variable or `_FILE` override was returned by the owner's command. The applicable documented defaults are `EXECUTIONS_DATA_PRUNE=true`, `EXECUTIONS_DATA_MAX_AGE=336` hours and `EXECUTIONS_DATA_PRUNE_MAX_COUNT=10000`. These are inferred effective values, not a live API readback of internal configuration or a guarantee that any particular execution link survives 14 days; the count limit can apply sooner. Source: https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/use-environment-variables/executions.md . Preserve essential receipts/exports in Drive. No instance setting was changed.
3. Review the completed PR43 package and operating restriction; merge/activation are separate from this evidence-consolidation patch. No production action was performed here.
4. When release gates are resolved, enable only Daily Revision Check, verify its connection to Configuration, cron 0 0 8 * * *, Jamaica timezone, timeout, OBSERVE configuration and owner handler, then publish the real monitor. Do not publish the test copy or reimport the generic JSON.
5. After the first actual 08:00 Jamaica run, capture execution ID/start/finish, full coverage, failure count, observation identities and evidence hashes. Current live source counts may differ from the October snapshot. Preserve public_rows_written=0, subscriber_sends=0 and financial_adoption_authorized=false. A manual run or intentional alert test is not this receipt.

No new permission ceremony is required for already approved work. Remaining evidence limitations prevent a claim that the scheduled service is complete. The website release already exists independently; no new website deployment is needed for this package.

## Durable record mapping

Use the established Monthly Tracker Drive handoff and documentation suite: architecture in docs/01-Architecture-Decisions/ADR-BT-SR-001.md, configuration/workflow manual 06, operational runbook 05, governance 07, release/recovery 10, master index 01 and central engineering handoff. This preserves the existing folder/document organization rather than creating duplicate systems. Private native exports and screenshots stay in Drive; public package contains sanitized summaries and hashes only.
