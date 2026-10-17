// Owner-approved presentation correction. Match the original revision exactly;
// serving rows, financial values and original publication hashes stay intact.
export const AUGUST_PUBLIC_COPY = Object.freeze({
  "id": "JIF-PUBLIC-COPY-2026-08-20261017",
  "month": "2026-08",
  "approved_at": "2026-10-17T20:33:03Z",
  "beforeHeadline": "Aug 2026: comparison with 2026-07",
  "beforeBullets": "From 2026-07 to 2026-08, On Track KPIs changed from 2 to 3, Watch from 3 to 3, and Under Pressure from 3 to 2.|Tax Revenue: Watch to Watch; YTD actual-to-budget gap -6.1% to -5.1%.|Non-Tax Revenue: Under Pressure to Under Pressure; YTD actual-to-budget gap -27.4% to -29.8%.|Total Revenue & Grants: Watch to Watch; YTD actual-to-budget gap -7.5% to -6.8%.|Primary Balance: Under Pressure to Under Pressure; YTD actual-to-budget gap -30.1% to -32.1%.|Fiscal Balance: Under Pressure to On Track; YTD actual-to-budget gap -8.2% to +5.2%.|Compensation of Employees: On Track to On Track; YTD actual-to-budget gap -0.2% to -0.8%.|Capital Expenditure: Watch to Watch; YTD actual-to-budget gap -11.4% to -14.7%.|Interest: On Track to On Track; YTD actual-to-budget gap -11.3% to -12.9%.",
  "beforeNote": "The August reading registers as Watch overall. Revenue and grants are below the YTD baseline and weigh on fiscal metrics; Non-Tax Revenue and Primary Balance are classified Under Pressure. Compensation of Employees and Interest are on track relative to their YTD baselines, providing some fiscal containment. In the next official release, watch whether Tax Revenue, Non-Tax Revenue, Total Revenue & Grants, Primary Balance, Capital Expenditure move closer to their YTD budget baselines, and whether the On Track measures remain contained.",
  "headline": "August moves to Watch; revenue pressures remain",
  "bullets": "3 KPIs are On Track|3 KPIs are on Watch|2 KPIs are Under Pressure|Primary Balance is the largest relative shortfall",
  "archiveNote": "Aug 2026 recorded Watch, with 2 of 8 KPIs Under Pressure, 3 On Track, and 3 on Watch."
});

const matchesCounts = (counts) => counts?.kpis_tracked === 8
  && counts.on_track === 3 && counts.watch === 3 && counts.under_pressure === 2;

export const applyRecordedPublicCopy = (data) => {
  const c = AUGUST_PUBLIC_COPY;
  const month = data.current_month;
  const matches = month?.month_sort === c.month && matchesCounts(month.counts)
    && month.status_headline === "Central Government: Watch"
    && month.monthly_note === c.beforeNote
    && month.what_changed_headline === c.beforeHeadline
    && month.what_changed_bullets === c.beforeBullets
    && (!month.monthly_editorial_headline || month.monthly_editorial_headline === c.beforeHeadline);
  const currentMonth = matches ? {
    ...month,
    monthly_editorial_headline: c.headline,
    what_changed_headline: c.headline,
    what_changed_bullets: c.bullets,
  } : month;
  const archive = data.archive.map((item) => (
    item.month_sort === c.month && item.status === "Watch" && matchesCounts(item.counts)
      && item.note === c.beforeNote ? { ...item, note: c.archiveNote } : item
  ));
  return { ...data, current_month: currentMonth, archive };
};
