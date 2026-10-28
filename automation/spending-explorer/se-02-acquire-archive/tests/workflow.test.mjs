import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
const w=JSON.parse(fs.readFileSync(new URL('../workflows/JIF-SE02-Acquire-Archive-REPORT-ONLY-v0.1.json',import.meta.url)));
const node=name=>w.nodes.find(n=>n.name===name),hash=b=>createHash('sha256').update(b).digest('hex');
const code=name=>node(name).parameters.jsCode;
async function execute(name,context,helpers={}){const box=vm.createContext({Buffer,...context,helpers});assert.equal(vm.runInContext('typeof crypto',box),'undefined');assert.equal(vm.runInContext('typeof URL',box),'undefined');return await new vm.Script('(async function(){'+code(name)+'}).call({helpers})').runInContext(box,{timeout:10000});}
const inputApi=items=>({first:()=>items[0],all:()=>items});
test('inactive full import has 24 unique nodes, no schedule, no caller/promotion/send nodes',()=>{assert.equal(w.active,false);assert.equal(w.nodes.length,24);assert.equal(new Set(w.nodes.map(x=>x.id)).size,24);assert.equal(new Set(w.nodes.map(x=>x.name)).size,24);assert.deepEqual(w.pinData,{});for(const n of w.nodes){assert.equal(n.retryOnFail,false);assert.ok(!n.credentials);assert.ok(!/scheduleTrigger|executeWorkflow$|telegram|googleSheets|webhook|executeCommand/.test(n.type));}});
test('all edges resolve and every native response returns through the same response context',()=>{for(const edges of Object.values(w.connections))for(const group of edges.main)for(const e of group)assert.ok(node(e.node));for(const n of w.nodes.filter(x=>/httpRequest|dataTable/.test(x.type)))assert.equal(w.connections[n.name].main[0][0].node,'SE02 | Response Context');assert.equal(w.connections['SE02 | Response Context'].main[0][0].node,'SE02 | Engine');});
test('HTTP uses finite timeouts, fixed body toggles, binary files, no redirects and no source credentials',()=>{for(const n of w.nodes.filter(x=>/httpRequest/.test(x.type))){assert.equal(n.typeVersion,4.4);assert.equal(n.parameters.options.timeout,180000);assert.equal(n.parameters.options.redirect.redirect.followRedirects,false);assert.equal(n.parameters.options.response.response.responseFormat,'file');assert.equal(typeof n.parameters.sendBody,'boolean');assert.equal(n.parameters.inputDataFieldName,'requestBody');}assert.equal(node('SE02 | public').parameters.authentication,'none');assert.equal(node('SE02 | public').parameters.sendBody,false);});
test('native table writes are insert-only reservations and exact-owner guard updates',()=>{const tables=w.nodes.filter(x=>/dataTable/.test(x.type));assert.equal(tables.filter(x=>x.parameters.operation==='insert').length,1);assert.equal(tables.filter(x=>x.parameters.operation==='update').length,2);assert.ok(!tables.some(x=>/delete|upsert/.test(x.parameters.operation)));for(const name of ['SE02 | acquire','SE02 | release']){const p=node(name).parameters;assert.equal(p.matchType,'allConditions');assert.equal(p.filters.conditions.length,7);assert.ok(p.filters.conditions[0].keyValue.includes('$execution.id'));}});
test('generated settings and VM report-only route require no transport or credential',async()=>{const settings=await execute('SE02 | Settings',{$input:inputApi([{json:{}}])});const eng=await execute('SE02 | Engine',{$input:inputApi(settings),$runIndex:0,$execution:{id:'4000'},$workflow:{id:'SE02_workflow_test'},$:name=>({first:()=>settings[0]})});assert.equal(eng[0].json.state.request.route,'done');assert.equal(Object.keys(eng[0].binary).length,0);const result=await execute('SE02 | Return Receipt',{$input:inputApi(eng)});assert.equal(result[0].json.state,'REPORT_ONLY');assert.equal(result[0].json.ok,false);assert.equal(result[0].json.official_download_calls,0);});
test('generated wrappers retain filesystem binary references through table nodes and upload exact source',async()=>{
 const catalog=JSON.parse(fs.readFileSync(new URL('../../se-01-source-monitor/config/source-catalog.v1.json',import.meta.url)));
 const raw=fs.readFileSync(new URL('../../se-01-source-monitor/config/source-catalog.v1.json',import.meta.url)),a=catalog.artifacts[0];
 const bytes=Buffer.concat([Buffer.from('%PDF-1.7\n'),Buffer.alloc(1000000,32),Buffer.from('\n%%EOF\n')]);
 const checkedAt=new Date(Date.now()-1000).toISOString();
 const results=[{sourceId:catalog.discovery.id,outcome:'UNCHANGED',statusCode:200,observedSha256:catalog.discovery.linkInventory.expectedSha256},...catalog.artifacts.map((s,i)=>({sourceId:s.id,sourceClass:s.sourceClass,url:s.url,outcome:i===0?'CHANGED':'UNCHANGED',statusCode:200,expectedSha256:s.expectedSha256,observedSha256:i===0?hash(bytes):s.expectedSha256,observedBytes:i===0?bytes.length:s.expectedBytes}))];
 const config={mode:'ARCHIVE',transportEnabled:true,archiveRootId:'archive_root_fixture',guardTableId:'guard_table_fixture',guardRowId:1,ledgerTableId:'ledger_table_fixture',scannerUrl:'https://scanner.example.test/scan'};
 const settings=[{json:{config,input:{sourceId:a.id,monitorReceipt:{workflowId:'SE-01',catalogDigest:hash(raw),fiscalYear:catalog.fiscalYear,state:'SOURCE_CHANGE_DETECTED',checkedAt,summary:{sourcesChecked:5,unchanged:4,changed:1,failed:0},results}}}}];
 const history=[],binaries=new Map(),files=new Map();let seq=0,table=[],uploadedSource,guard={id:1,guard_key:'JIF_SE02_ARCHIVE_GLOBAL',schema_version:'jif-se02-archive-v1',lock_token:'UNLOCKED',holder_execution_id:'NONE',holder_workflow_id:'NONE',acquired_at:'NONE'};
 const prepare=async(b,name,mime)=>{const id='filesystem-fixture-'+(++seq);binaries.set(id,Buffer.from(b));return {id,data:'filesystem-v2',fileName:name,mimeType:mime};};
 const $=name=>name==='SE02 | Settings'?{first:()=>settings[0]}:{all:(_branch,index)=>history[index]};
 let items=settings,iteration=0;
 while(iteration<100){
  const helpers={prepareBinaryData:prepare,getBinaryDataBuffer:async(i,key)=>{const ref=items[i].binary?.[key];assert.ok(ref?.id,'filesystem binary must be on actual input');return binaries.get(ref.id);}};
  const output=await execute('SE02 | Engine',{$input:inputApi(items),$runIndex:iteration,$execution:{id:'4001'},$workflow:{id:'SE02_workflow_test'},$},helpers);history.push(output);
  const s=output[0].json.state,q=s.request;
  assert.ok(JSON.stringify(s).length<15000,'state must contain metadata, never source base64');
  if(q.route==='done'){assert.equal(s.acquired,true);assert.equal(s.guardReleased,true);break;}
  let response;
  if(q.route==='guard_read')response=[{json:{...guard}}];
  else if(q.route==='acquire'){guard={...guard,...s.claim};response=[{json:{...guard}}];}
  else if(q.route==='release'){guard={...guard,lock_token:'UNLOCKED',holder_execution_id:'NONE',holder_workflow_id:'NONE',acquired_at:'NONE'};response=[{json:{...guard}}];}
  else if(q.route==='ledger_read')response=table.length?table.map(json=>({json})):[{json:{}}];
  else if(q.route==='ledger_insert'){table=[{batch_key:s.batchKey,reservation_json:JSON.stringify(s.reservation)}];response=[{json:table[0]}];}
  else {
   let status=200,data,headers={'content-type':'application/json'};
   if(q.route==='public'){data=bytes;headers={'content-type':'application/pdf'};}
   else if(q.route==='scan'){assert.deepEqual(binaries.get(output[0].binary.requestBody.id),bytes);data={status:'CLEAN',sha256:hash(bytes),bytes:bytes.length,engine:'VM fixture',engineVersion:'1',signatureVersion:'fixture',scannedAt:new Date().toISOString()};}
   else if(q.url.includes('/generateIds?'))data={ids:['folder_fixture','source_fixture','manifest_fixture']};
   else if(q.url.includes('/'+config.archiveRootId+'?'))data={id:config.archiveRootId,mimeType:'application/vnd.google-apps.folder',trashed:false,shared:false};
   else if(q.kind==='source_session'){data={};headers={location:'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=fixture'};}
   else if(q.method==='POST'||q.method==='PUT'){
    const kind=q.kind,v=s.reservation,body=binaries.get(output[0].binary.requestBody.id);
    const metadata=kind==='source'?{id:v.sourceId,name:v.manifest.file_name,mimeType:v.manifest.mime_type,parents:[v.folderId],appProperties:{jif_se02_batch:s.batchKey,jif_se02_kind:'source',jif_se02_version:'1'}}:kind==='folder'?JSON.parse(body):JSON.parse(body.toString('utf8',body.indexOf('\r\n\r\n')+4,body.indexOf('\r\n--',body.indexOf('\r\n\r\n')+4)));
    let content=kind==='folder'?Buffer.alloc(0):kind==='source'?bytes:Buffer.from(JSON.stringify(v.manifest,Object.keys(v.manifest).sort()));
    if(kind==='source'){assert.ok(body.includes(bytes));uploadedSource=body;}
    if(kind==='manifest'){
      const boundary='JIFSE02'+s.batchKey.slice(0,24),start=body.indexOf('\r\n\r\n',body.indexOf('\r\n--'+boundary)+4)+4;
      content=body.subarray(start,body.length-Buffer.byteLength('\r\n--'+boundary+'--\r\n'));
    }
    files.set(metadata.id,{metadata:{...metadata,trashed:false,size:String(content.length)},bytes:content});data={id:metadata.id};
   }else{const id=q.url.match(/\/files\/([^?]+)\?/)[1],file=files.get(id);if(!file){status=404;data={};}else data=q.url.includes('alt=media')?file.bytes:file.metadata;}
   const binaryData=Buffer.isBuffer(data)?data:Buffer.from(JSON.stringify(data));
   response=[{json:{statusCode:status,headers},binary:{...output[0].binary,response:await prepare(binaryData,'response.bin',headers['content-type'])}}];
  }
  // Native tables discard binaries. This context node must restore them from the exact iteration.
  items=await execute('SE02 | Response Context',{$input:inputApi(response),$runIndex:iteration,$execution:{id:'4001'},$workflow:{id:'SE02_workflow_test'},$});iteration++;
 }
 assert.ok(iteration<100);assert.ok(uploadedSource);assert.equal(files.size,3);assert.equal(table.length,1);
});
test('all eight native transports are disabled in the import candidate',()=>{const transports=w.nodes.filter(n=>/httpRequest|dataTable/.test(n.type));assert.equal(transports.length,8);assert.ok(transports.every(n=>n.disabled===true));});
