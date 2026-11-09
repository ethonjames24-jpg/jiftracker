"""SE-03 PDF page-continuity classification, deliberately review-only.

A prior activity heading is insufficient for canonical extraction. Require explicit
adjacent-page section identity; even a match is a human-review candidate.
"""
from __future__ import annotations
from dataclasses import dataclass

@dataclass(frozen=True)
class PageEvidence:
    physical_page: int
    head: str | None
    vote: str | None
    programme: str | None
    activity_headings: tuple[str, ...]
    section_boundary: bool = False


def classify_activity_continuation(
    previous: PageEvidence | None,
    current: PageEvidence,
    expected_activity: str,
    economic_matches: int,
    *,
    grain: str = "ACTIVITY",
) -> dict:
    """Identify reviewable cases; never calculate values or authorize a release."""
    if grain == "AIA_VOTE":
        status = "AIA_VOTE_SOURCE_RULE_REQUIRED"
    elif grain == "PROGRAMME":
        status = "PROGRAMME_SOURCE_RULE_REQUIRED"
    elif grain != "ACTIVITY":
        status = "UNKNOWN_GRAIN_FAILED_CLOSED"
    elif economic_matches != 1:
        status = "ECONOMIC_COLUMN_AMBIGUOUS_OR_MISSING"
    elif current.activity_headings:
        status = "CURRENT_PAGE_HEADING_REQUIRES_ON_PAGE_CLASSIFIER"
    elif previous is None or current.physical_page != previous.physical_page + 1:
        status = "NO_ADJACENT_PRIOR_PAGE_EVIDENCE"
    elif previous.section_boundary or current.section_boundary:
        status = "SECTION_BOUNDARY_REQUIRES_REVIEW"
    elif not all((previous.head, previous.vote, previous.programme,
                  current.head, current.vote, current.programme)):
        status = "INSUFFICIENT_EXPLICIT_SECTION_IDENTITY"
    elif ((previous.head, previous.vote, previous.programme) !=
          (current.head, current.vote, current.programme)):
        status = "SECTION_IDENTITY_CHANGED"
    elif len(previous.activity_headings) == 0:
        status = "NO_PRIOR_EXPLICIT_ACTIVITY_HEADING"
    elif previous.activity_headings[-1] != expected_activity:
        status = "PREVIOUS_ACTIVITY_NOT_EXPECTED_ACTIVITY"
    else:
        status = "CONTINUATION_SCOPE_CANDIDATE_REVIEW_ONLY"
    return {
        "status": status,
        "previous_page": previous.physical_page if previous else None,
        "current_page": current.physical_page,
        "expected_activity": expected_activity,
        "economic_matches": economic_matches,
        "canonical_row_reconstructed": False,
        "requires_source_page_human_review": True,
        "release_authorized": False,
    }
