"""Exact eight-rule offline compatibility projection, never a model writer."""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from collections import Counter
from pathlib import Path

from se03_staging_fact_parity import FACT_HEADERS,PROJECTION_FIELDS,compare_normalized
from se03_staging_normalize import Rejected,parse_csv

PROFILE_SHA256="44f49d1836b268c0778f4a39d3ee636e55bdaae0567da67581a1c2ae6761a125"
FINANCIAL_IDENTITY=("source_id","fiscal_year","measure_type","economic_code",
                    "amount_jmd","recurrent_or_capital","budget_number","vote_id")


def project(records:list[dict],profile:dict) -> tuple[list[dict],dict]:
    rules=profile["rules"]
    if len(rules)!=8 or len({r["rule_id"] for r in rules})!=8 or profile.get("publication_authorized") is not False:
        raise Rejected("INVALID_EIGHT_RULE_PROFILE")
    lookup={}
    for rule in rules:
        key=(rule["source_activity_key"],rule["economic_code"],rule["source_page"])
        if key in lookup or rule["canonical_programme_key"]!="_".join(rule["source_activity_key"].split("_")[:4]):
            raise Rejected("AMBIGUOUS_OR_CROSS_PROGRAMME_COMPAT_RULE")
        lookup[key]=rule
    output=[];hits=Counter()
    for original in records:
        row={k:original[k] for k in PROJECTION_FIELDS+("budget_number","vote_id")}
        key=(row["canonical_entity_key"],row["economic_code"],row["source_page"])
        rule=lookup.get(key)
        if rule:
            if (row["entity_type"]!="ACTIVITY" or row["source_id"]!=profile["source_id"]
                or row["fiscal_year"]!=profile["fiscal_year"] or row["measure_type"]!=profile["measure_type"]
                or row["recurrent_or_capital"]!=profile["recurrent_or_capital"]):
                raise Rejected("COMPAT_RULE_PRECONDITION_MISMATCH")
            hits[rule["rule_id"]]+=1
            row["entity_type"]="PROGRAMME"
            row["canonical_entity_key"]=rule["canonical_programme_key"]
            row["source_page"]=rule["canonical_reference_page"]
        # All geometry/Y and the physical page remain together, including when
        # the v1 reference points to a different printed Programme summary.
        row["physical_source_evidence"]=copy.deepcopy(original)
        row["compatibility_profile"]=profile["profile_id"]
        row["compatibility_rule_id"]=rule["rule_id"] if rule else None
        if any(row[k]!=original[k] for k in FINANCIAL_IDENTITY):
            raise Rejected("COMPAT_CHANGED_FINANCIAL_IDENTITY")
        output.append(row)
    if set(hits)!={r["rule_id"] for r in rules} or any(n!=1 for n in hits.values()):
        raise Rejected("EVERY_COMPAT_RULE_MUST_MATCH_EXACTLY_ONCE")
    return output,{
        "result":"FROZEN_V1_COMPAT_PROJECTION_REVIEW_ONLY","profile_id":profile["profile_id"],
        "records":len(output),"mapped_rows":sum(hits.values()),"rule_hits":dict(sorted(hits.items())),
        "financial_fields_changed":0,"original_physical_evidence_preserved":True,
        "source_candidate_rewritten":False,"frozen_model_modified":False,"publication_authorized":False,
    }


def main() -> int:
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--candidate-jsonl",type=Path,required=True)
    ap.add_argument("--frozen-csv",type=Path,required=True)
    ap.add_argument("--out-dir",type=Path,required=True)
    args=ap.parse_args()
    try:
        raw_profile=Path(__file__).with_name("se03_frozen_v1_compat_rules.json").read_bytes()
        if hashlib.sha256(raw_profile).hexdigest()!=PROFILE_SHA256:
            raise Rejected("COMPAT_PROFILE_PIN_MISMATCH")
        profile=json.loads(raw_profile)
        raw=args.candidate_jsonl.read_bytes();frozen_raw,frozen=parse_csv(args.frozen_csv,FACT_HEADERS)
        if (hashlib.sha256(raw).hexdigest()!=profile["candidate_sha256"] or
            hashlib.sha256(frozen_raw).hexdigest()!=profile["frozen_csv_sha256"]):
            raise Rejected("COMPAT_INPUT_PIN_MISMATCH")
        if args.out_dir.exists():raise Rejected("OUTPUT_DIRECTORY_ALREADY_EXISTS")
        original=[json.loads(line) for line in raw.decode("utf-8").splitlines()]
        if len(original)!=2912 or len(frozen)!=2912:raise Rejected("COMPAT_ROW_COUNT_MISMATCH")
        records,report=project(original,profile)
        parity=compare_normalized(records,frozen)
        if parity["result"]!="PROJECTION_PASS_REVIEW_ONLY":raise Rejected("COMPAT_EXACT_PARITY_FAILED")
        report.update(parity=parity,source_candidate_sha256=profile["candidate_sha256"],
                      frozen_csv_sha256=profile["frozen_csv_sha256"],profile_sha256=PROFILE_SHA256)
        payload="".join(json.dumps(r,sort_keys=True,separators=(",",":"))+"\n" for r in records)
        report["projected_records_sha256"]=hashlib.sha256(payload.encode()).hexdigest()
        args.out_dir.mkdir(parents=True,exist_ok=False)
        (args.out_dir/"compat_records_LOCAL_ONLY.jsonl").write_text(payload,encoding="utf-8")
        (args.out_dir/"compat_summary.json").write_text(json.dumps(report,sort_keys=True,indent=2)+"\n",encoding="utf-8")
    except (Rejected,OSError,ValueError,KeyError,TypeError) as exc:
        report={"result":"FAILED_CLOSED","error":str(exc) if isinstance(exc,Rejected) else "MALFORMED_OR_UNREADABLE_INPUT","publication_authorized":False}
    print(json.dumps(report,sort_keys=True,indent=2))
    return 2 if report["result"]=="FAILED_CLOSED" else 0


if __name__=="__main__":raise SystemExit(main())
