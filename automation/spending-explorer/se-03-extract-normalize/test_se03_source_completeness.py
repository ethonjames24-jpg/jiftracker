"""Synthetic-only source completeness checks; no private source data."""
from __future__ import annotations
import csv
import io
import unittest
from se03_source_completeness import REQUIRED_HEADERS, YEAR_LABELS, validate_bytes


def fixture(kind="AS_PRESENTED", *, records=2, title=True, footer=True, blanks=2,
            malformed=False, wrong_sum=False, duplicate=False, extra_after=False,
            negative=False, bad_header=False):
    out = io.StringIO(newline="")
    w = csv.writer(out, lineterminator="\r\n")
    if kind == "AS_PRESENTED" and title:
        w.writerow(["2026-2027 As Presented"] + [""] * 32)
        w.writerow([""] * 29 + ["Estimates (As Presented)", "Estimates", "Estimates", "Estimates"])
    h = list(REQUIRED_HEADERS) + list(YEAR_LABELS[kind])
    if bad_header:
        h[0] = "Wrong"
    w.writerow(h)
    for i in range(records):
        key = f"0100000000/11/1000/0101/16301/10005/{210101+i}/00"
        if duplicate:
            key = "0100000000/11/1000/0101/16301/10005/210101/00"
        if malformed and i == records - 1:
            w.writerow([key, "1000", "Org"])
        else:
            value = "-100.00" if negative else "100.00"
            w.writerow([key, "1000", "Org"] + [""] * 26 + [value] * 4)
    if footer:
        vals = ["0.00"] * 4 if wrong_sum else [str(records * (-100 if negative else 100)) + ".00"] * 4
        w.writerow(["Total"] + [""] * 28 + vals)
        for _ in range(blanks):
            w.writerow([""] * 33)
    if extra_after:
        w.writerow(["Unexpected"] + [""] * 32)
    return out.getvalue().encode("cp1252")


class Tests(unittest.TestCase):
    def check(self, kind="AS_PRESENTED", **kwargs):
        return validate_bytes(fixture(kind, **kwargs), kind, enforce_pin=False)

    def test_complete_presented_is_only_support(self):
        r = self.check(); self.assertEqual(r["status"], "SUPPORTING_EVIDENCE_ONLY")
        self.assertFalse(r["release_authorized"])

    def test_approved_without_footer_fails(self):
        r = self.check("APPROVED", footer=False, blanks=0)
        self.assertIn("TOTAL_FOOTER_MISSING", r["reasons"])

    def test_truncated_record(self):
        r = self.check("APPROVED", malformed=True, footer=False)
        self.assertTrue(any("NONSTANDARD_WIDTH" in x for x in r["reasons"]))

    def test_missing_presented_footer(self):
        self.assertIn("TOTAL_FOOTER_MISSING", self.check(footer=False)["reasons"])

    def test_missing_footer_even_if_hash_correct_fixture(self):
        self.assertEqual(self.check(footer=False)["status"], "FAILED_CLOSED_SOURCE_INCOMPLETE")

    def test_wrong_footer(self):
        self.assertTrue(any("FOOTER_SUM_MISMATCH" in x for x in self.check(wrong_sum=True)["reasons"]))

    def test_extra_nonempty_record_after_footer(self):
        self.assertTrue(any("NONBLANK_AFTER_FOOTER" in x for x in self.check(extra_after=True)["reasons"]))

    def test_trailing_blank_count(self):
        self.assertIn("TRAILING_BLANK_COUNT:1", self.check(blanks=1)["reasons"])

    def test_duplicate_coding_block(self):
        self.assertTrue(any("DUPLICATE_CODE" in x for x in self.check(duplicate=True)["reasons"]))

    def test_negative_source_amount(self):
        self.assertTrue(any("NEGATIVE_ALLOCATION" in x for x in self.check(negative=True)["reasons"]))

    def test_real_header_nbsp_vs_double_ascii_space(self):
        # Equivalence is limited to whitespace within known header labels.
        original = fixture("AS_PRESENTED")
        altered = original.replace(b"Int Org/Pub Body\xa0 Desc", b"Int Org/Pub Body  Desc", 1)
        self.assertNotEqual(original, altered)
        result = validate_bytes(altered, "AS_PRESENTED", enforce_pin=False)
        self.assertEqual(result["status"], "SUPPORTING_EVIDENCE_ONLY")

    def test_semantic_header_change_still_fails(self):
        altered = fixture("APPROVED").replace(b"Fin Pat Type", b"Fin Pat Tipe", 1)
        with self.assertRaisesRegex(ValueError, "UNRECOGNISED_HEADER mismatches"):
            validate_bytes(altered, "APPROVED", enforce_pin=False)

    def test_duplicate_normalized_header_still_fails(self):
        altered = fixture("APPROVED").replace(b"Int Org/Pub Body\xa0 Desc", b"Int Org/Pub Body", 1)
        with self.assertRaisesRegex(ValueError, "UNRECOGNISED_HEADER"):
            validate_bytes(altered, "APPROVED", enforce_pin=False)

    def test_bad_header_rejected(self):
        with self.assertRaisesRegex(ValueError, "UNRECOGNISED_HEADER"):
            self.check(bad_header=True)

    def test_pin_mismatch_rejected(self):
        with self.assertRaisesRegex(ValueError, "SOURCE_IDENTITY_MISMATCH"):
            validate_bytes(fixture(), "AS_PRESENTED", enforce_pin=True)

    def test_unknown_kind_rejected(self):
        with self.assertRaisesRegex(ValueError, "UNKNOWN_SOURCE_KIND"):
            validate_bytes(b"", "NONEXISTENT")

    def test_no_auto_authorization(self):
        for kind in ("APPROVED", "AS_PRESENTED"):
            self.assertFalse(self.check(kind)["canonical_2912_reextraction_accepted"])

    def test_unterminated_approved_fails(self):
        b = fixture("APPROVED", footer=False).rstrip(b"\r\n")
        r = validate_bytes(b, "APPROVED", enforce_pin=False)
        self.assertIn("UNTERMINATED_LAST_RECORD", r["reasons"])

    def test_invalid_amount_fails(self):
        b = fixture().replace(b"100.00", b"1e999", 1)
        r = validate_bytes(b, "AS_PRESENTED", enforce_pin=False)
        self.assertTrue(any("AMOUNT_INVALID" in s for s in r["reasons"]))

    def test_title_is_required(self):
        with self.assertRaisesRegex(ValueError, "UNRECOGNISED_TITLE"):
            self.check(title=False)


if __name__ == "__main__":
    unittest.main()
