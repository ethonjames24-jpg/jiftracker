import test from 'node:test';
import assert from 'node:assert/strict';
import { trackerPresentation } from './trackerPresentation.js';
const fixture = (key) => ({ current_month: { month_sort: key, month_label: 'old label', counts: { kpis_tracked: 8, under_pressure: 5 } }, kpis: [], available_months: [{ month_sort: '2026-08' }, { month_sort: key }] });
test('historical labels and latest available follow the feed rather than the calendar', () => {
 const input=fixture('2026-06'); const before=structuredClone(input);
 assert.equal(trackerPresentation(input).current_month.period_label,'Historical month');
 assert.equal(trackerPresentation(input).current_month.month_label,'Jun 2026');
 assert.equal(trackerPresentation(fixture('2026-08')).current_month.period_label,'Latest available');
 assert.deepEqual(input,before);
});
test('April correction requires the original numbers and wording; later revisions survive', () => {
 const input=fixture('2026-04'); input.kpis=[{kpi_label:'Fiscal Balance', annual_baseline_value:'$13,073.644',monthly_outturn_value:'$7,830.405',read_variance_text:'-40.1% more negative than baseline, material pressure',status:'Under Pressure'}];
 const result=trackerPresentation(input);
 assert.match(result.kpis[0].read_variance_text,/smaller surplus/);
 assert.equal(result.kpis[0].status,input.kpis[0].status);
 input.kpis[0].read_variance_text='New approved wording';
 assert.equal(trackerPresentation(input).kpis[0].read_variance_text,'New approved wording');
});
test('June opening headline is corrected without replacing later approved headlines', () => {
 const input=fixture('2026-06'); input.current_month.monthly_editorial_headline='Under Pressure opening readout';
 assert.match(trackerPresentation(input).current_month.monthly_editorial_headline,/June/);
 input.current_month.monthly_editorial_headline='Revised June headline';
 assert.equal(trackerPresentation(input).current_month.monthly_editorial_headline,'Revised June headline');
});
test('source metadata is bound to the recorded document and does not invent dates', () => {
 const input=fixture('2026-08'); input.current_month.source_document_1_url='https://www.mof.gov.jm/wp-content/uploads/Copy-of-CGO-August-2026.xlsx';
 input.current_month.budget_baseline_source='FY 2026/27 Estimates of Expenditure (context)';
 const result=trackerPresentation(input).current_month;
 assert.equal(result.source_document_1_publication_date,'September 30, 2026');
 assert.match(result.source_document_2_url,/Estimates-of-Expenditures.pdf$/);
 input.current_month.source_document_1_publication_date='New date';
 assert.equal(trackerPresentation(input).current_month.source_document_1_publication_date,'New date');
 input.current_month.source_document_1_url='https://example.com/revision.xlsx';delete input.current_month.source_document_1_publication_date;
 assert.equal(trackerPresentation(input).current_month.source_document_1_publication_date,undefined);
 assert.equal(trackerPresentation(fixture('2026-05')).current_month.source_document_1_publication_date,undefined);
});
