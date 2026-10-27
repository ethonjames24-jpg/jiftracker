import { DataQualityNote } from "./DataQualityNote.jsx";
import { TRACKER_TERMS } from "../content/trackerGlossary.js";

const indicators = ["Tax Revenue", "Non-Tax Revenue", "Total Revenue & Grants", "Primary Balance", "Fiscal Balance", "Compensation of Employees", "Capital Expenditure", "Interest"];

const categories = [
  { name: "On Track", text: "measure is broadly aligned with or favorable against the plan for the same period", className: "category-green" },
  { name: "Watch", text: "early warning or moderate concern", className: "category-amber" },
  { name: "Under Pressure", text: "material gap, weakness, delay or pressure compared with the plan for the same period", className: "category-red" },
];

const slug = (value) => value.toLowerCase().replaceAll("&", "and").replaceAll(" ", "-");

export const MethodologySection = ({ currentMonth }) => (
  <section id="methodology" className="section-band methodology-section" data-testid="methodology-section" data-screenshot-target="methodology">
    <div className="methodology-grid">
      <div className="section-intro methodology-intro">
        <p data-testid="methodology-eyebrow" className="eyebrow">Methodology</p>
        <h2 data-testid="methodology-heading">How the tracker reads the budget</h2>
        <p data-testid="methodology-description" className="methodology-copy">Each month, the JIF Budget Tracker compares the cumulative results reported since the financial year began in April with the Government’s plan for the same period. It shows what was planned, what the official public-finance tables report, and how eight key measures are performing.</p>
        <p data-testid="methodology-disclaimer" className="disclaimer">This tracker is for public-interest monitoring and civic education. It uses official public documents and does not replace formal audited government financial statements.</p>
      </div>
      <div className="methodology-cards">
        <article className="method-card" data-testid="assessment-rules">
          <h3>How the status is assigned</h3>
          <p>JIF calculates the gap as (YTD result − YTD budget) ÷ absolute YTD budget × 100. Higher results are favorable for revenue, balances and Capital Expenditure. Lower results are favorable for Compensation of Employees and Interest, so their gap is reversed before applying the bands.</p>
          <dl className="term-list">
            <div><dt>Standard band</dt><dd>On Track: −3% or better. Watch: below −3% through −8%. Under Pressure: below −8%.</dd></div>
            <div><dt>Capital Expenditure</dt><dd>On Track: −10% or better. Watch: below −10% through −20%. Under Pressure: below −20%.</dd></div>
            <div><dt>Overall assessment</dt><dd>The overall status is published as part of the reviewed monthly assessment. The public receipts do not specify a numerical rule for combining the eight statuses; this page does not calculate one.</dd></div>
          </dl>
          <p>These bands are documented in the <a href="/receipts-packs/2026-05-jif-receipts-pack.pdf">May receipts pack</a> and reaffirmed in the <a href="/receipts-packs/2026-08-jif-receipts-pack.pdf">August receipts pack</a>. The Capital Expenditure standing rule was approved on July 31, 2026. Earlier published results are retained as recorded.</p>
          <p>Statuses are JIF monitoring classifications, not Ministry ratings or findings of waste or wrongdoing. Read signed balance amounts alongside percentages, especially when a surplus becomes a deficit. A zero baseline cannot produce a meaningful percentage using this formula.</p>
        </article>
        <article data-testid="plain-language-terms-card" className="method-card">
          <h3 data-testid="plain-language-terms-heading">Plain-language guide</h3>
          <dl className="term-list">
            {TRACKER_TERMS.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.definition}</dd>
              </div>
            ))}
          </dl>
        </article>
        <article data-testid="core-indicators-card" className="method-card">
          <h3 data-testid="core-indicators-heading">Eight measures tracked</h3>
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
