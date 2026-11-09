import csv
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path
from se04_reconcile import FY2026_27, assess_csv, parse_integer_jmd

H = ['fact_id','source_id','fiscal_year','estimate_version','organisation_id',
     'economic_id','amount_jmd_normalized','currency','source_page','source_row',
     'import_batch_id','public_category_id','vote_id','measure_type']

def sample_rows():
    base={'source_id':FY2026_27.source_id,'fiscal_year':'2026/27','estimate_version':'AS_PASSED',
          'organisation_id':'ORG_01','economic_id':'ECON_21','currency':'JMD','source_page':'13',
          'source_row':'row 1','import_batch_id':'OFFLINE_SYNTHETIC',
          'public_category_id':'CAT_GOVERNANCE','vote_id':'VOTE_01'}
    return [dict(base, fact_id='FX1',measure_type='VOTED_ESTIMATE',amount_jmd_normalized='200'),
            dict(base,fact_id='FX2',measure_type='APPROPRIATIONS_IN_AID',
                 amount_jmd_normalized='-25',public_category_id='CAT_AIA_OFFSET')]

BASE = replace(FY2026_27,row_count=2,gross_jmd=200,aia_jmd=-25,net_jmd=175)

def report(rows,baseline=BASE,headers=H):
    with tempfile.TemporaryDirectory() as d:
        path=Path(d)/'offline.csv'
        with path.open('w',newline='',encoding='utf-8') as out:
            writer=csv.DictWriter(out,fieldnames=headers,extrasaction='ignore')
            writer.writeheader()
            writer.writerows(rows)
        return assess_csv(path,baseline)

class Validation(unittest.TestCase):
    def test_synthetic_fixtures_pass_no_release(self):
        r=report(sample_rows())
        self.assertEqual(r['status'],'QA_PASS_REVIEW_ONLY')
        self.assertFalse(r['source_pdf_extraction_tested'])

    def test_real_frozen_totals_are_pinned(self):
        self.assertEqual(FY2026_27.gross_jmd + FY2026_27.aia_jmd,FY2026_27.net_jmd)
        self.assertEqual(FY2026_27.row_count,2912)

    def test_duplicate_id_fails(self):
        rows=sample_rows()
        rows[1]['fact_id']='FX1'
        self.assertIn('MISSING_OR_DUPLICATE_FACT_ID',report(rows)['errors'])

    def test_missing_amount_not_zero_filled(self):
        rows=sample_rows()
        rows[1]['amount_jmd_normalized']=''
        self.assertIn('MISSING_AMOUNT',report(rows)['errors'])

    def test_wrong_source_fails(self):
        rows=sample_rows()
        rows[0]['source_id']='OTHER'
        self.assertIn('SOURCE_ID_MISMATCH',report(rows)['errors'])

    def test_wrong_year_fails(self):
        rows=sample_rows()
        rows[0]['fiscal_year']='2025/26'
        self.assertIn('FISCAL_YEAR_MISMATCH',report(rows)['errors'])

    def test_positive_aia_fails(self):
        rows=sample_rows()
        rows[1]['amount_jmd_normalized']='25'
        self.assertIn('AIA_NOT_NEGATIVE',report(rows)['errors'])

    def test_aia_public_category_must_remain_offset(self):
        rows=sample_rows()
        rows[1]['public_category_id']='CAT_HEALTH'
        self.assertIn('AIA_CATEGORY_NOT_OFFSET',report(rows)['errors'])

    def test_non_aia_negative_fails(self):
        rows=sample_rows()
        rows[0]['amount_jmd_normalized']='-200'
        self.assertIn('UNEXPECTED_NEGATIVE_GROSS',report(rows)['errors'])

    def test_amount_rejects_fractional_or_nan(self):
        for value in ('0.01','NaN','Infinity',''):
            with self.subTest(value=value),self.assertRaises(ValueError):
                parse_integer_jmd(value)

    def test_amount_accepts_comma_format(self):
        self.assertEqual(parse_integer_jmd('1,490,511,399,000'),1490511399000)

    def test_missing_column_fails(self):
        self.assertIn('MISSING_HEADER:vote_id',report(sample_rows(),
            headers=[x for x in H if x!='vote_id'])['errors'])

    def test_wrong_total_fails(self):
        self.assertIn('NET_MISMATCH',report(sample_rows(),
            baseline=replace(BASE,net_jmd=176))['errors'])

    def test_not_as_passed_fails(self):
        rows=sample_rows()
        rows[0]['estimate_version']='AS_PRESENTED'
        self.assertIn('NOT_AS_PASSED',report(rows)['errors'])

if __name__=='__main__':
    unittest.main()
