"""Source-pinned, read-only PDF-column cross-check of approved FY26 FACT rows.

This is NOT a complete source extraction: it identifies candidate source-page economic
lines without asserting ambiguous activity context or reconstructing vote-level AIA.
"""
from __future__ import annotations
import argparse,csv,hashlib,json,re
from collections import Counter
from pathlib import Path
from decimal import Decimal
import fitz

PINNED_PDF_SHA256='32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6'
ECON_CODE=re.compile(r'^ECON_(\d{2})$')
ACTIVITY_SOURCE=re.compile(r'^Activity\s+(\d{5});')
PDF_ACTIVITY_HEADING=re.compile(r'^Activity\s+(\d{5})\b')

def classify_activity_candidates(candidates,headings,source_row):
    """Check only explicit on-page activity heading; never infer missing context."""
    if not candidates:return 'NO_PDF_ECONOMIC_COLUMN_CANDIDATE'
    source_activity=ACTIVITY_SOURCE.match(source_row)
    if not source_activity:return 'NON_ACTIVITY_GRAIN_REQUIRES_SEPARATE_SOURCE_RULE'
    if not headings:return 'NO_ACTIVITY_HEADING_ON_SOURCE_PAGE'
    correct=[]
    for y in candidates:
        prior=[code for heading_y,code in headings if heading_y<=y]
        if prior and prior[-1]==source_activity.group(1):correct.append(y)
    if len(correct)==1:return 'SINGLE_ACTIVITY_SCOPED_PDF_COLUMN_CANDIDATE'
    if correct:return 'AMBIGUOUS_ACTIVITY_SCOPED_PDF_COLUMN_CANDIDATES'
    return 'NO_MATCHING_ACTIVITY_SCOPE_ON_SOURCE_PAGE'

def evidence(pdf_path:Path,fact_csv:Path,limit:int|None=None):
    sha=hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    if sha!=PINNED_PDF_SHA256:raise ValueError('SOURCE_PDF_SHA256_MISMATCH')
    doc=fitz.open(pdf_path)
    if len(doc)!=716:raise ValueError('SOURCE_PAGE_COUNT_MISMATCH')
    page_cache={}
    counts=Counter();examples={};total=0
    with fact_csv.open(newline='',encoding='utf-8-sig') as source:
        for row in csv.DictReader(source):
            if row['fiscal_year']!='2026/27':continue
            if row['source_id']!='SRC_EOE_2026_27_PASSED':raise ValueError('MISMATCHED_SOURCE_ID')
            if row['measure_type']=='APPROPRIATIONS_IN_AID':
                counts['AIA_REQUIRES_SEPARATE_VOTE_LEVEL_SOURCE_RULE']+=1;continue
            if limit is not None and total>=limit:break
            total+=1
            page_text=row['source_page'].strip()
            if not page_text.isdecimal() or not (1<=int(page_text)<=len(doc)):
                label='INVALID_SOURCE_PAGE'
            else:
                n=int(page_text)
                if n not in page_cache:
                    words=doc[n-1].get_text('words')
                    codes=[w for w in words if w[4].isdigit() and len(w[4])==2 and w[0]<50 and w[1]>85]
                    headings=[]
                    for block in doc[n-1].get_text('dict')['blocks']:
                        if block.get('type')!=0:continue
                        for line in block.get('lines',[]):
                            label=' '.join(span.get('text','') for span in line['spans']).strip()
                            hit=PDF_ACTIVITY_HEADING.match(label)
                            if hit:headings.append((line['bbox'][1],hit.group(1)))
                    page_cache[n]=(words,codes,sorted(headings))
                words,codes,headings=page_cache[n]
                match=ECON_CODE.fullmatch(row['economic_id'])
                if not match:label='ECON_CODE_FORMAT_REQUIRES_REVIEW'
                else:
                    amount=Decimal(row['amount_jmd_normalized'].replace(',',''))
                    if amount%1000:label='NON_THOUSAND_JMD_LINE_REQUIRES_REVIEW'
                    else:
                        expected=f'{amount/1000:,.1f}'
                        lower,upper=(333,390) if row['measure_type']=='AUTHORIZED_BY_LAW' else (391,449)
                        candidates=[]
                        for code in codes:
                            if code[4]!=match.group(1):continue
                            cy=code[1]
                            found=[w for w in words if abs(w[1]-cy)<1.6 and lower<=w[0]<upper and w[4]==expected]
                            if found:candidates.append(round(cy,2))
                        label=classify_activity_candidates(candidates,headings,row['source_row'])
            counts[label]+=1
            if label not in examples:examples[label]={'fact_id':row['fact_id'],'page':row['source_page'],'economic_id':row['economic_id'],'measure':row['measure_type']}
    return {'result':'PAGE_COLUMN_EVIDENCE_REVIEW_ONLY','pdf_sha256':sha,'pdf_pages':len(doc),'checked_non_aia_facts':total,'pages_cached':len(page_cache),'counts':dict(sorted(counts.items())),'examples':examples,'full_deterministic_extraction_accepted':False,'activity_context_uniqueness_proven':False,'aia_reconciled_from_pdf':False,'publication_authorized':False}

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('pdf',type=Path);ap.add_argument('private_fact_csv',type=Path);ap.add_argument('--limit',type=int);ap.add_argument('--output-json',type=Path)
    a=ap.parse_args();r=evidence(a.pdf,a.private_fact_csv,a.limit);report=json.dumps(r,indent=2,sort_keys=True);print(report)
    if a.output_json:a.output_json.write_text(report+'\n')
