import { FileCheck2, Landmark, Link2, ScrollText } from "lucide-react";

const isPublicHttpUrl = (value) => {
  const url = String(value || "").trim();

  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const publicLinksForMonth = (currentMonth) => [
  {
    label: currentMonth?.receipts_pack_label || "Public receipts pack",
    url: currentMonth?.receipts_pack_url,
    meta: currentMonth?.receipts_pack_updated_at ? `Updated ${currentMonth.receipts_pack_updated_at}` : "",
    testId: "receipts-pack-link",
  },
  {
    label: currentMonth?.source_document_1_label || "Source document 1",
    url: currentMonth?.source_document_1_url,
    testId: "source-document-1-link",
  },
  {
    label: currentMonth?.source_document_2_label || "Source document 2",
    url: currentMonth?.source_document_2_url,
    testId: "source-document-2-link",
  },
].filter((link) => isPublicHttpUrl(link.url));

export const SourceSection = ({ currentMonth }) => {
  const sources = [
    { label: "Monthly Outturn Source", value: currentMonth?.monthly_outturn_source, icon: FileCheck2, testId: "monthly-outturn-source" },
    { label: "Budget Baseline Source", value: currentMonth?.budget_baseline_source, icon: Landmark, testId: "budget-baseline-source" },
    { label: "Supporting Fiscal Context", value: currentMonth?.supporting_fiscal_context, icon: ScrollText, testId: "supporting-fiscal-context" },
  ];
  const publicLinks = publicLinksForMonth(currentMonth);

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
          {publicLinks.length > 0 && (
            <article data-testid="public-receipts-pack" className="source-card public-receipts-card">
              <Link2 size={25} className="green-icon" aria-hidden="true" />
              <div>
                <p data-testid="public-receipts-pack-label" className="source-label">Public receipts pack</p>
                <div className="public-link-list">
                  {publicLinks.map((link) => (
                    <p key={link.testId}>
                      <a data-testid={link.testId} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
                      {link.meta && <span className="public-link-meta">{link.meta}</span>}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
};
