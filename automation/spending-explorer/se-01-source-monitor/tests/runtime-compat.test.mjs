import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import {sha256Bytes,canonicalMofUrl} from '../src/n8n-runtime-compat.mjs';

const workflow=JSON.parse(await readFile(new URL('../workflows/JIF_SE01_Spending_Explorer_Source_Monitor_INACTIVE.json',import.meta.url),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const body=name=>workflow.nodes.find(n=>n.name===name).parameters.jsCode;
const wrap=code=>`(async function(){${code}\n}).call(this)`;
const base='https://www.mof.gov.jm/resources-annual-and-supplementary-estimates/';
const load=()=>runInNewContext(wrap(body('Load Approved Catalog')),{Buffer});

test('SHA-256 matches Node crypto across padding boundaries, random bytes and UTF-8',()=>{
 for(const size of [0,1,55,56,63,64,65,119,120,127,128,1000,100000]){const b=randomBytes(size);assert.equal(sha256Bytes(b),hash(b));}
 const b=Buffer.from('Jamaica – J$100 💚');assert.equal(sha256Bytes(b),hash(b));
});

test('SHA-256 handles a 30 MiB artifact without a full padded copy or per-byte JS array',()=>{
 const b=Buffer.alloc(30*1024*1024,0x7a),start=performance.now();
 assert.equal(sha256Bytes(b),hash(b));
 assert(performance.now()-start<15000,'30 MiB local hash exceeded 15 seconds');
});

test('scoped URL resolver matches WHATWG canonical paths for supported MOFPS links',()=>{
 for(const href of ['/wp-content/uploads/2026-2027-Approved-Estimates.csv','https://mof.gov.jm/wp-content/uploads/a.pdf?download=1#top','//WWW.MOF.GOV.JM:443/wp-content/uploads/a.pdf','../wp-content/uploads/2026-27-Supplementary-Estimates.pdf','/wp-content/./uploads/x/../a.pdf','/wp-content/%2e/uploads/a.pdf','/wp-content/uploads/a b.pdf','/wp-content/uploads/%20-a.pdf','/wp-content/uploads/café.pdf']){
  const want=new URL(href,base);want.hash='';want.search='';if(want.hostname==='mof.gov.jm')want.hostname='www.mof.gov.jm';
  assert.equal(canonicalMofUrl(href,base).url,want.toString(),href);
 }
});

test('scoped URL resolver rejects unsupported protocols and foreign authorities',()=>{
 for(const href of ['http://www.mof.gov.jm/a','https://www.mof.gov.jm.evil.invalid/a','https://x@www.mof.gov.jm/a','//evil.invalid/a','javascript:alert(1)','https://www.mof.gov.jm:8443/a','/wp-content/\\evil.pdf'])assert.throws(()=>canonicalMofUrl(href,base));
});

test('generated catalogue runs without crypto/URL and schedule stays disabled',async()=>{
 const items=await load();assert.equal(items.length,5);
 assert.equal(workflow.nodes.find(n=>n.type.endsWith('.scheduleTrigger')).disabled,true);
 assert.equal(workflow.active,false);
 for(const n of workflow.nodes.filter(n=>n.type.endsWith('.code')))assert.doesNotMatch(n.parameters.jsCode,/crypto\.subtle|new URL\(|require\(/);
});

async function fixture(){
 const sources=await load(),raw=sources[0].json.linkInventory.expectedUrls;
 const html=Buffer.from('Annual and Supplementary Estimates '+raw.map(u=>`<a href="${u}">source</a>`).join(''));
 const buffers=sources.map((s,i)=>i===0?html:Buffer.from(s.json.requiredMagicHex?'%PDF-1.7 SYNTHETIC FIXTURE':s.json.requiredTextTokens.join(' ')));
 sources.forEach((s,i)=>{s.json.minimumBytes=1;s.json.maximumBytes=50000000;if(i)s.json.expectedSha256=hash(buffers[i]);});
 const fetched=sources.map(s=>({json:{statusCode:200,headers:{'Content-Type':s.json.expectedContentTypes[0]}},binary:{data:{data:'unused-filesystem-placeholder'}}}));
 return {sources,buffers,fetched};
}

async function fingerprint(f){
 return runInNewContext(wrap(body('Fingerprint and Compare')),{Buffer,TextEncoder,
  $:()=>({all:()=>f.sources}),$input:{all:()=>f.fetched},helpers:{getBinaryDataBuffer:async i=>f.buffers[i]}});
}
async function receipt(results){return (await runInNewContext(wrap(body('Return Read-Only Receipt')),{$input:{all:()=>results}}))[0].json;}

test('generated fingerprint and receipt execute no-change with only exposed sandbox globals and binary helper',async()=>{
 const f=await fixture(),results=await fingerprint(f),r=await receipt(results);
 assert.equal(r.state,'MONITORED_NO_CHANGE');assert.equal(r.summary.sourcesChecked,5);assert.equal(r.summary.unchanged,5);
});

test('generated fingerprint detects modified bytes and a new supplementary source link',async()=>{
 const f=await fixture();f.buffers[1]=Buffer.concat([f.buffers[1],Buffer.from(' changed')]);
 f.buffers[0]=Buffer.concat([f.buffers[0],Buffer.from('<a href="/wp-content/uploads/2026-27-Supplementary-Estimates.pdf">new</a>')]);
 const r=await receipt(await fingerprint(f));assert.equal(r.state,'SOURCE_CHANGE_DETECTED');assert.equal(r.summary.changed,2);
 assert.equal(r.results[0].addedLinks.length,1);
});

test('generated HTTP failure overrides a simultaneous source change',async()=>{
 const f=await fixture();f.buffers[1]=Buffer.concat([f.buffers[1],Buffer.from(' changed')]);f.fetched[2].json.statusCode=404;
 const r=await receipt(await fingerprint(f));assert.equal(r.state,'FAILED_CLOSED');assert.equal(r.summary.failed,1);assert.equal(r.summary.changed,1);
});

test('generated fingerprint fails closed on redirect, missing body, wrong type and oversized bytes',async()=>{
 for(const mutate of [f=>{f.fetched[1].json.statusCode=302;},f=>{f.buffers[1]=null;},f=>{f.fetched[1].json.headers={'content-type':'text/html'};},f=>{f.sources[1].json.maximumBytes=5;}]){
  const f=await fixture();mutate(f);assert.equal((await receipt(await fingerprint(f))).state,'FAILED_CLOSED');
 }
});

test('terminal receipt cannot report no-change for empty, duplicate or unrecognized results',async()=>{
 const good=await fingerprint(await fixture());
 for(const results of [[],good.slice(0,4),[...good.slice(0,4),good[0]],good.map((r,i)=>i? r :{json:{...r.json,outcome:'OTHER'}})])assert.equal((await receipt(results)).state,'FAILED_CLOSED');
});

test('pre-network source loader rejects a foreign catalogue URL',async()=>{
 const code=body('Load Approved Catalog').replace('https://www.mof.gov.jm/resources-annual-and-supplementary-estimates/','https://example.invalid/');
 await assert.rejects(runInNewContext(wrap(code),{Buffer}),/SOURCE_BASE_URL_INVALID/);
});


test('generated graph serializes source requests and only compares the collected done output',()=>{
 const loop=workflow.nodes.find(n=>n.name==='Loop Official Sources');
 assert.equal(workflow.nodes.length,7);
 assert.equal(loop.type,'n8n-nodes-base.splitInBatches');assert.equal(loop.typeVersion,3);
 assert.equal(loop.parameters.batchSize,1);assert.equal(loop.parameters.options.reset,false);
 assert.equal(workflow.connections['Load Approved Catalog'].main[0][0].node,loop.name);
 assert.equal(workflow.connections[loop.name].main[0][0].node,'Fingerprint and Compare');
 assert.equal(workflow.connections[loop.name].main[1][0].node,'GET Official Source Bytes');
 assert.equal(workflow.connections['GET Official Source Bytes'].main[0][0].node,loop.name);
 const http=workflow.nodes.find(n=>n.name==='GET Official Source Bytes');
 assert.equal(http.parameters.options.timeout,180000);assert.equal(http.retryOnFail,false);
 assert.equal(http.parameters.options.redirect.redirect.followRedirects,false);
 assert.equal(http.parameters.method,'GET');
});
