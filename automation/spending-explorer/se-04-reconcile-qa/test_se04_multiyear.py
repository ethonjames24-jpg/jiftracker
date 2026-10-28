import csv
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path
from se04_multiyear import BASELINES, MEASURES, exact_integer, validate

HEAD = ['fact_id','source_id','fiscal_year','measure_type','estimate_version',
        'period_type','organisation_id','economic_id','vote_id',
        'amount_jmd_normalized','currency','source_page','source_row',
        'import_batch_id','public_category_id','is_actual','is_budget','activity_id','subprogramme_id']

B = {'2025/26': replace(BASELINES['2025/26'], rows=3, statutory_rows=1,
                         voted_rows=1, aia_rows=1,gross=300,aia=-20,net=280),
     '2026/27': replace(BASELINES['2026/27'], rows=3, statutory_rows=1,
                         voted_rows=1,aia_rows=1,gross=300,aia=-20,net=280)}

def fixture():
    out=[]
    for year in ('2025/26','2026/27'):
        for i,(m,amt) in enumerate(zip(MEASURES,[100,200,-20])):
            out.append(dict(fact_id=f'{year}-{i}',source_id=B[year].source_id,
                            fiscal_year=year,measure_type=m,estimate_version='AS_PASSED',
                            period_type='ANNUAL',organisation_id='ORG1',economic_id='E21',
                            vote_id='V1',amount_jmd_normalized=str(amt),currency='JMD',
                            source_page='13' if m!='APPROPRIATIONS_IN_AID' else '',
                            source_row='row',import_batch_id='TEST',
                            public_category_id='CAT_AIA_OFFSET' if m=='APPROPRIATIONS_IN_AID' else 'CAT_GOVERNANCE',
                            is_actual='FALSE',is_budget='TRUE',activity_id='' if m=='APPROPRIATIONS_IN_AID' else 'A1',
                            subprogramme_id='' if m=='APPROPRIATIONS_IN_AID' else 'S1'))
    return out

def assess(rows, years=('2025/26','2026/27'), fields=HEAD):
    with tempfile.TemporaryDirectory() as d:
        p=Path(d)/'facts.csv'
        with p.open('w',encoding='utf-8',newline='') as f:
            w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore')
            w.writeheader();w.writerows(rows)
        return validate(p,years,B)

class Tests(unittest.TestCase):
    def test_two_year_pass(self):
        r=assess(fixture());self.assertEqual(r['result'],'QA_PASS_REVIEW_ONLY');self.assertFalse(r['release_authorized'])
    def test_blank_aia_source_page_allowed(self):
        self.assertEqual(assess(fixture())['years']['2025/26']['blank_aia_source_pages'],1)
    def test_blank_aia_activity_allowed(self):
        self.assertEqual(assess(fixture())['years']['2026/27']['blank_activity_rows_in_mixed_grain'],1)
    def test_bad_non_aia_source_page(self):
        rows=fixture();rows[0]['source_page']='';self.assertIn('MISSING_SOURCE_PAGE_NON_AIA',assess(rows)['errors'])
    def test_mixed_year_export_required(self):
        self.assertIn('2025/26:ROW_COUNT_MISMATCH',assess(fixture()[3:])['errors'])
    def test_single_year_explicit(self):
        self.assertEqual(assess(fixture()[3:],('2026/27',))['result'],'QA_PASS_REVIEW_ONLY')
    def test_wrong_year_rejected(self):
        rows=fixture();rows[0]['fiscal_year']='2024/25';self.assertIn('UNEXPECTED_FISCAL_YEAR',assess(rows)['errors'])
    def test_wrong_source_rejected(self):
        rows=fixture();rows[0]['source_id']='bad';self.assertIn('SOURCE_ID_MISMATCH',assess(rows)['errors'])
    def test_bad_aia_sign(self):
        rows=fixture();rows[2]['amount_jmd_normalized']='20';self.assertIn('AIA_SIGN_NOT_NEGATIVE',assess(rows)['errors'])
    def test_misclassified_aia(self):
        rows=fixture();rows[2]['public_category_id']='CAT_OTHER';self.assertIn('AIA_CATEGORY_INVALID',assess(rows)['errors'])
    def test_duplicate_cross_year_ids(self):
        rows=fixture();rows[-1]['fact_id']=rows[0]['fact_id'];self.assertIn('MISSING_OR_DUPLICATE_FACT_ID',assess(rows)['errors'])
    def test_missing_lineage(self):
        rows=fixture();rows[0]['source_row']='';self.assertIn('MISSING_LINEAGE:source_row',assess(rows)['errors'])
    def test_not_as_passed(self):
        rows=fixture();rows[0]['estimate_version']='AS_PRESENTED';self.assertIn('SOURCE_NOT_AS_PASSED',assess(rows)['errors'])
    def test_wrong_actual_budget_flags(self):
        rows=fixture();rows[0]['is_actual']='TRUE';rows[0]['is_budget']='FALSE'
        self.assertIn('ACTUALS_FLAG_INVALID',assess(rows)['errors']);self.assertIn('BUDGET_FLAG_INVALID',assess(rows)['errors'])
    def test_missing_header(self):
        self.assertIn('MISSING_HEADER:vote_id',assess(fixture(),fields=[x for x in HEAD if x!='vote_id'])['errors'])
    def test_exact_decimal(self):
        for x in ('','NaN','Infinity','0.1'):
            with self.assertRaises(ValueError): exact_integer(x)
        self.assertEqual(exact_integer('1,000'),1000)
    def test_wrong_count(self):
        self.assertIn('2026/27:ROW_COUNT_MISMATCH',assess(fixture()[:-1])['errors'])
    def test_wrong_net(self):
        rows=fixture();rows[0]['amount_jmd_normalized']='101'
        self.assertIn('2025/26:NET_MISMATCH',assess(rows)['errors'])

if __name__=='__main__':
    unittest.main()
