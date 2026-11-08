import unittest
from se03_staging_normalize import (
    Rejected, activity_crosswalk, normalize, exact_amount, EXPECTED_TOTALS,
)

def row(measure="L", entity="A", key="01000_01_01_163_01_10001",
        economic="21", amount="100", page="13", budget="R"):
    return {
        "measure_code": measure, "entity_type": entity, "entity_key": key,
        "economic_code": economic, "amount_jmd": amount, "source_page": page,
        "budget_type_code": budget, "budget_number": "", "budget_type": "",
    }

class Tests(unittest.TestCase):
    def test_positive_statutory(self):
        records,receipt=normalize([row()],{},strict_counts=False)
        self.assertEqual(receipt["status"],"NORMALIZED_REVIEW_ONLY")
        self.assertEqual(records[0]["measure_type"],"AUTHORIZED_BY_LAW")
        self.assertFalse(receipt["public_release_authorized"])
        self.assertFalse(receipt["original_pdf_extraction_verified"])

    def test_voted_programme_without_activity(self):
        rec,receipt=normalize([row("V","P","41010_08_03_001")],{},False)
        self.assertEqual(receipt["status"],"NORMALIZED_REVIEW_ONLY")
        self.assertEqual(rec[0]["entity_type"],"PROGRAMME")

    def test_negative_aia_vote(self):
        rec,receipt=normalize([row("A","V","1000","AIA","-3208000","12")],{},False)
        self.assertEqual(receipt["status"],"NORMALIZED_REVIEW_ONLY")
        self.assertEqual(receipt["aia_jmd"],-3208000)

    def test_unresolved_activity_fails(self):
        _,receipt=normalize([row("V","A","01000_01_01_163_NA_10005")],{},False)
        self.assertIn("UNRESOLVED_ACTIVITY_SUBPROGRAMME",receipt["errors"])

    def test_resolved_activity_preserves_raw(self):
        m={"ACT_01000_01_01_163_NA_10005":"ACT_01000_01_01_163_01_10005"}
        records,receipt=normalize([row("V","A","01000_01_01_163_NA_10005")],m,False)
        self.assertEqual(receipt["status"],"NORMALIZED_REVIEW_ONLY")
        self.assertEqual(records[0]["canonical_entity_key"],"01000_01_01_163_01_10005")
        self.assertEqual(records[0]["raw_entity_key"],"01000_01_01_163_NA_10005")

    def test_ambiguous_review_map_fails(self):
        rows=[
          {"old_activity_id":"ACT_A_NA_1","resolved_activity_id":"ACT_A_01_1","review_status":"RESOLVED_QA_PASS"},
          {"old_activity_id":"ACT_A_NA_1","resolved_activity_id":"ACT_A_02_1","review_status":"RESOLVED_QA_PASS"},
        ]
        with self.assertRaises(Rejected): activity_crosswalk(rows)

    def test_unreviewed_mapping_ignored(self):
        rows=[{"old_activity_id":"ACT_A_NA_1","resolved_activity_id":"ACT_A_01_1","review_status":"PENDING"}]
        self.assertEqual(activity_crosswalk(rows),{})

    def test_aia_requires_vote_grain(self):
        _,receipt=normalize([row("A","A","01000_01_01_163_01_10001","AIA","-20")],{},False)
        self.assertIn("AIA_GRAIN_OR_ECONOMIC_INVALID",receipt["errors"])

    def test_aia_must_be_negative(self):
        _,receipt=normalize([row("A","V","1000","AIA","25")],{},False)
        self.assertIn("AMOUNT_SIGN_INVALID",receipt["errors"])

    def test_non_aia_missing_page_fails(self):
        _,receipt=normalize([row(page="")],{},False)
        self.assertIn("NON_AIA_PAGE_MISSING",receipt["errors"])

    def test_missing_amount_not_zero(self):
        with self.assertRaises(Rejected): exact_amount("")

    def test_fractional_amount_fails(self):
        with self.assertRaises(Rejected): exact_amount("1.5")

    def test_duplicate_signature_requires_review(self):
        _,receipt=normalize([row(),row()],{},False)
        self.assertIn("DUPLICATE_LINE_SIGNATURE_REQUIRES_REVIEW",receipt["errors"])

    def test_frozen_totals_must_fail_on_small_fixture(self):
        _,receipt=normalize([row()],{},True)
        self.assertEqual(receipt["status"],"FAILED_CLOSED")
        self.assertIn("EXPECTED_ROW_COUNT_MISMATCH",receipt["errors"])

if __name__=="__main__":
    unittest.main()
