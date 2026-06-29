import { AlertTriangle, ExternalLink, Link2, ScrollText } from "lucide-react";
import { PUBLIC_WARNING_MESSAGES, hasSourceLinkWarnings, isPublicHttpUrl as isSafeHttpUrl } from "../utils/dataQuality.js";

const BLOCKED_PUBLIC_URL_TERMS = ["n8n", "subscriber", "subscription"];

const hasText = (value) => String(value || "").trim().length > 0;

const isPublicHttpUrl = (value) => {
  const url = String(value || "").trim();

  if (!url) return false;

  try {
    const parsed = new URL(url);
    const hasHttpProtocol = parsed.protocol === "https:" || parsed.protocol === "http:";
    const normalizedUrl = parsed.href.toLowerCase();
    const exposesPrivateWorkflow = BLOCKED_PUBLIC_URL_TERMS.some((term) => normalizedUrl.includes(term));

    return hasHttpProtocol && isSafeHttpUrl(url) && !exposesPrivateWorkflow;
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

const sourceDetailFor = ({ label, value, url, fallbackLabel, cta, testId }) => ({
  label,
  value,
  link: publicLinkFor({ label: value, url, fallbackLabel, cta, testId }),
});

const receiptsPackDetailForMonth = (currentMonth) => ({
  label: currentMonth?.receipts_pack_label || "Public receipts pack",
  link: publicLinkFor({
    label: currentMonth?.receipts_pack_label,
    url: currentMonth?.receipts_pack_url,
    fallbackLabel: "Public receipts pack",
    cta: "Open receipts pack",
    testId: "receipts-pack-link",
    meta: currentMonth?.receipts_pack_updated_at ? `Updated ${currentMonth.receipts_pack_updated_at}` : currentMonth?.public_link_meta || "",
  }),
});

const SourceLink = ({ link }) => (
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
);

const PublicReceiptsPack = ({ currentMonth, monthlyOutturn, budgetBaseline }) => {
  const receiptsPack = receiptsPackDetailForMonth(currentMonth);
  const showSourceWarning = hasSourceLinkWarnings(currentMonth);
  const notes = [
    currentMonth?.source_note || currentMonth?.what_changed_source_note,
    currentMonth?.data_quality_status,
    currentMonth?.data_quality_public_note,
    currentMonth?.public_link_meta && !receiptsPack.link?.meta ? currentMonth.public_link_meta : "",
  ].filter(hasText);

  return (
    <article data-testid="public-receipts-pack" className="public-receipts-pack-card">
      <div className="public-receipts-pack-header">
        <Link2 size={29} aria-hidden="true" />
        <div>
          <p className="eyebrow">Receipts checked</p>
          <h3 data-testid="public-receipts-pack-heading">Public Receipts Pack</h3>
        </div>
      </div>
      <p data-testid="public-receipts-pack-explainer" className="public-receipts-pack-explainer">
        Jamaica In Focus links the tracker back to official public documents wherever available.
      </p>
      {showSourceWarning && (
        <div className="source-warning" data-testid="source-links-warning" role="status">
          <AlertTriangle size={18} aria-hidden="true" />
          <p>{PUBLIC_WARNING_MESSAGES.missingSourceLinks}</p>
        </div>
      )}
      <div className="receipts-pack-list">
        <div className="receipts-pack-row" data-testid="receipts-pack-monthly-outturn-row">
          <p className="source-label">Monthly outturn document</p>
          <p>{monthlyOutturn.value || "Not reported in the sheet for this month."}</p>
          {monthlyOutturn.link ? <SourceLink link={monthlyOutturn.link} /> : <p className="source-unavailable">Not available for this month</p>}
        </div>
        <div className="receipts-pack-row" data-testid="receipts-pack-budget-baseline-row">
          <p className="source-label">Budget / baseline document</p>
          <p>{budgetBaseline.value || "Not reported in the sheet for this month."}</p>
          {budgetBaseline.link ? <SourceLink link={budgetBaseline.link} /> : <p className="source-unavailable">Not available for this month</p>}
        </div>
        <div className="receipts-pack-row" data-testid="receipts-pack-link-row">
          <p className="source-label">Receipts pack link</p>
          <p>{receiptsPack.label}</p>
          {receiptsPack.link ? <SourceLink link={receiptsPack.link} /> : <p className="source-unavailable">Receipts pack not uploaded yet</p>}
          {receiptsPack.link?.meta && <p className="public-link-meta">{receiptsPack.link.meta}</p>}
        </div>
      </div>
      {notes.length > 0 && (
        <div className="receipts-pack-notes" data-testid="receipts-pack-notes">
          {notes.map((note) => <p key={note}>{note}</p>)}
        </div>
      )}
    </article>
  );
};

export const SourceSection = ({ currentMonth }) => {
  const monthlyOutturn = sourceDetailFor({
    label: "Monthly outturn document",
    value: currentMonth?.monthly_outturn_source || currentMonth?.source_document_1_label || currentMonth?.source_doc_title,
    url: currentMonth?.source_document_1_url || currentMonth?.source_doc_url,
    fallbackLabel: "Central Government Operations Table — April 2026",
    cta: "Open source document",
    testId: "source-document-1-link",
  });
  const budgetBaseline = sourceDetailFor({
    label: "Budget / baseline document",
    value: currentMonth?.budget_baseline_source || currentMonth?.source_document_2_label || currentMonth?.budget_source_title,
    url: currentMonth?.source_document_2_url || currentMonth?.budget_source_url,
    fallbackLabel: "2026–2027 Estimates of Expenditure",
    cta: "Open budget source",
    testId: "source-document-2-link",
  });
  const sourceContext = [
    { label: "Supporting Fiscal Context", value: currentMonth?.supporting_fiscal_context, icon: ScrollText, testId: "supporting-fiscal-context" },
  ];

  return (
    <section id="source-documents" className="section-band source-section" data-testid="source-documents-section" data-screenshot-target="source-documents" aria-labelledby="source-documents-heading">
      <div className="source-grid">
        <div>
          <p data-testid="sources-eyebrow" className="eyebrow">Source documents</p>
          <h2 id="source-documents-heading" data-testid="sources-heading">Official source documents</h2>
          <p data-testid="source-basis-text" className="source-basis">Source basis: Central Government Operations Table — April 2026; 2026–2027 Estimates of Expenditure; budget documents; fiscal policy documents; revenue estimates; and related official Ministry of Finance publications.</p>
        </div>
        <div className="source-card-stack">
          <PublicReceiptsPack currentMonth={currentMonth} monthlyOutturn={monthlyOutturn} budgetBaseline={budgetBaseline} />
          {sourceContext.map(({ label, value, icon: Icon, testId }) => (
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
