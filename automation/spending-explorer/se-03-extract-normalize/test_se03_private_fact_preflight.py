import csv
import json
import tempfile
import unittest
from pathlib import Path
from se03_private_fact_preflight import EXPECTED_COLS, SOURCE_SHA, inspect

class TestSourceGate(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        d=Path(self.temp.name)
        self.report=d/'inventory.json'; self.csv=d/'fact.csv'
        self.pages=[{'physical_page':n,'explicit':{'head':['15000C'] if n==1 else ['15000'], 'budget':['6'] if n==1 else ['1'], 'project':['29532'] if n==1 else [], 'activity':['10001'] if n==2 else []},'multiple_section_headings':[],'head_budget_conflicts':[]} for n in range(1,717)]
        self.report.write_text(json.dumps({'source_pdf_sha256':SOURCE_SHA,'page_inventory':self.pages}))
        self.row={k:'' for k in EXPECTED_COLS}
        self.row.update(fact_id='FACT01',source_id='SRC_EOE_2026_27_PASSED',estimate_version='AS_PASSED',fiscal_year='2026/27',source_page='1',budget_number='6',budget_type='CAPITAL',vote_id='VOTE_15000C',source_row='Activity 29532; economic 25; VOTED_ESTIMATE',measure_type='VOTED_ESTIMATE',economic_id='ECON_25',amount_jmd_normalized='891,664,000')
    def write(self, rows):
        with self.csv.open('w',newline='') as f:
            wr=csv.DictWriter(f,fieldnames=EXPECTED_COLS);wr.writeheader();wr.writerows(rows)
    def test_capital_project_not_activity_acceptance(self):
        self.write([self.row]);r=inspect(self.csv,self.report)
        self.assertEqual(r['review_required_status_counts']['EXPLICIT_ON_PAGE_CODE_ECON_AMOUNT_NOT_VERIFIED'],1)
        self.assertFalse(r['publication_authorized'])
        self.assertEqual(r['fatal_error_count'],4) # count mismatch only
    def test_missing_capital_head_review(self):
        self.pages[0]['explicit']['head']=[]
        self.report.write_text(json.dumps({'source_pdf_sha256':SOURCE_SHA,'page_inventory':self.pages}))
        self.write([self.row]);r=inspect(self.csv,self.report)
        self.assertEqual(r['review_required_status_counts']['PAGE_VOTE_HEAD_REVIEW_REQUIRED'],1)
    def test_budget_suffix_conflict(self):
        self.row['vote_id']='VOTE_15000';self.write([self.row]);r=inspect(self.csv,self.report)
        self.assertTrue(any('VOTE_BUDGET_SUFFIX_CONFLICT' in x for x in r['fatal_errors_first_40']))
    def test_wrong_source_failed(self):
        self.row['source_id']='SRC_OTHER';self.write([self.row]);r=inspect(self.csv,self.report)
        self.assertTrue(any('WRONG_SOURCE_ID' in x for x in r['fatal_errors_first_40']))
    def test_untrusted_pdf_digest_rejected(self):
        self.report.write_text(json.dumps({'source_pdf_sha256':'bad','page_inventory':self.pages}))
        self.write([self.row]);
        with self.assertRaisesRegex(ValueError,'PINNED_PAGE_INVENTORY'):inspect(self.csv,self.report)
    def test_duplicate_ids_rejected(self):
        self.write([self.row,self.row]);r=inspect(self.csv,self.report)
        self.assertTrue(any('DUPLICATE_FACT_ID' in x for x in r['fatal_errors_first_40']))
    def test_aia_not_positive(self):
        self.row.update(source_page='2',budget_number='1',budget_type='RECURRENT',vote_id='VOTE_15000',source_row='Vote 15000; economic AIA; APPROPRIATIONS_IN_AID',measure_type='APPROPRIATIONS_IN_AID',amount_jmd_normalized='10,000')
        self.write([self.row]);r=inspect(self.csv,self.report)
        self.assertTrue(any('AIA_NOT_NEGATIVE' in x for x in r['fatal_errors_first_40']))
    def test_wrong_header_rejected(self):
        with self.csv.open('w',newline='') as f:
            wr=csv.DictWriter(f,fieldnames=EXPECTED_COLS[:-1]);wr.writeheader()
        with self.assertRaisesRegex(ValueError,'EXACT_33_COLUMN'):inspect(self.csv,self.report)
    def test_nonfinite_amount_rejected(self):
        self.row['amount_jmd_normalized']='NaN';self.write([self.row]);r=inspect(self.csv,self.report)
        self.assertTrue(any('INVALID_FINANCIAL_AMOUNT' in x for x in r['fatal_errors_first_40']))
    def test_no_pdf_amount_acceptance(self):
        self.write([self.row]);r=inspect(self.csv,self.report)
        self.assertFalse(r['source_economic_amounts_independently_matched'])
        self.assertFalse(r['full_2912_row_source_reconstruction_accepted'])

if __name__=='__main__': unittest.main()
