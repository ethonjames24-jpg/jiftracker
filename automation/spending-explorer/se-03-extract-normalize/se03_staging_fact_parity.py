"""Offline historical staging/FACT comparison; never original-source acceptance.

All four CSVs must be explicitly SHA-256 pinned. Only aggregate receipts are
printed. Private rows and per-record differences are never emitted by this tool.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

from se03_staging_normalize import (
    CROSSWALK_HEADERS, STAGING_HEADERS, HEX, Rejected, activity_crosswalk,
    exact_amount, normalize, parse_csv,
)

FACT_HEADERS = tuple((
    "fact_id source_id period_id fiscal_year period_type period_start period_end "
    "measure_type estimate_version organisation_id function_id subfunction_id "
    "programme_id subprogramme_id activity_id economic_id funding_source_id "
    "location_id public_category_id amount_jmd amount_unit amount_jmd_normalized "
    "currency is_actual is_budget is_revised source_page source_row import_batch_id "
    "loaded_at vote_id budget_number budget_type"
).split())
PROJECTION_FIELDS = (
    "source_id", "fiscal_year", "measure_type", "entity_type",
    "canonical_entity_key", "economic_code", "amount_jmd", "source_page",
    "recurrent_or_capital",
)


def fact_signature(row: dict) -> tuple:
    """Project existing FACT identity; do not infer missing hierarchy/amounts."""
    match = re.fullmatch(
        r"(Activity|Programme|Vote) ([0-9]+); economic ([0-9]+|AIA); "
        r"(AUTHORIZED_BY_LAW|VOTED_ESTIMATE|APPROPRIATIONS_IN_AID)",
        row["source_row"],
    )
    if not match:
        raise Rejected("FACT_SOURCE_ROW_GRAMMAR_INVALID")
    kind, code, economic, measure = match.groups()
    field, prefix, grain = {
        "Activity": ("activity_id", "ACT_", "ACTIVITY"),
        "Programme": ("programme_id", "PROG_", "PROGRAMME"),
        "Vote": ("vote_id", "VOTE_", "VOTE"),
    }[kind]
    identifier = row[field]
    if not identifier.startswith(prefix):
        raise Rejected("FACT_ENTITY_ID_MISSING")
    key = identifier[len(prefix):]
    if key.split("_")[-1] != code or row["economic_id"] != "ECON_" + economic or row["measure_type"] != measure:
        raise Rejected("FACT_SOURCE_ROW_IDENTITY_CONFLICT")
    return (
        row["source_id"], row["fiscal_year"], measure, grain, key,
        economic, exact_amount(row["amount_jmd_normalized"]),
        row["source_page"], row["budget_type"],
    )


def compare_normalized(records: list[dict], frozen: list[dict]) -> dict:
    """Compare multisets, including duplicate multiplicity and explicit grain."""
    staged = Counter()
    for row in records:
        values = dict(row)
        if row["entity_type"] == "VOTE":
            # The historical staging has 1000, while FACT/source use 01000.
            values["canonical_entity_key"] = row["canonical_entity_key"].zfill(5)
        staged[tuple(values[k] for k in PROJECTION_FIELDS)] += 1
    baseline = Counter(fact_signature(row) for row in frozen)
    missing, extra = sum((baseline-staged).values()), sum((staged-baseline).values())
    return {
        "result": "PROJECTION_PASS_REVIEW_ONLY" if not (missing or extra) else "FAILED_CLOSED",
        "projection_fields": list(PROJECTION_FIELDS),
        "normalized_rows": len(records), "frozen_rows": len(frozen),
        "missing_signatures": missing, "extra_signatures": extra,
        "duplicate_normalized_signatures": sum(n-1 for n in staged.values()),
        "duplicate_frozen_signatures": sum(n-1 for n in baseline.values()),
        "full_33_field_staging_parity_verified": False,
        "original_pdf_extraction_verified": False,
        "release_authorized": False,
    }


def compare_fact_tables(frozen: list[dict], operational: list[dict]) -> dict:
    def indexed(rows):
        out = {}
        for row in rows:
            if not row["fact_id"] or row["fact_id"] in out:
                raise Rejected("MISSING_OR_DUPLICATE_FACT_ID")
            out[row["fact_id"]] = row
        return out
    left = indexed(frozen)
    # Validate global operational ID uniqueness before selecting the fiscal year.
    all_right = indexed(operational)
    right = {k:r for k,r in all_right.items() if r["fiscal_year"] == "2026/27"}
    changed = sum(left[k] != right[k] for k in left.keys() & right.keys())
    missing, extra = len(left.keys()-right.keys()), len(right.keys()-left.keys())
    return {
        "result": "FACT_TABLE_PASS_REVIEW_ONLY" if not (changed or missing or extra) else "FAILED_CLOSED",
        "frozen_rows": len(left), "operational_fy26_rows": len(right),
        "missing_ids": missing, "extra_ids": extra, "changed_rows": changed,
        "compared_field_count": len(FACT_HEADERS),
        "original_pdf_extraction_verified": False, "release_authorized": False,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    for name in ("staging", "crosswalk", "frozen", "operational"):
        ap.add_argument("--"+name+"-csv", type=Path, required=True)
        ap.add_argument("--"+name+"-sha256", required=True)
    args = ap.parse_args()
    try:
        inputs, pins = {}, {}
        for name, headers in (("staging", STAGING_HEADERS), ("crosswalk", CROSSWALK_HEADERS),
                              ("frozen", FACT_HEADERS), ("operational", FACT_HEADERS)):
            pin = getattr(args, name+"_sha256")
            if not HEX.fullmatch(pin):
                raise Rejected("PIN_SHA256_REQUIRED")
            blob, rows = parse_csv(getattr(args, name+"_csv"), headers)
            if hashlib.sha256(blob).hexdigest() != pin:
                raise Rejected("INPUT_PIN_MISMATCH:"+name)
            if name in ("frozen", "operational") and (not rows or tuple(rows[0]) != FACT_HEADERS):
                raise Rejected("FACT_33_FIELD_HEADER_MISMATCH")
            inputs[name], pins[name] = rows, pin
        records, normalization = normalize(inputs["staging"], activity_crosswalk(inputs["crosswalk"]))
        if normalization["status"] == "FAILED_CLOSED":
            raise Rejected("NORMALIZATION_FAILED_CLOSED")
        if len(inputs["frozen"]) != 2912:
            raise Rejected("FROZEN_ROW_COUNT_MISMATCH")
        projection = compare_normalized(records, inputs["frozen"])
        tables = compare_fact_tables(inputs["frozen"], inputs["operational"])
        passed = projection["result"] != "FAILED_CLOSED" and tables["result"] != "FAILED_CLOSED"
        receipt = {
            "result": "HISTORICAL_STAGING_PARITY_REVIEW_ONLY" if passed else "FAILED_CLOSED",
            "input_sha256": pins, "normalization": normalization,
            "staging_projection": projection, "existing_fact_table_comparison": tables,
            "original_pdf_extraction_verified": False, "release_authorized": False,
        }
    except (Rejected, OSError) as exc:
        # Do not echo OS exception text: it can contain private local paths.
        error = str(exc) if isinstance(exc, Rejected) else "INPUT_FILE_READ_FAILED"
        receipt = {"result":"FAILED_CLOSED", "error":error, "release_authorized":False}
    print(json.dumps(receipt, sort_keys=True, indent=2))
    return 2 if receipt["result"] == "FAILED_CLOSED" else 0


if __name__ == "__main__":
    raise SystemExit(main())
