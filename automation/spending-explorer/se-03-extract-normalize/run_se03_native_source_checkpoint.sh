#!/usr/bin/env bash
# JIF SE-03 PR #42 — pinned-source, read-only Mac acceptance gate.
# No modifications to existing Sheets, PRs, scanners, n8n or production data.
set -euo pipefail

COMMIT="5fbc89f321bd9b2b9a5a30d15538d11feef09cdb"
DIR="$HOME/Downloads/JIF_SE03_PR42_Native_Review"
APPROVED="$HOME/Downloads/JIF_SE03_2026-27_Approved_Estimates.csv"
PRESENTED="$HOME/Downloads/JIF_SE03_2026-27_As_Presented_Estimates.csv"
PREFIX="https://raw.githubusercontent.com/ethonjames24-jpg/jiftracker/$COMMIT/automation/spending-explorer/se-03-extract-normalize"
mkdir -p "$DIR"

for file in \
  se03_source_completeness.py \
  test_se03_source_completeness.py \
  se03_pdf_continuation_review.py \
  test_se03_pdf_continuation_review.py \
  se03_native_official_file_acceptance.py
do
  curl --fail --location --show-error --silent --retry 2 --max-time 90 \
    "$PREFIX/$file" -o "$DIR/$file"
done

python3 - "$DIR" <<'PY'
from pathlib import Path
import hashlib, sys
folder = Path(sys.argv[1])
pins = {
    'se03_source_completeness.py': 'e8f5c3cfc19c0dc299135acb521535c1b8d2c055',
    'test_se03_source_completeness.py': '6713764831730dd12f6ae2c32c5d8b3c427e95',
    'se03_pdf_continuation_review.py': 'ffc8aa923928a89b1cd19373581def5b035d11f2',
    'test_se03_pdf_continuation_review.py': '6997b778b5656a727ef4911fc94539bc157a527e',
    'se03_native_official_file_acceptance.py': '8fa3e906e127058841dda2b0cdb3fb1a9aed35cf',
}
for name, expected in pins.items():
    blob = (folder / name).read_bytes()
    identity = hashlib.sha1(b'blob ' + str(len(blob)).encode('ascii') + b'\x00' + blob).hexdigest()
    if identity != expected:
        raise SystemExit(f'FAILED_CLOSED: GITHUB_BLOB_ID_MISMATCH for {name}: {identity}')
    print(f'GITHUB_SOURCE_BLOB=PASS {name} {identity}')
print('PINNED_REMOTE_CHECKOUT_IDENTITY=PASS')
PY

printf '\n=== PR #42 remote-code synthetic tests ===\n'
(cd "$DIR" && python3 -m unittest -v test_se03_source_completeness test_se03_pdf_continuation_review)

printf '\n=== Expected official-file source dispositions (review only) ===\n'
test -f "$APPROVED" || { echo "MISSING_APPROVED_CSV=$APPROVED"; exit 2; }
test -f "$PRESENTED" || { echo "MISSING_AS_PRESENTED_CSV=$PRESENTED"; exit 2; }
python3 "$DIR/se03_native_official_file_acceptance.py" "$APPROVED" "$PRESENTED"

echo 'SE03_PR42_NATIVE_SOURCE_CHECKPOINT=PASS_REVIEW_ONLY'
echo 'FULL_SOURCE_DERIVED_2912_ROW_RECONSTRUCTION=NOT_ACCEPTED'
echo 'PRODUCTION_RELEASE=NO_GO'
