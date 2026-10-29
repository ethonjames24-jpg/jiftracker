#!/usr/bin/env bash
# JIF SE-03 exact-code, local-only private FACT preflight. No network upload.
set -euo pipefail
umask 077
WORK="$HOME/Downloads/JIF_SE03_PDF_Page_Review_20261028"
mkdir -p "$WORK"
PIN_COMMIT="837ada320e2f54835d2ba66f8656e1acb5a21f16"
RAW="https://raw.githubusercontent.com/ethonjames24-jpg/jiftracker/$PIN_COMMIT/automation/spending-explorer/se-03-extract-normalize"
for file in se03_private_fact_preflight.py test_se03_private_fact_preflight.py; do
  if ! curl --fail --location --silent --show-error --retry 2 --max-time 90 "$RAW/$file" -o "$WORK/$file"; then
    echo "FAILED_CLOSED_PINNED_SOURCE_FETCH file=$file commit=$PIN_COMMIT" >&2
    exit 2
  fi
done
python3 - "$WORK" <<'PY'
import hashlib,sys
from pathlib import Path
root=Path(sys.argv[1])
pins={"se03_private_fact_preflight.py":"7cf3a77bb58ecada94e8a402dc07f8708a01ab16",
      "test_se03_private_fact_preflight.py":"1af6934e64f24412d5e49ef3e3534b0a094971fe"}
for name,expected in pins.items():
    b=(root/name).read_bytes()
    got=hashlib.sha1(b"blob "+str(len(b)).encode()+b"\x00"+b).hexdigest()
    if got!=expected: raise SystemExit("FAILED_CLOSED_GIT_BLOB_"+name+" "+got)
    print("GITHUB_SOURCE_BLOB=PASS",name,got)
print("PINNED_REMOTE_CODE_IDENTITY=PASS")
PY
(cd "$WORK" && python3 -m unittest -v test_se03_private_fact_preflight)
INV="$WORK/se03_pdf_page_inventory_capital_v2_review_only.json"
if [[ ! -f "$INV" ]]; then
  echo "FAILED_CLOSED_MISSING_SOURCE_PINNED_CAPITAL_V2_PAGE_INVENTORY=$INV"
  exit 2
fi
if [[ -z "${JIF_SE03_FACT_CSV:-}" ]]; then
  shopt -s nullglob
  candidates=( "$HOME"/Downloads/*FACT_Government_Spending*.csv )
  if (( ${#candidates[@]} == 1 )); then
    FACT_CSV="${candidates[0]}"
  else
    echo "PRIVATE_FACT_EXPORT_NOT_FOUND_OR_AMBIGUOUS"
    echo "Export only Google Sheet FACT_Government_Spending as CSV to Downloads."
    echo 'Then run: JIF_SE03_FACT_CSV="$HOME/Downloads/<actual filename>.csv" bash "$HOME/Downloads/jif_se03_fact_preflight_20261028.sh"'
    exit 2
  fi
else
  FACT_CSV="$JIF_SE03_FACT_CSV"
fi
if [[ ! -f "$FACT_CSV" ]]; then
  echo "FAILED_CLOSED_NO_PRIVATE_FACT_CSV"
  exit 2
fi
REPORT="$WORK/se03_fact_private_review_summary.json"
python3 "$WORK/se03_private_fact_preflight.py" --fact-csv "$FACT_CSV" --inventory-json "$INV" --report "$REPORT"
echo "SE03_PRIVATE_FACT_PREFLIGHT=PASS_REVIEW_ONLY"
echo "PRIVATE_CSV_UPLOAD=NO"
echo "ECONOMIC_PDF_LINE_VALIDATION=NOT_ACCEPTED"
echo "SOURCE_DERIVED_2912_FACT_RECONSTRUCTION=NOT_ACCEPTED"
echo "PRODUCTION_RELEASE=NO_GO"
