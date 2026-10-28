#!/usr/bin/env bash
set -euo pipefail
umask 077
SRC_COMMIT="759568c36bef906fea66feacee603494db43ebd6"
PDF="${JIF_SE03_PDF:-$HOME/Downloads/JIF_SE03_2026-27_As_Passed.pdf}"
WORK="$HOME/Downloads/JIF_SE03_PDF_Page_Review_20261028"
mkdir -p "$WORK"
if [[ -x "$WORK/.venv/bin/python3" ]]; then
  export PATH="$WORK/.venv/bin:$PATH"
fi
RAW="https://raw.githubusercontent.com/ethonjames24-jpg/jiftracker/$SRC_COMMIT/automation/spending-explorer/se-03-extract-normalize"
for file in se03_pdf_page_inventory.py test_se03_pdf_page_inventory.py se03_pdf_continuation_review.py; do
    curl --fail --silent --show-error --location --retry 2 --max-time 120 "$RAW/$file" -o "$WORK/$file"
done
python3 - "$WORK" <<'PY_PINS'
from pathlib import Path
import hashlib, sys
base=Path(sys.argv[1])
pins={
'se03_pdf_page_inventory.py':'c36c95ea80f5ebf143573cb95b87bd0357616f6a',
'test_se03_pdf_page_inventory.py':'d17b04e2eb83e73dcab287db7070634b7ae72a72',
'se03_pdf_continuation_review.py':'ffc8aa923928a89b1cd19373581def5b035d11f2'}
for name,pin in pins.items():
    b=(base/name).read_bytes()
    ident=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\x00'+b).hexdigest()
    if ident!=pin: raise SystemExit('GITHUB_BLOB_MISMATCH '+name)
    print('SOURCE_GIT_BLOB=PASS',name,ident)
print('SOURCE_CHECKOUT_IDENTITY=PASS')
PY_PINS
(cd "$WORK" && python3 -m unittest -v test_se03_pdf_page_inventory)
if [[ ! -f "$PDF" ]]; then
  echo "SOURCE_PDF_NOT_PRESENT=$PDF"
  curl --fail --location --show-error --retry 2 --max-time 300     'https://www.mof.gov.jm/wp-content/uploads/2026-2027-Estimates-of-Expenditure-As-Passed.pdf'     -o "$PDF.partial"
  mv "$PDF.partial" "$PDF"
fi
python3 - "$PDF" <<'PY_SHA'
from pathlib import Path
import hashlib,sys
b=Path(sys.argv[1]).read_bytes()
s=hashlib.sha256(b).hexdigest()
if len(b)!=23172267 or s!='32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6':
    raise SystemExit('FAILED_CLOSED_PDF_IDENTITY bytes=%d hash=%s'%(len(b),s))
print('SOURCE_AS_PASSED_PDF_IDENTITY=PASS',len(b),s)
PY_SHA
python3 -c 'import fitz; print("PYMUPDF=AVAILABLE")'
OUT="$WORK/se03_pdf_page_inventory_capital_v2_review_only.json"
python3 "$WORK/se03_pdf_page_inventory.py" "$PDF" --output-json "$OUT"
python3 - "$OUT" <<'PY_AUDIT'
from pathlib import Path
import json,sys
source=Path(sys.argv[1]);data=json.loads(source.read_text())
pages=data['page_inventory']
if len(pages)!=716 or [p['physical_page'] for p in pages]!=list(range(1,717)):
    raise SystemExit('FAILED_CLOSED_PAGE_NUMBER_COVERAGE')
capital=[p for p in pages if p['explicit']['budget']==['6']]
with_c=[p for p in capital if len(p['explicit']['head'])==1 and p['explicit']['head'][0].upper().endswith('C')]
missing=[p['physical_page'] for p in capital if not p['explicit']['head']]
conflicts=[p['physical_page'] for p in pages if p.get('head_budget_conflicts')]
result={
'result':'CAPITAL_HEAD_DETECTION_REVIEW_ONLY',
'physical_pages':716,'budget6_pages':len(capital),
'budget6_pages_with_explicit_c_head':len(with_c),
'budget6_pages_without_explicit_head':len(missing),
'headless_capital_page_examples':missing[:30],
'head_budget_conflict_pages':conflicts,
'distinct_capital_head_codes':sorted({p['explicit']['head'][0] for p in with_c}),
'fact_queue_executed':False,'canonical_2912_fact_rows_accepted':False,
'publication_authorized':False}
dest=source.with_name('se03_capital_head_v2_audit_summary.json')
dest.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
print(json.dumps(result,indent=2,sort_keys=True))
print('AUDIT_REPORT='+str(dest))
if not capital or not with_c: raise SystemExit('FAILED_CLOSED_NO_CAPITAL_HEAD_DETECTED')
print('CAPITAL_HEAD_SUFFIX_DETECTION=OBSERVED_REVIEW_ONLY')
PY_AUDIT
echo "REVIEW_REPORT=$OUT"
echo 'FACT_QUEUE_NOT_EXECUTED=TRUE'
echo 'SE03_PDF_CAPITAL_HEAD_V2=PASS_REVIEW_ONLY'
echo 'FULL_SOURCE_DERIVED_2912_ROW_RECONSTRUCTION=NOT_ACCEPTED'
echo 'PRODUCTION_RELEASE=NO_GO'
