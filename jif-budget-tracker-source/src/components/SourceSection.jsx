import { CGO_LISTING_URL } from "../content/trackerSourceEvidence.js";
import { AlertTriangle, ExternalLink, Link2, ScrollText } from "lucide-react";
import { PUBLIC_WARNING_MESSAGES, hasSourceLinkWarnings, isPublicHttpUrl as isSafeHttpUrl } from "../utils/dataQuality.js";
import { receiptsCheckApproved } from "../utils/brandContent.js";

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

const sourceDetailFor = ({ label, value, url, fallbackLabel, cta, testId, metadata }) => ({
  label,
  value,
  link: publicLinkFor({ label: value, url, fallbackLabel, cta, testId }),
  metadata,
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

const SourceMetadata = ({ metadata, verificationStatus }) => (
  <dl className="source-metadata" data-testid={metadata.testId}>
    <div><dt>Source owner</dt><dd>{metadata.owner || "Not stated in the public feed"}</dd></div>
    {metadata.sourceRecord ? <>
      <div><dt>Source dates checked</dt><dd>{metadata.sourceRecord.checkedDate}</dd></div>
      <div><dt>Linked-file record date</dt><dd>{metadata.sourceRecord.fileRecordDate}</dd></div>
      <div><dt>Ministry listing date</dt><dd>{metadata.sourceRecord.listingDate} — for {metadata.sourceRecord.listedFile}</dd></div>
      {metadata.publicationDate && <div><dt>Publication date reported by feed</dt><dd>{metadata.publicationDate}</dd></div>}
    </> : <div><dt>Publication date</dt><dd>{metadata.publicationDate || "Not stated in the public feed"}</dd></div>}
    <div><dt>Period covered</dt><dd>{metadata.period || "Not stated in the public feed"}</dd></div>
    <div><dt>Used for tracker month</dt><dd>{metadata.trackerMonth || "Not stated in the public feed"}</dd></div>
    <div><dt>Verification status</dt><dd>{verificationStatus}</dd></div>
  </dl>
);

const PublicReceiptsPack = ({ currentMonth, monthlyOutturn, budgetBaseline }) => {
  const receiptsPack = receiptsPackDetailForMonth(currentMonth);
  const isReceiptsChecked = receiptsCheckApproved(currentMonth);
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
          <p className="eyebrow" data-testid="receipts-check-status">
            {isReceiptsChecked ? "Receipts Checked" : "Official source record"}
          </p>
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
          <p className="source-label">{monthlyOutturn.label}</p>
          <p>{monthlyOutturn.value || "Not reported in the sheet for this month."}</p>
          <SourceMetadata metadata={monthlyOutturn.metadata} verificationStatus={isReceiptsChecked ? "Receipts Checked" : "Official source record"} />
          {monthlyOutturn.link ? <SourceLink link={monthlyOutturn.link} /> : <p className="source-unavailable">Not available for this month</p>}
          {monthlyOutturn.metadata.sourceRecord && <SourceVersionNote record={monthlyOutturn.metadata.sourceRecord} />}
        </div>
        <div className="receipts-pack-row" data-testid="receipts-pack-budget-baseline-row">
          <p className="source-label">{budgetBaseline.label}</p>
          <p>{budgetBaseline.value || "Not reported in the sheet for this month."}</p>
          <SourceMetadata metadata={budgetBaseline.metadata} verificationStatus={isReceiptsChecked ? "Receipts Checked" : "Official source record"} />
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

const SourceVersionNote = ({ record }) => (
  <details className="source-version-note" data-testid="source-version-note">
    <summary>Source version and date notes</summary>
    <p>The linked workbook is {record.file}. Source records were checked on {record.checkedDate}. The file-record date is the Ministry attachment’s creation date; it does not establish when the document first became public. The listing date belongs to the file named above. JIF’s publication date is separate.</p>
    <p><a href={CGO_LISTING_URL} target="_blank" rel="noopener noreferrer">View the Ministry’s CGO listing</a></p>
    {record.revisionNote && <>
      <p>The published figures are retained against their original linked workbook. The Ministry listing points to a different version: {record.listedFile}.</p>
      <p>{record.revisionNote}</p>
      <p><a href={record.listedUrl} target="_blank" rel="noopener noreferrer">Compare the later Ministry workbook</a></p>
      <p>Adopting revised figures requires a separate source review and correction decision. Original receipts remain the record of the published assessment.</p>
    </>}
    {record.sha256 && <p className="source-fingerprint">Linked workbook SHA-256 at review: <code>{record.sha256}</code></p>}
    {record.revisionNote && <p className="source-fingerprint">Later workbook SHA-256 at review: <code>{record.listedSha256}</code></p>}
  </details>
);

export const SourceSection = ({ currentMonth, showReviewNote = false }) => {
  const monthlyOutturn = sourceDetailFor({
    label: currentMonth?.ytd_source_verified ? "Monthly results and YTD budget comparison" : "Monthly results document (official outturn)",
    value: currentMonth?.monthly_outturn_source || currentMonth?.source_document_1_label || currentMonth?.source_doc_title,
    url: currentMonth?.source_document_1_url || currentMonth?.source_doc_url,
    fallbackLabel: currentMonth?.month_label
      ? `Central Government Operations Table — ${currentMonth.month_label}`
      : "Central Government Operations Table",
    cta: "Open source document",
    testId: "source-document-1-link",
    metadata: {
      testId: "source-document-1-metadata",
      owner: currentMonth?.source_document_1_owner,
      sourceRecord: showReviewNote ? currentMonth?.source_record : null,
      publicationDate: currentMonth?.source_document_1_publication_date,
      period: currentMonth?.source_document_1_period || currentMonth?.month_label,
      trackerMonth: currentMonth?.month_label,
    },
  });
  const budgetBaseline = sourceDetailFor({
    label: currentMonth?.ytd_source_verified ? "Annual budget context" : "Budget plan document (official baseline)",
    value: currentMonth?.budget_baseline_source || currentMonth?.source_document_2_label || currentMonth?.budget_source_title,
    url: currentMonth?.source_document_2_url || currentMonth?.budget_source_url,
    fallbackLabel: "2026–2027 Estimates of Expenditure",
    cta: "Open budget source",
    testId: "source-document-2-link",
    metadata: {
      testId: "source-document-2-metadata",
      owner: currentMonth?.source_document_2_owner,
      publicationDate: currentMonth?.source_document_2_publication_date,
      period: currentMonth?.source_document_2_period || currentMonth?.fiscal_year,
      trackerMonth: currentMonth?.month_label,
    },
  });
  const sourceContext = [
    { label: "Additional official context", value: currentMonth?.supporting_fiscal_context, icon: ScrollText, testId: "supporting-fiscal-context" },
  ];
  const sourceBasis = [
    monthlyOutturn.value,
    budgetBaseline.value,
    "related official Ministry of Finance publications",
  ].filter(hasText).join("; ");

  return (
    <section id="source-documents" className="section-band source-section" data-testid="source-documents-section" data-screenshot-target="source-documents" aria-labelledby="source-documents-heading">
      <div className="source-grid">
        <div className="section-intro source-intro">
          <p data-testid="sources-eyebrow" className="eyebrow">Source documents</p>
          <h2 id="source-documents-heading" data-testid="sources-heading">Official source documents</h2>
          <p data-testid="source-basis-text" className="source-basis">Source basis: {sourceBasis}.</p>
          {currentMonth?.ytd_source_verified && <p className="source-basis">The monthly CGO workbook supplies both the reported YTD results and the YTD budget comparisons. The Estimates of Expenditure provide annual budget context.</p>}
          {showReviewNote && <p className="source-note">Review status refers to JIF’s data review. Missing source dates or documents are identified separately below.</p>}
        </div>
        <div className="source-card-stack">
          <PublicReceiptsPack currentMonth={currentMonth} monthlyOutturn={monthlyOutturn} budgetBaseline={budgetBaseline} />
          {sourceContext.map(({ label, value, icon: Icon, testId }) => (
            <article key={label} data-testid={`${testId}-card`} className="source-card">
              <Icon size={25} className="civic-icon" aria-hidden="true" />
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
