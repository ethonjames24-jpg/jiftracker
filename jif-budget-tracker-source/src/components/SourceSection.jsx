import { ExternalLink, FileCheck2, Landmark, Link2, ScrollText } from "lucide-react";

const BLOCKED_PUBLIC_URL_TERMS = ["n8n", "subscriber", "subscription"];

const isPublicHttpUrl = (value) => {
  const url = String(value || "").trim();

  if (!url) return false;

  try {
    const parsed = new URL(url);
    const isHttpUrl = parsed.protocol === "https:" || parsed.protocol === "http:";
    const normalizedUrl = parsed.href.toLowerCase();
    const exposesPrivateWorkflow = BLOCKED_PUBLIC_URL_TERMS.some((term) => normalizedUrl.includes(term));

    return isHttpUrl && !exposesPrivateWorkflow;
  } catch {
    return false;
  }
};

const publicLinkFor = ({ label, url, fallbackLabel, cta, testId, meta = "" }) => {
  if (!isPublicHttpUrl(url)) return null;

  return {
    label: label || fallbackLabel,
    url: String(url).trim(),
    cta,
    testId,
    meta,
  };
};

const receiptLinksForMonth = (currentMonth) => [
  publicLinkFor({
    label: currentMonth?.receipts_pack_label,
    url: currentMonth?.receipts_pack_url,
    fallbackLabel: "Public receipts pack",
    cta: "Open receipts pack",
    testId: "receipts-pack-link",
    meta: currentMonth?.receipts_pack_updated_at ? `Updated ${currentMonth.receipts_pack_updated_at}` : "",
  }),
].filter(Boolean);

export const SourceSection = ({ currentMonth }) => {
  const sources = [
    {
      label: "Monthly Outturn Source",
      value: currentMonth?.monthly_outturn_source,
      icon: FileCheck2,
      testId: "monthly-outturn-source",
      link: publicLinkFor({
        label: currentMonth?.source_document_1_label || currentMonth?.source_doc_title,
        url: currentMonth?.source_document_1_url || currentMonth?.source_doc_url,
        fallbackLabel: "Source document 1",
        cta: "Open source document",
        testId: "source-document-1-link",
      }),
    },
    {
      label: "Budget Baseline Source",
      value: currentMonth?.budget_baseline_source,
      icon: Landmark,
      testId: "budget-baseline-source",
      link: publicLinkFor({
        label: currentMonth?.source_document_2_label || currentMonth?.budget_source_title,
        url: currentMonth?.source_document_2_url || currentMonth?.budget_source_url,
        fallbackLabel: "Source document 2",
        cta: "Open budget source",
        testId: "source-document-2-link",
      }),
    },
    { label: "Supporting Fiscal Context", value: currentMonth?.supporting_fiscal_context, icon: ScrollText, testId: "supporting-fiscal-context" },
  ];
  const publicLinks = receiptLinksForMonth(currentMonth);

  return (
    <section className="section-band source-section" data-testid="source-documents-section">
      <div className="source-grid">
        <div>
          <p data-testid="sources-eyebrow" className="eyebrow">Source documents</p>
          <h2 data-testid="sources-heading">Official documents, public-interest readout</h2>
          <p data-testid="source-basis-text" className="source-basis">Source basis: Central Government Operations Table, budget documents, fiscal policy documents, revenue estimates, and related official Ministry of Finance publications.</p>
        </div>
        <div className="source-card-stack">
          {sources.map(({ label, value, icon: Icon, testId, link }) => (
            <article key={label} data-testid={`${testId}-card`} className="source-card">
              <Icon size={25} className="green-icon" aria-hidden="true" />
              <div>
                <p data-testid={`${testId}-label`} className="source-label">{label}</p>
                <p data-testid={testId}>{value || "Not reported in the sheet for this month."}</p>
                {link && (
                  <a
                    data-testid={link.testId}
                    className="source-link-button"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${link.cta}: ${link.label}`}
                  >
                    <ExternalLink size={17} aria-hidden="true" />
                    <span>{link.cta}</span>
                  </a>
                )}
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
                      <a data-testid={link.testId} href={link.url} target="_blank" rel="noopener noreferrer">{link.cta || link.label}</a>
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
