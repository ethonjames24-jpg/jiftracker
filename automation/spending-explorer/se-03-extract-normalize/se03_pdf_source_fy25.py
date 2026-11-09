"""Pinned FY25 As Passed extraction and historical comparison; REVIEW ONLY.

This archive hash was first recorded on 2026-11-09, not matched to an earlier
cryptographic pin. Extraction never reads FACT. Classification never rewrites
the source or approves historical identity differences.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

from se03_pdf_source_extract import (
    PYMUPDF_VERSION, SourceRejected, derive_records, extract_pages, page_lines,
)
from se03_pdf_source_compare import programme_key
from se03_staging_fact_parity import FACT_HEADERS, PROJECTION_FIELDS, fact_signature
from se03_staging_normalize import HEX, Rejected, parse_csv

SOURCE_ID = "SRC_EOE_2025_26_PASSED"
YEAR = "2025/26"
PDF_SHA256 = "3b198b92fe575454fa22ce20c6e7da7bf55d713f8c5bef506bc3ff08301276aa"
PDF_BYTES = 27_466_667
PDF_PAGES = 694
CONTROLS = (2900, 64, 2805, 31, 1309182355000, -49133377000, 1260048978000)


def identity_collisions(rows):
    identities = Counter()
    for signature, count in rows.items():
        identities[tuple(signature[i] for i in (0, 1, 2, 3, 4, 5, 8))] += count
    return sum(n - 1 for n in identities.values())


def signatures(records):
    out = Counter()
    for row in records:
        if row["source_id"] != SOURCE_ID or row["fiscal_year"] != YEAR:
            raise SourceRejected("FY25_SOURCE_SCOPE_INVALID")
        if type(row["amount_jmd"]) is not int:
            raise SourceRejected("FY25_INTEGER_JMD_REQUIRED")
        grain, key = row["entity_type"], row["canonical_entity_key"]
        pattern = r"[0-9]{5}" if grain == "VOTE" else r"[0-9]{5}_[0-9]{2}_[0-9]{2}_[0-9]{3}_[0-9]{1,3}_[0-9]{5}"
        if grain not in ("VOTE", "ACTIVITY") or not re.fullmatch(pattern, key):
            raise SourceRejected("FY25_ENTITY_KEY_INVALID")
        if not re.fullmatch(r"[1-9][0-9]*", row["source_page"]) or not 1 <= int(row["source_page"]) <= PDF_PAGES:
            raise SourceRejected("FY25_PHYSICAL_PAGE_REQUIRED")
        if row["recurrent_or_capital"] not in ("RECURRENT", "CAPITAL"):
            raise SourceRejected("FY25_BUDGET_TYPE_INVALID")
        if grain == "VOTE":
            valid = (row["economic_code"] == "AIA" and row["measure_type"] == "APPROPRIATIONS_IN_AID"
                     and row["amount_jmd"] < 0 and row["recurrent_or_capital"] == "RECURRENT")
        else:
            valid = (bool(re.fullmatch(r"[0-9]{2}", row["economic_code"]))
                     and row["measure_type"] in ("AUTHORIZED_BY_LAW", "VOTED_ESTIMATE") and row["amount_jmd"] > 0)
        if not valid:
            raise SourceRejected("FY25_MEASURE_ECONOMIC_SIGN_INVALID")
        out[tuple(row[k] for k in PROJECTION_FIELDS)] += 1
    if identity_collisions(out):
        raise SourceRejected("FY25_DUPLICATE_SOURCE_IDENTITY")
    return out


def financial_controls(records):
    signatures(records)
    measures = Counter(r["measure_type"] for r in records)
    gross = sum(r["amount_jmd"] for r in records if r["entity_type"] != "VOTE")
    aia = sum(r["amount_jmd"] for r in records if r["entity_type"] == "VOTE")
    actual = (len(records), measures["AUTHORIZED_BY_LAW"], measures["VOTED_ESTIMATE"],
              measures["APPROPRIATIONS_IN_AID"], gross, aia, gross + aia)
    if actual != CONTROLS:
        raise SourceRejected("FY25_SOURCE_FINANCIAL_CONTROL_MISMATCH")
    return {"records": len(records), "measure_counts": dict(measures), "gross_jmd": gross,
            "aia_jmd": aia, "net_jmd": gross + aia}


def extract(pdf: Path):
    raw = pdf.read_bytes()
    if len(raw) != PDF_BYTES or hashlib.sha256(raw).hexdigest() != PDF_SHA256:
        raise SourceRejected("FY25_AS_PASSED_PDF_IDENTITY_MISMATCH")
    import fitz
    if fitz.VersionBind != PYMUPDF_VERSION:
        raise SourceRejected("PYMUPDF_RUNTIME_VERSION_MISMATCH")
    with fitz.open(stream=raw, filetype="pdf") as doc:
        if len(doc) != PDF_PAGES:
            raise SourceRejected("FY25_PAGE_COUNT_MISMATCH")
        observations = extract_pages(
            ((i + 1, page_lines(page), page.get_text("words")) for i, page in enumerate(doc)),
            "2025-2026", "2026-2027", explanatory_subtables=True,
        )
    records = derive_records(observations, SOURCE_ID, YEAR)
    report = financial_controls(records)
    report.update(result="SOURCE_FINANCIAL_EXTRACTION_REVIEW_ONLY", source_pdf_sha256=PDF_SHA256,
                  source_pdf_bytes=PDF_BYTES, pages_examined=PDF_PAGES, pymupdf_version=PYMUPDF_VERSION,
                  archive_pin_first_recorded="2026-11-09", matched_prior_cryptographic_pin=False,
                  programme_residual_records=sum(r["entity_type"] == "PROGRAMME" for r in records),
                  printed_aia_occurrences=len(observations["aia_observations"]),
                  fact_or_staging_input_used_for_extraction=False, publication_authorized=False)
    return records, report


def historical_signature(row):
    """Strict FY25 grammar adapter; the FY26 grammar remains unchanged."""
    if row["source_id"] != SOURCE_ID or row["fiscal_year"] != YEAR or row["estimate_version"] != "AS_PASSED":
        raise SourceRejected("FY25_BASELINE_SCOPE_INVALID")
    if (row["budget_number"], row["budget_type"]) not in (("1", "RECURRENT"), ("6", "CAPITAL")):
        raise SourceRejected("FY25_BASELINE_BUDGET_CONFLICT")
    adapted = dict(row)
    if row["measure_type"] == "APPROPRIATIONS_IN_AID":
        if not re.fullmatch(r"VOTE_[0-9]{5}", row["vote_id"]) or row["source_row"] != (
            "Vote-level Appropriations-in-Aid offset for Head " + row["vote_id"][5:]
        ) or row["budget_number"] != "1":
            raise SourceRejected("FY25_AIA_GRAMMAR_INVALID")
        if row["source_page"] and not re.fullmatch(r"[1-9][0-9]*", row["source_page"]):
            raise SourceRejected("FY25_BASELINE_PAGE_INVALID")
        adapted["source_row"] = "Vote " + row["vote_id"][5:] + "; economic AIA; APPROPRIATIONS_IN_AID"
    else:
        match = re.fullmatch(r"(Activity|Project) ([0-9]{5}); economic ([0-9]{2}); (AUTHORIZED_BY_LAW|VOTED_ESTIMATE)", row["source_row"])
        if not match or (match[1] == "Project") != (row["budget_number"] == "6"):
            raise SourceRejected("FY25_DETAIL_GRAMMAR_INVALID")
        if not re.fullmatch(r"ACT_[0-9]{5}_[0-9]{2}_[0-9]{2}_[0-9]{3}_[0-9]{1,3}_[0-9]{5}", row["activity_id"]):
            raise SourceRejected("FY25_BASELINE_ACTIVITY_KEY_INVALID")
        if not re.fullmatch(r"[1-9][0-9]*", row["source_page"]) or not 1 <= int(row["source_page"]) <= PDF_PAGES:
            raise SourceRejected("FY25_BASELINE_PAGE_INVALID")
        adapted["source_row"] = row["source_row"].replace("Project ", "Activity ", 1)
    signature = fact_signature(adapted)
    if (signature[3] == "VOTE") != (signature[6] < 0) or signature[6] == 0:
        raise SourceRejected("FY25_BASELINE_SIGN_INVALID")
    return signature


def classify_pair(source, baseline):
    """Explain only one precisely delimited difference; grant no equivalence."""
    changed = [i for i, (a, b) in enumerate(zip(source, baseline)) if a != b]
    if changed == [7] and source[3] == "VOTE" and baseline[7] == "":
        return "BASELINE_AIA_PAGE_OMITTED"
    if changed == [4] and source[3] == "ACTIVITY":
        a, b = source[4].split("_"), baseline[4].split("_")
        fields = [i for i, (x, y) in enumerate(zip(a, b)) if x != y]
        if fields == [4]:
            return "SOURCE_SUBPROGRAMME_CODE_DIFFERENCE"
        if fields == [5]:
            return "SOURCE_ACTIVITY_CODE_DIFFERENCE"
    return None


def compare(candidate, baseline):
    left = signatures(candidate)
    right = Counter(historical_signature(r) for r in baseline)
    if any(n != 1 for n in right.values()):
        raise SourceRejected("FY25_DUPLICATE_BASELINE_SIGNATURE")
    baseline_collisions = identity_collisions(right)
    extra, missing = list((left - right).elements()), list((right - left).elements())
    # Require one-to-one classified pairs. An ambiguous equal-amount match blocks.
    pairs = [(i, j, kind) for i, a in enumerate(extra) for j, b in enumerate(missing)
             if (kind := classify_pair(a, b))]
    source_degree = Counter(i for i, j, kind in pairs)
    baseline_degree = Counter(j for i, j, kind in pairs)
    classified = Counter(kind for i, j, kind in pairs if source_degree[i] == baseline_degree[j] == 1)
    totals = []
    for rows in (left, right):
        rollup = Counter()
        for signature, count in rows.items():
            rollup[programme_key(signature)] += signature[6] * count
        totals.append(rollup)
    different = sum(totals[0][k] != totals[1][k] for k in totals[0].keys() | totals[1].keys())
    exact = not extra and not missing
    explained = sum(classified.values()) == len(extra) == len(missing)
    return {
        "result": "SOURCE_PROJECTION_MATCH_REVIEW_ONLY" if exact else (
            "SOURCE_TOTALS_MATCH_IDENTITY_REVIEW_REQUIRED" if not different and explained and not baseline_collisions else "FAILED_CLOSED"),
        "source_candidate_rows": len(candidate), "historical_baseline_rows": len(baseline),
        "exact_shared_field_matches": sum((left & right).values()),
        "source_extra_signatures": len(extra), "baseline_missing_signatures": len(missing),
        "baseline_duplicate_financial_identities": baseline_collisions,
        "difference_class_counts": dict(classified),
        "unclassified_source_signatures": len(extra) - sum(classified.values()),
        "unclassified_baseline_signatures": len(missing) - sum(classified.values()),
        "programme_economic_groups_compared": len(totals[0].keys() | totals[1].keys()),
        "programme_economic_groups_different": different, "exact_row_parity_verified": exact,
        "identity_differences_approved": False, "full_33_field_fact_reconstruction_verified": False,
        "publication_authorized": False,
    }


def pinned_bytes(path, expected):
    raw = path.read_bytes()
    if not HEX.fullmatch(expected) or hashlib.sha256(raw).hexdigest() != expected:
        raise SourceRejected("FY25_INPUT_SHA256_MISMATCH")
    return raw


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    extraction = commands.add_parser("extract")
    extraction.add_argument("--pdf", type=Path, required=True)
    extraction.add_argument("--out-dir", type=Path, required=True)
    comparison = commands.add_parser("compare")
    comparison.add_argument("--candidate-jsonl", type=Path, required=True)
    comparison.add_argument("--candidate-sha256", required=True)
    comparison.add_argument("--baseline-csv", type=Path, required=True)
    comparison.add_argument("--baseline-sha256", required=True)
    args = parser.parse_args()
    try:
        if args.command == "extract":
            if args.out_dir.exists():
                raise SourceRejected("OUTPUT_DIRECTORY_ALREADY_EXISTS")
            records, report = extract(args.pdf)
            payload = "".join(json.dumps(r, sort_keys=True, separators=(",", ":")) + "\n" for r in records)
            args.out_dir.mkdir(parents=True, exist_ok=False)
            (args.out_dir / "source_records_LOCAL_ONLY.jsonl").write_text(payload, encoding="utf-8")
            report["source_records_sha256"] = hashlib.sha256(payload.encode()).hexdigest()
            (args.out_dir / "source_summary.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        else:
            raw = pinned_bytes(args.candidate_jsonl, args.candidate_sha256)
            baseline_raw, all_rows = parse_csv(args.baseline_csv, FACT_HEADERS)
            if not HEX.fullmatch(args.baseline_sha256) or hashlib.sha256(baseline_raw).hexdigest() != args.baseline_sha256:
                raise SourceRejected("FY25_INPUT_SHA256_MISMATCH")
            ids = [r["fact_id"] for r in all_rows]
            if not all(ids) or len(set(ids)) != len(ids):
                raise SourceRejected("MISSING_OR_DUPLICATE_FACT_ID")
            records = [json.loads(line) for line in raw.decode("utf-8").splitlines()]
            controls = financial_controls(records)
            baseline = [r for r in all_rows if r["fiscal_year"] == YEAR]
            if len(baseline) != CONTROLS[0]:
                raise SourceRejected("FY25_EXPECTED_2900_BASELINE_ROWS_REQUIRED")
            report = compare(records, baseline)
            report.update(controls=controls, candidate_sha256=args.candidate_sha256,
                          baseline_capture_sha256=args.baseline_sha256)
    except (SourceRejected, Rejected, OSError, ValueError, KeyError, TypeError) as exc:
        report = {"result": "FAILED_CLOSED", "error": str(exc) if isinstance(exc, (SourceRejected, Rejected)) else "MALFORMED_OR_UNREADABLE_INPUT",
                  "publication_authorized": False}
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["result"] in ("SOURCE_FINANCIAL_EXTRACTION_REVIEW_ONLY", "SOURCE_PROJECTION_MATCH_REVIEW_ONLY") else 2


if __name__ == "__main__":
    raise SystemExit(main())
