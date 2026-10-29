#!/usr/bin/env python3
"""JIF SE-03: local-only FY26 FACT CSV/Capital PDF hierarchy preflight.

This classifies frozen model export quality; it does NOT reconstruct budget facts.
No external calls, no writes to Google Sheets, no automatic publication.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

SOURCE_SHA = "32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6"
EXPECTED_FACT_ROWS = 2912
EXPECTED_CAPITAL_FACT_ROWS = 114
EXPECTED_AIA_ROWS = 30
EXPECTED_PROGRAMME_ROWS = 81
EXPECTED_COLS = ("fact_id source_id period_id fiscal_year period_type period_start period_end measure_type "
    "estimate_version organisation_id function_id subfunction_id programme_id subprogramme_id activity_id "
    "economic_id funding_source_id location_id public_category_id amount_jmd amount_unit "
    "amount_jmd_normalized currency is_actual is_budget is_revised source_page source_row "
    "import_batch_id loaded_at vote_id budget_number budget_type").split()
ROW_RE = re.compile(r"^(Activity|Programme) (\d{3,5}); economic (\d{2}); (VOTED_ESTIMATE|AUTHORIZED_BY_LAW)$")
AIA_RE = re.compile(r"^Vote (\d{5}); economic AIA; APPROPRIATIONS_IN_AID$")
VOTE_RE = re.compile(r"^VOTE_(\d{5}C?)$")


def inspect(csv_file: Path, page_inventory: Path) -> dict:
    pdf_data = json.loads(page_inventory.read_text(encoding="utf-8"))
    pages = pdf_data.get("page_inventory", [])
    if (pdf_data.get("source_pdf_sha256") != SOURCE_SHA or
        len(pages) != 716 or [x.get("physical_page") for x in pages] != list(range(1, 717))):
        raise ValueError("PINNED_PAGE_INVENTORY_IDENTITY_OR_COVERAGE_MISMATCH")
    if any(not isinstance(x.get("explicit"), dict) for x in pages):
        raise ValueError("PAGE_INVENTORY_EXPLICIT_FIELDS_MISSING")
    sha = hashlib.sha256(csv_file.read_bytes()).hexdigest()
    counts = Counter()
    review = Counter()
    examples = {}
    seen = set()
    failures = []
    def issue(code: str, fact: str):
        review[code] += 1
        if len(examples.get(code, [])) < 5:
            examples.setdefault(code, []).append(fact)

    with csv_file.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        if tuple(reader.fieldnames or ()) != tuple(EXPECTED_COLS):
            raise ValueError("EXACT_33_COLUMN_EXPORT_HEADER_MISMATCH")
        for pos, row in enumerate(reader, start=2):
            if None in row or any(v is None for v in row.values()):
                failures.append(f"MALFORMED_CSV_RECORD:{pos}")
                continue
            if row["fiscal_year"] != "2026/27":
                counts["SKIPPED_OTHER_FY"] += 1
                continue
            counts["FY26_ROWS"] += 1
            fid = row["fact_id"]
            if not fid or fid in seen:
                failures.append(f"MISSING_OR_DUPLICATE_FACT_ID:{pos}")
            seen.add(fid)
            if row["source_id"] != "SRC_EOE_2026_27_PASSED":
                failures.append(f"WRONG_SOURCE_ID:{pos}")
            if row["estimate_version"] != "AS_PASSED":
                failures.append(f"WRONG_ESTIMATE_VERSION:{pos}")
            page = row["source_page"]
            if not page.isdecimal() or not 1 <= int(page) <= 716:
                failures.append(f"INVALID_SOURCE_PAGE:{pos}")
                continue
            inv = pages[int(page)-1]["explicit"]
            budget = row["budget_number"]
            capital = budget == "6"
            if budget not in {"1", "6"} or row["budget_type"] != ("CAPITAL" if capital else "RECURRENT"):
                failures.append(f"UNEXPECTED_BUDGET_TYPE:{pos}")
            if capital:
                counts["CAPITAL_FACT_ROWS"] += 1
            try:
                amount = Decimal(row["amount_jmd_normalized"].replace(",", ""))
                if not amount.is_finite(): raise InvalidOperation
            except (InvalidOperation, ValueError):
                failures.append(f"INVALID_FINANCIAL_AMOUNT:{pos}")
                amount = Decimal(0)
            vote = VOTE_RE.fullmatch(row["vote_id"])
            if not vote:
                failures.append(f"INVALID_VOTE_CODE:{pos}")
            else:
                head = vote.group(1)
                if head.endswith("C") != capital:
                    failures.append(f"VOTE_BUDGET_SUFFIX_CONFLICT:{pos}")
                if head not in inv.get("head", []):
                    issue("PAGE_VOTE_HEAD_REVIEW_REQUIRED", fid)
            if budget not in inv.get("budget", []):
                issue("PAGE_BUDGET_REVIEW_REQUIRED", fid)
            if pages[int(page)-1].get("multiple_section_headings") or pages[int(page)-1].get("head_budget_conflicts"):
                issue("MULTIPLE_OR_CONFLICTING_PAGE_CONTEXT_REVIEW", fid)
            source = row["source_row"]
            match = ROW_RE.fullmatch(source)
            aia = AIA_RE.fullmatch(source)
            if row["measure_type"] == "APPROPRIATIONS_IN_AID":
                counts["AIA_VOTE_ROWS"] += 1
                if not aia:
                    failures.append(f"AIA_ROW_GRAIN_MISMATCH:{pos}")
                if amount >= 0:
                    failures.append(f"AIA_NOT_NEGATIVE:{pos}")
                issue("AIA_VOTE_RECONSTRUCTION_REQUIRED", fid)
            elif match:
                kind, code, econ, measure = match.groups()
                if row["measure_type"] != measure or row["economic_id"] != "ECON_"+econ:
                    failures.append(f"ECON_OR_MEASURE_MISMATCH:{pos}")
                if kind == "Programme":
                    counts["PROGRAMME_GRAIN_ROWS"] += 1
                    issue("PROGRAMME_GRAIN_PDF_REVIEW_REQUIRED", fid)
                else:
                    counts["ACTIVITY_GRAIN_ROWS"] += 1
                    printed = "project" if capital else "activity"
                    if code in inv.get(printed, []):
                        issue("EXPLICIT_ON_PAGE_CODE_ECON_AMOUNT_NOT_VERIFIED", fid)
                    else:
                        issue(("CAPITAL_PROJECT" if capital else "RECURRENT_ACTIVITY") + "_CONTEXT_REVIEW_REQUIRED", fid)
            else:
                failures.append(f"UNKNOWN_SOURCE_ROW_GRAIN:{pos}")
    for key,expected in (("FY26_ROWS", EXPECTED_FACT_ROWS),
                         ("CAPITAL_FACT_ROWS", EXPECTED_CAPITAL_FACT_ROWS),
                         ("PROGRAMME_GRAIN_ROWS", EXPECTED_PROGRAMME_ROWS),
                         ("AIA_VOTE_ROWS", EXPECTED_AIA_ROWS)):
        if counts[key] != expected:
            failures.append(f"FROZEN_BASELINE_{key}_COUNT_MISMATCH:{counts[key]}!={expected}")
    result = {
        "result": "FACT_REVIEW_QUEUE_PREFLIGHT_PASS_REVIEW_ONLY" if not failures else "FAILED_CLOSED",
        "source_pdf_sha256": SOURCE_SHA,
        "private_fact_export_sha256": sha,
        "private_export_path_recorded": False,
        "row_counts": dict(sorted(counts.items())),
        "review_required_status_counts": dict(sorted(review.items())),
        "review_sample_fact_ids": examples,
        "fatal_errors_first_40": failures[:40],
        "fatal_error_count": len(failures),
        "source_economic_amounts_independently_matched": False,
        "full_2912_row_source_reconstruction_accepted": False,
        "historical_112_67_24_30_exception_cases_resolved": False,
        "publication_authorized": False,
    }
    return result


def main() -> int:
    p=argparse.ArgumentParser(description="JIF SE-03 private local FACT and PDF-page preflight")
    p.add_argument("--fact-csv",required=True,type=Path)
    p.add_argument("--inventory-json",required=True,type=Path)
    p.add_argument("--report",required=True,type=Path)
    a=p.parse_args()
    try:
        result=inspect(a.fact_csv,a.inventory_json)
    except (ValueError,OSError,UnicodeError,csv.Error,json.JSONDecodeError) as exc:
        print(json.dumps({"result":"FAILED_CLOSED","error":str(exc),"publication_authorized":False}))
        return 2
    a.report.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in result.items() if k!="review_sample_fact_ids"},indent=2,sort_keys=True))
    print("REPORT_WRITTEN="+str(a.report))
    return 0 if result["result"] == "FACT_REVIEW_QUEUE_PREFLIGHT_PASS_REVIEW_ONLY" else 2

if __name__=="__main__":
    raise SystemExit(main())
