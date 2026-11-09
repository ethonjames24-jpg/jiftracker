import contextlib
import hashlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from se03_pdf_source_fy25 import (
    SOURCE_ID, SourceRejected, Rejected, compare, extract, financial_controls,
    historical_signature, main, pinned_bytes,
)
from test_se03_staging_fact_parity import normalized, fact


def source(amount=100):
    row = normalized(amount)
    row.update(source_id=SOURCE_ID, fiscal_year="2025/26")
    return row


def baseline(amount="100"):
    row = fact(amount)
    row.update(source_id=SOURCE_ID, fiscal_year="2025/26", estimate_version="AS_PASSED", budget_number="1")
    return row


class Tests(unittest.TestCase):
    def test_exact_nine_field_match_has_no_publication_authority(self):
        result = compare([source()], [baseline()])
        self.assertEqual(result["result"], "SOURCE_PROJECTION_MATCH_REVIEW_ONLY")
        self.assertFalse(result["publication_authorized"])
        self.assertFalse(result["full_33_field_fact_reconstruction_verified"])

    def test_capital_project_grammar_adapts_without_changing_baseline(self):
        row = baseline()
        row.update(budget_number="6", budget_type="CAPITAL", source_row="Project 10001; economic 21; AUTHORIZED_BY_LAW")
        before = dict(row)
        self.assertEqual(historical_signature(row)[3], "ACTIVITY")
        self.assertEqual(row, before)

    def test_project_in_recurrent_budget_rejected(self):
        row = baseline(); row["source_row"] = row["source_row"].replace("Activity", "Project")
        with self.assertRaises(SourceRejected): historical_signature(row)

    def test_approved_version_or_different_year_rejected(self):
        for field, value in (("estimate_version", "APPROVED"), ("fiscal_year", "2026/27")):
            row = baseline(); row[field] = value
            with self.assertRaises(SourceRejected): historical_signature(row)

    def test_changed_subprogramme_explained_but_exact_parity_fails(self):
        row = source(); row["canonical_entity_key"] = "01000_01_01_163_24_10001"
        result = compare([row], [baseline()])
        self.assertEqual(result["difference_class_counts"], {"SOURCE_SUBPROGRAMME_CODE_DIFFERENCE": 1})
        self.assertFalse(result["exact_row_parity_verified"])
        self.assertFalse(result["identity_differences_approved"])
        self.assertEqual(result["result"], "SOURCE_TOTALS_MATCH_IDENTITY_REVIEW_REQUIRED")

    def test_changed_activity_explained_but_not_approved(self):
        row = source(); row["canonical_entity_key"] = "01000_01_01_163_01_12303"
        result = compare([row], [baseline()])
        self.assertEqual(result["difference_class_counts"], {"SOURCE_ACTIVITY_CODE_DIFFERENCE": 1})
        self.assertFalse(result["identity_differences_approved"])

    def test_simultaneous_activity_and_subprogramme_change_is_unclassified(self):
        row = source(); row["canonical_entity_key"] = "01000_01_01_163_24_12303"
        self.assertEqual(compare([row], [baseline()])["result"], "FAILED_CLOSED")

    def test_same_total_with_changed_economic_category_fails(self):
        row = source(); row["economic_code"] = "22"
        result = compare([row], [baseline()])
        self.assertEqual(result["programme_economic_groups_different"], 2)
        self.assertEqual(result["result"], "FAILED_CLOSED")

    def test_different_physical_detail_page_is_not_accepted(self):
        row = source(); row["source_page"] = "14"
        self.assertEqual(compare([row], [baseline()])["result"], "FAILED_CLOSED")

    def test_ambiguous_equal_amount_classification_fails_closed(self):
        first = source(); first["canonical_entity_key"] = "01000_01_01_163_24_10001"
        second = source(); second["canonical_entity_key"] = "01000_01_01_163_25_10001"
        old1 = baseline(); old2 = baseline(); old2["activity_id"] = "ACT_01000_01_01_163_02_10001"
        result = compare([first, second], [old1, old2])
        self.assertEqual(result["result"], "FAILED_CLOSED")
        self.assertEqual(result["unclassified_source_signatures"], 2)

    def test_duplicate_source_or_baseline_cannot_disappear_in_rollup(self):
        with self.assertRaises(SourceRejected): compare([source(), source()], [baseline()])
        with self.assertRaises(SourceRejected): compare([source()], [baseline(), baseline()])

    def test_duplicate_identity_rejected_when_amount_or_page_differs(self):
        second = source(200); second["source_page"] = "14"
        with self.assertRaises(SourceRejected): compare([source(), second], [baseline()])

    def test_existing_baseline_identity_collision_is_diagnosed_and_blocks_acceptance(self):
        second = source(200); second["canonical_entity_key"] = "01000_01_01_163_01_12303"
        result = compare([source(), second], [baseline(), baseline("200")])
        self.assertEqual(result["baseline_duplicate_financial_identities"], 1)
        self.assertEqual(result["programme_economic_groups_different"], 0)
        self.assertEqual(result["difference_class_counts"], {"SOURCE_ACTIVITY_CODE_DIFFERENCE": 1})
        self.assertEqual(result["result"], "FAILED_CLOSED")

    def test_missing_row_fails_even_if_other_row_exact(self):
        result = compare([source()], [])
        self.assertEqual(result["result"], "FAILED_CLOSED")

    def test_source_identity_and_integer_amount_required(self):
        for field, value in (("source_id", "OTHER"), ("amount_jmd", True), ("amount_jmd", 100.0), ("source_page", "0")):
            row = source(); row[field] = value
            with self.assertRaises(SourceRejected): compare([row], [baseline()])

    def test_historical_activity_code_must_agree_with_entity(self):
        row = baseline(); row["source_row"] = row["source_row"].replace("10001", "99999")
        with self.assertRaises(Rejected): historical_signature(row)

    def test_source_sign_must_agree_with_measure(self):
        with self.assertRaises(SourceRejected): compare([source(-100)], [baseline()])

    def test_aia_blank_baseline_page_explained_without_erasing_source_page(self):
        a = source(-100)
        a.update(entity_type="VOTE", canonical_entity_key="01000", economic_code="AIA", measure_type="APPROPRIATIONS_IN_AID")
        b = baseline("-100")
        b.update(vote_id="VOTE_01000", activity_id="", economic_id="ECON_AIA", measure_type="APPROPRIATIONS_IN_AID",
                 source_page="", source_row="Vote-level Appropriations-in-Aid offset for Head 01000")
        result = compare([a], [b])
        self.assertEqual(result["difference_class_counts"], {"BASELINE_AIA_PAGE_OMITTED": 1})
        self.assertEqual(a["source_page"], "13")
        self.assertFalse(result["exact_row_parity_verified"])

    def test_aia_head_conflict_rejected(self):
        row = baseline("-100")
        row.update(vote_id="VOTE_01000", measure_type="APPROPRIATIONS_IN_AID",
                   source_row="Vote-level Appropriations-in-Aid offset for Head 02000")
        with self.assertRaises(SourceRejected): historical_signature(row)

    def test_financial_controls_do_not_accept_small_synthetic_dataset(self):
        with self.assertRaises(SourceRejected): financial_controls([source()])

    def test_wrong_pdf_hash_rejected_before_pdf_parsing(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "wrong.pdf"; path.write_bytes(b"synthetic")
            with self.assertRaises(SourceRejected): extract(path)

    def test_changed_input_bytes_fail_pin(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "input"; path.write_bytes(b"synthetic")
            with self.assertRaises(SourceRejected): pinned_bytes(path, "0" * 64)

    def test_existing_output_directory_rejected_before_source_read(self):
        with tempfile.TemporaryDirectory() as directory:
            output = io.StringIO()
            with patch("sys.argv", ["fy25", "extract", "--pdf", "absent.pdf", "--out-dir", directory]), contextlib.redirect_stdout(output):
                self.assertEqual(main(), 2)
            self.assertEqual(json.loads(output.getvalue())["error"], "OUTPUT_DIRECTORY_ALREADY_EXISTS")

    def test_baseline_receipt_hash_must_bind_the_bytes_actually_parsed(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "candidate.jsonl"
            path.write_text(json.dumps(source()) + "\n", encoding="utf-8")
            candidate_sha = hashlib.sha256(path.read_bytes()).hexdigest()
            baseline_sha = hashlib.sha256(b"original capture").hexdigest()
            argv = ["fy25", "compare", "--candidate-jsonl", str(path), "--candidate-sha256", candidate_sha,
                    "--baseline-csv", "capture.csv", "--baseline-sha256", baseline_sha]
            output = io.StringIO()
            with patch("sys.argv", argv), patch("se03_pdf_source_fy25.parse_csv", return_value=(b"changed capture", [])), contextlib.redirect_stdout(output):
                self.assertEqual(main(), 2)
            self.assertEqual(json.loads(output.getvalue())["error"], "FY25_INPUT_SHA256_MISMATCH")


if __name__ == "__main__":
    unittest.main()
