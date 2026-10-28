import { sourceEvidenceFor } from './trackerSourceEvidence.js';
// Presentation evidence: public May–August receipts packs. Feed records and
// frozen capture/admin views remain unchanged. Prefer any newer feed metadata.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (key, fallback = '') => {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(key || '');
  return match ? `${MONTHS[Number(match[2]) - 1]} ${match[1]}` : fallback;
};
const PUBLISHER = 'Ministry of Finance and the Public Service';
const ANNUAL_SOURCE = 'https://www.mof.gov.jm/wp-content/uploads/2026-2027-Estimates-of-Expenditures.pdf';
const SOURCE_FILES = {
  '2026-04': 'Copy-of-CGO-April-2026.xlsx',
  '2026-05': 'Copy-of-CGO-May-2026-Revised.xlsx',
  '2026-06': 'Copy-of-CGO-June-2026.xlsx',
  '2026-07': 'Copy-of-CGO-July-2026.xlsx',
  '2026-08': 'Copy-of-CGO-August-2026.xlsx',
};
export const trackerPresentation = (data) => {
  const original = data.current_month;
  const key = original.month_sort;
  const month = { ...original, month_label: monthLabel(key, original.month_label) };
  const latest = [...(data.available_months || [])].sort((a, b) => b.month_sort.localeCompare(a.month_sort))[0]?.month_sort;
  month.is_latest_available = key === latest;
  month.period_label = month.is_latest_available ? 'Latest available' : 'Historical month';
  const kpis = (data.kpis || []).map(kpi => {
    if (key === '2026-04' && kpi.kpi_label === 'Fiscal Balance'
      && kpi.annual_baseline_value === '$13,073.644' && kpi.monthly_outturn_value === '$7,830.405'
      && kpi.read_variance_text === '-40.1% more negative than baseline, material pressure') {
      return { ...kpi, read_variance_text: '40.1% below YTD baseline; smaller surplus than planned' };
    }
    return kpi;
  });
  if (key === '2026-06' && month.counts?.under_pressure === 5 && month.counts?.kpis_tracked === 8) {
    for (const field of ['monthly_editorial_headline', 'what_changed_headline']) {
      if (/^Under Pressure opening readout\.?$/.test(month[field] || '')) {
        month[field] = 'June remains Under Pressure; five measures fall short';
      }
    }
  }
  const knownSource = SOURCE_FILES[key] && month.source_document_1_url === `https://www.mof.gov.jm/wp-content/uploads/${SOURCE_FILES[key]}`;
  if (knownSource) {
    month.source_document_1_owner ||= PUBLISHER;
    month.source_document_1_period ||= key === '2026-04' ? 'April 2026 (year to date)' : `April–${month.month_label} (year to date)`;
    month.ytd_source_verified = key !== '2026-04';
  }
  if (key === '2026-08' && knownSource && !month.source_document_2_url
    && month.budget_baseline_source === 'FY 2026/27 Estimates of Expenditure (context)') {
    month.source_document_2_url = ANNUAL_SOURCE;
  }
  if (month.source_document_2_url === ANNUAL_SOURCE) {
    month.source_document_2_owner ||= PUBLISHER;
    month.source_document_2_period ||= 'April 2026–March 2027';
  }
  month.source_record = sourceEvidenceFor(original, data.kpis);
  return { ...data, current_month: month, kpis,
    archive: (data.archive || []).map(item => ({ ...item, month_label: monthLabel(item.month_sort, item.month_label) })),
    available_months: (data.available_months || []).map(item => ({ ...item, month_label: monthLabel(item.month_sort, item.month_label) })) };
};
