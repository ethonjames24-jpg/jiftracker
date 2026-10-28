import unittest
from pathlib import Path
import tempfile
from se03_pdf_page_inventory import (
    heading_inventory, page_evidence, review_continuation, economic_candidate_count, inventory,
)


def e(lines, page=2):
    return heading_inventory(lines, page)


class PageInventoryTests(unittest.TestCase):
    def test_explicit_heading_hierarchy(self):
        x = e(["Head 01000 - Governor-General", "Budget 1 - Recurrent",
               "Function 01 - General Public Services", "SubFunction 01 - Executive",
               "Programme 163 - Governance", "Sub Programme 01 - Central",
               "Activity 10005 - Direction"])
        self.assertEqual(x["explicit"]["head"], ["01000"])
        self.assertEqual(x["explicit"]["budget"], ["1"])
        self.assertEqual(x["explicit"]["programme"], ["163"])
        self.assertEqual(x["explicit"]["activity"], ["10005"])

    def test_no_implicit_parent_context(self):
        x = e(["Activity 10005 - Direction and Management"])
        self.assertIsNone(page_evidence(x).head)
        self.assertIsNone(page_evidence(x).vote)
        self.assertIsNone(page_evidence(x).programme)

    def test_ignores_body_mentions(self):
        x = e(["The Activity 10005 supports spending", "Head No. and Title", "Programme 163 expenditure:"])
        self.assertEqual(x["explicit"]["activity"], [])
        self.assertEqual(x["explicit"]["head"], [])
        self.assertEqual(x["explicit"]["programme"], [])

    def test_ambiguous_multi_programme(self):
        x = e(["Programme 163 - Gov", "Programme 164 - Other"])
        self.assertIn("programme", x["multiple_section_headings"])
        self.assertIsNone(page_evidence(x).programme)
        self.assertTrue(page_evidence(x).section_boundary)

    def test_duplicate_running_head_deduped(self):
        x = e(["Head 01000 - Governor", "Head 01000 - Governor"])
        self.assertEqual(x["explicit"]["head"], ["01000"])
        self.assertFalse(x["multiple_section_headings"])

    def test_project_separate_from_activity(self):
        x = e(["Project 21686 - Contingencies"])
        self.assertEqual(x["explicit"]["project"], ["21686"])
        self.assertEqual(x["explicit"]["activity"], [])

    def test_context_without_economic_candidate_fails(self):
        previous=e(["Head 01000 - Gov", "Budget 1 - Recurrent", "Programme 163 - G", "Activity 10005 - Direction"], 1)
        current=e(["Head 01000 - Gov", "Budget 1 - Recurrent", "Programme 163 - G"], 2)
        v=review_continuation(previous,current,{"source_row":"Activity 10005; economic 21; VOTED_ESTIMATE"},0)
        self.assertEqual(v["status"], "ECONOMIC_COLUMN_AMBIGUOUS_OR_MISSING")

    def test_adjacent_source_candidate_is_review_only(self):
        previous=e(["Head 01000 - Gov", "Budget 1 - Recurrent", "Programme 163 - G", "Activity 10005 - Direction"],1)
        current=e(["Head 01000 - Gov", "Budget 1 - Recurrent", "Programme 163 - G"],2)
        v=review_continuation(previous,current,{"source_row":"Activity 10005; economic 21; VOTED_ESTIMATE"},1)
        self.assertEqual(v["status"],"CONTINUATION_SCOPE_CANDIDATE_REVIEW_ONLY")
        self.assertFalse(v["canonical_row_reconstructed"])
        self.assertFalse(v["release_authorized"])

    def test_different_head_failed_closed(self):
        prev=e(["Head 01000 - Gov", "Budget 1 - Recurrent", "Programme 163 - G", "Activity 10005 - Direction"],1)
        curr=e(["Head 02000 - Parliament", "Budget 1 - Recurrent", "Programme 163 - G"],2)
        self.assertEqual(review_continuation(prev,curr,{"source_row":"Activity 10005; economic 21; VOTED_ESTIMATE"},1)["status"],"SECTION_IDENTITY_CHANGED")

    def test_missing_current_programme_failed_closed(self):
        prev=e(["Head 01000 - Gov", "Budget 1 - Recurrent", "Programme 163 - G", "Activity 10005 - Direction"],1)
        curr=e(["Head 01000 - Gov", "Budget 1 - Recurrent"],2)
        self.assertEqual(review_continuation(prev,curr,{"source_row":"Activity 10005; economic 21; VOTED_ESTIMATE"},1)["status"],"INSUFFICIENT_EXPLICIT_SECTION_IDENTITY")

    def test_current_heading_deferred(self):
        curr=e(["Activity 10005 - Direct"],2)
        self.assertEqual(review_continuation(None,curr,{"source_row":"Activity 10005; economic 21; VOTED_ESTIMATE"},1)["status"],"ON_PAGE_HEADING_DEFER_TO_EXISTING_CLASSIFIER")

    def test_nonactivity_grain_fail_closed(self):
        curr=e([],2)
        self.assertEqual(review_continuation(None,curr,{"source_row":"Programme 163; economic 21; VOTED_ESTIMATE"},1)["status"],"NON_ACTIVITY_GRAIN_SEPARATE_RULE")

    def test_invalid_pdf_sha_before_open(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/"bad.pdf"
            path.write_bytes(b"not a genuine PDF")
            with self.assertRaisesRegex(ValueError,"SOURCE_PDF_SHA256_MISMATCH"):
                inventory(path)

    def test_econ_column_unique_reuses_original_method(self):
        class Page:
            def get_text(self,style):
                return [(12,120,14,128,"21",0,0,0),(402,120.6,428,128,"1,234.0",0,0,1)]
        page=Page()
        fact={"economic_id":"ECON_21","amount_jmd_normalized":"1,234,000", "measure_type":"VOTED_ESTIMATE"}
        self.assertEqual(economic_candidate_count(page,fact),1)

    def test_bad_amount_does_not_guess(self):
        class Page:
            def get_text(self,*args):
                raise AssertionError("should not inspect PDF for invalid amount")
        self.assertEqual(economic_candidate_count(Page(),{"economic_id":"ECON_21","amount_jmd_normalized":"x","measure_type":"VOTED_ESTIMATE"}),0)

    def test_non_thousand_amount_does_not_guess(self):
        class Page:
            def get_text(self,*args):
                raise AssertionError("no access")
        self.assertEqual(economic_candidate_count(Page(),{"economic_id":"ECON_21","amount_jmd_normalized":"500.01","measure_type":"VOTED_ESTIMATE"}),0)


if __name__=='__main__':
    unittest.main()
