import { FileCheck2 } from "lucide-react";

export const PublicSummaryCard = ({ summary }) => {
  if (!summary) return null;

  return (
    <article data-testid="approved-public-summary-card" className="info-card public-summary-card">
      <div className="info-card-title-row">
        <FileCheck2 size={22} className="green-icon" aria-hidden="true" />
        <h2 data-testid="approved-public-summary-title">Approved tracker summary</h2>
      </div>
      <p data-testid="approved-public-summary-text">{summary}</p>
    </article>
  );
};
