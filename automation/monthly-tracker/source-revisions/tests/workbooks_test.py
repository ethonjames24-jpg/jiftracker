import unittest,importlib.util,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'scripts'))
spec=importlib.util.spec_from_file_location('rec',ROOT/'scripts/reconcile-workbooks.py');rec=importlib.util.module_from_spec(spec);spec.loader.exec_module(rec)
class WorkbookCases(unittest.TestCase):
 def check_month(self,month,old,new,changes,amounts):
  r=rec.reconcile(ROOT/'fixtures'/old,ROOT/'fixtures'/new,month);self.assertEqual(len(r['literal_changes']),changes);self.assertEqual(r['amount_changed_rows'],amounts);self.assertEqual(r['status_changed_rows'],0);self.assertEqual(r['cache_input_checks'],32);return r
 def test_april_actual_revision(self):self.check_month('2026-04','Copy-of-CGO-April-2026.xlsx','Copy-of-CGO-April-2026-1.xlsx',1,2)
 def test_may_formula_repairs(self):self.check_month('2026-05','Copy-of-CGO-May-2026-Revised.xlsx','Copy-of-CGO-May-2026_.xlsx',5,0)
 def test_june_budget_flip(self):
  r=self.check_month('2026-06','Copy-of-CGO-June-2026.xlsx','Copy-of-CGO-June-2026-1.xlsx',1,2);f=next(k for k in r['kpis'] if k['kpi']=='Fiscal Balance');self.assertGreater(f['original']['budget'],0);self.assertLess(f['candidate']['budget'],0)
 def test_wrong_month_rejected(self):
  with self.assertRaises(AssertionError):rec.extract(ROOT/'fixtures/Copy-of-CGO-June-2026.xlsx','2026-07')
if __name__=='__main__':unittest.main()
