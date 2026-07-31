import { StatusBadge } from "./StatusBadge.jsx";
import { definitionForKpi } from "../content/trackerGlossary.js";

const displayValue = (value) => value || "Not reported";

export const KpiTable = ({ kpis, monthLabel }) => (
  <section className="section-band kpi-section" data-testid="kpi-breakdown-section">
    <div className="section-inner">
      <p data-testid="kpi-table-eyebrow" className="eyebrow">Performance by measure</p>
      <h2 data-testid="kpi-table-heading">Key budget measures for {monthLabel}</h2>
      <p id="kpi-table-reading-note" className="table-reading-note" data-testid="kpi-table-reading-note">
        <strong>How to read these figures:</strong> Amounts are in J$ millions. The planned and reported columns are cumulative from April through the selected month—not single-month totals.
        <span className="mobile-table-hint"> Swipe sideways to see every column.</span>
      </p>
      <div
        data-testid="kpi-table-card"
        className="table-card"
        tabIndex="0"
        role="region"
        aria-label={`Scrollable budget measures table for ${monthLabel}`}
      >
        <table data-testid="kpi-breakdown-table" aria-describedby="kpi-table-reading-note">
          <caption className="sr-only">Planned and reported year-to-date results for the eight budget measures tracked in {monthLabel}.</caption>
          <thead>
            <tr>
              <th data-testid="kpi-table-head-kpi">Budget measure</th>
              <th className="kpi-number-column" data-testid="kpi-table-head-baseline">
                <span>Budget plan to date</span>
                <small>FY 2026/27 YTD baseline</small>
              </th>
              <th className="kpi-number-column" data-testid="kpi-table-head-outturn">
                <span>Reported result to date</span>
                <small>FY 2026/27 YTD outturn</small>
              </th>
              <th data-testid="kpi-table-head-variance">How it compares</th>
              <th data-testid="kpi-table-head-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi, index) => {
              const definition = definitionForKpi(kpi.kpi_label);

              return (
                <tr key={`${kpi.kpi_label}-${index}`} data-testid={`kpi-table-row-${index}`}>
                  <td data-testid={`kpi-label-${index}`} className="kpi-name-cell">
                    <strong className="kpi-name">{displayValue(kpi.kpi_label)}</strong>
                    {definition && <span className="kpi-definition">{definition}</span>}
                  </td>
                  <td className="kpi-number-cell" data-testid={`kpi-baseline-${index}`}>{displayValue(kpi.annual_baseline_value)}</td>
                  <td className="kpi-number-cell" data-testid={`kpi-outturn-${index}`}>{displayValue(kpi.monthly_outturn_value)}</td>
                  <td data-testid={`kpi-variance-${index}`}>{displayValue(kpi.read_variance_text)}</td>
                  <td><StatusBadge status={kpi.status} testId={`kpi-status-${index}`} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);
