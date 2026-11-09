import tempfile
import unittest
from pathlib import Path

from se03_pdf_source_extract import (
    SourceRejected, canonical, derive_records, extract, extract_pages,
    read_cell, table_columns,
)


def word(text,x0=395,x1=427,y=220):
    return (x0,y,x1,y+8,text,0,0,0)


def line(text,y,x=29):
    return ((x,y,x+150,y+9),text)


def fixture(head="01000",programme="163",activity="10001",amount="123,456.0"):
    lines=[line("Head "+head+" - Example",50),line("Budget 1 - Recurrent",65),
           line("Function 01 - General Public Services",80),
           line("SubFunction 01 - Executive Services",95),
           line("Programme "+programme+" - Example",110),line("$ '000",120),
           line("Sub Programme 01 - Example",180),line("Activity "+activity+" - Example",190)]
    words=[word("2026-2027",386,421,150),word("2027-2028",436,471,150),
           word("21",25,32),word("-",375,377),word(amount),word("999,999.0",440,477)]
    return 1,lines,words


def observation(amount=100,kind="activity",code="10001",page=1):
    return dict(head="01000",budget="1",function="01",subfunction="01",programme="163",
                economic="21",measure="V",subprogramme="01",kind=kind,code=code,
                amount=amount,page=page,y=220,geometry={})


def bundle(details=(),summaries=(),aia=()):
    return {"details":list(details),"programme_summaries":list(summaries),"aia_observations":list(aia)}


class Tests(unittest.TestCase):
    def test_headers_define_current_and_law_columns(self):
        columns=table_columns(fixture()[2])
        self.assertEqual(columns["V"],(378.5,428.5))
        self.assertEqual(columns["L"],(328.5,378.5))

    def test_next_year_is_excluded_even_when_inside_old_left_edge_band(self):
        words=fixture()[2]
        amount,_=read_cell(words,220,table_columns(words)["V"])
        self.assertEqual(amount,123456000)

    def test_large_current_amount_starting_left_of_391_is_selected(self):
        words=[word("38,092,728.0",390,427),word("99,000,000.0",440,477)]
        self.assertEqual(read_cell(words,220,(379,429))[0],38092728000)

    def test_multiple_current_cell_tokens_rejected(self):
        with self.assertRaises(SourceRejected):
            read_cell([word("123",390,400),word("456.0",405,427)],220,(379,429))

    def test_crossing_column_boundary_rejected(self):
        with self.assertRaises(SourceRejected):read_cell([word("123.0",377,427)],220,(379,429))

    def test_crossing_numeric_token_cannot_be_ignored_beside_contained_token(self):
        with self.assertRaises(SourceRejected):
            read_cell([word("9,999.0",377,410),word("123.0",412,427)],220,(379,429))

    def test_empty_current_cell_rejected(self):
        with self.assertRaises(SourceRejected):read_cell([],220,(379,429))

    def test_dash_is_explicit_zero(self):
        self.assertEqual(read_cell([word("-",425,427)],220,(379,429))[0],0)

    def test_malformed_source_number_rejected(self):
        with self.assertRaises(SourceRejected):read_cell([word("1,,234.0")],220,(379,429))

    def test_missing_current_year_header_rejected(self):
        with self.assertRaises(SourceRejected):table_columns([word("2025-2026",386,421,150)])

    def test_repeated_year_headers_with_same_geometry_agree(self):
        words=fixture()[2];words += [word("2026-2027",386,421,300),word("2027-2028",436,471,300)]
        self.assertEqual(table_columns(words)["V"],(378.5,428.5))

    def test_conflicting_year_header_geometry_rejected(self):
        words=fixture()[2];words += [word("2026-2027",390,425,300),word("2027-2028",440,475,300)]
        with self.assertRaises(SourceRejected):table_columns(words)

    def test_source_detail_without_any_fact_input(self):
        result=extract_pages([fixture()])
        self.assertEqual(result["details"][0]["amount"],123456000)
        self.assertEqual(result["details"][0]["subprogramme"],"01")

    def test_units_must_be_explicit(self):
        n,lines,words=fixture();lines=[x for x in lines if "$" not in x[1]]
        with self.assertRaises(SourceRejected):extract_pages([(n,lines,words)])

    def test_capital_subprogramme_heading_without_dash(self):
        n,lines,words=fixture(head="01000C")
        lines=[(box,text.replace("Budget 1 - Recurrent","Budget 6 - Capital")
                .replace("Sub Programme 01 - Example","Sub Programme 01 Example")
                .replace("Activity 10001 - Example","Project 10001 - Example")) for box,text in lines]
        result=extract_pages([(n,lines,words)])
        self.assertEqual(result["details"][0]["kind"],"project")

    def test_changed_programme_does_not_inherit_subprogramme(self):
        n,lines,words=fixture(programme="164")
        lines=[x for x in lines if not x[1].startswith("Sub Programme")]
        with self.assertRaises(SourceRejected):extract_pages([fixture(),(2,lines,words)])

    def test_same_programme_adjacent_page_retains_explicit_subprogramme(self):
        n,lines,words=fixture(activity="10005")
        lines=[x for x in lines if not x[1].startswith("Sub Programme")]
        result=extract_pages([fixture(),(2,lines,words)])
        self.assertEqual(result["details"][1]["subprogramme"],"01")

    def test_skipped_page_cannot_carry_context(self):
        _,lines,words=fixture()
        with self.assertRaises(SourceRejected):extract_pages([fixture(),(3,lines,words)])

    def test_repeated_physical_page_rejected(self):
        with self.assertRaises(SourceRejected):extract_pages([fixture(),fixture()])

    def test_total_activity_closes_section(self):
        n,lines,words=fixture();lines += [line("Total Activity 10001 - Example",230)]
        words += [word("22",25,32,250),word("-",375,377,250),word("333.0",395,427,250)]
        self.assertEqual(len(extract_pages([(n,lines,words)])["details"]),1)

    def test_new_subprogramme_cannot_reuse_previous_activity(self):
        n,lines,words=fixture();lines += [line("Sub Programme 02 - New section",230)]
        words += [word("22",25,32,250),word("-",375,377,250),word("333.0",395,427,250)]
        rows=extract_pages([(n,lines,words)])["details"]
        self.assertEqual(len(rows),1)

    def test_programme_residual_does_not_double_count_details(self):
        rows=derive_records(bundle([observation(70)],[observation(100,"summary","")]))
        self.assertEqual([r["amount_jmd"] for r in rows],[70,30])
        self.assertEqual(rows[1]["source_method"],"PROGRAMME_SUMMARY_LESS_SOURCE_DETAILS")

    def test_negative_programme_residual_rejected(self):
        with self.assertRaises(SourceRejected):
            derive_records(bundle([observation(101)],[observation(100,"summary","")]))

    def test_detail_requires_own_programme_summary(self):
        with self.assertRaises(SourceRejected):derive_records(bundle([observation()]))

    def test_repeated_programme_summary_rejected(self):
        row=observation(100,"summary","")
        with self.assertRaises(SourceRejected):derive_records(bundle(summaries=[row,row]))

    def test_two_agreeing_aia_occurrences_become_one_negative_offset(self):
        rows=derive_records(bundle(aia=[observation(-10,page=2),observation(-10,page=3)]))
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]["amount_jmd"],-10)
        self.assertEqual(rows[0]["source_page"],"2")
        self.assertEqual(rows[0]["entity_type"],"VOTE")

    def test_disagreeing_aia_occurrences_rejected(self):
        with self.assertRaises(SourceRejected):
            derive_records(bundle(aia=[observation(-10),observation(-11)]))

    def test_single_aia_occurrence_not_silently_accepted(self):
        with self.assertRaises(SourceRejected):derive_records(bundle(aia=[observation(-10)]))

    def test_head_capital_suffix_conflict_rejected(self):
        row=observation();row["head"]="01000C"
        with self.assertRaises(SourceRejected):canonical(row,"ACTIVITY","TEST")

    def test_wrong_pdf_bytes_rejected_before_pdf_parse(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/"wrong.pdf";path.write_bytes(b"synthetic")
            with self.assertRaises(SourceRejected):extract(path)


if __name__=="__main__":unittest.main()
