#!/usr/bin/env bash
# JIF SE-03: immutable-source read-only economic-cell candidate scan.
set -euo pipefail
umask 077
WORK="$HOME/Downloads/JIF_SE03_PDF_Page_Review_20261028"
mkdir -p "$WORK"
PIN_COMMIT="ff1f8c5b51b5224d466e3fdfdffb5c4bbccf7d77"
RAW="https://raw.githubusercontent.com/ethonjames24-jpg/jiftracker/$PIN_COMMIT/automation/spending-explorer/se-03-extract-normalize"
for file in se03_private_fact_preflight.py se03_pdf_page_inventory.py se03_pdf_continuation_review.py se03_pdf_economic_review.py test_se03_private_fact_preflight.py test_se03_pdf_page_inventory.py test_se03_pdf_economic_review.py; do
  if ! curl --fail --location --silent --show-error --retry 2 --max-time 90 "$RAW/$file" -o "$WORK/$file"; then
    echo "FAILED_CLOSED_PINNED_CODE_FETCH file=$file commit=$PIN_COMMIT" >&2
    exit 2
  fi
done
python3 - "$WORK" <<'PY_PINS'
import hashlib,sys
from pathlib import Path
d=Path(sys.argv[1])
pins={
"se03_private_fact_preflight.py":"7cf3a77bb58ecada94e8a402dc07f8708a01ab16",
"se03_pdf_page_inventory.py":"c36c95ea80f5ebf143573cb95b87bd0357616f6a",
"se03_pdf_continuation_review.py":"ffc8aa923928a89b1cd19373581def5b035d11f2",
"se03_pdf_economic_review.py":"9196d3890dd23730ac796b4595a6073c056e2a83",
"test_se03_private_fact_preflight.py":"1af6934e64f24412d5e49ef3e3534b0a094971fe",
"test_se03_pdf_page_inventory.py":"d17b04e2eb83e73dcab287db7070634b7ae72a72",
"test_se03_pdf_economic_review.py":"8bf8682dd192c041b3debf31cbf688f6c6f27c11"}
for name,pin in pins.items():
    blob=(d/name).read_bytes()
    ident=hashlib.sha1(b"blob "+str(len(blob)).encode()+b"\x00"+blob).hexdigest()
    if ident != pin: raise SystemExit("FAILED_CLOSED_GITHUB_BLOB_MISMATCH: "+name)
    print("PINNED_GIT_BLOB=PASS",name)
print("PINNED_REMOTE_CODE_IDENTITY=PASS 7/7")
PY_PINS
PYTHON="$WORK/.venv/bin/python3"
if [[ ! -x "$PYTHON" ]]; then
  PYTHON="python3"
fi
(cd "$WORK" && "$PYTHON" -m unittest -q test_se03_private_fact_preflight test_se03_pdf_page_inventory test_se03_pdf_economic_review)
FACT_CSV="${JIF_SE03_FACT_CSV:-}"
if [[ -z "$FACT_CSV" ]]; then
  shopt -s nullglob
  candidates=("$HOME"/Downloads/*FACT_Government_Spending*.csv)
  if (( ${#candidates[@]} != 1 )); then
    echo "FAILED_CLOSED_PRIVATE_FACT_CSV_MISSING_OR_AMBIGUOUS"
    echo 'Set JIF_SE03_FACT_CSV to the exact private file path and rerun.'
    exit 2
  fi
  FACT_CSV="${candidates[0]}"
fi
if [[ ! -f "$FACT_CSV" ]]; then
  echo "FAILED_CLOSED_PRIVATE_FACT_CSV_NOT_FOUND"
  exit 2
fi
PDF="${JIF_SE03_PDF:-$HOME/Downloads/JIF_SE03_2026-27_As_Passed.pdf}"
INV="$WORK/se03_pdf_page_inventory_capital_v2_review_only.json"
if [[ ! -f "$PDF" || ! -f "$INV" ]]; then
  echo "FAILED_CLOSED_MISSING_PINNED_PDF_OR_CAPITAL_V2_PAGE_INVENTORY"
  exit 2
fi
"$PYTHON" - "$FACT_CSV" <<'PY_ID'
from pathlib import Path
import hashlib,sys
sha=hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest()
if sha != "8ea4d7ac2b94eb5c8f5831da4b4a989e495e172e23dc6dc5269e6e55555c234c":
    raise SystemExit("FAILED_CLOSED_PRIVATE_FACT_EXPORT_CHANGED_FROM_ACCEPTED_PREFLIGHT")
print("PRIVATE_FACT_EXPORT_SHA256=PASS",sha)
PY_ID
"$PYTHON" "$WORK/se03_pdf_economic_review.py" \
  --pdf "$PDF" --fact-csv "$FACT_CSV" --inventory-json "$INV" \
  --report "$WORK/se03_pdf_economic_candidates_review_only.json"
echo "SE03_ECONOMIC_CANDIDATES=REVIEW_ONLY"
echo "PRIVATE_FINANCIAL_ROWS_UPLOADED=NO"
echo "CANONICAL_2912_SOURCE_ROWS_ACCEPTED=NO"
echo "PRODUCTION_RELEASE=NO_GO"
