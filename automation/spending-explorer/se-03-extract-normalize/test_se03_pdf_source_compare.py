import unittest
from se03_pdf_source_compare import compare_candidate
from test_se03_staging_fact_parity import normalized,fact


class Tests(unittest.TestCase):
    def test_exact_projection_match_has_no_release_authority(self):
        report=compare_candidate([normalized()],[fact()])
        self.assertEqual(report["result"],"SOURCE_PROJECTION_MATCH_REVIEW_ONLY")
        self.assertFalse(report["publication_authorized"])
        self.assertFalse(report["full_33_field_fact_parity_verified"])

    def test_activity_programme_equal_amount_does_not_clear_identity(self):
        record=normalized()
        base=fact();base.update(activity_id="",programme_id="PROG_01000_01_01_163",
                               source_row="Programme 163; economic 21; AUTHORIZED_BY_LAW")
        report=compare_candidate([record],[base])
        self.assertEqual(report["result"],"SOURCE_TOTALS_MATCH_IDENTITY_REVIEW_REQUIRED")
        self.assertEqual(report["exact_shared_field_matches"],0)
        self.assertEqual(report["programme_economic_financial_groups_different"],0)
        self.assertEqual(len(report["identity_differences"]),1)
        self.assertFalse(report["identity_differences_approved"])

    def test_financial_difference_fails_closed(self):
        record=normalized(101)
        self.assertEqual(compare_candidate([record],[fact()])["result"],"FAILED_CLOSED")

    def test_same_total_but_changed_economic_category_fails(self):
        record=normalized();record["economic_code"]="22"
        report=compare_candidate([record],[fact()])
        self.assertEqual(report["result"],"FAILED_CLOSED")
        self.assertEqual(report["programme_economic_financial_groups_different"],2)

    def test_changed_source_page_only_stays_unclassified(self):
        record=normalized();record["source_page"]="14"
        report=compare_candidate([record],[fact()])
        self.assertEqual(report["result"],"FAILED_CLOSED")
        self.assertEqual(report["unclassified_source_extra_signatures"],1)

    def test_duplicate_multiplicity_cannot_disappear_in_rollup(self):
        report=compare_candidate([normalized(),normalized()],[fact()])
        self.assertEqual(report["result"],"FAILED_CLOSED")
        self.assertEqual(report["source_extra_signatures"],1)

    def test_one_programme_row_cannot_match_two_detail_rows_by_total(self):
        first=normalized(40);second=normalized(60,key="01000_01_01_163_01_10002")
        base=fact();base.update(activity_id="",programme_id="PROG_01000_01_01_163",
                               source_row="Programme 163; economic 21; AUTHORIZED_BY_LAW")
        report=compare_candidate([first,second],[base])
        self.assertEqual(report["programme_economic_financial_groups_different"],0)
        self.assertEqual(report["result"],"FAILED_CLOSED")


if __name__=="__main__":unittest.main()
