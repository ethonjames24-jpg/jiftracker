# SCAN-01 / SE-02 native acceptance handoff

**Review date:** November 9, 2026, America/New_York.
**State:** IN PROGRESS; preparation and read-only source audit only.
**Production disposition:** NO-GO. No native command, scan, acquisition, workflow
execution, credential binding, archive write, merge or activation was performed
for this handoff.

The owner approved preparation of scanner/archive acceptance in parallel with
the Spending Explorer data work. That preparation does not authorize the native
tests below. Preserve the operational scanner, monthly Tracker, source/model
workbooks and public feeds. EAA and corrected Checkpoint C remain paused.

## 1. Evidence read for this handoff

| Source | Revision / observed evidence |
| --- | --- |
| Controlled scanner release gates | [Document 16](https://docs.google.com/document/d/1Sf50lBCHDOvqdUJrDG-rukzMFD-MuLTLLKnsErgIKGU/edit); last recorded native checkpoint October 28, 2026 |
| Scanner engineering history | [Engineering handoff](https://docs.google.com/document/d/1JrGSGworzmZKzYU6itEQODiPm-bctqXhkeVhNLTIz6Q/edit); preserves failed R1/R2 and accepted R3 scope |
| SE-02 candidate | [PR39](https://github.com/ethonjames24-jpg/jiftracker/pull/39), OPEN / DRAFT / UNMERGED, head `61e9356966025fab9e948a3603ddc330f3641c6d` |
| SE-02 executable source | `automation/spending-explorer/se-02-acquire-archive/` at that exact head: README, install config, table schema, scanner contract, validation record, transition engine, workflow generator and generated JSON read |
| Generated workflow | Blob `71b0e520b4991b84a60176f39fe9ed3b6146f8a9`, 91,984 bytes according to tree metadata; parsed directly from GitHub source in this audit |

The generated JSON is inactive, has 24 nodes, one Manual Preflight trigger, no
schedule, zero credential bindings and eight disabled native transports:
`guard_read`, `acquire`, `release`, `ledger_read`, `ledger_insert`, `drive`,
`public`, `scan`. All have `retryOnFail=false`. Settings remain
`mode=REPORT_ONLY`, `transportEnabled=false`, blank `scannerUrl`, `caseInput=null`.
These are **repository snapshot observations**, not a new live n8n readback.

No local test suite was rerun for this documentation-only audit. Recorded test
counts below retain their original provenance and are not new acceptance results.

## 2. Preserve the accepted historical scanner baseline

The last accepted native scanner checkpoint is **Stage 3D-R3 same-signature
instance rollover**, not a changed-signature update:

- Native receipt SHA256:
  `53ff92d18588d534d4440bf84f3655bd17b5dd5ceffc820e3899510bc6962dbb`.
- Both generations loaded signed version `28166`, inventory digest
  `e16eef156cd0ee1f48ed09e053f7afd253777852ecfd92f0aa8e066ccbb3de9d`.
- Historical G1 ClamD ID:
  `9a4df6efaa0b6f8f3b4c0263b81ca4cac4646105721e8a5d38db58dac2f9ba21`.
- Historical G2 ClamD ID:
  `f36478c495a3e597534d25eeb158ff63cf34c87f485dfe19a0f3afa81171e095`.
- Real authorized CLEAN scans, no-lease/replay denial, exact-ID retirement,
  stopped/quarantine fresh-process readback were recorded; original scanner was
  READY before and after that historical run.
- Receipt explicitly denied genuine different-signature transition, native
  in-flight HTTP drain and exact RAM-loaded signature-byte digest proof.
- Earlier Stage 3C native signature/load receipt SHA256:
  `576c49fe7cbdea09d882b7f5129ddc644a5a2e9d656fa819cfda8b80590bf4c7`.

Do not rerun accepted R3 merely to obtain a newer PASS. Preserve failed R1/R2
evidence and their quarantines. No present-day container state or scanner health
is inferred from October's recorded READY / BOTH_STOPPED result.

## 3. November 9 freshness and artifact readiness gate

Twelve calendar days have elapsed since the October 28 native observation.
Version `28167` was observed operationally then, but was never accepted as an
independently acquired, sealed and signature-verified Stage 4 candidate.
Neither `28166` nor `28167` is asserted current or freshness-eligible today.
The exact age limit is not restated here because the current executable policy
must be read, hash-verified and applied to actual current timestamps/versions.

**Before issuing a runnable native command:**

1. Obtain the exact reviewed launcher/package bytes and verify their recorded
   hashes and actual local paths. Their names/hashes are recorded below, but this
   handoff has not downloaded or inspected the ZIP/launcher bytes. Do not repeat
   the prior missing-Downloads-file problem by assuming a file exists.
2. Read the launcher and its embedded source against the controlled version;
   identify its fixed `28166`, dated directories and prior-receipt assumptions.
   Do not execute an old launcher merely because its filename looks correct.
3. Prepare a **current read-only** preflight that inspects clock/policy source,
   historical receipt hashes, operational identity/readiness, isolation and
   stopped/quarantine evidence without scans, downloads or state changes.
4. Re-evaluate candidate generations with the unchanged real freshness policy.
   If the October baseline is now ineligible, preserve its historical evidence
   and obtain an explicitly reviewed replacement baseline/acquisition plan. Do
   not disable freshness, backdate clocks or rename files to simulate change.
5. Two different, independently verified signed generations must be simultaneously
   eligible for a genuine transition. If unavailable, record
   `BLOCKED_NOT_ENOUGH_ELIGIBLE_GENERATIONS`; stop before transition testing.

Recorded prepared artifacts (historical identities; current bytes/locations not
materialized or reverified in this handoff):

| Artifact | Recorded SHA256 | Evidence boundary |
| --- | --- | --- |
| `jif_scan01_stage4_release_gates_20261028.zip` | `856a0960f46651aa932103376c7fd15ad5a3ae6e65e30995b68fc0674a63bd4c` | Historical 26 local tests; review contract only |
| `jif_scan01_stage4_completion_readiness_20261028.sh` | `09ebfeee6eec5cab7c74a5576235d96fabbbf2a7e1bccd1551b614a2d8a7d973` | Owner ran October 28 discovery; must revalidate code/time assumptions before reuse |
| `jif_scan01_stage4a_native_acquisition_20261028.zip` | `4ebb693232106bfbf07116cf6d7eda855958703f1514807b3bd1be283b39bd81` | Historical 13 local tests; no Stage 4A native acceptance |
| `jif_scan01_stage4a_native_acquisition_launcher_20261028.sh` | `8495629e2f90c21828809083390fe1d964d4abc341844904cc1ec12a2dfed40e` | Prepared isolated acquisition launcher; unexecuted natively in record |
| `jif_scan01_stage4a_launcher_20261028.zip` | `45e9faa32547aa6e8825605ba260d157c427b98777061aa159466d3f3589f69c` | Distribution ZIP, not an acquisition receipt |

The old acquisition package names private state
`~/jif-scan01-stage4a-native-acquire-20261028` and code directory
`~/jif-scan01-stage4a-package-20261028`. Inspect existing state read-only before
choosing new uniquely named test state; never delete or overwrite a failed run.

## 4. Ordered scanner acceptance gates — operator execution remains pending

| Gate | Required native evidence | Stop condition |
| --- | --- | --- |
| S0: fresh readiness | Verified current policy/clock; accepted historical hashes; operational scanner identity/readiness; prior candidate STOPPED journals/quarantine; exact reviewed package; documented isolation and approval scope | Any unknown owner/state, stale/ineligible generation or package mismatch |
| S1: Stage 4A acquisition/load | New isolated acquisition; independently sealed exact inventory/hash; native signature verification; distinct eligible version/digest; isolated ClamD PING/VERSION and actual CLEAN/EICAR; independent fresh-process receipt/state readback | Unchanged bytes, unverified signatures, stale generation, load/identity/readback failure |
| S2: changed-generation transition | Two distinct concurrently eligible verified inventories under one exclusive owner; exact old/new identity and state trace; genuine version/digest transition | Same-signature instance rollover alone is insufficient |
| S3: Stage 4B real drain | Owner-authorized HTTP upload and actual ClamD INSTREAM demonstrably active before transition; new admissions blocked; bounded completion or safe abort; native backend quiescence before old retirement; no false CLEAN | Synthetic thread/ticket-only drain, unresolved request, timeout or unproved quiescence |
| S4: Stage 4C interrupted cutover | Separate isolated transaction; actual controller death between exact old retirement and new readiness; fresh owner inspects every possible generation ID/image, STOPPED journal and sticky quarantine; no auto READY/lease replay | Partial receipts, unknown process, uncertain generation ownership or recovery that silently enables admission |
| S5: release decision | Independent hashes/readback, native clean/infected/no-lease/replay results, accepted failure/rollback evidence, unchanged operational scanner, explicit residual RAM-attestation disposition and owner authorization | Any missing proof; a locally passing release-gate CLI is not native evidence |

Use isolated names, private state and networks with no operational scanner network
or published port. Real HTTP probes may use a reviewed isolated namespace path;
do not expose a public test listener to obtain the evidence. Stage 4A's isolated
load PASS, if obtained later, would not by itself clear S2–S5.

## 5. Exact SE-02 integration prerequisites

Repository config at PR39 head:

| Item | Recorded value | Live verification still required |
| --- | --- | --- |
| Installed workflow | `I37vL2CouMUNCYxw` | Fetch exact live graph/export/hash and active/published state; do not import a duplicate |
| Owner-reported diagnostic | Execution `2603`, October 19, REPORT_ONLY / expected `ok:false`, zero transports | Saved execution was not directly fetched in the recorded PR; not ARCHIVE acceptance |
| n8n project | `uEgykgvoDVlzk0ML` | Verify current project/workflow/table association and runtime version |
| Dedicated archive root | `1zJVOBm8PxF8ontZzHS5udYMIBke1lUBB` | Current metadata and private sharing/access; no archive package upload accepted yet |
| Guard table / row | `jwPFylsV6PbE0hff`, numeric row `1` | Exact row/key/version/holder tuple, including previously off-screen `acquired_at` |
| Reservation table | `gu5oNfmgz6Tb1MVA` | Correct String columns `batch_key`,`reservation_json`; current rows/ownership; screenshot-empty is historical |
| Guard contract | `JIF_SE02_ARCHIVE_GLOBAL` / `jif-se02-archive-v1` | SE-02-only tables; never bind monthly Tracker tables |
| Mode / transport | `REPORT_ONLY` / `false` | Table-ID Settings patch was prepared, not reported installed; confirm actual Settings before any write |
| Scanner endpoint | Blank | Reviewed HTTPS endpoint and separately scoped Header Auth credential; real contract/lease integration not yet proven |
| Drive credential | Unbound in generated JSON | Scoped root access; native binary/upload/readback behavior not yet accepted |
| Reviewed catalogue digest | `f84921812c0950717879b528e57530a4c23f5c8e2bfb65b51b022f6c9b9fda29` | Exact catalogue/input identity and selected changed artifact; do not fake CHANGED from no-change evidence |

The initial import SHA256 `eca126356984c4a9a8d855724ba7464f45af322412b9ef0e34328d53699fc682`
and 91,952-byte size in PR39 identify a historical import. The current configured
repository JSON is 91,984 bytes with the blob above. Neither is asserted the
current installed export hash. Reconcile these identities rather than treating
the old import hash as the configured runtime proof.

Scanner adapter contract, exactly as implemented in PR39:

- Request: original raw file body; canonical PDF/CSV Content-Type;
  `X-JIF-Expected-SHA256`; separate n8n Header Auth credential. No Drive OAuth
  credential may reach the scanner. Redirects and retries disabled.
- Successful response: HTTP200 and exactly seven fields: `status`, `sha256`,
  `bytes`, `engine`, `engineVersion`, `signatureVersion`, `scannedAt`.
- Adapter must calculate hash/count itself and perform the full actual scan;
  never echo the expected header as evidence. Timestamp must be between source
  retrieval and current workflow clock; real engine/signature identity required.
- Scanner must enforce reviewed 50,000,000-byte and transport/body limits, use
  maintained signatures/current policy and preserve no public file copy.
- Prove compatibility with the scanner's actual owner/lease/generation controls;
  a configured static Header Auth node alone does not prove that integration.

The engine checks source size **after** native download; this is not a streaming
HTTP byte cap. Each HTTP request has180-second timeout, no redirects and no
retries; JSON is capped at1MB after transport. Native transport/body/decompression
resource limits therefore need explicit configuration and evidence, not an
assumption that downstream size validation bounds the download itself.

## 6. SE-02 native archive sequence after scanner qualification

These are gated acceptance scenarios, not permission to enable the current
workflow. Prepare one versioned configured candidate/export and exact diff, keep
it unpublished/disconnected, and obtain scoped operator authorization before
ARCHIVE mode or credential/transport changes.

1. **Read-only installation reconciliation:** actual n8n runtime, workflow ID,
   graph/export hash, disabled transport inventory, table schema/current holder
   state, archive root metadata/access, scanner endpoint contract and credential
   boundaries. No duplicate workflow or monthly guard reuse.
2. **Guard/reservation semantics:** prove exact-owner conditional acquisition,
   fresh guard read before every write, one immutable insert-only reservation,
   losing contender denied and unable to release another execution's tuple.
3. **Controlled clean archive:** approved fresh source-change receipt (at most24
   hours old per code), complete five-source catalogue set, one selected changed
   artifact, exact source size/type/magic/hash, real clean scanner evidence, three
   reserved Drive IDs before creation, original source and manifest byte readback,
   and exact guard release/readback. Record actual workflow/execution IDs.
4. **Completed replay:** same batch uses the original reserved IDs/metadata;
   prove zero extra source downloads, scans, ID allocations, reservations or file
   creations. Existing retrieval metadata cannot be rewritten on replay.
5. **Fail-closed cases:** infected/hash/scan-time/schema mismatch, source change
   during retrieval, corrupted stored source/manifest, invalid session URL,
   conflicting reservation and owned-guard loss; no ACQUIRED or downstream calls.
6. **Unknown acknowledgments / stop / concurrency:** inspect exact saved
   execution, guard tuple, immutable reservation and reserved Drive IDs before
   retry/recovery. Prove unknown creates reconcile by ID without duplicate
   inserts/files. Native stopped-run recovery remains unaccepted until evidenced.
7. **Acceptance readback:** source + manifest hashes, scanner evidence, one
   reservation/batch, private metadata, guard state, no public rows/sends/downstream
   calls, original workflow/source catalogue/monthly system unchanged. Only then
   consider a separately approved SE-01 handoff and later end-to-end workflow test.

Drive source upload is resumable-session creation plus **one full-file PUT**, not
an implemented in-run chunk-resume mechanism. A missing session acknowledgment
must stop for inspection. Future authorized retry may reuse the reserved file ID;
it must not invent new IDs to escape uncertain state.

## 7. Abort and recovery boundaries

- Scanner uncertainty: deny READY/new leases, retain evidence and staged data,
  reconcile exact ownership under the exclusive lock, stop only owned isolated
  candidates, verify STOPPED journals/sticky quarantine from a fresh process.
  Never clear quarantine or restore admission merely because a process stopped.
- Preserve old failed candidate directories/receipts and immutable definitions.
  No blanket Docker cleanup, shared-network change or operational scanner restart.
- SE-02 ordinary known failures may release the verified owned guard under code
  control. Unknown reservation outcome, guard read/ownership uncertainty, manual
  stop or outside-engine runtime failure may retain it. Never reset based on age
  or a red execution badge. Confirm the terminal saved execution and exact tuple,
  reservation and Drive IDs before a separately reviewed recovery action.
- No delete/update/upsert path for reservations; no archive overwrite, sharing
  change, public feed rollback, source/model correction or monthly-workflow action
  is authorized by this handoff. Uncertain state remains blocked with evidence.

## 8. Current blockers, ownership and next concrete action

| Blocker | Owner role | Required next evidence |
| --- | --- | --- |
| Dated launcher/definition assumptions | Engineering + operator | Materialized exact package bytes, code/hash review, current read-only policy/clock/identity/isolation snapshot |
| Two distinct eligible signed generations not accepted | Scanner engineering/operator | Isolated acquisition/signature/load receipts for actual current candidates; no invented version |
| Native drain and interrupted transition open | Scanner engineering/operator | S3/S4 real HTTP/ClamD and fresh-process recovery evidence |
| Endpoint/lease/SE-02 schema bridge unproven | Integration engineering | Exact adapter contract and owner authorization mapping, native positive/negative tests |
| Installed Settings/table/credential state unverified | Workflow operator | Same workflow ID's native export, read-only table/root/credential-boundary readback |
| Native archive/concurrency/recovery open | Integration engineering/operator | Controlled scenario receipts, reserved-ID/source/manifest readback, no extra effects |
| Release decision absent | Owner after review | Accepted evidence, residual RAM-attestation decision, explicit scoped release authorization |

**Next action:** engineering first materializes/reviews the recorded readiness
and acquisition artifacts, then prepares a current dated **read-only readiness
preflight** with explicit freshness stop conditions. Return that concrete package
and exact execution boundary for operator review. Do not issue or run the old
October acquisition launcher as if November eligibility had been established.

This handoff only prepares acceptance. It creates no native receipt, current
scanner-version claim or production permission. Offline SE-03/SE-04 approved
fixture work may continue in parallel while these native gates remain open.
