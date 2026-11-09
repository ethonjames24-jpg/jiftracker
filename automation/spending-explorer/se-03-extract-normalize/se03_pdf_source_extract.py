"""Pinned FY26 As Passed PDF financial extraction, offline and REVIEW ONLY.

Extraction takes no FACT/staging input. Printed year headers locate columns;
explicit source hierarchy locates rows. Programme residuals are identified as
derived arithmetic, not printed Activity facts. No release authority is granted.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from decimal import Decimal
from pathlib import Path

PDF_SHA256 = "32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6"
PDF_BYTES = 23_172_267
PDF_PAGES = 716
PYMUPDF_VERSION = "1.26.6"
CONTEXT = {
    "head": r"^Head\s+(\d{5}C?)\s*[-–—]",
    "budget": r"^Budget\s+([16])\s*[-–—]",
    "function": r"^Function\s+(\d{2})\s*[-–—]",
    "subfunction": r"^Sub\s*Function\s+(\d{2})\s*[-–—]",
    "programme": r"^Programme\s+(\d{3})\s*[-–—]",
}
MEASURES = {"L":"AUTHORIZED_BY_LAW", "V":"VOTED_ESTIMATE"}
BASE_FIELDS = ("head", "budget", "function", "subfunction", "programme")
GROUP_FIELDS = BASE_FIELDS + ("economic", "measure")


class SourceRejected(ValueError):
    pass


def table_columns(words: list) -> dict:
    """Derive the current/law cells from adjacent printed fiscal-year headers."""
    pairs = []
    for current in words:
        if current[4] != "2026-2027" or not (125 < current[1] < 750 and 330 < current[0] < 450):
            continue
        center = (current[0]+current[2])/2
        for following in words:
            if following[4] != "2027-2028" or abs(current[1]-following[1]) >= 1.6:
                continue
            next_center = (following[0]+following[2])/2
            width = next_center-center
            if 40 < width < 60:
                left, right = center-width/2, center+width/2
                pairs.append({"L":(left-width,left), "V":(left,right)})
    # Some pages repeat the same table header. All observed pairs must agree
    # on the actual column geometry; disagreement is still a blocking error.
    layouts={tuple(round(value,3) for measure in ("L","V") for value in pair[measure])
             for pair in pairs}
    if len(layouts) != 1:
        raise SourceRejected("PRINTED_FISCAL_COLUMN_HEADERS_NOT_UNIQUE")
    return pairs[0]


def read_cell(words: list, y: float, bounds: tuple[float,float]) -> tuple[int,dict]:
    """Read a complete word inside the printed cell, never a left-edge search."""
    left,right = bounds
    crossing=[w for w in words if abs(w[1]-y)<1.6 and w[0]<right and w[2]>left
              and not (left<=w[0] and w[2]<right) and re.fullmatch(r"[-0-9,.]+",w[4])]
    if crossing:
        raise SourceRejected("PRINTED_NUMERIC_TOKEN_CROSSES_COLUMN_BOUNDARY")
    tokens = [w for w in words if abs(w[1]-y)<1.6 and left<=w[0] and w[2]<right]
    if len(tokens) != 1:
        raise SourceRejected("PRINTED_CELL_NOT_ONE_COMPLETE_TOKEN")
    word = tokens[0]
    text = word[4]
    if text == "-":
        amount = 0
    elif re.fullmatch(r"(?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\.[0-9]",text):
        value = Decimal(text.replace(",",""))*1000
        if value != value.to_integral_value():
            raise SourceRejected("NONINTEGRAL_PRINTED_JMD")
        amount = int(value)
    else:
        raise SourceRejected("PRINTED_AMOUNT_GRAMMAR_INVALID")
    return amount, {"cell_left":left,"cell_right":right,"word_bbox":list(word[:4])}


def page_lines(page) -> list:
    result=[]
    for block in page.get_text("dict").get("blocks",[]):
        for line in block.get("lines",[]):
            text=" ".join(s.get("text","") for s in line.get("spans",[])).strip()
            if text:
                result.append((line["bbox"],text))
    return result


def extract_pages(pages) -> dict:
    """Pure geometry parser; pages yield (physical_page, line tuples, words)."""
    details,summaries,aia = [],[],[]
    active,subprogramme,previous_context = None,None,None
    previous_page=0
    for physical_page,lines,words in pages:
        if physical_page!=previous_page+1:
            raise SourceRejected("SOURCE_PAGES_NOT_CONSECUTIVE_FROM_ONE")
        previous_page=physical_page
        context={}
        for kind,pattern in CONTEXT.items():
            values={m[1] for box,text in lines if box[1]<125 and (m:=re.match(pattern,text,re.I))}
            if len(values)>1:
                raise SourceRejected("CONFLICTING_PRINTED_PAGE_CONTEXT")
            if values:
                context[kind]=next(iter(values))
        if context!=previous_context:
            active,subprogramme=None,None
        previous_context=context
        events=[]
        for box,text in lines:
            y=box[1]
            if not 130<y<750:
                continue
            for kind,pattern in (
                ("sub",r"^Sub\s*Programme\s+([0-9]{1,3})(?:\s*[-–—]|\s+[A-Za-z])"),
                ("activity",r"^Activity\s+([0-9]{5})\s*[-–—]"),
                ("project",r"^Project\s+([0-9]{5})\s*[-–—]"),
            ):
                if box[0]<100 and (m:=re.match(pattern,text,re.I)):
                    events.append((y,0,kind,m[1]));break
            else:
                if text.startswith(("Total Activity","Total Project")):
                    events.append((y,0,"end_detail",""))
                elif text.startswith("Analysis of Expenditure"):
                    events.append((y,0,"summary",""))
                elif text.startswith("Total Programme"):
                    events.append((y,0,"end_summary",""))
                elif text.startswith("Less Appropriations-In-Aid"):
                    events.append((y,0,"aia",""))
        for word in words:
            if 20<word[0]<40 and 130<word[1]<750 and re.fullmatch(r"[0-9]{2}",word[4]):
                events.append((word[1],1,"economic",word[4]))
        columns=None

        def cell(y,measure):
            nonlocal columns
            if not any(re.search(r"\$\s*['’]\s*000",text) for _,text in lines):
                raise SourceRejected("PRINTED_THOUSANDS_UNIT_MISSING")
            if columns is None:
                columns=table_columns(words)
            return read_cell(words,y,columns[measure])

        for y,_,kind,code in sorted(events):
            if kind=="sub":
                subprogramme=code
                active=None
            elif kind in ("activity","project"):
                if not all(k in context for k in CONTEXT) or subprogramme is None:
                    raise SourceRejected("DETAIL_HIERARCHY_CONTEXT_INCOMPLETE")
                if (kind=="project") != (context["budget"]=="6"):
                    raise SourceRejected("PROJECT_BUDGET_CONTEXT_CONFLICT")
                active=(kind,code,subprogramme)
            elif kind=="end_detail":
                active=None
            elif kind=="summary":
                active=("summary","",None) if "programme" in context else None
            elif kind=="end_summary":
                if active and active[0]=="summary":
                    active=None
            elif kind=="aia":
                if not all(k in context for k in ("head","budget")):
                    raise SourceRejected("AIA_VOTE_CONTEXT_MISSING")
                amount,geometry=cell(y,"V")
                if amount:
                    aia.append(dict(context,page=physical_page,y=y,amount=-amount,geometry=geometry))
            elif kind=="economic" and active:
                if not all(k in context for k in CONTEXT):
                    raise SourceRejected("ECONOMIC_HIERARCHY_CONTEXT_INCOMPLETE")
                for measure in ("L","V"):
                    amount,geometry=cell(y,measure)
                    if amount:
                        row=dict(context,page=physical_page,y=y,kind=active[0],code=active[1],
                                 subprogramme=active[2],economic=code,measure=measure,amount=amount,geometry=geometry)
                        (summaries if active[0]=="summary" else details).append(row)
    return {"details":details,"programme_summaries":summaries,"aia_observations":aia}


def canonical(row:dict,grain:str,method:str) -> dict:
    head=row["head"]
    if head.endswith("C") != (row["budget"]=="6"):
        raise SourceRejected("HEAD_BUDGET_SUFFIX_CONFLICT")
    parts=[head.removesuffix("C")]
    if grain!="VOTE":
        parts += [row["function"],row["subfunction"],row["programme"]]
    if grain=="ACTIVITY":
        parts += [row["subprogramme"],row["code"]]
    return {
        "source_id":"SRC_EOE_2026_27_PASSED","fiscal_year":"2026/27",
        "measure_type":"APPROPRIATIONS_IN_AID" if grain=="VOTE" else MEASURES[row["measure"]],
        "entity_type":grain,"canonical_entity_key":"_".join(parts),
        "economic_code":"AIA" if grain=="VOTE" else row["economic"],
        "amount_jmd":row["amount"],"source_page":str(row["page"]),
        "recurrent_or_capital":"CAPITAL" if row["budget"]=="6" else "RECURRENT",
        "budget_number":row["budget"],"vote_id":"VOTE_"+head,
        "source_method":method,"source_y":row["y"],
        "source_geometry":row.get("geometry"),
    }


def derive_records(observations:dict) -> list[dict]:
    details=observations["details"]
    totals=Counter()
    detail_refs=defaultdict(list)
    for row in details:
        key=tuple(row[k] for k in GROUP_FIELDS)
        totals[key]+=row["amount"]
        detail_refs[key].append({"page":row["page"],"y":row["y"]})
    records=[canonical(row,"ACTIVITY","PRINTED_DETAIL_CELL") for row in details]
    summaries={}
    for row in observations["programme_summaries"]:
        key=tuple(row[k] for k in GROUP_FIELDS)
        if key in summaries:
            raise SourceRejected("REPEATED_PROGRAMME_ECONOMIC_SUMMARY")
        summaries[key]=row
    if set(totals)-set(summaries):
        raise SourceRejected("DETAIL_WITHOUT_PROGRAMME_SUMMARY")
    for key,row in summaries.items():
        residual=row["amount"]-totals[key]
        if residual<0:
            raise SourceRejected("NEGATIVE_PROGRAMME_RESIDUAL")
        if residual:
            record=canonical(dict(row,amount=residual),"PROGRAMME","PROGRAMME_SUMMARY_LESS_SOURCE_DETAILS")
            record["derivation"]={"printed_programme_amount":row["amount"],
                                  "source_detail_amount_sum":totals[key],"detail_refs":detail_refs[key]}
            records.append(record)
    grouped=defaultdict(list)
    for row in observations["aia_observations"]:
        grouped[(row["head"],row["budget"])].append(row)
    for rows in grouped.values():
        # Same vote deduction appears in two printed summaries; never add twice.
        if len(rows)!=2 or len({r["amount"] for r in rows})!=1:
            raise SourceRejected("AIA_REPEATED_SUMMARIES_NOT_TWO_IDENTICAL_AMOUNTS")
        first=min(rows,key=lambda r:(r["page"],r["y"]))
        record=canonical(first,"VOTE","NEGATIVE_PRINTED_AIA_DEDUCTION_ONCE")
        record["source_occurrences"]=[{"page":r["page"],"y":r["y"]} for r in rows]
        records.append(record)
    return records


def extract(pdf:Path) -> tuple[list,dict]:
    raw=pdf.read_bytes()
    if len(raw)!=PDF_BYTES or hashlib.sha256(raw).hexdigest()!=PDF_SHA256:
        raise SourceRejected("AS_PASSED_PDF_IDENTITY_MISMATCH")
    import fitz
    if fitz.VersionBind!=PYMUPDF_VERSION:
        raise SourceRejected("PYMUPDF_RUNTIME_VERSION_MISMATCH")
    with fitz.open(stream=raw,filetype="pdf") as doc:
        if len(doc)!=PDF_PAGES:
            raise SourceRejected("AS_PASSED_PAGE_COUNT_MISMATCH")
        observations=extract_pages((i+1,page_lines(page),page.get_text("words")) for i,page in enumerate(doc))
    records=derive_records(observations)
    measures=Counter(r["measure_type"] for r in records)
    gross=sum(r["amount_jmd"] for r in records if r["entity_type"]!="VOTE")
    aia=sum(r["amount_jmd"] for r in records if r["entity_type"]=="VOTE")
    # Baseline controls can reject, but never select or fabricate source cells.
    if (len(records),measures["AUTHORIZED_BY_LAW"],measures["VOTED_ESTIMATE"],
        measures["APPROPRIATIONS_IN_AID"],gross,aia,gross+aia)!=(
            2912,61,2821,30,1490511399000,-48730045000,1441781354000):
        raise SourceRejected("SOURCE_FINANCIAL_CONTROL_MISMATCH")
    report={
        "result":"SOURCE_FINANCIAL_EXTRACTION_REVIEW_ONLY","source_pdf_sha256":PDF_SHA256,
        "source_pdf_bytes":len(raw),"pages_examined":PDF_PAGES,"records":len(records),
        "pymupdf_version":PYMUPDF_VERSION,
        "grain_counts":dict(Counter(r["entity_type"] for r in records)),
        "measure_counts":dict(measures),"gross_jmd":gross,"aia_jmd":aia,"net_jmd":gross+aia,
        "programme_summary_cells":len(observations["programme_summaries"]),
        "printed_aia_occurrences":len(observations["aia_observations"]),
        "fact_or_staging_input_used_for_extraction":False,
        "full_33_field_fact_reconstruction_verified":False,"publication_authorized":False,
    }
    return records,report


def main() -> int:
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--pdf",type=Path,required=True)
    ap.add_argument("--out-dir",type=Path,required=True)
    args=ap.parse_args()
    try:
        if args.out_dir.exists():
            raise SourceRejected("OUTPUT_DIRECTORY_ALREADY_EXISTS")
        records,report=extract(args.pdf)
        args.out_dir.mkdir(parents=True,exist_ok=False)
        payload="".join(json.dumps(r,sort_keys=True,separators=(",",":"))+"\n" for r in records)
        (args.out_dir/"source_records_LOCAL_ONLY.jsonl").write_text(payload,encoding="utf-8")
        report["source_records_sha256"]=hashlib.sha256(payload.encode()).hexdigest()
        (args.out_dir/"source_summary.json").write_text(json.dumps(report,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    except (SourceRejected,OSError) as exc:
        error=str(exc) if isinstance(exc,SourceRejected) else "LOCAL_FILE_OPERATION_FAILED"
        print(json.dumps({"result":"FAILED_CLOSED","error":error,"publication_authorized":False}))
        return 2
    print(json.dumps(report,indent=2,sort_keys=True))
    return 0


if __name__=="__main__":
    raise SystemExit(main())
