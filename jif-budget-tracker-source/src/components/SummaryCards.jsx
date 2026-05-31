import { AlertTriangle, Eye, Gauge, ShieldCheck } from "lucide-react";

const CARD_ANIMATION_STAGGER_MS = 70;

export const SummaryCards = ({ counts }) => {
  const items = [
    { label: "On Track", value: counts?.on_track || 0, icon: ShieldCheck, color: "#0b6b3a", testId: "summary-on-track" },
    { label: "Watch", value: counts?.watch || 0, icon: Eye, color: "#b45309", testId: "summary-watch" },
    { label: "Under Pressure", value: counts?.under_pressure || 0, icon: AlertTriangle, color: "#b91c1c", testId: "summary-under-pressure" },
    { label: "KPIs Tracked", value: counts?.kpis_tracked || 0, icon: Gauge, color: "#111111", testId: "summary-kpis-tracked" },
  ];

  return (
    <section className="section-band summary-section" data-testid="status-summary-section">
      <div className="section-inner">
        <p data-testid="summary-eyebrow" className="eyebrow">Status summary</p>
        <h2 data-testid="summary-heading">Where the fiscal lines stand</h2>
        <div className="summary-grid">
          {items.map(({ label, value, icon: Icon, color, testId }, index) => (
            <article key={label} data-testid={`${testId}-card`} className="summary-card animate-rise" style={{ animationDelay: `${index * CARD_ANIMATION_STAGGER_MS}ms` }}>
              <div className="summary-card-header">
                <p data-testid={`${testId}-label`}>{label}</p>
                <Icon size={25} style={{ color }} aria-hidden="true" />
              </div>
              <p data-testid={`${testId}-count`} className="summary-count" style={{ color }}>{value}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};