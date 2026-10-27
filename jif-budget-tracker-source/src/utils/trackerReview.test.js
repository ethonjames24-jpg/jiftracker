import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('comparison renders all seven unchanged indicators and normalizes month labels', async () => {
 const server=await createServer({server:{middlewareMode:true,ws:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
 try {
  const {MonthComparison}=await server.ssrLoadModule('/src/components/MonthComparison.jsx');
  const labels=['Tax Revenue','Non-Tax Revenue','Total Revenue & Grants','Primary Balance','Compensation of Employees','Capital Expenditure','Interest'];
  const html=renderToStaticMarkup(createElement(MonthComparison,{comparison:{has_previous_month:true,selected_month:{month_sort:'2026-08'},previous_month:{month_sort:'2026-07',month_label:'Jul-2026'},movements:{is_reliable:true,improved:[{label:'Fiscal Balance'}],worsened:[],unchanged:labels.map(label=>({label}))}}}));
  for(const label of labels) assert.ok(html.includes(label.replaceAll('&','&amp;')));
  assert.equal((html.match(/<li>/g)||[]).length,8);
  assert.ok(html.includes('Jul 2026'));
 } finally {await server.close();}
});
test('mobile disclosure preserves exact values and desktop table remains semantic', async () => {
 const server=await createServer({server:{middlewareMode:true,ws:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
 try {
  const {KpiTable}=await server.ssrLoadModule('/src/components/KpiTable.jsx');
  const html=renderToStaticMarkup(createElement(KpiTable,{monthLabel:'Aug 2026',kpis:[{kpi_label:'Fiscal Balance',annual_baseline_value:'-$61,578.247',monthly_outturn_value:'-$58,350.344',status:'On Track',read_variance_text:'5.2% less negative than YTD baseline'}]}));
  assert.match(html,/<details>/); assert.match(html,/-\$58,350.344/);
  assert.equal((html.match(/scope="col"/g)||[]).length,5);
  assert.match(html,/role="region"/);
 } finally {await server.close();}
});

test('compact publication details do not replace the capture card', async () => {
 const server=await createServer({server:{middlewareMode:true,ws:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
 try {
  const {LatestUpdateStatus}=await server.ssrLoadModule('/src/components/LatestUpdateStatus.jsx');
  const month={month_label:'Aug 2026',status_headline:'Watch'};
  const capture=renderToStaticMarkup(createElement(LatestUpdateStatus,{currentMonth:month}));
  const publicView=renderToStaticMarkup(createElement(LatestUpdateStatus,{currentMonth:month,compact:true}));
  assert.match(capture,/latest-update-card/);
  assert.match(capture,/latest-update-status-badge/);
  assert.match(publicView,/latest-update-inline/);
  assert.doesNotMatch(publicView,/latest-update-status-badge/);
 } finally {await server.close();}
});
