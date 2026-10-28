"""Run pinned SE-03 source-completeness verdicts against the two local official CSVs.

This is an EXPECTED-FAIL classification check, not a release or source-import approval.
No downloads, public-data writes, credentials or publishing actions.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from se03_source_completeness import validate_bytes


def evaluate(approved: Path, presented: Path) -> dict:
    a = validate_bytes(approved.read_bytes(), "APPROVED")
    p = validate_bytes(presented.read_bytes(), "AS_PRESENTED")
    required_approved = {
        "TOTAL_FOOTER_MISSING", "UNTERMINATED_LAST_RECORD", "NONSTANDARD_WIDTH:20964:5"
    }
    a_reasons = set(a["reasons"])
    checks = {
        "approved_exact_source_identity": a["source_identity"] == "PASS",
        "approved_recognized_truncation": required_approved.issubset(a_reasons),
        "approved_content_rejected": a["status"] == "FAILED_CLOSED_SOURCE_INCOMPLETE" and not a["source_complete"],
        "approved_complete_row_count": a["complete_financial_rows"] == 20962,
        "approved_raw_sum_diagnostic_only": a["year_totals_jmd"][0] == "1422984394000.00",
        "presented_exact_source_identity": p["source_identity"] == "PASS",
        "presented_support_only": p["status"] == "SUPPORTING_EVIDENCE_ONLY" and p["source_complete"],
        "presented_complete_rows": p["complete_financial_rows"] == 23559,
        "presented_total_footer": p["footer_record"] == 23563 and p["trailing_blank_records"] == 2,
        "presented_gross_diagnostic_only": p["year_totals_jmd"][0] == "1490511399000.00",
        "no_canonical_or_release_authority": not any((a["canonical_2912_reextraction_accepted"],
            p["canonical_2912_reextraction_accepted"], a["release_authorized"],
            p["release_authorized"])),
    }
    return {
        "result": "SOURCE_CLASSIFICATION_EXPECTED_PASS_REVIEW_ONLY" if all(checks.values()) else "FAILED_CLOSED",
        "checks": checks,
        "approved_reasons": a["reasons"],
        "presented_reasons": p["reasons"],
        "approved_source_sha256": a["source_sha256"],
        "presented_source_sha256": p["source_sha256"],
        "canonical_2912_source_reconstruction_accepted": False,
        "publication_authorized": False,
    }


def main() -> int:
    p = argparse.ArgumentParser(description="Read-only SE-03 native official-file classification")
    p.add_argument("approved_csv", type=Path)
    p.add_argument("as_presented_csv", type=Path)
    args = p.parse_args()
    try:
        report = evaluate(args.approved_csv, args.as_presented_csv)
    except (OSError, ValueError, UnicodeError) as ex:
        report = {"result": "FAILED_CLOSED", "error": str(ex), "publication_authorized": False}
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["result"] == "SOURCE_CLASSIFICATION_EXPECTED_PASS_REVIEW_ONLY" else 2


if __name__ == "__main__":
    raise SystemExit(main())
