import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { makeArchive } from '../src/archive.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const now=()=> '2026-10-19T23:00:00.000Z';
const config={mode:'ARCHIVE',transportEnabled:true,archiveRootId:'root_private_archive',guardTableId:'guard_test_table',guardRowId:1,ledgerTableId:'ledger_test_table',scannerUrl:'https://scanner.example.test/scan'};
const ctx={workflowId:'workflow_se02_test',executionId:'3001'};
const source=Buffer.from('%PDF-1.7\nOFFICIAL SYNTHETIC TEST\n%%EOF\n');
const artifacts=Array.from({length:4},(_,i)=>({id:'artifact_'+i,sourceClass:i===0?'primary_controlling':'supporting_active',title:'Test '+i,releaseDate:'2026-04-02',url:'https://www.mof.gov.jm/wp-content/uploads/test-'+i+'.pdf',fileName:'test-'+i+'.pdf',expectedContentTypes:['application/pdf','application/octet-stream'],minimumBytes:10,maximumBytes:1024,requiredMagicHex:'255044462d',expectedSha256:hash(Buffer.from('old'+i))}));
const catalog={fiscalYear:'2026-2027',authority:{publisher:'MOFPS'},discovery:{id:'index'},artifacts};
const catalogDigest=hash(Buffer.from('catalogue'));
const engine=()=>makeArchive({hash,now,catalog,catalogDigest});
function input(bytes=source){const results=[{sourceId:'index',outcome:'UNCHANGED',statusCode:200,observedSha256:hash(Buffer.from('links'))},...artifacts.map((a,i)=>({sourceId:a.id,sourceClass:a.sourceClass,url:a.url,outcome:i===0?'CHANGED':'UNCHANGED',statusCode:200,expectedSha256:a.expectedSha256,observedSha256:i===0?hash(bytes):a.expectedSha256,observedBytes:bytes.length}))];return {sourceId:'artifact_0',monitorReceipt:{workflowId:'SE-01',catalogDigest,fiscalYear:catalog.fiscalYear,state:'SOURCE_CHANGE_DETECTED',checkedAt:'2026-10-19T22:59:00.000Z',summary:{sourcesChecked:5,unchanged:4,changed:1,failed:0},results}};}
const clone=v=>JSON.parse(JSON.stringify(v));
const resp=(o,status=200)=>({status,bytes:Buffer.from(JSON.stringify(o)),headers:{'content-type':'application/json'}});
function world(){return {guard:{id:1,guard_key:'JIF_SE02_ARCHIVE_GLOBAL',schema_version:'jif-se02-archive-v1',lock_token:'UNLOCKED',holder_execution_id:'NONE',holder_workflow_id:'NONE',acquired_at:'NONE'},ledger:[],files:new Map(),posts:[],gets:[],scans:0,allocations:0};}
function transport(s,w,options={}){
 const q=s.request;
 if(q.route==='guard_read')return {rows:[clone(w.guard)]};
 if(q.route==='acquire'){if(w.guard.lock_token==='UNLOCKED')Object.assign(w.guard,s.claim);return {rows:[]};}
 if(q.route==='release'){if(Object.entries(s.claim).every(([k,v])=>w.guard[k]===v))Object.assign(w.guard,{lock_token:'UNLOCKED',holder_execution_id:'NONE',holder_workflow_id:'NONE',acquired_at:'NONE'});return {rows:[]};}
 if(q.route==='ledger_read')return {rows:w.ledger.filter(r=>r.batch_key===s.batchKey).map(clone)};
 if(q.route==='ledger_insert'){w.ledger.push({id:w.ledger.length+1,batch_key:s.batchKey,reservation_json:JSON.stringify(s.reservation)});return options.discardInsertAck?{rows:[{error:'lost acknowledgement'}]}:{rows:[w.ledger.at(-1)]};}
 if(q.route==='public'){w.gets.push(q.url);return {status:options.sourceStatus||200,bytes:options.sourceBytes||source,headers:{'content-type':options.sourceMime||'application/pdf'}};}
 if(q.route==='scan'){w.scans++;return resp({status:options.scanStatus||'CLEAN',sha256:options.scanHash||s.observedSha256,bytes:s.observedBytes,engine:'fixture-only',engineVersion:'1.0',signatureVersion:'fixture-v1',scannedAt:now()});}
 if(q.route!=='drive')throw Error('unexpected route '+q.route);
 if(q.url.includes('/generateIds?')){const n=++w.allocations;return resp({ids:['folder_'+n+'_id','source_'+n+'_id','manifest_'+n+'_id']});}
 if(q.kind==='source_session')return {status:200,bytes:Buffer.alloc(0),headers:{location:'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=fixture'}};
 if(q.method==='POST'||q.method==='PUT'){
  const {reservation:v}=s,kind=q.kind;
  const body=engine().body(s,options.sourceBytes||source);
  const metadata={id:v[kind+'Id'],name:kind==='folder'?'SE02-'+s.batchKey:kind==='source'?v.manifest.file_name:'source-manifest.json',mimeType:kind==='folder'?'application/vnd.google-apps.folder':kind==='source'?v.manifest.mime_type:'application/json',parents:[kind==='folder'?s.config.archiveRootId:v.folderId],appProperties:{jif_se02_batch:s.batchKey,jif_se02_kind:kind,jif_se02_version:'1'},trashed:false};
  const bytes=kind==='source'?(options.sourceBytes||source):kind==='manifest'?Buffer.from(engine().stable(v.manifest)):Buffer.alloc(0);
  metadata.size=String(bytes.length);
  // Emulate Drive's create-only pre-generated ID semantics, including a lost response.
  if(w.files.has(metadata.id))return resp({},409);
  w.files.set(metadata.id,{metadata,bytes});w.posts.push({kind,id:metadata.id,body});
  return options.discardPostAck?{status:0,bytes:Buffer.alloc(0)}:resp({id:metadata.id});
 }
 if(q.url.includes('/'+config.archiveRootId+'?'))return resp({id:config.archiveRootId,mimeType:'application/vnd.google-apps.folder',trashed:false,shared:options.sharedRoot||false});
 const match=q.url.match(/\/files\/([^?]+)\?/),file=w.files.get(match?.[1]);
 if(!file)return resp({},404);
 if(q.url.includes('alt=media'))return {status:200,bytes:options.corruptReadback?Buffer.from('corrupt'):file.bytes,headers:{'content-type':file.metadata.mimeType}};
 return resp(file.metadata);
}
function run(w=world(),options={},caseInput=input(),context=ctx){let e=engine(),s=e.start(config,caseInput,context),count=0;while(s.request.route!=='done'){assert.ok(++count<150,'bounded transitions');if(options.stopAt===s.phase)return {s,w,stopped:true};const r=transport(s,w,options);s=e.step(s,r);}return {s,w,result:e.result(s)};}

test('report-only import reaches no transport and cannot report acquired',()=>{const e=engine(),s=e.start({...config,mode:'REPORT_ONLY',guardTableId:'',ledgerTableId:'',scannerUrl:''},null,ctx),r=e.result(s);assert.equal(s.request.route,'done');assert.equal(r.state,'REPORT_ONLY');assert.equal(r.ok,false);assert.equal(r.drive_create_attempts,0);assert.equal(r.malware_scan_verified,false);assert.ok(r.blockers.length>=3);});
test('acquires one exact source and manifest, only after clean scan and readback',()=>{const {result:r,w}=run();assert.equal(r.ok,true);assert.equal(r.state,'ACQUIRED');assert.equal(r.source_byte_readback,'PASS');assert.equal(r.manifest_byte_readback,'PASS');assert.equal(w.posts.length,3);assert.equal(w.ledger.length,1);assert.equal(w.gets.length,1);assert.equal(w.scans,1);assert.equal(w.guard.lock_token,'UNLOCKED');assert.equal(r.publication_authorized,false);assert.equal(r.extraction_authorized,false);assert.equal(r.public_rows_written,0);});
test('replay reuses original reservation/files without download, scan, allocate, insert or create',()=>{const first=run(),before={posts:first.w.posts.length,ledger:first.w.ledger.length,gets:first.w.gets.length,scans:first.w.scans,allocate:first.w.allocations};const second=run(first.w,{},input(),{...ctx,executionId:'3002'});assert.equal(second.result.ok,true);assert.equal(second.result.idempotent_replay,true);assert.equal(second.result.drive_create_attempts,0);assert.deepEqual({posts:first.w.posts.length,ledger:first.w.ledger.length,gets:first.w.gets.length,scans:first.w.scans,allocate:first.w.allocations},before);assert.deepEqual(second.result.source_package,first.result.source_package);});
test('changed bytes with same title create a distinct immutable revision',()=>{const first=run(),next=Buffer.from('%PDF-1.7\nNEW REVISION\n%%EOF\n');const second=run(first.w,{sourceBytes:next},input(next),{...ctx,executionId:'3002'});assert.equal(second.result.ok,true);assert.notEqual(first.result.batch_id,second.result.batch_id);assert.equal(first.w.files.size,6);assert.equal(first.w.ledger.length,2);});
test('lost archive write acknowledgments read back preallocated IDs without a second POST',()=>{const r=run(world(),{discardPostAck:true});assert.equal(r.result.ok,true);assert.equal(r.w.posts.length,3);assert.equal(r.result.drive_create_attempts,3);});
test('discarded reservation acknowledgment reconciles one insert through a fresh read',()=>{const r=run(world(),{discardInsertAck:true});assert.equal(r.result.ok,true);assert.equal(r.w.ledger.length,1);});
test('stored reservation resumes missing files with the same IDs',()=>{const first=run(),v=first.s.reservation;first.w.files.delete(v.sourceId);first.w.files.delete(v.manifestId);const r=run(first.w,{},input(),{...ctx,executionId:'3002'});assert.equal(r.result.ok,true);assert.equal(r.w.ledger.length,1);assert.equal(r.s.reservation.sourceId,v.sourceId);assert.equal(r.w.posts.length,5);});
test('local contender is blocked without taking or releasing another holder token',()=>{const w=world();Object.assign(w.guard,{lock_token:'held_other',holder_execution_id:'other',holder_workflow_id:'other',acquired_at:now()});const original=clone(w.guard),r=run(w);assert.equal(r.result.state,'FAILED_CLOSED');assert.equal(w.posts.length,0);assert.equal(w.ledger.length,0);assert.deepEqual(w.guard,original);});
test('two idle readers cannot both obtain the guard',()=>{const e=engine(),w=world();let a=e.start(config,input(),ctx),b=e.start(config,input(),{...ctx,executionId:'3002'});a=e.step(a,transport(a,w));b=e.step(b,transport(b,w));a=e.step(a,transport(a,w));b=e.step(b,transport(b,w));a=e.step(a,transport(a,w));b=e.step(b,transport(b,w));assert.equal(a.owned,true);assert.equal(b.request.route,'done');assert.equal(b.failure.includes('ownership'),true);assert.equal(w.guard.lock_token,a.claim.lock_token);});
for(const opts of [{sourceStatus:404},{sourceStatus:302},{sourceMime:'text/html'},{sourceBytes:Buffer.from('not a pdf')},{scanStatus:'INFECTED'},{scanHash:'0'.repeat(64)},{sharedRoot:true}])test('failure stops before immutable archive: '+JSON.stringify(opts),()=>{const r=run(world(),opts);assert.equal(r.result.state,'FAILED_CLOSED');assert.equal(r.result.ok,false);assert.equal(r.w.posts.length,0);assert.equal(r.w.ledger.length,0);assert.equal(r.w.guard.lock_token,'UNLOCKED');});
test('corrupt stored byte readback never returns acquired',()=>{const first=run();const r=run(first.w,{corruptReadback:true},input(),{...ctx,executionId:'3002'});assert.equal(r.result.ok,false);assert.equal(r.result.guard_release_verified,true);assert.equal(r.w.posts.length,3);});
test('duplicate reservation rows fail closed rather than selecting a random package',()=>{const first=run();first.w.ledger.push({...first.w.ledger[0],id:2});const r=run(first.w,{},input(),{...ctx,executionId:'3002'});assert.equal(r.result.ok,false);assert.equal(r.w.posts.length,3);});
test('modified manifest reservation cannot authorize extraction or release',()=>{const first=run();const v=JSON.parse(first.w.ledger[0].reservation_json);v.manifest.publication_authorized=true;first.w.ledger[0].reservation_json=JSON.stringify(v);const r=run(first.w,{},input(),{...ctx,executionId:'3002'});assert.equal(r.result.ok,false);assert.equal(r.result.publication_authorized,false);});
test('unknown reservation outcome retains guard and forbids another insert',()=>{const e=engine(),w=world();let s=e.start(config,input(),ctx);while(s.phase!=='LEDGER_INSERT')s=e.step(s,transport(s,w));s=e.step(s,{rows:[{error:'unknown outcome'}]});assert.equal(s.phase,'LEDGER_READ');s=e.step(s,{rows:[]});const r=e.result(s);assert.equal(r.state,'FAILED_CLOSED');assert.equal(r.guard_recovery_required,true);assert.notEqual(w.guard.lock_token,'UNLOCKED');assert.equal(w.posts.length,0);});
for(const [label,edit] of [
 ['no change',x=>x.monitorReceipt.state='MONITORED_NO_CHANGE'],
 ['failed receipt',x=>x.monitorReceipt.summary.failed=1],
 ['catalogue',x=>x.monitorReceipt.catalogDigest='0'.repeat(64)],
 ['stale receipt',x=>x.monitorReceipt.checkedAt='2026-10-17T00:00:00Z'],
 ['future receipt',x=>x.monitorReceipt.checkedAt='2026-10-20T00:00:00Z'],
 ['wrong URL',x=>x.monitorReceipt.results[1].url='https://evil.example/test.pdf'],
 ['duplicate sources',x=>x.monitorReceipt.results[4]=clone(x.monitorReceipt.results[1])],
 ['false changed count',x=>x.monitorReceipt.summary.changed=2],
 ['unchanged bytes labelled changed',x=>x.monitorReceipt.results[1].observedSha256=artifacts[0].expectedSha256],
 ['discovery-only acquisition',x=>x.sourceId='index'],
])test('input gate rejects '+label,()=>{const x=input();edit(x);assert.throws(()=>engine().start(config,x,ctx),/JIF_SE02_BLOCKED/);});
test('missing scanner is never a bypass',()=>{assert.throws(()=>engine().start({...config,scannerUrl:''},input(),ctx),/scanner/);});
test('source and manifest uploads use opaque binary bytes, never Google conversion',()=>{const r=run();const p=r.w.posts.find(x=>x.kind==='source');assert.ok(p.body.bytes.includes(source));assert.equal(p.body.mime,'application/pdf');assert.equal(r.result.source_upload_put_attempts,1);assert.equal(r.w.files.get(p.id).metadata.mimeType,'application/pdf');});
test('CSV file gate preserves exact bytes and checks required header tokens',()=>{const old=clone(artifacts[0]);try{Object.assign(artifacts[0],{fileName:'test-0.csv',expectedContentTypes:['text/csv'],requiredTextTokens:['Coding Block','Org Desc','2026-2027']});delete artifacts[0].requiredMagicHex;const csv=Buffer.from('Coding Block,Org Desc,2026-2027\n001,Fixture,1\n');const r=run(world(),{sourceBytes:csv,sourceMime:'text/csv'},input(csv));assert.equal(r.result.ok,true);assert.equal(r.result.source_package.manifest.mime_type,'text/csv');const bad=Buffer.from('bad header data without fiscal label\n');assert.equal(run(world(),{sourceBytes:bad,sourceMime:'text/csv'},input(bad)).result.ok,false);}finally{for(const k of Object.keys(artifacts[0]))delete artifacts[0][k];Object.assign(artifacts[0],old);}});
test('oversized source and missing private table setup stop before a guard attempt',()=>{assert.throws(()=>engine().start(config,input(Buffer.alloc(1025)),ctx),/artifact/);assert.throws(()=>engine().start({...config,ledgerTableId:config.guardTableId},input(),ctx),/tables/);});
test('resumable upload session cannot redirect authenticated bytes to another host',()=>{const e=engine(),w=world();let s=e.start(config,input(),ctx);while(s.phase!=='SOURCE_SESSION_POST')s=e.step(s,transport(s,w));s=e.step(s,{status:200,bytes:Buffer.alloc(0),headers:{location:'https://evil.example/upload?upload_id=fixture'}});while(s.request.route!=='done')s=e.step(s,transport(s,w));assert.equal(e.result(s).ok,false);assert.equal(w.files.size,1);assert.equal(w.guard.lock_token,'UNLOCKED');});
test('unacknowledged resumable session is not blindly initiated again',()=>{const e=engine(),w=world();let s=e.start(config,input(),ctx);while(s.phase!=='SOURCE_SESSION_POST')s=e.step(s,transport(s,w));s=e.step(s,{status:0,bytes:Buffer.alloc(0)});while(s.request.route!=='done')s=e.step(s,transport(s,w));assert.equal(e.result(s).ok,false);assert.equal(w.ledger.length,1);assert.equal(w.files.size,1);assert.equal(w.guard.lock_token,'UNLOCKED');});
