import { FileCheck2, Landmark, ScrollText } from "lucide-react";

export const SourceSection = ({ currentMonth }) => {
  const sources = [
    { label: "Monthly Outturn Source", value: currentMonth?.monthly_outturn_source, icon: FileCheck2, testId: "monthly-outturn-source" },
    { label: "Budget Baseline Source", value: currentMonth?.budget_baseline_source, icon: Landmark, testId: "budget-baseline-source" },
    { label: "Supporting Fiscal Context", value: currentMonth?.supporting_fiscal_context, icon: ScrollText, testId: "supporting-fiscal-context" },
  ];

  return (
    <section className="section-band source-section" data-testid="source-documents-section">
      <div className="source-grid">
        <div>
          <p data-testid="sources-eyebrow" className="eyebrow">Source documents</p>
          <h2 data-testid="sources-heading">Official documents, public-interest readout</h2>
          <p data-testid="source-basis-text" className="source-basis">Source basis: Central Government Operations Table, budget documents, fiscal policy documents, revenue estimates, and related official Ministry of Finance publications.</p>
        </div>
        <div className="source-card-stack">
          {sources.map(({ label, value, icon: Icon, testId }) => (
            <article key={label} data-testid={`${testId}-card`} className="source-card">
              <Icon size={25} className="green-icon" aria-hidden="true" />
              <div>
                <p data-testid={`${testId}-label`} className="source-label">{label}</p>
                <p data-testid={testId}>{value || "Not reported in the sheet for this month."}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};