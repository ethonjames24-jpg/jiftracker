import contextlib
import copy
import io
import json
import unittest
from unittest.mock import patch

from se03_staging_fact_parity import (
    FACT_HEADERS, Rejected, compare_fact_tables, compare_normalized, main,
)


def normalized(amount=100, key="01000_01_01_163_01_10001"):
    return {
        "source_id":"SRC_EOE_2026_27_PASSED", "fiscal_year":"2026/27",
        "measure_type":"AUTHORIZED_BY_LAW", "entity_type":"ACTIVITY",
        "canonical_entity_key":key, "economic_code":"21", "amount_jmd":amount,
        "source_page":"13", "recurrent_or_capital":"RECURRENT",
    }


def fact(amount="100", fid="FACT_SYNTHETIC_1"):
    row = dict.fromkeys(FACT_HEADERS, "")
    row.update({
        "fact_id":fid, "source_id":"SRC_EOE_2026_27_PASSED", "fiscal_year":"2026/27",
        "measure_type":"AUTHORIZED_BY_LAW", "activity_id":"ACT_01000_01_01_163_01_10001",
        "economic_id":"ECON_21", "amount_jmd_normalized":amount,
        "source_page":"13", "budget_type":"RECURRENT",
        "source_row":"Activity 10001; economic 21; AUTHORIZED_BY_LAW",
    })
    return row


class Tests(unittest.TestCase):
    def test_exact_projection_is_not_full_source_acceptance(self):
        report = compare_normalized([normalized()], [fact()])
        self.assertEqual(report["result"], "PROJECTION_PASS_REVIEW_ONLY")
        self.assertEqual(len(report["projection_fields"]), 9)
        self.assertFalse(report["full_33_field_staging_parity_verified"])
        self.assertFalse(report["original_pdf_extraction_verified"])
        self.assertFalse(report["release_authorized"])

    def test_same_total_with_two_changed_amounts_fails(self):
        rows = [normalized(90), normalized(110)]
        report = compare_normalized(rows, [fact(), fact(fid="SECOND")])
        self.assertEqual(report["result"], "FAILED_CLOSED")
        self.assertEqual(report["missing_signatures"], 2)

    def test_missing_row_fails(self):
        self.assertEqual(compare_normalized([], [fact()])["missing_signatures"], 1)

    def test_duplicate_multiplicity_is_preserved(self):
        report = compare_normalized([normalized(), normalized()], [fact()])
        self.assertEqual(report["extra_signatures"], 1)
        self.assertEqual(report["duplicate_normalized_signatures"], 1)

    def test_wrong_page_fails(self):
        record = normalized(); record["source_page"] = "14"
        self.assertEqual(compare_normalized([record], [fact()])["result"], "FAILED_CLOSED")

    def test_inconsistent_fact_source_row_rejected(self):
        row = fact(); row["source_row"] = "Activity 99999; economic 21; AUTHORIZED_BY_LAW"
        with self.assertRaises(Rejected): compare_normalized([normalized()], [row])

    def test_programme_grain(self):
        record = normalized(); record.update(entity_type="PROGRAMME",canonical_entity_key="01000_01_01_163")
        row = fact(); row.update(activity_id="",programme_id="PROG_01000_01_01_163",
                                source_row="Programme 163; economic 21; AUTHORIZED_BY_LAW")
        self.assertEqual(compare_normalized([record], [row])["result"], "PROJECTION_PASS_REVIEW_ONLY")

    def test_vote_aia_leading_zero_is_format_only(self):
        record = normalized(-10); record.update(entity_type="VOTE",canonical_entity_key="1000",
                                               economic_code="AIA",measure_type="APPROPRIATIONS_IN_AID")
        row = fact("-10"); row.update(activity_id="",vote_id="VOTE_01000",economic_id="ECON_AIA",
            measure_type="APPROPRIATIONS_IN_AID",source_row="Vote 01000; economic AIA; APPROPRIATIONS_IN_AID")
        self.assertEqual(compare_normalized([record], [row])["result"], "PROJECTION_PASS_REVIEW_ONLY")

    def test_fact_order_does_not_matter(self):
        a,b = fact(),fact(fid="SECOND")
        self.assertEqual(compare_fact_tables([a,b], [b,a])["changed_rows"], 0)

    def test_changed_nonfinancial_field_detected(self):
        row = fact(); changed = copy.deepcopy(row); changed["loaded_at"] = "CHANGED"
        self.assertEqual(compare_fact_tables([row], [changed])["changed_rows"], 1)

    def test_cross_year_duplicate_fact_id_rejected(self):
        row = fact(); prior = dict(row, fiscal_year="2025/26")
        with self.assertRaises(Rejected): compare_fact_tables([row], [row,prior])

    def test_cli_bad_pin_fails_before_read(self):
        args = ["tool"]
        for name in ("staging", "crosswalk", "frozen", "operational"):
            args += ["--"+name+"-csv", "nonexistent.csv", "--"+name+"-sha256", "invalid"]
        out = io.StringIO()
        with patch("sys.argv",args), contextlib.redirect_stdout(out):
            self.assertEqual(main(), 2)
        self.assertEqual(json.loads(out.getvalue())["error"], "PIN_SHA256_REQUIRED")


if __name__ == "__main__":
    unittest.main()
