import {hashBytes} from './sha256.mjs';
export const SCOPE='JIF_MONTHLY_TRACKER_SOURCE_REVISIONS_ONLY';
export const HOST='https://www.mof.gov.jm';
export const LISTING=HOST+'/central-government-operations-tables/';
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const LABELS=['Tax Revenue','Non-Tax Revenue','Total Revenue & Grants','Primary Balance','Fiscal Balance','Compensation of Employees','Capital Expenditure','Interest'];
const fail=(code)=>{throw new Error(code);};
export function safeWorkbook(url){return typeof url==='string' && /^https:\/\/www\.mof\.gov\.jm\/wp-content\/uploads\/[A-Za-z0-9_.-]+\.xlsx$/.test(url) && !url.includes('..');}
export function parseCsv(text){
 if(typeof text!=='string'||text.length>3000000||/^\s*</.test(text))fail('INVALID_CSV_RESPONSE');
 const rows=[];let row=[],cell='',quote=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++;}else if(quote||cell==='')quote=!quote;else fail('INVALID_CSV_QUOTE');}else if(!quote&&(c===','||c==='\n'||c==='\r')){row.push(cell);cell='';if(c!==','){if(row.some(x=>x!==''))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}else cell+=c;}
 if(quote)fail('UNCLOSED_CSV_QUOTE');if(cell!==''||row.length){row.push(cell);if(row.some(x=>x!==''))rows.push(row);}
 const headers=rows.shift();if(!headers||new Set(headers).size!==headers.length)fail('INVALID_CSV_HEADERS');
 return rows.map(r=>{if(r.length!==headers.length)fail('CSV_ROW_WIDTH');return Object.fromEntries(headers.map((h,i)=>[h,r[i]]));});
}
export function parseListing(html,{start,end}={}){
 if(typeof html!=='string'||html.length>3000000||!html.includes('Central Government Operations'))fail('LISTING_STRUCTURE_CHANGED');
 const entries=[];const sections=[...html.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>([\s\S]*?)(?=<h4\b|$)/gi)];
 for(const m of sections){const title=m[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();const t=/Central Government Operations Table\s*[-–—]\s*([A-Za-z]+)\s+(\d{4})/i.exec(title);if(!t)continue;
 const index=MONTHS.findIndex(x=>x.toLowerCase()===t[1].toLowerCase());if(index<0)continue;
 const month=t[2]+'-'+String(index+1).padStart(2,'0');if((start&&month<start)||(end&&month>end))continue;
 const body=m[2].slice(0,10000),link=/<a\b[^>]*href=["']([^"']+)["']/i.exec(body),date=/<p\b[^>]*>\s*([A-Za-z]+ \d{1,2}, \d{4})\s*<\/p>/i.exec(body);if(!link||!date)fail('LISTING_ENTRY_INCOMPLETE');
 let url=link[1].replaceAll('&amp;','&');if(url.startsWith('/'))url=HOST+url;if(!safeWorkbook(url))fail('UNTRUSTED_LISTING_URL');
 const entry={month_sort:month,url,listing_date:date[1]};
 if(!entries.some(x=>JSON.stringify(x)===JSON.stringify(entry)))entries.push(entry);
 }
 if(!entries.length)fail('NO_CGO_LISTING_ENTRIES');return entries;
}
export function planChecks({trackerCsv,extrasCsv,html,baselines,now}){
 const rows=parseCsv(trackerCsv),extras=parseCsv(extrasCsv);const date=new Date(now);if(!Number.isFinite(+date))fail('INVALID_CHECK_TIME');
 const fy=date.getUTCFullYear()-(date.getUTCMonth()<3?1:0);const start=fy+'-04',end=(fy+1)+'-03';const listing=parseListing(html,{start,end});
 const months=[...new Set(rows.map(r=>r.month_sort).filter(x=>/^\d{4}-\d{2}$/.test(x)&&x>=start&&x<=end))].sort();if(!months.length)fail('NO_PUBLISHED_MONTHS_IN_FY');
 const tasks=[];
 for(const month of months){const kpis=rows.filter(x=>x.month_sort===month);if(kpis.length!==8||LABELS.some(label=>kpis.filter(x=>x.kpi_label===label).length!==1))fail('INCOMPLETE_PUBLISHED_KPI_SET');
 const extra=extras.filter(x=>x.month_sort===month);if(extra.length!==1||!safeWorkbook(extra[0].source_document_1_url))fail('PUBLISHED_SOURCE_URL_UNVERIFIED');
 const bs=baselines.filter(x=>x.month_sort===month);if(bs.length>1)fail('DUPLICATE_BASELINE');const baseline=bs[0]||null;
 if(baseline&&(!safeWorkbook(baseline.source_url)||!/^[a-f0-9]{64}$/.test(baseline.sha256)||!['VERIFIED_SNAPSHOT_MATCHES_PUBLISHED','ACCEPTED_PUBLISHED_ARCHIVE'].includes(baseline.provenance)))fail('INVALID_BASELINE');
 const ls=listing.filter(x=>x.month_sort===month);if(ls.length!==1)fail('MISSING_OR_AMBIGUOUS_LISTING_MONTH');
 const targets=new Map();const add=(url,role)=>targets.set(url,[...(targets.get(url)||[]),role]);if(baseline)add(baseline.source_url,'BASELINE_URL');add(extra[0].source_document_1_url,'PUBLISHED_URL');add(ls[0].url,'LISTED_URL');
 for(const [url,roles]of targets)tasks.push({check_key:hashBytes(month+'|'+url),month_sort:month,url,roles:roles.join('+'),baseline,listing_date:ls[0].listing_date,checked_at:now});
 }
 if(tasks.length>36)fail('SOURCE_LIMIT_EXCEEDED');return tasks;
}
export function inspect(task,{status,bytes,error},prior=[]){
 if(!safeWorkbook(task.url))fail('UNTRUSTED_TASK_URL');
 let error_code=error?'HTTP_REQUEST_FAILED':'';if(status!==200)error_code='HTTP_STATUS_'+String(status||'MISSING');
 if(!bytes||bytes.length<100||bytes.length>10000000)error_code=error_code||'INVALID_WORKBOOK_SIZE';
 const buffer=Buffer.from(bytes||[]);const tail=buffer.subarray(Math.max(0,buffer.length-65557));
 if(buffer.length&&(!buffer.subarray(0,4).equals(Buffer.from([80,75,3,4]))||!tail.includes(Buffer.from([80,75,5,6]))||!buffer.includes(Buffer.from('xl/workbook.xml'))))error_code=error_code||'NOT_XLSX_ZIP';
 const digest=error_code?'':hashBytes(buffer),base=task.baseline;
 let classification=error_code?'CHECK_FAILED':!base?'BASELINE_REQUIRED':digest!==base.sha256?'SOURCE_BYTES_CHANGED':task.url!==base.source_url?'SOURCE_LINK_CHANGED':'UNCHANGED';
 const case_id=hashBytes([SCOPE,task.month_sort,task.url,digest||error_code].join('|'));
 const matches=prior.filter(x=>x.case_id===case_id);if(matches.length>1)fail('DUPLICATE_OBSERVATION_ROWS');const old=matches[0];
 if(old&&(!Number.isFinite(Date.parse(old.first_seen))||Date.parse(old.first_seen)>Date.parse(task.checked_at)))fail('OBSERVATION_TIME_CONFLICT');
 if(old && (old.month_sort!==task.month_sort||old.url!==task.url||old.observed_sha256!==digest))fail('OBSERVATION_IDENTITY_CONFLICT');
 const observation={case_id,check_key:task.check_key,month_sort:task.month_sort,roles:task.roles,url:task.url,listing_date:task.listing_date,baseline_provenance:base?.provenance||'UNVERIFIED',published_sha256:base?.sha256||'',observed_sha256:digest,observed_size:String(buffer.length),classification,review_required:String(classification!=='UNCHANGED'),first_seen:old?.first_seen||task.checked_at,last_seen:task.checked_at,evidence_file_id:old?.evidence_file_id||'',error_code,semantic_review_status:classification==='UNCHANGED'?'NOT_REQUIRED':'REQUIRED'};
 return {observation,archive_required:!error_code&&classification!=='UNCHANGED'&&!observation.evidence_file_id,archive_name:`${task.month_sort}-${digest}.xlsx`,complete:!error_code};
}
export function summarize(rows,expected){
 if(!Number.isInteger(expected)||expected<1||rows.length!==expected||new Set(rows.map(x=>x.check_key)).size!==expected)fail('INCOMPLETE_CHECK_COVERAGE');
 for(const r of rows){if(!/^[a-f0-9]{64}$/.test(r.check_key)||!/^[a-f0-9]{64}$/.test(r.case_id)||!safeWorkbook(r.url)||!['UNCHANGED','SOURCE_BYTES_CHANGED','SOURCE_LINK_CHANGED','BASELINE_REQUIRED','CHECK_FAILED'].includes(r.classification)||r.review_required!==String(r.classification!=='UNCHANGED')||(r.classification!=='CHECK_FAILED'&&!/^[a-f0-9]{64}$/.test(r.observed_sha256)))fail('INVALID_PERSISTED_OBSERVATION');}
 const count=name=>rows.filter(x=>x.classification===name).length;
 return {scope:SCOPE,checked_sources:rows.length,check_complete:count('CHECK_FAILED')===0,baseline_coverage_complete:count('BASELINE_REQUIRED')===0,unchanged:count('UNCHANGED'),changes:count('SOURCE_BYTES_CHANGED')+count('SOURCE_LINK_CHANGED'),baseline_required:count('BASELINE_REQUIRED'),failed:count('CHECK_FAILED'),public_rows_written:0,subscriber_sends:0,financial_adoption_authorized:false,review_case_ids:[...new Set(rows.filter(x=>x.review_required==='true').map(x=>x.case_id))]};
}
