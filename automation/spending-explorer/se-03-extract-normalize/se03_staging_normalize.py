"""SE-03 review-only staging normalizer for approved FY2026/27 As Passed lines.

Input STG_FactLoad is an existing *historical extraction*, not an original PDF.
The unresolved _NA_ activity keys require the signed-off RECON_ActivityLinks
crosswalk; this tool never guesses sub-programme memberships or invents lines.
No production network, Sheet writes, publication, or source PDF extraction.
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

STAGING_HEADERS = (
    "measure_code", "entity_type", "entity_key", "economic_code", "amount_jmd",
    "source_page", "budget_type_code", "budget_number", "budget_type",
)
CROSSWALK_HEADERS = ("old_activity_id", "resolved_activity_id", "review_status")
MEASURES = {"L": "AUTHORIZED_BY_LAW", "V": "VOTED_ESTIMATE",
            "A": "APPROPRIATIONS_IN_AID"}
TYPES = {"A": "ACTIVITY", "P": "PROGRAMME", "V": "VOTE"}
BUDGET_TYPES = {"R": "RECURRENT", "C": "CAPITAL"}
FISCAL_YEAR = "2026/27"
SOURCE_ID = "SRC_EOE_2026_27_PASSED"
EXPECTED_COUNTS = {"AUTHORIZED_BY_LAW": 61, "VOTED_ESTIMATE": 2821,
                   "APPROPRIATIONS_IN_AID": 30}
EXPECTED_TOTALS = {"gross_jmd": 1490511399000, "aia_jmd": -48730045000,
                   "net_jmd": 1441781354000, "rows": 2912}
HEX = re.compile(r"^[0-9a-f]{64}$")


class Rejected(Exception):
    pass


def parse_csv(path: Path, required: tuple[str, ...]) -> tuple[bytes, list[dict[str, str]]]:
    blob = path.read_bytes()
    try:
        content = blob.decode("utf-8-sig")
    except UnicodeError as exc:
        raise Rejected("INVALID_UTF8") from exc
    reader = csv.DictReader(content.splitlines())
    headings = reader.fieldnames or []
    if len(headings) != len(set(headings)) or not set(required).issubset(headings):
        raise Rejected("INVALID_CSV_HEADER")
    rows = list(reader)
    if any(None in row or any(v is None for v in row.values()) for row in rows):
        raise Rejected("RAGGED_CSV")
    return blob, rows


def exact_amount(value: str) -> int:
    s = value.strip()
    if not s or not re.fullmatch(r"-?[0-9][0-9,]*", s):
        raise Rejected("INVALID_JMD_AMOUNT")
    try:
        number = Decimal(s.replace(",", ""))
    except InvalidOperation as exc:
        raise Rejected("INVALID_JMD_AMOUNT") from exc
    if not number.is_finite() or number != number.to_integral_value():
        raise Rejected("INVALID_JMD_AMOUNT")
    return int(number)


def activity_crosswalk(rows: list[dict[str, str]]) -> dict[str, str]:
    out = {}
    for row in rows:
        old = row["old_activity_id"].strip()
        new = row["resolved_activity_id"].strip()
        status = row["review_status"].strip()
        if not old or not new or not status.endswith("QA_PASS"):
            continue
        if not old.startswith("ACT_") or not new.startswith("ACT_") or "_NA_" in new:
            raise Rejected("CROSSWALK_UNRESOLVED")
        previous = out.get(old)
        if previous is not None and previous != new:
            raise Rejected("AMBIGUOUS_CROSSWALK")
        out[old] = new
    return out


def normalize(staging: list[dict[str, str]], crosswalk: dict[str, str],
              strict_counts: bool = True) -> tuple[list[dict], dict]:
    out, errors = [], Counter()
    measures, totals, keys = Counter(), Counter(), set()
    for index, row in enumerate(staging, start=2):
        try:
            mcode = row["measure_code"].strip()
            etype = row["entity_type"].strip()
            raw_key = row["entity_key"].strip()
            economic = row["economic_code"].strip()
            page = row["source_page"].strip()
            budget = row["budget_type_code"].strip()
            budget_num = row["budget_number"].strip()
            if mcode not in MEASURES or etype not in TYPES:
                raise Rejected("UNRECOGNIZED_MEASURE_OR_GRAIN")
            if not raw_key or not economic or not budget or budget not in BUDGET_TYPES:
                raise Rejected("REQUIRED_STAGING_FIELD_MISSING")
            if mcode == "A" and (etype != "V" or economic != "AIA"):
                raise Rejected("AIA_GRAIN_OR_ECONOMIC_INVALID")
            if mcode != "A" and economic == "AIA":
                raise Rejected("AIA_MEASURE_MISMATCH")
            if page and (not page.isdecimal() or int(page) <= 0):
                raise Rejected("INVALID_PAGE")
            if not page and mcode != "A":
                raise Rejected("NON_AIA_PAGE_MISSING")
            if budget_num and not budget_num.isdecimal():
                raise Rejected("INVALID_BUDGET_NUMBER")
            amount = exact_amount(row["amount_jmd"])
            if (mcode == "A" and amount >= 0) or (mcode != "A" and amount < 0):
                raise Rejected("AMOUNT_SIGN_INVALID")
            canonical_key = raw_key
            if etype == "A" and "_NA_" in raw_key:
                canonical_id = crosswalk.get("ACT_" + raw_key)
                if not canonical_id:
                    raise Rejected("UNRESOLVED_ACTIVITY_SUBPROGRAMME")
                canonical_key = canonical_id[4:]
            if etype == "A" and len(canonical_key.split("_")) != 6:
                raise Rejected("INVALID_ACTIVITY_KEY_STRUCTURE")
            if etype == "P" and len(canonical_key.split("_")) != 4:
                raise Rejected("INVALID_PROGRAMME_KEY_STRUCTURE")
            if etype == "V" and not re.fullmatch(r"\d{4,5}",raw_key):
                raise Rejected("INVALID_VOTE_KEY_STRUCTURE")
            rec = {
                "staging_row": index, "source_id": SOURCE_ID, "fiscal_year": FISCAL_YEAR,
                "measure_type": MEASURES[mcode], "entity_type": TYPES[etype],
                "raw_entity_key": raw_key, "canonical_entity_key": canonical_key,
                "economic_code": economic, "amount_jmd": amount,
                "source_page": page, "source_row": f"STG_FactLoad:{index}",
                "recurrent_or_capital": BUDGET_TYPES[budget],
                "budget_number": budget_num,
                "source_is_previously_extracted_staging": True,
            }
            # Multiset signature, not a uniqueness claim: repeated lines are not dropped.
            key = (mcode, etype, canonical_key, economic, amount, page, budget,
                   budget_num, row["budget_type"].strip())
            if key in keys:
                errors["DUPLICATE_LINE_SIGNATURE_REQUIRES_REVIEW"] += 1
            keys.add(key)
            out.append(rec)
            measures[MEASURES[mcode]] += 1
            totals["aia" if mcode == "A" else "gross"] += amount
        except Rejected as exc:
            errors[str(exc)] += 1
    gross, aia = totals["gross"], totals["aia"]
    if strict_counts:
        if len(out) != EXPECTED_TOTALS["rows"]:
            errors["EXPECTED_ROW_COUNT_MISMATCH"] += 1
        for measure, expected in EXPECTED_COUNTS.items():
            if measures[measure] != expected:
                errors[f"EXPECTED_MEASURE_COUNT_MISMATCH:{measure}"] += 1
        for name, actual in (("gross_jmd", gross), ("aia_jmd", aia),
                             ("net_jmd", gross + aia)):
            if actual != EXPECTED_TOTALS[name]:
                errors[f"EXPECTED_{name.upper()}_MISMATCH"] += 1
    receipt = {
        "status": "NORMALIZED_REVIEW_ONLY" if not errors else "FAILED_CLOSED",
        "record_count": len(out), "source_rows_read": len(staging),
        "measure_counts": dict(sorted(measures.items())),
        "gross_jmd": gross, "aia_jmd": aia, "net_jmd": gross + aia,
        "errors": dict(sorted(errors.items())),
        "original_pdf_extraction_verified": False,
        "fact_record_parity_verified": False,
        "public_release_authorized": False,
    }
    return out, receipt


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--staging-csv", type=Path, required=True)
    ap.add_argument("--crosswalk-csv", type=Path, required=True)
    ap.add_argument("--out-dir", type=Path, required=True)
    ap.add_argument("--staging-sha256", required=True)
    ap.add_argument("--crosswalk-sha256", required=True)
    args = ap.parse_args()
    for value in (args.staging_sha256, args.crosswalk_sha256):
        if not HEX.fullmatch(value):
            raise SystemExit("PIN_SHA256_REQUIRED")
    try:
        stg_blob, staging = parse_csv(args.staging_csv, STAGING_HEADERS)
        map_blob, mapping = parse_csv(args.crosswalk_csv, CROSSWALK_HEADERS)
        if hashlib.sha256(stg_blob).hexdigest() != args.staging_sha256:
            raise Rejected("STAGING_PIN_MISMATCH")
        if hashlib.sha256(map_blob).hexdigest() != args.crosswalk_sha256:
            raise Rejected("CROSSWALK_PIN_MISMATCH")
        records, receipt = normalize(staging, activity_crosswalk(mapping))
    except Rejected as exc:
        print(json.dumps({"status":"FAILED_CLOSED","error":str(exc),
                          "public_release_authorized":False}))
        return 2
    receipt["staging_sha256"] = args.staging_sha256
    receipt["crosswalk_sha256"] = args.crosswalk_sha256
    if receipt["status"] == "FAILED_CLOSED":
        print(json.dumps(receipt, sort_keys=True))
        return 2
    # Success only: never write a partial accepted normalization.
    args.out_dir.mkdir(parents=True, exist_ok=True)
    if any(args.out_dir.iterdir()):
        raise SystemExit("OUTPUT_DIRECTORY_NOT_EMPTY")
    canonical = "".join(json.dumps(r, sort_keys=True, separators=(",",":"))+"\n" for r in records)
    (args.out_dir / "normalized.jsonl").write_text(canonical, encoding="utf-8")
    receipt["normalized_sha256"] = hashlib.sha256(canonical.encode()).hexdigest()
    (args.out_dir / "review_receipt.json").write_text(
        json.dumps(receipt,sort_keys=True,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(receipt,sort_keys=True))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
