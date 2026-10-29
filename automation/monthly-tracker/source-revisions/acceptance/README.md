# Current evidence — October 29, 2026

The owner already completed NORMAL April–June, all four injected fault cases, and cancellation followed by serial replay #2750. May/June runs were sequential, so overlap remains unverified. The real monitor automatic owner-alert test is separately evidenced. See ../docs/NATIVE-ACCEPTANCE.md and ../docs/RELEASE-CLOSEOUT.md. Keep this test copy unpublished; its latest export is OBSERVE/NORMAL/June, so return it to REPORT_ONLY for storage when next editing it. The procedures below remain reproducible test instructions, not a request to repeat completed tests.

# TEST ONLY — isolated native acceptance

Do not replace the configured monitor. Import this JSON as a NEW workflow. Keep it unpublished. It has no schedule, error-handler binding, credentials, public writer or sender. The clone deliberately checks only the listed April candidate (one source), using the same engine as the real monitor.

## One-time setup

1. In the same n8n project, create NEW table `JIF_BT_SR_TEST_Baselines` by importing config/BASELINES-SEED.csv. Confirm five rows; month_sort, source_url, sha256, provenance, archive_note and verified_date are String; size_bytes may be numeric.
2. Create NEW table `JIF_BT_SR_TEST_Observations` by importing TEST-OBSERVATIONS-SCHEMA.csv. All 17 imported columns must be String. Delete its ONE `SETUP_ROW_DELETE_BEFORE_TEST` row, leaving zero rows. Do not delete any rows from the accepted monitor table. Planning rejects the sentinel if it remains.
3. Import JIF_Source_Revisions_ISOLATED_ACCEPTANCE_INACTIVE.json as a NEW workflow. Bind the existing JIF Drive credential only to Archive Candidate Privately and Download Archived Candidate. Their fixed destination is TEST ONLY folder `1_tjDf3qSRxTFHIH_rVh9ErfdQwJksdtX` (https://drive.google.com/drive/folders/1_tjDf3qSRxTFHIH_rVh9ErfdQwJksdtX).
4. Open Configuration. Set baseline_table_id and observation_table_id to the two NEW test table IDs only. The gate rejects either accepted monitor table ID, identical IDs, unknown modes or a different folder. Keep mode REPORT_ONLY and test_case NORMAL initially. Execute once: CONFIGURATION_REQUIRED and test_only=true; no transport nodes run.
5. Change only mode to OBSERVE. Leave test_case NORMAL and target_month 2026-04. Execute the whole workflow once. Expect one changed source, no failed checks, complete baseline coverage and test_only=true; one observation and one test archive. This is a test-copy receipt, not activation of the actual monitor.
6. Repeat NORMAL sequentially. The table stays one row; first_seen/evidence_file_id stay fixed, last_seen advances; archive count stays one. Record execution IDs, table counts and file IDs.

## Controlled fault cases — run one at a time

Change only Configuration.test_case. Keep target_month 2026-04. Do not overlap these runs. Non-NORMAL modes intentionally ignore previous observations to exercise first-seen branches; they can create extra TEST archives and failed-test records. Never treat them as official review evidence.

| test_case | Expected native result | Persistence check |
| --- | --- | --- |
| MISSING_BASELINE | The selected task has no trusted baseline. A candidate is archived, observation is BASELINE_REQUIRED, completion raises REVISION_CHECK_REQUIRES_ATTENTION. | Only the TEST table/folder change; baseline seed rows stay unchanged. |
| DOWNLOAD_FAILURE | Reserved invalid host fails. Inspection records CHECK_FAILED and completion raises REVISION_CHECK_REQUIRES_ATTENTION. | Failed TEST observation exists; no archive for the failed download; no complete no-change receipt. |
| ARCHIVE_HASH_MISMATCH | Bytes downloaded from the TEST archive are copied and one byte changed in memory. Verify Archived Bytes raises ARCHIVE_READBACK_HASH_MISMATCH. | Uploaded TEST file remains intact; candidate observation is not upserted; do not alter a stored file. |
| POST_ARCHIVE_FAILURE | Candidate is uploaded and readback-verified, then the TEST ONLY fault node raises INJECTED_POST_ARCHIVE_FAILURE before upsert. | An unlogged TEST archive is intentionally left; accepted source archives/table stay untouched. |

After each fault restore test_case NORMAL and run the whole test copy once. Expect a complete one-source receipt. Record how records and hashes reconcile; retain orphan evidence rather than deleting blindly. Missing-baseline classification for the same URL/hash shares the logical case ID with a later verified record, so NORMAL may update that TEST row after restoring the real baseline. Download errors have a distinct failure identity and can remain as historical TEST rows. A successful new normal check does not mean those older fault records vanish.

## Native overlap and interrupted-write gate

Do not publish or schedule the copy. To probe a first-seen race, leave NORMAL and change target_month to 2026-05 (an untested listed candidate). Open the same test workflow in two tabs and start full manual runs close together. Record both execution IDs and actual start/end times, or record that n8n refused/queued overlap; do not claim overlap from two sequential runs. Compare new candidate archive hashes, row count and duplicate case_id/check_key records. Run one further NORMAL check to see whether duplicate identities are rejected. If duplicates/orphans occur, this confirms the documented limitation; it is not permission to ignore the failure. Preserve a TEST CSV/export and reconcile duplicates under a reviewed operator procedure. Never delete accepted records.

For an execution-stop test, use another untested target month, observe the upload/readback stage, stop the TEST execution, then rerun NORMAL. Record whether the archive or upsert already committed; a stopped UI or missing response alone does not prove a write failed. The deterministic POST_ARCHIVE_FAILURE case gives a repeatable archive-before-log boundary; it does not substitute for a true native execution stop.

Current engine does not claim distributed exactly-once archive or row creation. Do not enable the real schedule until an explicit overlap-prevention/serial-operation and recovery disposition is documented. The test copy cannot verify the real monitor’s owner alert: its new ID is intentionally outside the shared handler allowlist. Automatic alert delivery requires a separate controlled automatic failure of the actual configured monitor, not a manual test.

## Restore / retain

Return the test copy to REPORT_ONLY after testing and retain exports, execution IDs and TEST evidence. Keep it inactive and unpublished. Do not import it over the real monitor. Do not attach it to production publishers, guard/ledger tables, subscribers or Spending Explorer.
