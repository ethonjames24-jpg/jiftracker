import unittest
from se03_pdf_continuation_review import PageEvidence as P, classify_activity_continuation as C


class Tests(unittest.TestCase):
    def setUp(self):
        self.prev = P(12, "01000", "01", "163", ("10001", "10005"))
        self.curr = P(13, "01000", "01", "163", ())

    def status(self, previous=None, current=None, act="10005", matches=1, grain="ACTIVITY"):
        return C(self.prev if previous is None else previous,
                 self.curr if current is None else current, act, matches, grain=grain)

    def test_restricted_candidate_never_autoaccepts(self):
        r = self.status()
        self.assertEqual(r["status"], "CONTINUATION_SCOPE_CANDIDATE_REVIEW_ONLY")
        self.assertFalse(r["canonical_row_reconstructed"])
        self.assertFalse(r["release_authorized"])

    def test_different_head(self):
        self.assertEqual(self.status(current=P(13, "02000", "01", "163", ()))['status'], "SECTION_IDENTITY_CHANGED")

    def test_different_programme(self):
        self.assertEqual(self.status(current=P(13, "01000", "01", "164", ()))['status'], "SECTION_IDENTITY_CHANGED")

    def test_missing_explicit_identity(self):
        self.assertEqual(self.status(current=P(13, "01000", None, "163", ()))['status'], "INSUFFICIENT_EXPLICIT_SECTION_IDENTITY")

    def test_boundary_rejected(self):
        self.assertEqual(self.status(current=P(13, "01000", "01", "163", (), True))['status'], "SECTION_BOUNDARY_REQUIRES_REVIEW")

    def test_nonadjacent(self):
        self.assertEqual(self.status(current=P(15, "01000", "01", "163", ()))['status'], "NO_ADJACENT_PRIOR_PAGE_EVIDENCE")

    def test_competing_current_heading(self):
        self.assertEqual(self.status(current=P(13, "01000", "01", "163", ("10006",)))['status'], "CURRENT_PAGE_HEADING_REQUIRES_ON_PAGE_CLASSIFIER")

    def test_prior_activity_mismatch(self):
        self.assertEqual(self.status(act="10001")['status'], "PREVIOUS_ACTIVITY_NOT_EXPECTED_ACTIVITY")

    def test_no_prior_activity(self):
        self.assertEqual(self.status(previous=P(12, "01000", "01", "163", ()))['status'], "NO_PRIOR_EXPLICIT_ACTIVITY_HEADING")

    def test_multiple_economic_matches(self):
        self.assertEqual(self.status(matches=2)['status'], "ECONOMIC_COLUMN_AMBIGUOUS_OR_MISSING")

    def test_zero_economic_matches(self):
        self.assertEqual(self.status(matches=0)['status'], "ECONOMIC_COLUMN_AMBIGUOUS_OR_MISSING")

    def test_programme_grain(self):
        self.assertEqual(self.status(grain="PROGRAMME")['status'], "PROGRAMME_SOURCE_RULE_REQUIRED")

    def test_aia_vote(self):
        self.assertEqual(self.status(grain="AIA_VOTE")['status'], "AIA_VOTE_SOURCE_RULE_REQUIRED")

    def test_unknown_grain(self):
        self.assertEqual(self.status(grain="UNKNOWN")['status'], "UNKNOWN_GRAIN_FAILED_CLOSED")


if __name__ == '__main__':
    unittest.main()
