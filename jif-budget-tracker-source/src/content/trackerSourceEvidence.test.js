import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fetchTrackerData } from '../services/googleSheets.js';
import { trackerPresentation } from './trackerPresentation.js';
const fixture=JSON.parse(await readFile(new URL('../../scripts/fixtures/source-disclosure-feed.json',import.meta.url),'utf8'));
const csv=rows=>{const keys=[...new Set(rows.flatMap(Object.keys))],cell=x=>'"'+String(x??'').replaceAll('"','""')+'"';return [keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\n');};
const feeds={'366568461':csv(fixture.tracker),'1176061617':csv(fixture.extras.map(({month_sort,month_label})=>({month_sort,month_label}))),'1322269186':csv(fixture.extras)};
const load=key=>fetchTrackerData(key,async url=>({ok:true,text:async()=>feeds[new URL(url).searchParams.get('gid')]}));
const days=[['2026-04','May 29, 2026','June 3, 2026'],['2026-05','July 2, 2026','July 21, 2026'],['2026-06','July 31, 2026','July 31, 2026'],['2026-07','September 1, 2026','August 31, 2026'],['2026-08','September 30, 2026','September 30, 2026']];
test('all 40 published KPI values/statuses, counts and original source/receipt links survive presentation',async()=>{
 for(const [key,recordDate,listingDate]of days){const input=await load(key),before=structuredClone(input),output=trackerPresentation(input);assert.deepEqual(input,before);assert.equal(output.kpis.length,8);
 for(let i=0;i<8;i++)for(const field of ['kpi_label','annual_baseline_value','monthly_outturn_value','status'])assert.equal(output.kpis[i][field],input.kpis[i][field],`${key} ${field}`);
 assert.deepEqual(output.current_month.counts,input.current_month.counts);
 for(const field of ['status_headline','overall_status','source_document_1_url','source_document_2_url','receipts_pack_url','latest_update_at'])assert.equal(output.current_month[field],field==='source_document_2_url' && key==='2026-08' ? 'https://www.mof.gov.jm/wp-content/uploads/2026-2027-Estimates-of-Expenditures.pdf' : input.current_month[field],`${key} ${field}`);
 assert.equal(output.current_month.source_record.fileRecordDate,recordDate);assert.equal(output.current_month.source_record.listingDate,listingDate);
 }
});
test('historical impact notes require every reviewed value/status and the original URL',async()=>{
 for(const key of ['2026-04','2026-05','2026-06']){const input=await load(key);assert.ok(trackerPresentation(input).current_month.source_record.revisionNote,key);
 for(const field of ['annual_baseline_value','monthly_outturn_value','status']){const revised=structuredClone(input);revised.kpis[0][field]=field==='status'?'On Track':'$1.000';assert.equal(trackerPresentation(revised).current_month.source_record.revisionNote,null);}
 const duplicate=structuredClone(input);duplicate.kpis[7]=duplicate.kpis[0];assert.equal(trackerPresentation(duplicate).current_month.source_record.revisionNote,null);
 input.current_month.source_document_1_url='https://example.com/revised.xlsx';assert.equal(trackerPresentation(input).current_month.source_record,null);
 }
 const future=await load('2026-08');future.current_month.month_sort='2026-09';assert.equal(trackerPresentation(future).current_month.source_record,null);
});
test('rendered disclosure describes versions and precedence; capture source markup is unchanged',async()=>{
 const server=await createServer({server:{middlewareMode:true,ws:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
 try{const {SourceSection}=await server.ssrLoadModule('/src/components/SourceSection.jsx'),{MethodologySection}=await server.ssrLoadModule('/src/components/MethodologySection.jsx');
 for(const key of ['2026-04','2026-05','2026-06']){const raw=await load(key),month=trackerPresentation(raw).current_month;
 const html=renderToStaticMarkup(createElement(SourceSection,{currentMonth:month,showReviewNote:true}));assert.match(html,/Linked-file record date/);assert.match(html,/Ministry listing date/);assert.match(html,/does not establish when the document first became public/);assert.ok(html.includes(month.source_document_1_url));assert.ok(html.includes(month.source_record.listedUrl));
 const capture=renderToStaticMarkup(createElement(SourceSection,{currentMonth:raw.current_month})),withEvidence=renderToStaticMarkup(createElement(SourceSection,{currentMonth:{...raw.current_month,source_record:month.source_record}}));assert.equal(capture,withEvidence);assert.doesNotMatch(capture,/source-version-note|Linked-file record date/);
 if(key==='2026-06')assert.match(html,/planned surplus to a planned deficit/);
 const method=renderToStaticMarkup(createElement(MethodologySection,{currentMonth:month}));assert.match(method,/three or more Under Pressure/);assert.match(method,/three or more Watch/);assert.match(method,/supplied nonblank overall status takes precedence/);assert.doesNotMatch(method,/public receipts do not specify a numerical rule/);
 }
 }finally{await server.close();}
});
