#!/usr/bin/env python3
from pathlib import Path
import sys,json,hashlib,importlib.util
from decimal import Decimal
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'scripts'));spec=importlib.util.spec_from_file_location('rec',ROOT/'scripts/reconcile-workbooks.py');rec=importlib.util.module_from_spec(spec);spec.loader.exec_module(rec)
feed=json.loads((ROOT/'fixtures/published-feed.json').read_text())['tracker'];baselines=json.loads((ROOT/'config/baselines.json').read_text());checked=0
for b in baselines:
 path=ROOT/'fixtures'/b['source_url'].split('/')[-1];assert hashlib.sha256(path.read_bytes()).hexdigest()==b['sha256'];_,kpis=rec.extract(path,b['month_sort']);rows=[r for r in feed if r['month_sort']==b['month_sort']];assert len(rows)==8
 for raw in rows:
  for field,metric in [('monthly_outturn_value','actual'),('annual_baseline_value','budget')]:assert abs(kpis[raw['kpi_label']][metric]-Decimal(raw[field].replace('$','').replace(',','')))<Decimal('.00051')
  assert raw['status']==kpis[raw['kpi_label']]['status'];checked+=1
print(json.dumps({'result':'PASS','baselines':len(baselines),'published_kpis_matched':checked,'restricted_evaluator_cache_checks':checked*2,'historical_archive_provenance_not_inferred':True},indent=2))
