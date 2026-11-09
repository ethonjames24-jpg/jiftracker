"""Read-only validation of a private JIF Spending Explorer FACT CSV export.

Does NOT extract a source PDF, update a Sheet, authorize a release or publish data.
Runs only on an explicit local CSV path supplied by the operator. No network code.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path

REQUIRED = frozenset({
    'fact_id', 'source_id', 'fiscal_year', 'measure_type', 'estimate_version',
    'organisation_id', 'economic_id', 'amount_jmd_normalized', 'currency',
    'source_page', 'source_row', 'import_batch_id', 'public_category_id', 'vote_id',
})
MEASURE_TYPES = frozenset({'AUTHORIZED_BY_LAW', 'VOTED_ESTIMATE', 'APPROPRIATIONS_IN_AID'})

@dataclass(frozen=True)
class Baseline:
    source_id: str
    fiscal_year: str
    row_count: int
    gross_jmd: int
    aia_jmd: int
    net_jmd: int

FY2026_27 = Baseline(
    source_id='SRC_EOE_2026_27_PASSED', fiscal_year='2026/27', row_count=2912,
    gross_jmd=1490511399000, aia_jmd=-48730045000, net_jmd=1441781354000,
)


def parse_integer_jmd(value: str) -> int:
    """Only exact JMD integer amounts are supported; missing cannot become zero."""
    if value is None or not value.strip():
        raise ValueError('MISSING_AMOUNT')
    raw = value.strip().replace(',', '')
    try:
        amount = Decimal(raw)
    except InvalidOperation as exc:
        raise ValueError('INVALID_AMOUNT') from exc
    if not amount.is_finite() or amount != amount.to_integral_value():
        raise ValueError('NON_INTEGRAL_JMD')
    return int(amount)


def assess_csv(path: Path, baseline: Baseline = FY2026_27) -> dict:
    """Return deterministic denial-only QA; never authorize publication."""
    raw = path.read_bytes()
    errors = Counter()
    totals = Counter()
    by_measure = Counter()
    seen = set()
    total = 0
    try:
        contents = raw.decode('utf-8-sig')
    except UnicodeError:
        return {'status': 'FAILED_CLOSED', 'errors': {'INVALID_UTF8': 1},
                'sha256': hashlib.sha256(raw).hexdigest()}
    import io
    reader = csv.DictReader(io.StringIO(contents, newline=''))
    names = set(reader.fieldnames or [])
    if len(reader.fieldnames or []) != len(names):
        errors['DUPLICATE_HEADER'] += 1
    for field in sorted(REQUIRED - names):
        errors[f'MISSING_HEADER:{field}'] += 1
    if errors:
        return {'status': 'FAILED_CLOSED', 'errors': dict(sorted(errors.items())),
                'sha256': hashlib.sha256(raw).hexdigest()}
    for row in reader:
        total += 1
        if None in row:
            errors['UNEXPECTED_EXTRA_COLUMNS'] += 1
            continue
        fact_id = (row['fact_id'] or '').strip()
        if not fact_id or fact_id in seen:
            errors['MISSING_OR_DUPLICATE_FACT_ID'] += 1
        seen.add(fact_id)
        if row['source_id'].strip() != baseline.source_id:
            errors['SOURCE_ID_MISMATCH'] += 1
        if row['fiscal_year'].strip() != baseline.fiscal_year:
            errors['FISCAL_YEAR_MISMATCH'] += 1
        if row['estimate_version'].strip() != 'AS_PASSED':
            errors['NOT_AS_PASSED'] += 1
        if row['currency'].strip() != 'JMD':
            errors['NOT_JMD'] += 1
        for key in ('organisation_id', 'economic_id', 'source_page',
                    'source_row', 'import_batch_id', 'vote_id', 'public_category_id'):
            if not (row[key] or '').strip():
                errors[f'MISSING_LINEAGE:{key}'] += 1
        measure = (row['measure_type'] or '').strip()
        if measure not in MEASURE_TYPES:
            errors['UNRECOGNIZED_MEASURE'] += 1
            continue
        try:
            amount = parse_integer_jmd(row['amount_jmd_normalized'])
        except ValueError as exc:
            errors[str(exc)] += 1
            continue
        if measure == 'APPROPRIATIONS_IN_AID':
            if amount >= 0:
                errors['AIA_NOT_NEGATIVE'] += 1
            if row['public_category_id'].strip() != 'CAT_AIA_OFFSET':
                errors['AIA_CATEGORY_NOT_OFFSET'] += 1
        elif amount < 0:
            errors['UNEXPECTED_NEGATIVE_GROSS'] += 1
        totals['aia' if measure == 'APPROPRIATIONS_IN_AID' else 'gross'] += amount
        by_measure[measure] += 1
    gross, aia = totals['gross'], totals['aia']
    net = gross + aia
    if total != baseline.row_count:
        errors['ROW_COUNT_MISMATCH'] += 1
    if gross != baseline.gross_jmd:
        errors['GROSS_MISMATCH'] += 1
    if aia != baseline.aia_jmd:
        errors['AIA_MISMATCH'] += 1
    if net != baseline.net_jmd:
        errors['NET_MISMATCH'] += 1
    return {
        'status': 'QA_PASS_REVIEW_ONLY' if not errors else 'FAILED_CLOSED',
        'sha256': hashlib.sha256(raw).hexdigest(),
        'source_id': baseline.source_id, 'fiscal_year': baseline.fiscal_year,
        'rows': total, 'gross_jmd': gross, 'aia_jmd': aia, 'net_jmd': net,
        'measure_counts': dict(sorted(by_measure.items())),
        'errors': dict(sorted(errors.items())),
        'no_publication_or_sheet_write': True,
        'source_pdf_extraction_tested': False,
        'full_public_feed_reconciliation_tested': False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description='JIF offline private FACT reconciliation only')
    parser.add_argument('csv_path', type=Path)
    parser.add_argument('--report-json', type=Path, help='Optional local QA report; not a public sheet')
    args = parser.parse_args()
    report = assess_csv(args.csv_path)
    formatted = json.dumps(report, sort_keys=True, indent=2)
    print(formatted)
    if args.report_json:
        args.report_json.write_text(formatted + '\n', encoding='utf-8')
    return 0 if report['status'] == 'QA_PASS_REVIEW_ONLY' else 2

if __name__ == '__main__':
    raise SystemExit(main())
