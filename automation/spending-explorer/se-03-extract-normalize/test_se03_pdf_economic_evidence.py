import tempfile
import unittest
from pathlib import Path
from se03_pdf_economic_evidence import (classify_activity_candidates,evidence,PINNED_PDF_SHA256)

class EvidenceProof(unittest.TestCase):
    def test_source_sha_pinned(self):
        self.assertEqual(len(PINNED_PDF_SHA256),64)
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'wrong.pdf'
            p.write_bytes(b'not source')
            with self.assertRaisesRegex(ValueError,'SOURCE_PDF_SHA256_MISMATCH'):
                evidence(p,p)
    def test_disambiguate_summary_from_activity_line(self):
        self.assertEqual(classify_activity_candidates([337.5,585.8],[(479.3,'10001')],
                         'Activity 10001; economic 21; AUTHORIZED_BY_LAW'),
                         'SINGLE_ACTIVITY_SCOPED_PDF_COLUMN_CANDIDATE')
    def test_wrong_activity_never_substituted(self):
        self.assertEqual(classify_activity_candidates([585.8],[(479.3,'10005')],
                         'Activity 10001; economic 21; AUTHORIZED_BY_LAW'),
                         'NO_MATCHING_ACTIVITY_SCOPE_ON_SOURCE_PAGE')
    def test_missing_on_page_context_remains_review(self):
        self.assertEqual(classify_activity_candidates([585.8],[],
                         'Activity 10001; economic 21; AUTHORIZED_BY_LAW'),
                         'NO_ACTIVITY_HEADING_ON_SOURCE_PAGE')
    def test_programme_grain_requires_other_rule(self):
        self.assertEqual(classify_activity_candidates([585.8],[(479.3,'10001')],
                         'Programme 001; economic 21; VOTED_ESTIMATE'),
                         'NON_ACTIVITY_GRAIN_REQUIRES_SEPARATE_SOURCE_RULE')
    def test_multiple_matches_not_automatically_accepted(self):
        self.assertEqual(classify_activity_candidates([585.8,589],[(479.3,'10001')],
                         'Activity 10001; economic 21; AUTHORIZED_BY_LAW'),
                         'AMBIGUOUS_ACTIVITY_SCOPED_PDF_COLUMN_CANDIDATES')
    def test_no_economic_match_not_fabricated(self):
        self.assertEqual(classify_activity_candidates([],[(479.3,'10001')],
                         'Activity 10001; economic 21; AUTHORIZED_BY_LAW'),
                         'NO_PDF_ECONOMIC_COLUMN_CANDIDATE')

if __name__=='__main__':unittest.main()
