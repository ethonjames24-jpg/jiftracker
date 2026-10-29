import unittest
from se03_pdf_economic_review import classify


def row(**kw):
    base = {"measure_type":"VOTED_ESTIMATE", "source_row":"Activity 10001; economic 21; VOTED_ESTIMATE", "budget_number":"1", "vote_id":"VOTE_01000"}
    base.update(kw)
    return base


def page(**kw):
    base={"multiple_section_headings":[], "head_budget_conflicts":[],
          "explicit":{"head":["01000"],"budget":["1"],"activity":["10001"],"project":[]}}
    base.update(kw)
    return base

class EconomicReviewSafetyTests(unittest.TestCase):
    def test_unique_is_candidate_only(self):
        self.assertEqual(classify(row(),page(),1),"UNIQUE_ECONOMIC_CELL_CANDIDATE_REVIEW_ONLY")
    def test_no_cell_is_not_a_false_canonical_acceptance(self):
        self.assertEqual(classify(row(),page(),0),"ECONOMIC_CELL_NOT_FOUND_BY_BOUNDING_BOX")
    def test_many_cells_stay_ambiguous(self):
        self.assertEqual(classify(row(),page(),2),"ECONOMIC_CELL_MULTIPLE_CANDIDATES")
    def test_capital_project_identity(self):
        r=row(budget_number="6",vote_id="VOTE_15000C",source_row="Activity 29532; economic 25; VOTED_ESTIMATE")
        p=page(explicit={"head":["15000C"],"budget":["6"],"activity":[],"project":["29532"]})
        self.assertEqual(classify(r,p,1),"UNIQUE_ECONOMIC_CELL_CANDIDATE_REVIEW_ONLY")
    def test_capital_project_not_accepted_as_recurrent_activity(self):
        r=row(budget_number="6",vote_id="VOTE_15000C",source_row="Activity 29532; economic 25; VOTED_ESTIMATE")
        p=page(explicit={"head":["15000C"],"budget":["6"],"activity":["29532"],"project":[]})
        self.assertEqual(classify(r,p,1),"ACTIVITY_OR_PROJECT_SCOPE_REVIEW_REQUIRED")
    def test_multi_section_defers_even_with_unique_amount(self):
        self.assertEqual(classify(row(),page(multiple_section_headings=["subprogramme"]),1),"MULTI_SECTION_CONTEXT_REVIEW_REQUIRED")
    def test_inconsistent_head_is_blocker(self):
        self.assertEqual(classify(row(),page(explicit={"head":["02000"],"budget":["1"],"activity":["10001"]}),1),"HEAD_SCOPE_REVIEW_REQUIRED")
    def test_programme_has_own_method(self):
        self.assertEqual(classify(row(source_row="Programme 001; economic 21; VOTED_ESTIMATE"),page(),1),"PROGRAMME_GRAIN_METHOD_REQUIRED")
    def test_aia_has_own_method(self):
        self.assertEqual(classify(row(measure_type="APPROPRIATIONS_IN_AID",source_row="Vote 01000; economic AIA; APPROPRIATIONS_IN_AID"),page(),1),"AIA_VOTE_METHOD_REQUIRED")
    def test_unrecognized_grammar_fails_closed(self):
        self.assertEqual(classify(row(source_row="Activity 10001 economic 21"),page(),1),"SOURCE_ROW_GRAMMAR_REVIEW_REQUIRED")

if __name__=='__main__':unittest.main()
