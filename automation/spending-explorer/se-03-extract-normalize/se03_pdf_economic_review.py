#!/usr/bin/env python3
"""JIF SE-03 pinned PDF economic candidate observation, local-only and review-only.

This cannot certify any canonical FACT row. It records only possible PDF matches
under the existing strictly bounded economic column locator. No uploads/writes.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

from se03_private_fact_preflight import EXPECTED_COLS, SOURCE_SHA, inspect
from se03_pdf_page_inventory import economic_candidate_count

ROW = re.compile(r"^Activity (\d{5}); economic (\d{2}); (VOTED_ESTIMATE|AUTHORIZED_BY_LAW)$")


def classify(row: dict, page: dict, candidates: int) -> str:
    """Classify scope/amount separately; never mark a canonical row accepted."""
    if row["measure_type"] == "APPROPRIATIONS_IN_AID":
        return "AIA_VOTE_METHOD_REQUIRED"
    if row["source_row"].startswith("Programme "):
        return "PROGRAMME_GRAIN_METHOD_REQUIRED"
    match = ROW.fullmatch(row["source_row"])
    if not match:
        return "SOURCE_ROW_GRAMMAR_REVIEW_REQUIRED"
    if page.get("multiple_section_headings") or page.get("head_budget_conflicts"):
        return "MULTI_SECTION_CONTEXT_REVIEW_REQUIRED"
    explicit = page["explicit"]
    code = match.group(1)
    expected_kind = "project" if row["budget_number"] == "6" else "activity"
    if code not in explicit.get(expected_kind, []):
        return "ACTIVITY_OR_PROJECT_SCOPE_REVIEW_REQUIRED"
    if row["vote_id"].removeprefix("VOTE_") not in explicit.get("head", []):
        return "HEAD_SCOPE_REVIEW_REQUIRED"
    if row["budget_number"] not in explicit.get("budget", []):
        return "BUDGET_SCOPE_REVIEW_REQUIRED"
    if candidates == 0:
        return "ECONOMIC_CELL_NOT_FOUND_BY_BOUNDING_BOX"
    if candidates > 1:
        return "ECONOMIC_CELL_MULTIPLE_CANDIDATES"
    return "UNIQUE_ECONOMIC_CELL_CANDIDATE_REVIEW_ONLY"


class CachedWordPage:
    def __init__(self, words):
        self.words = words
    def get_text(self, style):
        if style != "words":
            raise ValueError("WORD_PAGE_REVIEW_ONLY")
        return self.words


def run(pdf: Path, fact_csv: Path, page_inventory: Path) -> dict:
    pre = inspect(fact_csv, page_inventory)
    if pre["result"] != "FACT_REVIEW_QUEUE_PREFLIGHT_PASS_REVIEW_ONLY":
        raise ValueError("FACT_STRUCTURE_PREFLIGHT_FAILED_CLOSED")
    raw = pdf.read_bytes()
    source_sha = hashlib.sha256(raw).hexdigest()
    if source_sha != SOURCE_SHA or len(raw) != 23_172_267:
        raise ValueError("OFFICIAL_AS_PASSED_PDF_IDENTITY_MISMATCH")
    inventory = json.loads(page_inventory.read_text(encoding="utf-8"))
    pages = inventory["page_inventory"]
    import fitz  # PyMuPDF: existing isolated local venv, no new network deps.
    doc = fitz.open(stream=raw, filetype="pdf")
    outcomes = Counter()
    count_kinds = Counter()
    examples = {}
    word_cache = {}
    try:
        if len(doc) != 716:
            raise ValueError("SOURCE_PAGE_COUNT_NOT_716")
        with fact_csv.open(encoding="utf-8-sig", newline="") as fh:
            reader = csv.DictReader(fh)
            if tuple(reader.fieldnames or ()) != tuple(EXPECTED_COLS):
                raise ValueError("EXACT_33_HEADER_FAILED_CLOSED")
            for row in reader:
                if row["fiscal_year"] != "2026/27":
                    continue
                pg = int(row["source_page"])-1
                activity = ROW.fullmatch(row["source_row"])
                if row["measure_type"] == "APPROPRIATIONS_IN_AID":
                    status = "AIA_VOTE_METHOD_REQUIRED"
                elif row["source_row"].startswith("Programme "):
                    status = "PROGRAMME_GRAIN_METHOD_REQUIRED"
                else:
                    if pg not in word_cache:
                        word_cache[pg] = CachedWordPage(doc[pg].get_text("words"))
                    candidates = economic_candidate_count(word_cache[pg], row)
                    count_kinds[str(min(candidates, 2)) if candidates <= 1 else "2+"] += 1
                    status = classify(row, pages[pg], candidates)
                outcomes[status] += 1
                if len(examples.get(status, [])) < 5:
                    examples.setdefault(status, []).append(row["fact_id"])
    finally:
        doc.close()
    if sum(outcomes.values()) != 2912:
        raise ValueError("CLASSIFICATION_NOT_2912_FAILED_CLOSED")
    return {
        "result": "PDF_ECONOMIC_CELL_CANDIDATES_REVIEW_ONLY",
        "source_pdf_sha256": source_sha,
        "private_fact_export_sha256": pre["private_fact_export_sha256"],
        "fy26_rows_examined": sum(outcomes.values()),
        "candidate_count_distribution_for_activity_grain": dict(sorted(count_kinds.items())),
        "row_status_counts": dict(sorted(outcomes.items())),
        "example_fact_ids_first_five_per_status": examples,
        "financial_line_parity_accepted": False,
        "canonical_2912_33_field_source_reconstruction_accepted": False,
        "historical_112_67_24_30_exception_lists_resolved": False,
        "publication_authorized": False,
    }


def main() -> int:
    p=argparse.ArgumentParser(description="JIF read-only source-pinned economic cell review")
    p.add_argument("--pdf", type=Path, required=True)
    p.add_argument("--fact-csv", type=Path, required=True)
    p.add_argument("--inventory-json", type=Path, required=True)
    p.add_argument("--report", type=Path, required=True)
    a=p.parse_args()
    try:
        result=run(a.pdf,a.fact_csv,a.inventory_json)
    except (OSError, ValueError, KeyError, UnicodeError, csv.Error) as exc:
        print(json.dumps({"result":"FAILED_CLOSED","error":str(exc),"publication_authorized":False}))
        return 2
    a.report.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in result.items() if k!="example_fact_ids_first_five_per_status"},indent=2,sort_keys=True))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
