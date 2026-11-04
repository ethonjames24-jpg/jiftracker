import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { makeArchive } from '../src/archive.mjs';
import { sha256Bytes } from '../../se-01-source-monitor/src/n8n-runtime-compat.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw=fs.readFileSync(path.join(root,'../se-01-source-monitor/config/source-catalog.v1.json'));
const catalog=JSON.parse(raw),catalogDigest=createHash('sha256').update(raw).digest('hex');
if(catalogDigest!=='f84921812c0950717879b528e57530a4c23f5c8e2bfb65b51b022f6c9b9fda29')throw Error('Reviewed catalogue changed');
const config=JSON.parse(fs.readFileSync(path.join(root,'config/install-config.json')));
const w={name:'JIF | SE-02 Acquire and Archive | REPORT ONLY v0.1',active:false,nodes:[],connections:{},pinData:{},settings:{executionOrder:'v1',saveManualExecutions:true,saveDataErrorExecution:'all',saveDataSuccessExecution:'all'}};
const uid=n=>createHash('sha256').update('jif-se02-v1/'+n).digest('hex').slice(0,32).replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/,'$1-$2-$3-$4-$5');
function node(name,type,parameters,position,version=2){const n={id:uid(name),name,type,typeVersion:version,parameters,position,retryOnFail:false};w.nodes.push(n);return n;}
function edge(a,b){w.connections[a]={main:[[{node:b,type:'main',index:0}]]};}
const runtime=sha256Bytes.toString()+'\n'+makeArchive.toString()+'\nconst engine=makeArchive({hash:sha256Bytes,now:()=>new Date().toISOString(),catalog:'+JSON.stringify(catalog)+',catalogDigest:'+JSON.stringify(catalogDigest)+'});\n';
node('SE02 | Manual Preflight','n8n-nodes-base.manualTrigger',{},[-700,0],1);
node('SE02 | Future Child Input','n8n-nodes-base.executeWorkflowTrigger',{inputSource:'passthrough'},[-700,180],1.1);
node('SE02 | Settings','n8n-nodes-base.code',{jsCode:'const config='+JSON.stringify(config,null,2)+';\nconst input=config.caseInput ?? ($input.first()?.json?.monitorReceipt ? $input.first().json : null);\nreturn [{json:{config,input}}];\n'},[-460,0]);
node('SE02 | Engine','n8n-nodes-base.code',{jsCode:runtime+`
let s;const input=$input.first();
if($runIndex===0){const settings=$('SE02 | Settings').first().json;s=engine.start(settings.config,settings.input,{workflowId:String($workflow.id||''),executionId:String($execution.id||'')});}
else{
 const prior=$('SE02 | Engine').all(0,$runIndex-1);if(prior.length!==1)throw new Error('JIF_SE02_BLOCKED: same-execution state missing');
 s=JSON.parse(JSON.stringify(prior[0].json.state));
 if(s.owner.executionId!==String($execution.id)||s.owner.workflowId!==$workflow.id)throw new Error('JIF_SE02_BLOCKED: current execution differs');
 const response={status:Number(input.json.statusCode||0),headers:Object.fromEntries(Object.entries(input.json.headers||{}).map(([k,v])=>[k.toLowerCase(),v])),rows:input.json.tableRows,bytes:Buffer.alloc(0)};
 if(input.binary?.response)response.bytes=await this.helpers.getBinaryDataBuffer(0,'response');s=engine.step(s,response);
}
const binary={};if(s.hasSourceBytes&&input.binary?.source)binary.source=input.binary.source;
if(['drive','public','scan'].includes(s.request.route)){
 let source=Buffer.alloc(0);if(['scan','source'].includes(s.request.kind))source=await this.helpers.getBinaryDataBuffer(0,'source');
 const body=engine.body(s,source);s.request.mime=body.mime;binary.requestBody=await this.helpers.prepareBinaryData(body.bytes,'request.bin',body.mime);
}
return [{json:{state:s},binary}];
`},[-200,0]);
node('SE02 | Response Context','n8n-nodes-base.code',{jsCode:`
const prior=$('SE02 | Engine').all(0,$runIndex);if(prior.length!==1)throw new Error('JIF_SE02_BLOCKED: transport context missing');
const p=prior[0],s=p.json.state;if(s.owner.executionId!==String($execution.id)||s.owner.workflowId!==$workflow.id)throw new Error('JIF_SE02_BLOCKED: transport execution differs');
const inputs=$input.all(),table=['guard_read','acquire','release','ledger_read','ledger_insert'].includes(s.request.route);
if(!table&&inputs.length!==1)throw new Error('JIF_SE02_BLOCKED: one HTTP response required');
const binary={...p.binary,...inputs[0]?.binary};if(s.phase==='SOURCE_GET'&&inputs[0]?.binary?.response)binary.source=inputs[0].binary.response;
return [{json:table?{tableRows:inputs.map(i=>i.json)}:inputs[0].json,binary}];
`},[1800,1700]);
node('SE02 | Return Receipt','n8n-nodes-base.code',{jsCode:runtime+'return [{json:engine.result($input.first().json.state)}];\n'},[600,-150]);
node('SE02 | Invalid Route','n8n-nodes-base.code',{jsCode:"throw new Error('JIF_SE02_BLOCKED: transport route differs');"},[800,1800]);
const routes=['done','guard_read','acquire','release','ledger_read','ledger_insert','drive','public','scan'];
for(let i=0;i<routes.length;i++){
 const r=routes[i],name='SE02 | Route '+r;
 node(name,'n8n-nodes-base.if',{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{id:uid(name+'/condition'),leftValue:'={{$json.state.request.route}}',rightValue:r,operator:{type:'string',operation:'equals'}}],combinator:'and'},options:{}},[60+i*150,i*200],2.2);
 w.connections[name]={main:[[{node:r==='done'?'SE02 | Return Receipt':'SE02 | '+r,type:'main',index:0}],[{node:i===routes.length-1?'SE02 | Invalid Route':'SE02 | Route '+routes[i+1],type:'main',index:0}]]};
}
const schema=names=>names.map(id=>({id,displayName:id,required:false,defaultMatch:false,display:true,type:'string',canBeUsedToMatch:true}));
const guardCols=['guard_key','schema_version','lock_token','holder_execution_id','holder_workflow_id','acquired_at'];
const guardTable={__rl:true,mode:'id',value:'={{$json.state.config.guardTableId}}'},ledgerTable={__rl:true,mode:'id',value:'={{$json.state.config.ledgerTableId}}'};
const base={resource:'row',matchType:'allConditions'};
node('SE02 | guard_read','n8n-nodes-base.dataTable',{...base,operation:'get',dataTableId:guardTable,filters:{conditions:[]},returnAll:true},[1400,200],1.1);
const claimCheck=route=>`={{(()=>{const s=$json.state;if(!$('SE02 | Engine').isExecuted||s.version!=='jif-se02-archive-v1'||s.request.route!=='${route}'||s.owner.workflowId!==$workflow.id||s.owner.executionId!==String($execution.id)||s.claim.lock_token!=='JIF-SE02|'+$workflow.id+'|'+$execution.id)throw new Error('JIF_SE02_BLOCKED: same-execution write required');return String(s.config.guardRowId);})()}}`;
for(const route of ['acquire','release']){
 const release=route==='release',keys=['lock_token','holder_execution_id','holder_workflow_id','acquired_at'];
 const values=Object.fromEntries(keys.map(k=>[k,release?(k==='lock_token'?'UNLOCKED':'NONE'):'={{$json.state.claim.'+k+'}}']));
 const filters=[{keyName:'id',keyValue:claimCheck(route)},{keyName:'guard_key',keyValue:'JIF_SE02_ARCHIVE_GLOBAL'},{keyName:'schema_version',keyValue:'jif-se02-archive-v1'},...keys.map(k=>({keyName:k,keyValue:release?'={{$json.state.claim.'+k+'}}':k==='lock_token'?'UNLOCKED':'NONE'}))];
 node('SE02 | '+route,'n8n-nodes-base.dataTable',{...base,operation:'update',dataTableId:guardTable,filters:{conditions:filters},columns:{mappingMode:'defineBelow',value:values,schema:schema(guardCols)},options:{dryRun:false}},[1400,release?600:400],1.1);
}
node('SE02 | ledger_read','n8n-nodes-base.dataTable',{...base,operation:'get',dataTableId:ledgerTable,filters:{conditions:[{keyName:'batch_key',keyValue:'={{$json.state.batchKey}}'}]},returnAll:true},[1400,800],1.1);
node('SE02 | ledger_insert','n8n-nodes-base.dataTable',{resource:'row',operation:'insert',dataTableId:ledgerTable,columns:{mappingMode:'defineBelow',value:{batch_key:"={{(()=>{const s=$json.state;if(s.phase!=='LEDGER_INSERT'||!s.owned||s.owner.workflowId!==$workflow.id||s.owner.executionId!==String($execution.id)||!s.reservationPending)throw new Error('JIF_SE02_BLOCKED: guarded reservation required');return s.batchKey;})()}}",reservation_json:'={{JSON.stringify($json.state.reservation)}}'},schema:schema(['batch_key','reservation_json'])},options:{optimizeBulk:false}},[1400,1000],1.1);
for(const route of ['drive','public','scan']){
 const p={url:'={{$json.state.request.url}}',method:'={{$json.state.request.method}}',sendBody:route!=='public',contentType:'binaryData',inputDataFieldName:'requestBody',sendHeaders:true,headerParameters:{parameters:[{name:'Accept',value:'application/json, application/pdf, text/csv'},{name:'Content-Type',value:'={{$json.state.request.mime}}'},{name:'Cache-Control',value:'no-cache'}]},options:{timeout:180000,redirect:{redirect:{followRedirects:false,maxRedirects:0}},response:{response:{fullResponse:true,neverError:true,responseFormat:'file',outputPropertyName:'response'}}},authentication:route==='drive'?'predefinedCredentialType':route==='scan'?'genericCredentialType':'none'};
 if(route==='drive')p.nodeCredentialType='googleDriveOAuth2Api';if(route==='scan'){p.genericAuthType='httpHeaderAuth';p.headerParameters.parameters.push({name:'X-JIF-Expected-SHA256',value:'={{$json.state.observedSha256}}'});}
 node('SE02 | '+route,'n8n-nodes-base.httpRequest',p,[1400,route==='drive'?1200:route==='public'?1400:1600],4.4);
}
for(const n of w.nodes.filter(n=>n.type==='n8n-nodes-base.dataTable'||n.type==='n8n-nodes-base.httpRequest')){n.disabled=config.transportEnabled!==true;n.alwaysOutputData=true;n.onError='continueRegularOutput';edge(n.name,'SE02 | Response Context');}
edge('SE02 | Manual Preflight','SE02 | Settings');edge('SE02 | Future Child Input','SE02 | Settings');edge('SE02 | Settings','SE02 | Engine');edge('SE02 | Engine','SE02 | Route done');edge('SE02 | Response Context','SE02 | Engine');
fs.writeFileSync(path.join(root,'workflows/JIF-SE02-Acquire-Archive-REPORT-ONLY-v0.1.json'),JSON.stringify(w,null,2)+'\n');
console.log(JSON.stringify({nodes:w.nodes.length,active:w.active,catalogDigest,defaultMode:config.mode,credentialsBound:0}));
