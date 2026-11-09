#!/usr/bin/env bash
# SE-03 review-only pinned As Passed PDF evidence pass. No private upload or publication.
set -euo pipefail
umask 077
SRC_COMMIT="e1364db149bc0ff3d6d28b44c6e2aff70be2feaa"
PDF="${JIF_SE03_PDF:-$HOME/Downloads/JIF_SE03_2026-27_As_Passed.pdf}"
WORK="$HOME/Downloads/JIF_SE03_PDF_Page_Review_20261028"
mkdir -p "$WORK"
RAW="https://raw.githubusercontent.com/ethonjames24-jpg/jiftracker/$SRC_COMMIT/automation/spending-explorer/se-03-extract-normalize"
for file in se03_pdf_page_inventory.py test_se03_pdf_page_inventory.py se03_pdf_continuation_review.py; do
    curl --fail --silent --show-error --location --retry 2 --max-time 120 "$RAW/$file" -o "$WORK/$file"
done
python3 - "$WORK" <<'PY'
import hashlib, sys
from pathlib import Path
base = Path(sys.argv[1])
expected = {
    'se03_pdf_page_inventory.py': '115310bb04a2408c0faa089c8f785258d2af6f2c',
    'test_se03_pdf_page_inventory.py': 'ea36d52498ad7fd7445d85d91dd6441d6c326b8e',
    'se03_pdf_continuation_review.py': 'ffc8aa923928a89b1cd19373581def5b035d11f2',
}
for name, pin in expected.items():
    blob = (base/name).read_bytes()
    got = hashlib.sha1(b'blob ' + str(len(blob)).encode() + b'\x00' + blob).hexdigest()
    if got != pin:
        raise SystemExit('FAILED_CLOSED_REMOTE_GIT_BLOB ' + name + ' ' + got)
    print('SOURCE_GIT_BLOB=PASS', name, got)
print('SOURCE_CHECKOUT_IDENTITY=PASS')
PY
(cd "$WORK" && python3 -m unittest -v test_se03_pdf_page_inventory)
if [[ ! -f "$PDF" ]]; then
  echo "SOURCE_PDF_NOT_PRESENT=$PDF"
  echo "Downloading public Ministry of Finance As Passed PDF into an isolated review path."
  curl --fail --location --show-error --retry 2 --max-time 300 \
    'https://www.mof.gov.jm/wp-content/uploads/2026-2027-Estimates-of-Expenditure-As-Passed.pdf' \
    -o "$PDF.partial"
  mv "$PDF.partial" "$PDF"
fi
python3 - "$PDF" <<'PY'
import hashlib,sys
from pathlib import Path
p=Path(sys.argv[1])
raw=p.read_bytes()
hash=hashlib.sha256(raw).hexdigest()
expected='32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6'
if hash!=expected or len(raw)!=23172267:
    raise SystemExit('FAILED_CLOSED_PDF_IDENTITY bytes=%d sha256=%s' % (len(raw),hash))
print('SOURCE_AS_PASSED_PDF_IDENTITY=PASS')
print('SOURCE_PDF_BYTES=',len(raw))
print('SOURCE_PDF_SHA256=',hash)
PY
python3 -c 'import fitz; print("PYMUPDF=AVAILABLE")' || { echo 'PYMUPDF_MISSING: see review README'; exit 2; }
OUT="$WORK/se03_pdf_page_inventory_review_only.json"
if [[ -n "${JIF_SE03_FACT_CSV:-}" ]]; then
  python3 "$WORK/se03_pdf_page_inventory.py" "$PDF" --private-fact-csv "$JIF_SE03_FACT_CSV" --output-json "$OUT"
else
  python3 "$WORK/se03_pdf_page_inventory.py" "$PDF" --output-json "$OUT"
  echo 'FACT_CSV_NOT_PROVIDED: produced page inventory only; 112 continuation cases NOT evaluated.'
  echo 'To add a private FACT review queue, set JIF_SE03_FACT_CSV to your existing local export path.'
fi
printf 'REVIEW_REPORT=%s\n' "$OUT"
echo 'SE03_PDF_PAGE_INVENTORY=PASS_REVIEW_ONLY'
echo 'SE03_CANONICAL_2912_FACT_RECONSTRUCTION=NOT_ACCEPTED'
echo 'PRODUCTION_RELEASE=NO_GO'
