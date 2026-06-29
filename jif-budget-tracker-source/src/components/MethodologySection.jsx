import { DataQualityNote } from "./DataQualityNote.jsx";

const indicators = ["Tax Revenue", "Non-Tax Revenue", "Total Revenue & Grants", "Primary Balance", "Fiscal Balance", "Compensation of Employees", "Capital Expenditure", "Interest"];

const categories = [
  { name: "On Track", text: "line is broadly aligned with or favorable against the baseline", className: "category-green" },
  { name: "Watch", text: "early warning or moderate concern", className: "category-amber" },
  { name: "Under Pressure", text: "material gap, weakness, delay, or fiscal pressure compared with the baseline", className: "category-red" },
];

const slug = (value) => value.toLowerCase().replaceAll("&", "and").replaceAll(" ", "-");

export const MethodologySection = ({ currentMonth }) => (
  <section id="methodology" className="section-band methodology-section" data-testid="methodology-section" data-screenshot-target="methodology">
    <div className="methodology-grid">
      <div>
        <p data-testid="methodology-eyebrow" className="eyebrow">Methodology</p>
        <h2 data-testid="methodology-heading">How the tracker reads the budget</h2>
        <p data-testid="methodology-description" className="methodology-copy">The Jamaica In Focus Budget Performance Tracker compares Jamaica’s monthly central government outturn against the FY 2026/27 budget baseline and supporting fiscal documents. It is designed to show what the budget promised, what the monthly public finance data reports, and how key fiscal indicators are tracking over time.</p>
        <p data-testid="methodology-disclaimer" className="disclaimer">This tracker is for public-interest monitoring and civic education. It uses official public documents and does not replace formal audited government financial statements.</p>
      </div>
      <div className="methodology-cards">
        <article data-testid="core-indicators-card" className="method-card">
          <h3 data-testid="core-indicators-heading">Core indicators</h3>
          <div className="indicator-list">
            {indicators.map((item) => <span key={item} data-testid={`indicator-${slug(item)}`}>{item}</span>)}
          </div>
        </article>
        <DataQualityNote currentMonth={currentMonth} />
        <article data-testid="status-categories-card" className="method-card">
          <h3 data-testid="status-categories-heading">Status categories</h3>
          {categories.map((item) => (
            <div key={item.name} data-testid={`category-${slug(item.name)}`} className={`category ${item.className}`}>
              <p data-testid={`category-${slug(item.name)}-name`}>{item.name}</p>
              <span data-testid={`category-${slug(item.name)}-text`}>{item.text}</span>
            </div>
          ))}
        </article>
      </div>
    </div>
  </section>
);