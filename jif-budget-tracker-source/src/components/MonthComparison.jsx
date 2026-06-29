import { ArrowDownRight, ArrowRight, ArrowUpRight, GitCompareArrows } from "lucide-react";
import { StatusBadge } from "./StatusBadge.jsx";

const countItems = (counts = {}) => [
  { key: "kpis_tracked", label: "KPIs", value: counts.kpis_tracked || 0 },
  { key: "on_track", label: "On Track", value: counts.on_track || 0, className: "metric-green" },
  { key: "watch", label: "Watch", value: counts.watch || 0, className: "metric-amber" },
  { key: "under_pressure", label: "Under Pressure", value: counts.under_pressure || 0, className: "metric-red" },
];

const ComparisonMonthCard = ({ eyebrow, month }) => (
  <article className="comparison-card comparison-month-card" data-testid={`comparison-${eyebrow.toLowerCase()}-card`}>
    <p className="eyebrow">{eyebrow} month</p>
    <div className="comparison-card-heading">
      <h3>{month?.month_label || "Month pending"}</h3>
      <StatusBadge status={month?.status_headline} testId={`comparison-${eyebrow.toLowerCase()}-status`} />
    </div>
    <div className="comparison-count-grid">
      {countItems(month?.counts).map((item) => (
        <div key={item.key} className="comparison-count-tile">
          <span>{item.label}</span>
          <strong className={item.className || "metric-black"}>{item.value}</strong>
        </div>
      ))}
    </div>
  </article>
);

const movementIcon = {
  improved: ArrowUpRight,
  worsened: ArrowDownRight,
  unchanged: ArrowRight,
};

const movementLabels = {
  improved: "Improved",
  worsened: "Worsened",
  unchanged: "No change",
};

const MovementList = ({ title, items, type }) => {
  const Icon = movementIcon[type] || ArrowRight;
  if (!items?.length) return null;

  return (
    <div className={`movement-list movement-${type}`} data-testid={`comparison-${type}-list`}>
      <h4><Icon size={17} aria-hidden="true" /> {title}</h4>
      <ul>
        {items.slice(0, 5).map((item) => (
          <li key={`${type}-${item.label}`}>{item.label}</li>
        ))}
      </ul>
    </div>
  );
};

export const MonthComparison = ({ comparison }) => {
  if (!comparison?.has_previous_month) {
    return (
      <section id="month-comparison" className="section-band month-comparison-section" data-testid="month-comparison-section">
        <div className="section-inner">
          <p className="eyebrow">Month-to-month readout</p>
          <h2>Month-to-Month Comparison</h2>
          <article className="comparison-empty-card" data-testid="month-comparison-empty">
            <GitCompareArrows size={28} className="green-icon" aria-hidden="true" />
            <p>{comparison?.message || "No previous tracker month is available yet for comparison."}</p>
          </article>
        </div>
      </section>
    );
  }

  const hasMovements = comparison.movements?.is_reliable && (
    comparison.movements.improved.length || comparison.movements.worsened.length || comparison.movements.unchanged.length
  );

  return (
    <section id="month-comparison" className="section-band month-comparison-section" data-testid="month-comparison-section">
      <div className="section-inner">
        <p className="eyebrow">Month-to-month readout</p>
        <h2>Month-to-Month Comparison</h2>
        <div className="comparison-grid">
          <ComparisonMonthCard eyebrow="Selected" month={comparison.selected_month} />
          <ComparisonMonthCard eyebrow="Previous" month={comparison.previous_month} />
          <article className="comparison-card comparison-summary-card" data-testid="comparison-change-summary-card">
            <div className="comparison-card-heading">
              <h3>Change summary</h3>
              <GitCompareArrows size={24} className="green-icon" aria-hidden="true" />
            </div>
            <p className="comparison-summary-line" data-testid="comparison-summary-line">{comparison.summary_text}</p>
            <p className="comparison-detail" data-testid="comparison-pressure-detail">{comparison.under_pressure_delta_text}</p>
            {hasMovements ? (
              <div className="movement-grid">
                <MovementList title={movementLabels.improved} type="improved" items={comparison.movements.improved} />
                <MovementList title={movementLabels.worsened} type="worsened" items={comparison.movements.worsened} />
                <MovementList title={movementLabels.unchanged} type="unchanged" items={comparison.movements.unchanged} />
              </div>
            ) : (
              <p className="comparison-safe-note" data-testid="comparison-safe-note">{comparison.movements?.note || "KPI-by-KPI status comparison is not shown because indicator names differ between months."}</p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
};
