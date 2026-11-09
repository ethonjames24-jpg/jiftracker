"""Compare an already extracted PDF candidate to frozen FACT; review only.

Never changes source candidates, the frozen model, or record grain to force
parity. Programme financial equality does not clear row-identity differences.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

from se03_staging_normalize import HEX, Rejected, parse_csv
from se03_staging_fact_parity import FACT_HEADERS, PROJECTION_FIELDS, fact_signature


def programme_key(signature:tuple) -> tuple:
    source,year,measure,grain,key,economic,amount,page,budget=signature
    scope=key if grain=="VOTE" else "_".join(key.split("_")[:4])
    return source,year,measure,scope,economic,budget


def compare_candidate(candidate:list[dict],frozen:list[dict]) -> dict:
    left=Counter(tuple(r[k] for k in PROJECTION_FIELDS) for r in candidate)
    right=Counter(fact_signature(r) for r in frozen)
    extra,missing=left-right,right-left
    source_totals,frozen_totals=Counter(),Counter()
    for signatures,totals in ((left,source_totals),(right,frozen_totals)):
        for signature,count in signatures.items():
            totals[programme_key(signature)]+=signature[6]*count
    changed_groups=sum(source_totals[k]!=frozen_totals[k] for k in source_totals.keys()|frozen_totals.keys())
    by_extra,by_missing=defaultdict(list),defaultdict(list)
    for signatures,index in ((extra,by_extra),(missing,by_missing)):
        for signature,count in signatures.items():
            index[(programme_key(signature),signature[6])].extend([signature]*count)
    differences=[]
    for key in by_extra.keys()|by_missing.keys():
        added,old=by_extra[key],by_missing[key]
        if len(added)==len(old)==1 and added[0][3]=="ACTIVITY" and old[0][3]=="PROGRAMME":
            a,b=added[0],old[0]
            differences.append({
                "kind":"SOURCE_ACTIVITY_VS_FROZEN_PROGRAMME", "programme_key":key[0][3],
                "economic_code":a[5],"source_activity_key":a[4],
                "source_page":a[7],"frozen_page":b[7],"amount_equal":True,
            })
    row_parity=not extra and not missing
    classified=len(differences)==sum(extra.values())==sum(missing.values())
    if row_parity:
        result="SOURCE_PROJECTION_MATCH_REVIEW_ONLY"
    elif changed_groups==0 and classified:
        result="SOURCE_TOTALS_MATCH_IDENTITY_REVIEW_REQUIRED"
    else:
        result="FAILED_CLOSED"
    return {
        "result":result,"source_candidate_rows":len(candidate),"frozen_rows":len(frozen),
        "exact_shared_field_matches":sum((left&right).values()),
        "source_extra_signatures":sum(extra.values()),"frozen_missing_signatures":sum(missing.values()),
        "programme_economic_financial_groups_compared":len(source_totals.keys()|frozen_totals.keys()),
        "programme_economic_financial_groups_different":changed_groups,
        "source_grain_counts":dict(Counter(r["entity_type"] for r in candidate)),
        "frozen_grain_counts":dict(Counter(s[3] for s in right.elements())),
        "identity_differences":sorted(differences,key=lambda r:(r["programme_key"],r["economic_code"])),
        "unclassified_source_extra_signatures":sum(extra.values())-len(differences),
        "unclassified_frozen_missing_signatures":sum(missing.values())-len(differences),
        "full_33_field_fact_parity_verified":False,"identity_differences_approved":False,
        "publication_authorized":False,
    }


def main() -> int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate-jsonl",type=Path,required=True)
    parser.add_argument("--candidate-sha256",required=True)
    parser.add_argument("--frozen-csv",type=Path,required=True)
    parser.add_argument("--frozen-sha256",required=True)
    args=parser.parse_args()
    try:
        if not all(HEX.fullmatch(v) for v in (args.candidate_sha256,args.frozen_sha256)):
            raise Rejected("INPUT_SHA256_PINS_REQUIRED")
        raw=args.candidate_jsonl.read_bytes()
        fact_raw,frozen=parse_csv(args.frozen_csv,FACT_HEADERS)
        if hashlib.sha256(raw).hexdigest()!=args.candidate_sha256 or hashlib.sha256(fact_raw).hexdigest()!=args.frozen_sha256:
            raise Rejected("INPUT_SHA256_MISMATCH")
        candidate=[json.loads(line) for line in raw.decode("utf-8").splitlines()]
        if len(candidate)!=2912 or len(frozen)!=2912:
            raise Rejected("EXPECTED_2912_ROW_COUNTS_REQUIRED")
        report=compare_candidate(candidate,frozen)
        report["candidate_sha256"]=args.candidate_sha256
        report["frozen_sha256"]=args.frozen_sha256
    except (Rejected,OSError,ValueError,KeyError,TypeError) as exc:
        code=str(exc) if isinstance(exc,Rejected) else "MALFORMED_OR_UNREADABLE_INPUT"
        report={"result":"FAILED_CLOSED","error":code,"publication_authorized":False}
    print(json.dumps(report,indent=2,sort_keys=True))
    # A successfully explained grain difference still fails exact parity.
    return 0 if report["result"]=="SOURCE_PROJECTION_MATCH_REVIEW_ONLY" else 2


if __name__=="__main__":raise SystemExit(main())
