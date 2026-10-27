// Run against local Vite with VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL pointing to /__mock_subscribe.
// All feeds and subscription responses are synthetic; external requests are blocked.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const output = process.env.TEST_OUTPUT_DIR || '/tmp/jif-ui-evidence';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote'] });
const page = await browser.newPage({ reducedMotion: 'reduce' });
const errors = []; page.on('pageerror', e => errors.push(e.message));
const labels = ['Tax Revenue','Non-Tax Revenue','Total Revenue & Grants','Primary Balance','Fiscal Balance','Compensation of Employees','Capital Expenditure','Interest'];
const statuses = ['Watch','Under Pressure','Watch','Under Pressure','On Track','On Track','Watch','On Track'];
const months = ['2026-04','2026-05','2026-06','2026-07','2026-08'];
const names = ['Apr','May','Jun','Jul','Aug'];
const csv = rows => { const keys=[...new Set(rows.flatMap(Object.keys))]; const cell=x=>'"'+String(x??'').replaceAll('"','""')+'"'; return [keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\n'); };
const feeds = {
 '366568461':csv(months.flatMap((month_sort,m)=>labels.map((kpi_label,i)=>({month_sort,month_label:names[m]+'-2026', kpi_label, display_order:i+1, status:m===3&&i===4?'Under Pressure':statuses[i],status_headline:'Watch', annual_baseline_value:'$13,073.644', monthly_outturn_value:'$7,830.405',read_variance_text:m===0&&i===4?'-40.1% more negative than baseline, material pressure':'Below YTD baseline',monthly_editorial_headline:'Budget performance for '+names[m]})))),
 '1176061617':csv(months.map((month_sort,m)=>({month_sort,month_label:names[m]+'-2026',status:'Watch'}))),
 '1322269186':csv(months.map((month_sort,m)=>({month_sort,month_label:names[m]+'-2026',monthly_note:'Synthetic regression fixture.',latest_update_at:'2026-10-22T12:00:00Z',source_document_1_url:'https://www.mof.gov.jm/wp-content/uploads/Copy-of-CGO-'+['April','May','June','July','August'][m]+'-2026.xlsx',receipts_pack_url:base+'/receipts-packs/'+month_sort+'-jif-receipts-pack.pdf'})))
};
let responseStatus='pending_confirmation', sends=0, delayedReads=0;
await page.route('**/*', async route=>{
 const url=new URL(route.request().url());
 if(url.hostname==='docs.google.com') { if(delayedReads>0) { delayedReads--; await new Promise(resolve=>setTimeout(resolve,500)); } return route.fulfill({status:200,contentType:'text/csv',body:feeds[url.searchParams.get('gid')]||''}); }
 if(url.pathname==='/__mock_subscribe') { sends++; return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:responseStatus})}); }
 if(url.origin===base) return route.continue();
 return route.abort();
});
try {
 await page.goto(base);
 const select=page.getByTestId('month-select-trigger');
 await page.waitForFunction(()=>document.querySelector('select')?.value==='2026-08');
 for(const month of months) { await select.selectOption(month); await page.waitForFunction(m=>document.querySelector('main')?.getAttribute('aria-busy')==='false'&&document.querySelector('select')?.value===m,month); assert.equal(new URL(page.url()).searchParams.get('month'),month); }
 await page.goBack(); await page.waitForFunction(()=>document.querySelector('select')?.value==='2026-07');
 await page.goBack(); await page.waitForFunction(()=>document.querySelector('select')?.value==='2026-06');
 await page.goForward(); await page.waitForFunction(()=>document.querySelector('select')?.value==='2026-07');
 await select.selectOption('2026-04');
 await page.waitForFunction(()=>document.querySelector('main')?.getAttribute('aria-busy')==='false');
 assert.match(await page.getByTestId('kpi-table-card').innerText(),/smaller surplus/);
 assert.equal(await page.getByTestId('tracker-state-pill').textContent(),'Historical month');
 await select.selectOption('2026-08'); await page.waitForFunction(()=>document.querySelector('main')?.getAttribute('aria-busy')==='false');
 assert.equal(await page.getByTestId('comparison-unchanged-list').locator('li').count(),7);
 delayedReads=3;
 await select.selectOption('2026-04');
 await select.selectOption('2026-08');
 await page.waitForTimeout(650);
 assert.equal(await select.inputValue(),'2026-08');
 assert.match(await page.getByTestId('dashboard-title').textContent(),/Aug/);
 for(const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>window.scrollTo(0,0));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
  assert.equal(await page.getByTestId('mobile-kpi-list').isVisible(),width<=600);
  await page.screenshot({path:`${output}/tracker-${width}.png`});
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByTestId('mobile-kpi-list').locator('summary').first().click();
 assert.ok(await page.getByTestId('mobile-kpi-list').locator('dd').first().isVisible());
 await page.getByTestId('mobile-kpi-list').scrollIntoViewIfNeeded();
 await page.screenshot({path:`${output}/mobile-measures.png`});
 await page.getByTestId('compact-subscribe-scroll-button').click();
 await page.waitForFunction(()=>document.activeElement?.id==='subscriber-email');
 assert.ok(await page.locator('#subscriber-email').evaluate(el=>el.getBoundingClientRect().top>=202));
 await page.getByTestId('subscribe-form').evaluate(el=>el.requestSubmit());
 assert.equal(await page.locator('#subscriber-email').getAttribute('aria-invalid'),'true');
 assert.equal(sends,0);
 assert.equal(await page.locator('#subscribe-status-message').getAttribute('role'),'status');
 for(const status of ['pending_confirmation','already_subscribed','server_error']) {
  responseStatus=status;
  await page.locator('#subscriber-email').fill('synthetic@example.com');
  await page.locator('#subscriber-consent').check();
  await page.getByTestId('subscribe-form').evaluate(el=>el.requestSubmit());
  await page.waitForFunction(s=>document.querySelector('#subscribe-status-message')?.classList.contains(s),status);
 }
 assert.equal(sends,3); assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',months:5,history:'Back/Forward',comparisonUnchanged:7,widths:[320,390,768,1440],mockSubscriptionResponses:3,realSubscriptions:0,browserErrors:errors,screenshots:output}));
} finally { await browser.close(); }
