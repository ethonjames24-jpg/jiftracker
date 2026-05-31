import { StatusBadge } from "./StatusBadge.jsx";

const displayValue = (value) => value || "Not reported";

export const KpiTable = ({ kpis, monthLabel }) => (
  <section className="section-band kpi-section" data-testid="kpi-breakdown-section">
    <div className="section-inner">
      <p data-testid="kpi-table-eyebrow" className="eyebrow">KPI breakdown</p>
      <h2 data-testid="kpi-table-heading">Budget lines for {monthLabel}</h2>
      <div data-testid="kpi-table-card" className="table-card">
        <table data-testid="kpi-breakdown-table">
          <thead>
            <tr>
              <th data-testid="kpi-table-head-kpi">KPI</th>
              <th data-testid="kpi-table-head-baseline">FY 2026/27 Annual Baseline</th>
              <th data-testid="kpi-table-head-outturn">Monthly Outturn</th>
              <th data-testid="kpi-table-head-variance">Read / Variance</th>
              <th data-testid="kpi-table-head-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi, index) => (
              <tr key={`${kpi.kpi_label}-${index}`} data-testid={`kpi-table-row-${index}`}>
                <td data-testid={`kpi-label-${index}`} className="kpi-name">{displayValue(kpi.kpi_label)}</td>
                <td data-testid={`kpi-baseline-${index}`}>{displayValue(kpi.annual_baseline_value)}</td>
                <td data-testid={`kpi-outturn-${index}`}>{displayValue(kpi.monthly_outturn_value)}</td>
                <td data-testid={`kpi-variance-${index}`}>{displayValue(kpi.read_variance_text)}</td>
                <td><StatusBadge status={kpi.status} testId={`kpi-status-${index}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);