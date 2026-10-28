// Local-only regression: frozen public feed snapshot, all external requests blocked.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const fixture=JSON.parse(await readFile(new URL('./fixtures/source-disclosure-feed.json',import.meta.url),'utf8'));
const csv=rows=>{const keys=[...new Set(rows.flatMap(Object.keys))],cell=x=>'"'+String(x??'').replaceAll('"','""')+'"';return[keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\n');};
const feeds={'366568461':csv(fixture.tracker),'1176061617':csv(fixture.extras.map(({month_sort,month_label})=>({month_sort,month_label}))),'1322269186':csv(fixture.extras)};
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173',baseline=process.env.BASELINE_URL||'http://127.0.0.1:5174',output=process.env.TEST_OUTPUT_DIR||'/tmp/jif-source-disclosure-evidence';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote']});
const errors=[],writes=[];
async function pageFor(origin){const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>{const url=new URL(route.request().url());if(route.request().method()!=='GET'){writes.push(url.origin+url.pathname);return route.abort();}if(url.hostname==='docs.google.com')return route.fulfill({status:200,contentType:'text/csv',body:feeds[url.searchParams.get('gid')]||''});if(url.origin===origin)return route.continue();return route.abort();});return page;}
async function settle(page){await page.waitForFunction(()=>document.querySelector('main')?.getAttribute('aria-busy')==='false'||document.querySelector('[data-capture-ready="true"]'));}
try{
 const before=await pageFor(baseline),after=await pageFor(base);
 for(const month of ['2026-04','2026-05','2026-06','2026-07','2026-08']){
  await before.goto(`${baseline}/?month=${month}`);await after.goto(`${base}/?month=${month}`);await settle(before);await settle(after);
  assert.equal(await after.getByTestId('kpi-table-card').innerText(),await before.getByTestId('kpi-table-card').innerText(),`${month} KPI output`);
  for(const link of ['source-document-1-link','source-document-2-link','receipts-pack-link']){
   assert.deepEqual(await after.getByTestId(link).evaluateAll(es=>es.map(e=>e.getAttribute('href'))),await before.getByTestId(link).evaluateAll(es=>es.map(e=>e.getAttribute('href'))),`${month} ${link}`);
  }
  const meta=after.getByTestId('source-document-1-metadata');assert.match(await meta.innerText(),/Linked-file record date/i);assert.match(await meta.innerText(),/Ministry listing date/i);
  const details=after.getByTestId('source-version-note');await details.locator('summary').focus();await after.keyboard.press('Enter');assert.equal(await details.getAttribute('open'),'');
  if(month==='2026-06')assert.match(await details.innerText(),/planned surplus to a planned deficit/);
  if(month==='2026-05')assert.match(await details.innerText(),/already calculated Interest and Capital/);
  for(const width of [320,390,768,1440]){await after.setViewportSize({width,height:1000});await after.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth && document.querySelector('[data-testid="source-documents-section"]').scrollWidth<=document.querySelector('[data-testid="source-documents-section"]').clientWidth,null,{timeout:3000});assert.ok(await after.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${month} overflow ${width}: ${JSON.stringify(await after.evaluate(()=>[...document.querySelectorAll("body *")].map(e=>({tag:e.tagName,cls:e.className,w:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})).filter(e=>e.right>innerWidth+1).slice(0,18)))}`);assert.ok(await after.getByTestId('source-documents-section').evaluate(el=>el.scrollWidth<=el.clientWidth),`${month} clipped source content ${width}`);}
 }
 await after.goto(`${base}/?month=2026-06`);await settle(after);
 for(const width of [390,1440]){
  await after.setViewportSize({width,height:1000});await before.goto(`${baseline}/?month=2026-06`);await settle(before);await before.setViewportSize({width,height:1000});
  await before.getByTestId('source-documents-section').screenshot({style:"header, .section-nav-shell, .skip-link, .back-to-top-button, .floating-subscribe-button { display: none !important; }",path:`${output}/before-source-${width}.png`});
  await after.getByTestId('source-version-note').locator('summary').focus();await after.keyboard.press('Enter');
  await after.getByTestId('source-documents-section').screenshot({style:"header, .section-nav-shell, .skip-link, .back-to-top-button, .floating-subscribe-button { display: none !important; }",path:`${output}/after-source-${width}.png`});
  await after.getByTestId('methodology-section').screenshot({style:"header, .section-nav-shell, .skip-link, .back-to-top-button, .floating-subscribe-button { display: none !important; }",path:`${output}/after-method-${width}.png`});
  await before.getByTestId('methodology-section').screenshot({style:"header, .section-nav-shell, .skip-link, .back-to-top-button, .floating-subscribe-button { display: none !important; }",path:`${output}/before-method-${width}.png`});
  if(width===390)await after.getByTestId('source-version-note').locator('summary').press('Enter');
 }
 for(const month of ['2026-04','2026-05','2026-06','2026-07','2026-08'])for(const mode of ['hero','kpi','sources']){
  await before.goto(`${baseline}/?month=${month}&capture=${mode}`);await after.goto(`${base}/?month=${month}&capture=${mode}`);await settle(before);await settle(after);
  assert.equal(await after.locator('.capture-page').innerHTML(),await before.locator('.capture-page').innerHTML(),`${month} capture ${mode}`);
 }
 await after.goto(base);await settle(after);const select=after.getByTestId('month-select-trigger');await select.selectOption('2026-04');await settle(after);await select.selectOption('2026-06');await settle(after);await after.goBack();await settle(after);assert.equal(await select.inputValue(),'2026-04');assert.match(await after.getByTestId('source-document-1-metadata').innerText(),/May 29, 2026/);await after.goForward();await settle(after);assert.equal(await select.inputValue(),'2026-06');
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 const result={result:'PASS',snapshot:'public feed checked October 28, 2026; no live writes',months:5,kpiRowsUnchanged:40,originalLinksUnchanged:true,captureMarkupComparisons:15,widths:[320,390,768,1440],keyboardDisclosure:true,history:true,pageErrors:errors,writeRequests:writes,screenshots:output};await writeFile(`${output}/result.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
