# Source-revision monitor operating and recovery rules

Scope: Monthly Tracker source revisions only. Spending Explorer is excluded.

## Serialization disposition

The current implementation provides logical sequential deduplication, not a distributed execution lock or exactly-once writes. Two browser-tab attempts yielded sequential executions; concurrent correctness is UNVERIFIED. Do not change instance-wide concurrency settings because other workflows share this instance.

For the existing deployment, use one published monitor with one daily schedule (08:00 America/Jamaica) and the verified 1,200-second timeout. No second workflow may use its observation table. Do not start manual runs or retries while it is published. For maintenance: unpublish the monitor, inspect Executions and wait until no execution is running or waiting, then perform one full manual run at a time. A queued/running execution must reach a terminal state before another starts. Restore the reviewed schedule and publish only after reconciliation. This is an operator-enforced restriction, not a proven runtime concurrency control. If unattended overlapping entry points are required, implement and test an atomic guard before adding them.

## Partial-write recovery

After any failed, canceled or timed-out run, unpublish before recovery and retain its execution ID. Inspect the observation table by case_id/check_key and the evidence folder before retrying. A missing response does not establish that a write failed. Preserve any uploaded but unlogged archive; do not delete evidence to make counts agree. Verify candidate bytes against the expected SHA-256. Existing valid evidence and a single matching observation can be reused on a sequential full rerun. An unlogged archive can lead to another archive on retry; retain both and record their IDs and hashes. Do not claim physical exactly-once archiving.

Duplicate logical observations, missing/mismatched evidence or uncertain commit state require reconciliation before a retry. Export affected rows first; select a canonical record only after byte/hash and provenance verification, preserve a repair record, and never alter financial/editorial decisions through observation repair. Do not force a success receipt or bypass hash/schema checks.

## Retention disposition

Workflow settings save successful, failed and manual executions. Instance pruning age/count settings have not been inspected; saving settings alone do not prove retention duration. Preserve acceptance receipts, failed-execution details needed for recovery, workflow snapshots and source evidence in the private Drive handoff before pruning can remove them. Archive workbooks and observation records have no automatic deletion step in this package. Do not change global pruning settings as part of this work. Actual instance retention remains an explicit operational unknown to resolve before relying on saved execution links as durable evidence.

## Completion evidence

Four isolated fault paths, sequential reuse, cancellation/replay and automatic owner alerts are evidenced in NATIVE-ACCEPTANCE.md. Runtime overlap safety remains unverified. Final activation requires restored configuration review, documentation/package consolidation, and an actual scheduled source-check receipt after publishing. Financial corrections require separate review; monitor activation does not approve revised historical figures or source dates.
