"""Read-only multi-year FACT reconciliation for the JIF approved Spending Explorer.

Source inputs must be an authorized local CSV export. This script never reads
public/operational network data, writes Google Sheets or authorizes publication.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
from collections import Counter
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path

MEASURES = ('AUTHORIZED_BY_LAW', 'VOTED_ESTIMATE', 'APPROPRIATIONS_IN_AID')
REQUIRED = frozenset({
    'fact_id', 'source_id', 'fiscal_year', 'measure_type', 'estimate_version',
    'period_type', 'organisation_id', 'economic_id', 'vote_id',
    'amount_jmd_normalized', 'currency', 'source_page', 'source_row',
    'import_batch_id', 'public_category_id', 'is_actual', 'is_budget',
})

@dataclass(frozen=True)
class YearBaseline:
    source_id: str
    rows: int
    statutory_rows: int
    voted_rows: int
    aia_rows: int
    gross: int
    aia: int
    net: int

BASELINES = {
    '2025/26': YearBaseline(
        'SRC_EOE_2025_26_PASSED', 2900, 64, 2805, 31,
        1309182355000, -49133377000, 1260048978000,
    ),
    '2026/27': YearBaseline(
        'SRC_EOE_2026_27_PASSED', 2912, 61, 2821, 30,
        1490511399000, -48730045000, 1441781354000,
    ),
}


def exact_integer(value: str) -> int:
    if value is None or not str(value).strip():
        raise ValueError('MISSING_AMOUNT')
    clean = str(value).strip().replace(',', '')
    try:
        val = Decimal(clean)
    except InvalidOperation as exc:
        raise ValueError('INVALID_AMOUNT') from exc
    if not val.is_finite() or val != val.to_integral_value():
        raise ValueError('NON_INTEGRAL_JMD')
    return int(val)


def validate(path: Path, expected_years: tuple[str, ...] = ('2025/26', '2026/27'),
             baselines: dict[str, YearBaseline] | None = None) -> dict:
    """Return denial-only data-quality results. Never a release authorization."""
    baselines = BASELINES if baselines is None else baselines
    if not expected_years or any(y not in baselines for y in expected_years):
        raise ValueError('UNAPPROVED_YEAR_SELECTION')
    blob = path.read_bytes()
    digest = hashlib.sha256(blob).hexdigest()
    errors = Counter()
    try:
        contents = blob.decode('utf-8-sig')
    except UnicodeError:
        return {'result': 'FAILED_CLOSED', 'sha256': digest, 'errors': {'INVALID_UTF8': 1},
                'release_authorized': False}
    reader = csv.DictReader(io.StringIO(contents, newline=''))
    names = reader.fieldnames or []
    if len(names) != len(set(names)):
        errors['DUPLICATE_HEADER'] += 1
    for field in sorted(REQUIRED - set(names)):
        errors[f'MISSING_HEADER:{field}'] += 1
    if errors:
        return {'result': 'FAILED_CLOSED', 'sha256': digest,
                'errors': dict(sorted(errors.items())), 'release_authorized': False}
    stats = {y: {'rows': 0, 'by_measure': Counter(), 'gross': 0, 'aia': 0,
                 'blank_activity': 0, 'blank_subprogramme': 0,
                 'blank_aia_source_page': 0} for y in expected_years}
    seen_ids = set()
    for row in reader:
        if None in row:
            errors['EXTRA_CSV_FIELDS'] += 1
            continue
        fid = str(row['fact_id'] or '').strip()
        if not fid or fid in seen_ids:
            errors['MISSING_OR_DUPLICATE_FACT_ID'] += 1
        if fid:
            seen_ids.add(fid)
        year = str(row['fiscal_year'] or '').strip()
        if year not in stats:
            errors['UNEXPECTED_FISCAL_YEAR'] += 1
            continue
        baseline, state = baselines[year], stats[year]
        state['rows'] += 1
        measure = str(row['measure_type'] or '').strip()
        state['by_measure'][measure] += 1
        if str(row['source_id'] or '').strip() != baseline.source_id:
            errors['SOURCE_ID_MISMATCH'] += 1
        if str(row['estimate_version'] or '').strip() != 'AS_PASSED':
            errors['SOURCE_NOT_AS_PASSED'] += 1
        if str(row['period_type'] or '').strip() != 'ANNUAL':
            errors['PERIOD_NOT_ANNUAL'] += 1
        if str(row['currency'] or '').strip() != 'JMD':
            errors['CURRENCY_NOT_JMD'] += 1
        if str(row['is_actual'] or '').strip().upper() not in ('FALSE', '0'):
            errors['ACTUALS_FLAG_INVALID'] += 1
        if str(row['is_budget'] or '').strip().upper() not in ('TRUE', '1'):
            errors['BUDGET_FLAG_INVALID'] += 1
        for field in ('organisation_id', 'economic_id', 'vote_id', 'source_row',
                      'import_batch_id', 'public_category_id'):
            if not str(row[field] or '').strip():
                errors[f'MISSING_LINEAGE:{field}'] += 1
        if not str(row['source_page'] or '').strip():
            if measure == 'APPROPRIATIONS_IN_AID':
                state['blank_aia_source_page'] += 1
            else:
                errors['MISSING_SOURCE_PAGE_NON_AIA'] += 1
        for field, name in (('activity_id', 'blank_activity'),
                            ('subprogramme_id', 'blank_subprogramme')):
            # Different legitimate FACT grains may have no activity-level code.
            if field in row and not str(row[field] or '').strip():
                state[name] += 1
        if measure not in MEASURES:
            errors['UNKNOWN_MEASURE_TYPE'] += 1
            continue
        try:
            amount = exact_integer(row['amount_jmd_normalized'])
        except ValueError as exc:
            errors[str(exc)] += 1
            continue
        if measure == 'APPROPRIATIONS_IN_AID':
            if amount >= 0:
                errors['AIA_SIGN_NOT_NEGATIVE'] += 1
            if str(row['public_category_id'] or '').strip() != 'CAT_AIA_OFFSET':
                errors['AIA_CATEGORY_INVALID'] += 1
            state['aia'] += amount
        else:
            if amount < 0:
                errors['NEGATIVE_GROSS_LINE'] += 1
            state['gross'] += amount
    year_results = {}
    for year in expected_years:
        expected = baselines[year]
        s = stats[year]
        if s['rows'] != expected.rows:
            errors[f'{year}:ROW_COUNT_MISMATCH'] += 1
        for measure, n in zip(MEASURES, (expected.statutory_rows, expected.voted_rows,
                                         expected.aia_rows)):
            if s['by_measure'][measure] != n:
                errors[f'{year}:MEASURE_COUNT:{measure}'] += 1
        if s['gross'] != expected.gross:
            errors[f'{year}:GROSS_MISMATCH'] += 1
        if s['aia'] != expected.aia:
            errors[f'{year}:AIA_MISMATCH'] += 1
        if s['gross'] + s['aia'] != expected.net:
            errors[f'{year}:NET_MISMATCH'] += 1
        year_results[year] = {
            'rows': s['rows'], 'measure_counts': dict(sorted(s['by_measure'].items())),
            'gross_jmd': s['gross'], 'aia_jmd': s['aia'],
            'net_jmd': s['gross'] + s['aia'],
            'blank_activity_rows_in_mixed_grain': s['blank_activity'],
            'blank_subprogramme_rows_in_mixed_grain': s['blank_subprogramme'],
            'blank_aia_source_pages': s['blank_aia_source_page'],
        }
    return {
        'result': 'QA_PASS_REVIEW_ONLY' if not errors else 'FAILED_CLOSED',
        'sha256': digest, 'years': year_results,
        'errors': dict(sorted(errors.items())), 'release_authorized': False,
        'full_source_extraction_tested': False,
        'private_sheet_live_readback_tested_by_this_cli': False,
        'public_serving_parity_tested_by_this_cli': False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description='JIF private FACT CSV QA; no network or publication')
    parser.add_argument('csv_path', type=Path)
    parser.add_argument('--year', choices=tuple(BASELINES), action='append',
                        help='Select an explicit fiscal-year export; default requires both years')
    parser.add_argument('--report-json', type=Path)
    args = parser.parse_args()
    report = validate(args.csv_path, tuple(dict.fromkeys(args.year or tuple(BASELINES))))
    rendered = json.dumps(report, indent=2, sort_keys=True)
    print(rendered)
    if args.report_json:
        args.report_json.write_text(rendered + '\n', encoding='utf-8')
    return 0 if report['result'] == 'QA_PASS_REVIEW_ONLY' else 2

if __name__ == '__main__':
    raise SystemExit(main())
