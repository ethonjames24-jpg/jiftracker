"""Offline frozen-v1 replay and serving QA; no publication or network actions.

Financial/hierarchy fields derive from the source compatibility projection and
governed dimensions. Stable fact ID, old import batch and old loaded_at are
baseline replay references, not evidence of a new ingestion or official source.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
import sys
from collections import Counter,defaultdict
from datetime import datetime
from decimal import Decimal,InvalidOperation
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"se-03-extract-normalize"))
from se03_staging_fact_parity import FACT_HEADERS,PROJECTION_FIELDS,fact_signature
from se03_staging_normalize import HEX,Rejected,exact_amount

FY="2026/27"
NET=1441781354000
REFERENCE_FIELDS=("fact_id","import_batch_id","loaded_at")
BASELINE_COMPAT_SHA256="35c598e6673416894cf6062097cbd17caad91e52eb6287cd0b51d640fdd61ebe"
BASELINE_FROZEN_SHA256="ee8862f085244219328ca9703c9d3e5496cca8e6bb7c1aa22b28e64368f48e2d"
DISPLAY_ORDER=dict(zip(("CAT_DEBT","CAT_GOVERNANCE","CAT_SECURITY_JUSTICE","CAT_ECONOMIC_INFRASTRUCTURE",
    "CAT_ENVIRONMENT","CAT_HOUSING_COMMUNITIES","CAT_HEALTH","CAT_CULTURE_RECREATION","CAT_EDUCATION",
    "CAT_SOCIAL_PROTECTION","CAT_AIA_OFFSET"),(1,2,3,4,5,6,7,8,9,10,99)))
GROUP=("fiscal_year","measure_type","organisation_id","function_id","programme_id","economic_id",
       "public_category_id","recurrent_or_capital","source_id")
DIM_IDS={"DIM_Period":"period_id","DIM_Organisation":"organisation_id","DIM_Function":"function_id",
    "DIM_SubFunction":"subfunction_id","DIM_Vote":"vote_id","DIM_Programme":"programme_id",
    "DIM_SubProgramme":"subprogramme_id","DIM_Activity":"activity_id",
    "DIM_Economic_Classification":"economic_id","DIM_Funding_Source":"funding_source_id",
    "DIM_Location":"location_id","Source_Catalog":"source_id"}


def index_rows(rows,key):
    out={}
    for row in rows:
        value=row[key]
        if not isinstance(value,str) or not value or value.strip()!=value or value in out:
            raise Rejected("MISSING_NONCANONICAL_OR_DUPLICATE_REFERENCE_ID:"+key)
        out[value]=row
    return out


def references(tables):
    refs={name:index_rows(tables[name],field) for name,field in DIM_IDS.items()}
    refs["MAP_Public_Categories"]=tables["MAP_Public_Categories"]
    for row in refs["MAP_Public_Categories"]:
        if row["review_status"]!="APPROVED" or not row["approved_by"] or not row["approved_at"]:
            raise Rejected("CATEGORY_RULE_NOT_APPROVED")
    return refs


def hierarchy_cohorts(tables):
    report={}
    for table,key,expected in (("op_subprogramme","subprogramme_id",(316,32)),
                               ("op_activity","activity_id",(766,74))):
        rows=tables[table];index_rows(rows,key)
        counts=Counter(r["active_from"] for r in rows)
        if counts!={"2026-04-01":expected[0],"2025-04-01":expected[1]}:
            raise Rejected("DIMENSION_INTRODUCTION_COHORT_COUNTS_MISMATCH:"+table)
        report[table]={"fy26_origin_records":expected[0],"additional_fy25_origin_records":expected[1],
                       "combined_unique_records":len(rows)}
    return {"introduction_cohorts":report,"fy25_additions_are_not_full_fy25_dimension_universe":True,
            "historical_qa_fail_rows_modified":False}


def category_for(row,rules):
    matches=[r for r in rules if r["source_field"] in ("economic_id","function_id")
             and row.get(r["source_field"])==r["source_value"]]
    if not matches:raise Rejected("PUBLIC_CATEGORY_MAPPING_MISSING")
    priority=min(int(r["priority_order"]) for r in matches)
    winners=[r for r in matches if int(r["priority_order"])==priority]
    if len(winners)!=1:raise Rejected("PUBLIC_CATEGORY_MAPPING_AMBIGUOUS")
    return winners[0]["public_category_id"]


def canonical_replay(projected,frozen,refs):
    lookup={}
    for row in frozen:
        key=fact_signature(row)
        if key in lookup:raise Rejected("AMBIGUOUS_FROZEN_SIGNATURE")
        lookup[key]=row
    periods=[p for p in refs["DIM_Period"].values() if p["fiscal_year"]==FY and p["period_type"]=="ANNUAL"]
    if len(periods)!=1:raise Rejected("ANNUAL_PERIOD_NOT_UNIQUE")
    period=periods[0];out=[];different=Counter();seen=set()
    for source in projected:
        signature=tuple(source[k] for k in PROJECTION_FIELDS)
        if signature not in lookup:raise Rejected("PROJECTED_SIGNATURE_NOT_IN_FROZEN")
        baseline=lookup[signature]
        row=dict.fromkeys(FACT_HEADERS,"")
        for field in REFERENCE_FIELDS:row[field]=baseline[field]
        if not row["fact_id"] or row["fact_id"] in seen:raise Rejected("REPLAY_FACT_ID_NOT_UNIQUE")
        seen.add(row["fact_id"])
        amount=source["amount_jmd"]
        if type(amount) is not int:raise Rejected("SOURCE_AMOUNT_NOT_INTEGER")
        row.update(source_id=source["source_id"],fiscal_year=source["fiscal_year"],period_id=period["period_id"],
            period_type="ANNUAL",period_start=period["period_start"],period_end=period["period_end"],
            measure_type=source["measure_type"],estimate_version="AS_PASSED",economic_id="ECON_"+source["economic_code"],
            amount_jmd=f"{amount:,}",amount_jmd_normalized=f"{amount:,}",amount_unit="JMD",currency="JMD",
            is_actual="FALSE",is_budget="TRUE",is_revised="FALSE",source_page=source["source_page"],
            vote_id=source["vote_id"],budget_number=source["budget_number"],budget_type=source["recurrent_or_capital"])
        vote=refs["DIM_Vote"][row["vote_id"]]
        if (vote["budget_number"],vote["budget_type"],vote["fiscal_year"])!=(row["budget_number"],row["budget_type"],FY):
            raise Rejected("VOTE_PERIOD_OR_BUDGET_CONFLICT")
        row["organisation_id"]=vote["organisation_id"]
        grain=source["entity_type"];parts=source["canonical_entity_key"].split("_")
        expected={"ACTIVITY":6,"PROGRAMME":4,"VOTE":1}
        if grain not in expected or len(parts)!=expected[grain] or not all(p.isascii() and p.isdecimal() for p in parts):
            raise Rejected("CANONICAL_ENTITY_GRAMMAR_INVALID")
        if "VOTE_"+parts[0]+("C" if row["budget_type"]=="CAPITAL" else "")!=row["vote_id"]:
            raise Rejected("CANONICAL_HEAD_VOTE_CONFLICT")
        if grain!="VOTE":
            row["function_id"]="FUNC_"+parts[1]
            row["subfunction_id"]="SFUNC_"+parts[1]+"_"+parts[2]
            row["programme_id"]="PROG_"+"_".join(parts[:4])
        if grain=="ACTIVITY":
            row["subprogramme_id"]="SPROG_"+"_".join(parts[:5]);row["activity_id"]="ACT_"+"_".join(parts)
        if (grain=="VOTE")!=(row["measure_type"]=="APPROPRIATIONS_IN_AID"):
            raise Rejected("AIA_GRAIN_CONFLICT")
        if (grain=="VOTE" and amount>=0) or (grain!="VOTE" and amount<0):raise Rejected("CANONICAL_SIGN_CONFLICT")
        row["source_row"]=f"{ {'ACTIVITY':'Activity','PROGRAMME':'Programme','VOTE':'Vote'}[grain]} {parts[-1]}; economic {source['economic_code']}; {row['measure_type']}"
        row["public_category_id"]=category_for(row,refs["MAP_Public_Categories"])
        for table,field in DIM_IDS.items():
            value=row[field]
            if value and value not in refs[table]:raise Rejected("FOREIGN_KEY_MISSING:"+field)
        if row["programme_id"]:
            programme=refs["DIM_Programme"][row["programme_id"]]
            if (programme["organisation_id"],programme["function_id"])!=(row["organisation_id"],row["function_id"]):
                raise Rejected("PROGRAMME_PARENT_CONFLICT")
            if refs["DIM_SubFunction"][row["subfunction_id"]]["function_id"]!=row["function_id"]:
                raise Rejected("SUBFUNCTION_PARENT_CONFLICT")
        if row["activity_id"]:
            activity=refs["DIM_Activity"][row["activity_id"]]
            sub=refs["DIM_SubProgramme"][row["subprogramme_id"]]
            if (activity["subprogramme_id"],activity["programme_id"],activity["organisation_id"])!=(row["subprogramme_id"],row["programme_id"],row["organisation_id"]):
                raise Rejected("ACTIVITY_PARENT_CONFLICT")
            if (sub["programme_id"],sub["organisation_id"])!=(row["programme_id"],row["organisation_id"]):
                raise Rejected("SUBPROGRAMME_PARENT_CONFLICT")
        for field in FACT_HEADERS:
            if row[field]!=baseline[field]:different[field]+=1
        out.append(row)
    if len(out)!=len(frozen) or len(seen)!=len(frozen):raise Rejected("CANONICAL_REPLAY_COVERAGE_MISMATCH")
    return out,{"records":len(out),"compared_fields":len(FACT_HEADERS),"field_differences":dict(different),
        "reference_only_fields":list(REFERENCE_FIELDS),"independent_33_field_source_reconstruction":False,
        "foreign_key_and_parent_checks_passed":True,"publication_authorized":False}


def decimal(value):
    try:result=Decimal(value.replace(",",""))
    except (InvalidOperation,AttributeError):raise Rejected("INVALID_DISPLAY_NUMBER")
    if not result.is_finite():raise Rejected("NONFINITE_DISPLAY_NUMBER")
    return result


def category_labels(refs):
    out={}
    for r in refs["MAP_Public_Categories"]:
        key=r["public_category_id"];value=r["public_category_name"]
        if key in out and out[key]!=value:raise Rejected("CATEGORY_LABEL_CONFLICT")
        if r["include_in_every_100"]!="TRUE":raise Rejected("CATEGORY_EXCLUDED_FROM_EVERY100")
        out[key]=value
    return out


def validate_metadata(row,public):
    if not row["record_id"] or row["record_id"].strip()!=row["record_id"]:
        raise Rejected("SERVING_RECORD_ID_MISSING_OR_NONCANONICAL")
    if datetime.fromisoformat(row["last_updated"]).utcoffset() is None:
        raise Rejected("SERVING_TIMESTAMP_TIMEZONE_MISSING")
    allowed={"RELEASED","PUBLIC_RELEASED","PUBLISHED","AUTHORIZED"} if public else {"MODEL_APPROVED_RELEASE_NOT_AUTHORIZED"}
    if row["data_status"] not in allowed:raise Rejected("SERVING_ROW_STATUS_INVALID")


def required_strings(row,fields):
    if any(not isinstance(row.get(field),str) or not row[field] or row[field].strip()!=row[field]
           for field in fields):
        raise Rejected("SERVING_REQUIRED_STRING_MISSING_OR_NONCANONICAL")


def serving_qa(canonical,spending,every100,refs,public=False):
    index_rows(spending,"record_id");index_rows(every100,"record_id")
    if any(r["fiscal_year"] not in {"2025/26",FY} for r in spending+every100):
        raise Rejected("UNSUPPORTED_SERVING_FISCAL_YEAR")
    skipped_spending=sum(r["fiscal_year"]!=FY for r in spending)
    skipped_every100=sum(r["fiscal_year"]!=FY for r in every100)
    spending=[r for r in spending if r["fiscal_year"]==FY]
    every100=[r for r in every100 if r["fiscal_year"]==FY]
    totals=Counter();categories=Counter();source_urls={k:v["source_url"] for k,v in refs["Source_Catalog"].items()}
    labels=category_labels(refs)
    for row in canonical:
        adapted=dict(row,recurrent_or_capital=row["budget_type"])
        amount=exact_amount(row["amount_jmd_normalized"])
        totals[tuple(adapted[k] for k in GROUP)]+=amount
        categories[row["public_category_id"]]+=amount
    source_ids={row["source_id"] for row in canonical}
    if len(source_ids)!=1:raise Rejected("CANONICAL_SOURCE_ID_NOT_UNIQUE")
    net=sum(totals.values())
    if net!=NET:raise Rejected("SERVING_NET_CONTROL_MISMATCH")
    observed=set();max_error=Decimal(0)
    for row in spending:
        required_strings(row,("record_id","fiscal_year","period_label","period_type","measure_type",
            "organisation_id","organisation_name","economic_id","economic_name","public_category_id",
            "public_category_name","recurrent_or_capital","source_id","source_url","data_status","last_updated"))
        if row["measure_type"]!="APPROPRIATIONS_IN_AID":required_strings(row,("function_id","function_name"))
        key=tuple(row[k] for k in GROUP)
        if key in observed or key not in totals:raise Rejected("SERVING_GROUP_DUPLICATE_OR_UNKNOWN")
        observed.add(key);amount=exact_amount(row["amount_jmd"])
        if amount!=totals[key]:raise Rejected("SERVING_EXACT_AMOUNT_MISMATCH")
        expected={"organisation_name":refs["DIM_Organisation"][row["organisation_id"]]["public_display_name"] or refs["DIM_Organisation"][row["organisation_id"]]["official_name"],
            "function_name":refs["DIM_Function"][row["function_id"]]["function_name"] if row["function_id"] else "",
            "programme_name":refs["DIM_Programme"][row["programme_id"]]["programme_name"] if row["programme_id"] else "",
            "economic_name":refs["DIM_Economic_Classification"][row["economic_id"]]["economic_name"],
            "public_category_name":labels[row["public_category_id"]],"source_url":source_urls[row["source_id"]],
            "period_label":"FY"+FY,"period_type":"ANNUAL"}
        if any(row[k]!=v for k,v in expected.items()):raise Rejected("SERVING_LABEL_OR_SOURCE_METADATA_MISMATCH")
        error=abs(decimal(row["share_of_total_pct"])-Decimal(amount)*100/net)
        if error>Decimal("0.005000000001"):raise Rejected("SERVING_PERCENTAGE_OUTSIDE_DISPLAY_TOLERANCE")
        max_error=max(max_error,error);validate_metadata(row,public)
    if observed!=set(totals):raise Rejected("SERVING_GROUP_COVERAGE_MISMATCH")
    observed_categories=set();display_sum=Decimal(0)
    for row in every100:
        required_strings(row,("record_id","fiscal_year","period_label","measure_type","public_category_id",
            "public_category_name","source_id","source_url","data_status","last_updated"))
        category=row["public_category_id"]
        if category in observed_categories or category not in categories:raise Rejected("EVERY100_CATEGORY_DUPLICATE_OR_UNKNOWN")
        observed_categories.add(category)
        if exact_amount(row["amount_jmd"])!=categories[category] or exact_amount(row["denominator_amount_jmd"])!=net:
            raise Rejected("EVERY100_AMOUNT_OR_DENOMINATOR_MISMATCH")
        exact_share=Decimal(categories[category])*100/net
        for field in ("share_pct","per_j100"):
            if abs(decimal(row[field])-exact_share)>Decimal("0.005000000001"):
                raise Rejected("EVERY100_DISPLAY_ROUNDING_OUT_OF_TOLERANCE")
        if (row["public_category_name"]!=labels[category] or int(row["display_order"])!=DISPLAY_ORDER[category]
            or row["source_id"] not in source_ids
            or row["source_url"]!=source_urls[row["source_id"]] or row["period_label"]!="FY"+FY
            or row["measure_type"]!="APPROVED_BUDGET_NET"):
            raise Rejected("EVERY100_METADATA_CONFLICT")
        display_sum+=decimal(row["per_j100"]);validate_metadata(row,public)
    if observed_categories!=set(categories):raise Rejected("EVERY100_CATEGORY_COVERAGE_MISMATCH")
    tolerance=Decimal("0.005")*len(categories)
    if abs(display_sum-100)>tolerance+Decimal("0.000000000001"):
        raise Rejected("EVERY100_SUM_OUTSIDE_ROUNDING_TOLERANCE")
    return {"spending_rows":len(spending),"every100_categories":len(every100),"net_jmd":net,
        "other_year_spending_rows_not_source_verified":skipped_spending,
        "other_year_every100_rows_not_source_verified":skipped_every100,
        "financial_amounts_exact":True,"labels_and_source_metadata_match":True,
        "display_rounding_tolerance_per_value":"0.005 percentage points plus 1e-12 numeric serialization allowance",
        "spending_max_percentage_error":str(max_error),"every100_display_sum":str(display_sum),
        "every100_sum_tolerance":str(tolerance),"publication_authorized":False}


def load_inputs(path,expected_sha):
    raw=path.read_bytes()
    if not HEX.fullmatch(expected_sha) or hashlib.sha256(raw).hexdigest()!=expected_sha:
        raise Rejected("INPUT_MANIFEST_PIN_MISMATCH")
    spec=json.loads(raw);tables={};pins={}
    for key,item in spec["inputs"].items():
        target=(path.parent/item["file"]).resolve()
        if not target.is_relative_to(path.parent.resolve()):raise Rejected("INPUT_PATH_OUTSIDE_MANIFEST_DIRECTORY")
        blob=target.read_bytes()
        if hashlib.sha256(blob).hexdigest()!=item["sha256"]:raise Rejected("REFERENCE_PIN_MISMATCH:"+key)
        pins[key]=item["sha256"]
        if key=="compat":tables[key]=[json.loads(line) for line in blob.decode().splitlines()];continue
        reader=csv.DictReader(io.StringIO(blob.decode("utf-8-sig"),newline=""));headers=reader.fieldnames or []
        if not headers or len(set(headers))!=len(headers):raise Rejected("REFERENCE_CSV_HEADER_INVALID")
        rows=list(reader)
        if any(None in row or any(v is None for v in row.values()) for row in rows):raise Rejected("REFERENCE_CSV_RAGGED")
        tables[key]=rows
    if pins.get("compat")!=BASELINE_COMPAT_SHA256 or pins.get("frozen")!=BASELINE_FROZEN_SHA256:
        raise Rejected("CANONICAL_BASELINE_ARTIFACT_PIN_MISMATCH")
    return tables,pins


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input-manifest",type=Path,required=True);ap.add_argument("--manifest-sha256",required=True)
    ap.add_argument("--out-dir",type=Path,required=True);args=ap.parse_args()
    try:
        if args.out_dir.exists():raise Rejected("OUTPUT_DIRECTORY_ALREADY_EXISTS")
        tables,pins=load_inputs(args.input_manifest,args.manifest_sha256);refs=references(tables)
        cohort_report=hierarchy_cohorts(tables)
        if len(tables["compat"])!=2912 or len(tables["frozen"])!=2912:raise Rejected("EXPECTED_2912_CANONICAL_ROWS")
        canonical,canonical_report=canonical_replay(tables["compat"],tables["frozen"],refs)
        if canonical_report["field_differences"]:raise Rejected("CANONICAL_33_FIELD_REPLAY_DIFFERENCES")
        frozen_qa=serving_qa(canonical,tables["DS_SpendingExplorer"],tables["DS_Every100"],refs)
        public_qa=serving_qa(canonical,tables["public_spending"],tables["public_every100"],refs,True)
        report={"result":"CANONICAL_REPLAY_AND_SERVING_QA_REVIEW_ONLY","input_sha256":pins,
                "hierarchy_scope":cohort_report,
                "canonical":canonical_report,"frozen_serving":frozen_qa,"public_fy26_serving":public_qa,
                "fy25_independent_source_extraction_verified":False,"publication_authorized":False}
        args.out_dir.mkdir(parents=True,exist_ok=False)
        with (args.out_dir/"canonical_REPLAY_LOCAL_ONLY.csv").open("w",newline="",encoding="utf-8") as f:
            writer=csv.DictWriter(f,fieldnames=FACT_HEADERS,lineterminator="\n");writer.writeheader();writer.writerows(canonical)
        (args.out_dir/"qa_receipt.json").write_text(json.dumps(report,sort_keys=True,indent=2)+"\n",encoding="utf-8")
    except (Rejected,OSError,ValueError,KeyError,TypeError) as exc:
        report={"result":"FAILED_CLOSED","error":str(exc) if isinstance(exc,Rejected) else "INVALID_OR_UNREADABLE_INPUT",
                "publication_authorized":False}
    print(json.dumps(report,sort_keys=True,indent=2))
    return 2 if report["result"]=="FAILED_CLOSED" else 0


if __name__=="__main__":raise SystemExit(main())
