# SE-02 Acquire and Archive — v0.1 candidate

Prepared under Ethon's 2026-10-19 implementation approval. **Installed as I37vL2CouMUNCYxw; owner-supplied native report-only preflight execution 2603 passed its zero-transport diagnostic boundary. No archive-mode run or activation is accepted.**

SE-01 is already merged as PR #38 and its five-source native no-change test passed. This package does not modify SE-01, monthly publication, public serving tables, or frozen Spending Explorer data.

## Initial installation (completed)

Import `workflows/JIF-SE02-Acquire-Archive-REPORT-ONLY-v0.1.json` into **one new SE-02 workflow**, save it, and leave it unpublished. It has **24 nodes**, no schedule, zero bound credentials, and eight disabled native transport nodes. Do not append it to SE-01 or replace another workflow. After confirming the canvas, its manual report-only preflight can be run without source, Drive, scanner or table calls.

The default result is `REPORT_ONLY`, `ok:false`, zero acquired files and explicit setup blockers. This is an installation diagnostic, never an acquisition PASS.

## Current installation checkpoint — 2026-10-19

The owner supplied separate SE-02 Data Table URLs in project `uEgykgvoDVlzk0ML`:

- Guard `jwPFylsV6PbE0hff`: screenshot showed one row, numeric ID `1`, key `JIF_SE02_ARCHIVE_GLOBAL`, version `jif-se02-archive-v1`, token `UNLOCKED`, and holder execution/workflow `NONE`. `acquired_at` was off-screen and remains unverified.
- Reservations `gu5oNfmgz6Tb1MVA`: screenshot showed String columns `batch_key` and `reservation_json`, no rows, Total 0.

These IDs are now recorded in `config/install-config.json` and the generated Settings code. This is owner UI evidence, not a native transport readback. **The Settings patch has been prepared, not reported installed.** The only owner edit is to replace all code in the existing `SE02 | Settings` node and save the same workflow. Do not import again, run, publish, enable transports, or change other nodes. The generated full JSON remains a reproducible configuration snapshot, not an instruction to reimport.

`mode=REPORT_ONLY`, `transportEnabled=false`, `scannerUrl=""` and `caseInput=null` are unchanged. Native table readback, a real scanner adapter/endpoint/credential, Drive binding, controlled archive/replay/failure/recovery acceptance, and the eventual SE-01 handoff remain pending. Initial engineering ZIP/import hashes remain historical baseline artifacts; this source revision and the current Drive handoff record contain the table-ID override. No monthly guard, source catalogue or public data was changed.

## Scope and layout

One selected changed artifact per invocation. A complete, fresh (at most 24-hour-old) SE-01 source-change receipt must match the unchanged approved catalogue. Discovery-only changes and newly discovered URLs require catalogue review before acquisition. No-change receipts are not transformed into fake acquisition cases.

Private archive root: https://drive.google.com/drive/folders/1zJVOBm8PxF8ontZzHS5udYMIBke1lUBB . It was created and metadata-verified as not shared during preparation; **no official source package has been uploaded**.

Each content batch gets one folder, the original PDF/CSV, and `source-manifest.json`. Metadata includes source authority/class, FY, catalogue title/release date, original URL, retrieval date, byte count, SHA-256, scanner identity/signatures/result, original monitor time, parser `NOT_EXTRACTED`, contract version, archive IDs and explicit release prohibitions. The changed-file release date remains null/unverified; the catalogue date is separately labelled and is not presented as a verified revision date. Original retrieval metadata is retained on replay.

Batch identity is publisher + stable source type ID + FY + byte SHA-256 + parser/contract version. Different bytes create a different folder even if the title/URL is unchanged. URL/title alone do not create a release. The SE-01 source catalogue is not edited by this package.

## Before any live archive test

1. Create two **separate SE-02-only** n8n Data Tables using `config/table-schema.json`. Seed exactly one guard row using `config/guard-initial-row.csv`; record its actual numeric row ID. Never bind the monthly tracker guard or ledger.
2. Configure a trusted malware scanner endpoint implementing `docs/SCANNER-CONTRACT.md`. **No scanner service or clean result is fabricated by this package.** Its endpoint/credential has not yet been selected or tested.
3. Bind a Drive OAuth credential with access to the private root, and a scanner Header Auth credential. Keep secrets in n8n credential storage.
4. Record the installed SE-02 workflow ID. Prepare a configured export with the actual table IDs, scanner URL, `transportEnabled:true` and explicitly authorized ARCHIVE mode. Enable transport only through that reviewed candidate, not ad-hoc edits to many nodes.
5. Perform controlled isolated native acquisition/replay/failure/recovery checks before connecting a live SE-01 handoff. This package's native stopped-run recovery is **not yet accepted**.

Do not run a live archive merely to repeat SE-01's successful no-change check. Source acceptance and all SE-03–SE-07 work remain separate.

## Persistence and failures

Native conditional guard updates serialize reservations and Drive writes. The guard checks the exact row/key/version and current workflow/execution/token. A losing contender cannot write or release another owner's tuple. Each write is preceded by a fresh guard read.

Allocate three Google Drive IDs and insert one immutable reservation **before** any archive file creation. Re-read the reservation before proceeding. Folder/source/manifest IDs survive an interrupted execution in the reservation table. Replays use those IDs and byte readback; completed replays do not redownload, rescan, allocate IDs or create files. The reservation table has no update/delete/upsert path.

Official binaries use Drive **resumable session creation plus one full-file PUT** (files may be 10–30 MB). The small JSON manifest uses multipart. All file requests are create-only; there is no PATCH/overwrite or sharing operation. An unknown write acknowledgment is followed by ID-based readback, not an automatic second create. A missing session acknowledgment stops for inspection. A future authorized rerun may start a new session for the same reserved file ID; this cannot create a second ID but is not an in-run chunk-resume implementation.

Ordinary source/type/hash/scan/readback failures release the owned guard and return FAILED_CLOSED. Unknown reservation outcomes, guard-read/ownership uncertainty, manually stopped runs, or a runtime failure outside the transition engine may leave the guard held. **Do not reset it based on age or a red execution badge.** Verify the terminal saved execution, exact tuple, reservation and Drive IDs first; controlled recovery for this installed workflow must be prepared and accepted before unattended use. No automated stopped-run recovery is claimed.

The HTTP timeout is 180 seconds per request, no redirects and no retries. The source size gate is checked **after** the native HTTP download; it is not a streaming transport byte cap. PDF signatures/CSV tokens are file gates, not structural extraction or budget-data reconciliation. That remains SE-03/SE-04 work.

Source bytes travel as filesystem binary references through Code/HTTP/table contexts; JSON state contains only metadata, not file base64. Generated VM fixtures exercise this contract but do not prove the live n8n binary manager or real Google transport.

## Validation

Run `npm run build` and `npm test` in this package. See `docs/VALIDATION.md` for the local/native evidence boundary.

Primary implementation references:
- https://developers.google.com/workspace/drive/api/guides/create-file
- https://developers.google.com/workspace/drive/api/guides/manage-uploads
- https://github.com/n8n-io/n8n/blob/n8n%402.25.7/packages/nodes-base/nodes/DataTable/actions/row/insert.operation.ts
- https://github.com/n8n-io/n8n/blob/n8n%402.25.7/packages/nodes-base/nodes/HttpRequest/V3/HttpRequestV3.node.ts
- https://github.com/n8n-io/n8n/blob/n8n%402.25.7/packages/workflow/src/workflow-data-proxy.ts
