"""JIF SE-03 official CSV integrity/completeness gate (review-only).

A known SHA-256 identifies bytes; it never proves completeness or authority.
Approved open-data CSV is a known truncated fixture and MUST fail closed.
As Presented CSV is a complete *supporting* reference, never As Passed authority.
No network, data writes, repair, substitution, or publication controls.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

PINS = {
    "APPROVED": (10891264, "cdb6ce99c678feabb3c3c48cf2bcc06d756762a8240c302f82719cabecb4e7ab"),
    "AS_PRESENTED": (12262651, "d480726d35bb1d694f4f0a48e2fab3038c5968d335dc45b00ab5f51bfb497f1a"),
}
REQUIRED_HEADERS = (
    "Coding Block", "Org", "Org Desc", "Int Org/Pub Body", "Int Org/Pub Body\xa0 Desc",
    "Fin Pat Type", "Fin Pat Type Desc", "Fin Pat SubType", "Fin Pat SubType Desc",
    "Fund", "Fund Desc", "Loan/Grant Code", "Loan/Grant Desc", "Func",
    "Func Desc", "SubFunc", "SubFunc Desc", "Prog", "Prog Desc", "SubProg",
    "SubProg Desc", "Act/Proj", "Act/Proj Desc", "Obj", "Obj Desc",
    "SubObj", "SubObj Desc", "Detail SubObj", "Detail SubObj Desc",
)
YEAR_LABELS = {
    "APPROVED": ("2026-2027", "2027-2028", "2028-2029", "2029-2030"),
    "AS_PRESENTED": ("2026-2027", "2027/28", "2028/29", "2029/30"),
}


def amount(value: str) -> Decimal:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("BLANK_AMOUNT")
    if not re.fullmatch(r"-?(?:0|[1-9][0-9]*|[1-9][0-9]{0,2}(?:,[0-9]{3})+)(?:\.[0-9]{1,2})?", value.strip()):
        raise ValueError("INVALID_AMOUNT_FORMAT")
    try:
        n = Decimal(value.strip().replace(",", ""))
    except InvalidOperation as ex:
        raise ValueError("INVALID_AMOUNT") from ex
    if not n.is_finite() or n != n.to_integral_value():
        raise ValueError("NONINTEGRAL_AMOUNT")
    return n


def validate_bytes(raw: bytes, kind: str, *, enforce_pin: bool = True) -> dict:
    if kind not in PINS:
        raise ValueError("UNKNOWN_SOURCE_KIND")
    checksum = hashlib.sha256(raw).hexdigest()
    byte_size, accepted_sha = PINS[kind]
    if enforce_pin and (len(raw) != byte_size or checksum != accepted_sha):
        raise ValueError("SOURCE_IDENTITY_MISMATCH")
    try:
        decoded = raw.decode("cp1252", "strict")
    except UnicodeError as ex:
        raise ValueError("CP1252_DECODE_FAILED") from ex
    rdr = csv.reader(io.StringIO(decoded, newline=""))

    def take(label: str) -> list[str]:
        try:
            row = next(rdr)
        except StopIteration as ex:
            raise ValueError(f"MISSING_{label}") from ex
        if len(row) != 33:
            raise ValueError(f"{label}_WIDTH_NOT_33")
        return row

    if kind == "AS_PRESENTED":
        title = take("TITLE")
        if title[0].strip() != "2026-2027 As Presented" or any(v.strip() for v in title[1:]):
            raise ValueError("UNRECOGNISED_TITLE")
        labels = take("AMOUNT_LABELS")
        if (any(v.strip() for v in labels[:29]) or
            tuple(v.strip() for v in labels[29:]) !=
            ("Estimates (As Presented)", "Estimates", "Estimates", "Estimates")):
            raise ValueError("UNRECOGNISED_AMOUNT_LABELS")

    header = take("HEADER")
    if (tuple(header[:29]) != REQUIRED_HEADERS or
        tuple(x.strip() for x in header[29:]) != YEAR_LABELS[kind] or
        len(set(header)) != 33):
        raise ValueError("UNRECOGNISED_HEADER")

    total = [Decimal(0)] * 4
    footer = None
    blank_trailing = 0
    anomalies: list[str] = []
    count = 0
    seen: set[str] = set()
    missing = []
    header_record = 3 if kind == "AS_PRESENTED" else 1
    for record, row in enumerate(rdr, start=header_record + 1):
        if footer is not None:
            if len(row) != 33 or any(v.strip() for v in row):
                anomalies.append(f"NONBLANK_AFTER_FOOTER:{record}")
            else:
                blank_trailing += 1
            continue
        if len(row) != 33:
            anomalies.append(f"NONSTANDARD_WIDTH:{record}:{len(row)}")
            if len(missing) < 3:
                missing.append({"record": record, "width": len(row), "coding_block": row[0] if row else ""})
            continue
        code = row[0].strip()
        if code == "Total":
            if any(v.strip() for v in row[1:29]):
                anomalies.append(f"TOTAL_METADATA_NONBLANK:{record}")
            try:
                footer = ([amount(v) for v in row[29:]], record)
            except ValueError as exc:
                anomalies.append(f"INVALID_TOTAL_FOOTER:{record}:{exc}")
            continue
        if not code or code in seen:
            anomalies.append(f"BLANK_OR_DUPLICATE_CODE:{record}")
        elif code.count("/") != 7:
            anomalies.append(f"INVALID_CODING_BLOCK:{record}")
        seen.add(code)
        count += 1
        if not row[1].strip() or not row[2].strip():
            anomalies.append(f"MISSING_ORGANISATION:{record}")
        try:
            amounts = [amount(v) for v in row[29:]]
        except ValueError as exc:
            anomalies.append(f"AMOUNT_INVALID:{record}:{exc}")
            continue
        for j, n in enumerate(amounts):
            if n < 0:
                anomalies.append(f"NEGATIVE_ALLOCATION:{record}:{j+30}")
            total[j] += n

    if footer is None:
        anomalies.append("TOTAL_FOOTER_MISSING")
    else:
        for i, (expected, observed) in enumerate(zip(footer[0], total), 30):
            if expected != observed:
                anomalies.append(f"FOOTER_SUM_MISMATCH:COL{i}")
        if kind == "AS_PRESENTED" and blank_trailing != 2:
            anomalies.append(f"TRAILING_BLANK_COUNT:{blank_trailing}")
    if kind == "APPROVED":
        if not raw.endswith((b"\n", b"\r")):
            anomalies.append("UNTERMINATED_LAST_RECORD")
    if enforce_pin:
        if kind == "APPROVED" and (count != 20962 or len(missing) != 1):
            anomalies.append("PINNED_APPROVED_STRUCTURE_CHANGED")
        if kind == "AS_PRESENTED" and (count != 23559 or footer is None or footer[1] != 23563):
            anomalies.append("PINNED_PRESENTED_STRUCTURE_CHANGED")
    return {
        "kind": kind, "source_sha256": checksum, "bytes": len(raw),
        "source_identity": "PASS" if enforce_pin else "TEST_FIXTURE",
        "source_complete": not anomalies,
        "status": "SUPPORTING_EVIDENCE_ONLY" if not anomalies and kind == "AS_PRESENTED"
            else "FAILED_CLOSED_SOURCE_INCOMPLETE" if anomalies else "NEEDS_SOURCE_AUTHORITY_REVIEW",
        "complete_financial_rows": count,
        "distinct_coding_blocks": len(seen),
        "footer_record": footer[1] if footer else None,
        "year_totals_jmd": [str(x) for x in total],
        "trailing_blank_records": blank_trailing,
        "irregular_examples": missing,
        "reasons": anomalies[:30], "reason_count": len(anomalies),
        "canonical_2912_reextraction_accepted": False,
        "as_passed_authority_proven": False,
        "release_authorized": False,
    }


def main() -> int:
    p = argparse.ArgumentParser(description="JIF SE03 source completeness check; review only")
    p.add_argument("kind", choices=tuple(PINS))
    p.add_argument("csv_path", type=Path)
    args = p.parse_args()
    try:
        result = validate_bytes(args.csv_path.read_bytes(), args.kind)
    except (OSError, ValueError) as exc:
        result = {"status": "FAILED_CLOSED", "error": str(exc), "release_authorized": False}
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "SUPPORTING_EVIDENCE_ONLY" else 2


if __name__ == "__main__":
    raise SystemExit(main())
