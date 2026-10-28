"""JIF SE-03 source-pinned As Passed PDF heading/continuation inventory.

Read-only. Uses only explicit same-page headings; does NOT infer cross-page
sections, source amounts, canonical FACT records or release authority.
The optional private FACT CSV is read locally to create a review-only queue.
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

from se03_pdf_continuation_review import PageEvidence, classify_activity_continuation

PINNED_PDF_SHA256 = "32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6"
EXPECTED_PAGES = 716
PATTERNS = {
    "head": re.compile(r"^Head\s+(\d{5})\s*[-\u2013\u2014]", re.I),
    "budget": re.compile(r"^Budget\s+([16])\s*[-\u2013\u2014]", re.I),
    "function": re.compile(r"^Function\s+(\d{2})\s*[-\u2013\u2014]", re.I),
    "subfunction": re.compile(r"^Sub\s*Function\s+(\d{2})\s*[-\u2013\u2014]", re.I),
    "programme": re.compile(r"^Programme\s+(\d{3})\s*[-\u2013\u2014]", re.I),
    "subprogramme": re.compile(r"^Sub\s*Programme\s+(\d{1,3})\s*[-\u2013\u2014]", re.I),
    "activity": re.compile(r"^Activity\s+(\d{5})\b", re.I),
    "project": re.compile(r"^Project\s+(\d{5})\b", re.I),
}
ACTIVITY_SOURCE = re.compile(r"^Activity\s+(\d{5});")
ECON_ID = re.compile(r"^ECON_(\d{2})$")


def heading_inventory(lines: list[str], physical_page: int) -> dict:
    """Parse anchored explicit headings without carrying section data from elsewhere."""
    values = {kind: [] for kind in PATTERNS}
    for line in lines:
        normalized_line = re.sub(r"\s+", " ", line.strip())
        for kind, pattern in PATTERNS.items():
            match = pattern.match(normalized_line)
            if match:
                values[kind].append(match.group(1))
                break
    unique = {k: list(dict.fromkeys(v)) for k, v in values.items()}
    boundaries = [k for k in ("head", "budget", "function", "subfunction", "programme", "subprogramme")
                  if len(unique[k]) > 1]
    return {
        "physical_page": physical_page,
        "explicit": unique,
        "multiple_section_headings": boundaries,
        "has_activity_heading": bool(values["activity"] or values["project"]),
        "no_inferred_values": True,
    }


def page_evidence(inventory: dict) -> PageEvidence:
    """Convert only single explicitly observed page headings to continuity checks."""
    e = inventory["explicit"]
    single = lambda key: e[key][0] if len(e[key]) == 1 else None
    return PageEvidence(
        physical_page=inventory["physical_page"],
        head=single("head"), vote=single("budget"), programme=single("programme"),
        activity_headings=tuple(e["activity"] + e["project"]),
        section_boundary=bool(inventory["multiple_section_headings"]),
    )


def dict_lines(page) -> list[str]:
    result = []
    for block in page.get_text("dict").get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            s = " ".join(span.get("text", "") for span in line.get("spans", [])).strip()
            if s:
                result.append(s)
    return result


def economic_candidate_count(page, fact: dict) -> int:
    """Replicate existing classifier's candidate-column search, without assigning context."""
    code = ECON_ID.fullmatch(fact.get("economic_id", ""))
    if not code:
        return 0
    try:
        amt = Decimal(fact["amount_jmd_normalized"].replace(",", ""))
    except (KeyError, InvalidOperation, ValueError):
        return 0
    if not amt.is_finite() or amt % 1000:
        return 0
    expected = f"{amt / 1000:,.1f}"
    measure = fact.get("measure_type")
    if measure == "AUTHORIZED_BY_LAW":
        left, right = 333, 390
    elif measure == "VOTED_ESTIMATE":
        left, right = 391, 449
    else:
        return 0
    words = page.get_text("words")
    codes = [w for w in words if w[4] == code.group(1) and w[0] < 50 and w[1] > 85]
    matches = set()
    for token in codes:
        cy = token[1]
        if any(abs(w[1] - cy) < 1.6 and left <= w[0] < right and w[4] == expected for w in words):
            matches.add(round(cy, 2))
    return len(matches)


def review_continuation(previous: dict | None, current: dict, fact: dict, economic_count: int) -> dict:
    source = ACTIVITY_SOURCE.match(fact.get("source_row", ""))
    if not source:
        return {"status": "NON_ACTIVITY_GRAIN_SEPARATE_RULE", "canonical_row_reconstructed": False,
                "requires_source_page_human_review": True, "release_authorized": False}
    if current["explicit"]["activity"] or current["explicit"]["project"]:
        return {"status": "ON_PAGE_HEADING_DEFER_TO_EXISTING_CLASSIFIER", "canonical_row_reconstructed": False,
                "requires_source_page_human_review": True, "release_authorized": False}
    return classify_activity_continuation(
        page_evidence(previous) if previous else None, page_evidence(current),
        source.group(1), economic_count,
    )


def inventory(pdf_path: Path, private_fact_csv: Path | None = None) -> dict:
    raw = pdf_path.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    if sha != PINNED_PDF_SHA256:
        raise ValueError("SOURCE_PDF_SHA256_MISMATCH")
    import fitz  # Optional PyMuPDF runtime dependency, not needed for pure parser tests.
    document = fitz.open(stream=raw, filetype="pdf")
    try:
        if len(document) != EXPECTED_PAGES:
            raise ValueError("SOURCE_PAGE_COUNT_MISMATCH")
        pages = [heading_inventory(dict_lines(document[i]), i + 1) for i in range(len(document))]
        result = {
            "result": "PDF_PAGE_INVENTORY_REVIEW_ONLY",
            "source_pdf_sha256": sha, "physical_pages": len(pages),
            "page_inventory": pages, "queue": [], "queue_status_counts": {},
            "source_derived_2912_fact_rows_accepted": False,
            "publication_authorized": False,
        }
        if private_fact_csv is not None:
            counts = Counter()
            queue = []
            eligible = 0
            with private_fact_csv.open(encoding="utf-8-sig", newline="") as f:
                for row in csv.DictReader(f):
                    if row.get("fiscal_year") != "2026/27":
                        continue
                    if row.get("source_id") != "SRC_EOE_2026_27_PASSED":
                        raise ValueError("UNEXPECTED_SOURCE_ID")
                    eligible += 1
                    page_raw = row.get("source_page", "")
                    n = int(page_raw) if page_raw.isdecimal() else 0
                    if not 1 <= n <= len(document):
                        verdict = {"status": "INVALID_SOURCE_PAGE_REVIEW_REQUIRED"}
                    elif row.get("measure_type") == "APPROPRIATIONS_IN_AID":
                        verdict = {"status": "AIA_VOTE_LEVEL_RULE_REQUIRED"}
                    else:
                        prev = pages[n - 2] if n > 1 else None
                        matches = economic_candidate_count(document[n - 1], row)
                        verdict = review_continuation(prev, pages[n - 1], row, matches)
                    status = verdict["status"]
                    counts[status] += 1
                    if status != "ON_PAGE_HEADING_DEFER_TO_EXISTING_CLASSIFIER":
                        queue.append({
                            "fact_id": row.get("fact_id", ""), "source_page": page_raw,
                            "source_row_type": "AIA" if row.get("measure_type") == "APPROPRIATIONS_IN_AID" else
                                               "ACTIVITY" if ACTIVITY_SOURCE.match(row.get("source_row", "")) else "OTHER",
                            "economic_id": row.get("economic_id", ""),
                            "status": status, "human_review_required": True,
                            "canonical_reconstruction_accepted": False,
                        })
            result["fy26_fact_rows_examined"] = eligible
            result["queue"] = queue
            result["queue_status_counts"] = dict(sorted(counts.items()))
            result["queue_is_complete_canonical_extraction"] = False
        return result
    finally:
        document.close()


def main() -> int:
    ap = argparse.ArgumentParser(description="JIF SE-03 source-pinned PDF page inventory, review only")
    ap.add_argument("pdf", type=Path)
    ap.add_argument("--private-fact-csv", type=Path)
    ap.add_argument("--output-json", type=Path, required=True)
    args = ap.parse_args()
    try:
        out = inventory(args.pdf, args.private_fact_csv)
    except (OSError, ValueError, KeyError) as exc:
        print(json.dumps({"result": "FAILED_CLOSED", "error": str(exc), "publication_authorized": False}))
        return 2
    args.output_json.write_text(json.dumps(out, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    overview = {k: v for k, v in out.items() if k not in ("page_inventory", "queue")}
    overview["page_inventory_record_count"] = len(out["page_inventory"])
    overview["review_queue_records"] = len(out["queue"])
    print(json.dumps(overview, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
