import { ShieldCheck } from "lucide-react";

export const DataQualityNote = ({ currentMonth }) => {
  const hasNote = currentMonth?.data_quality_status || currentMonth?.data_quality_public_note || currentMonth?.next_review_window;
  if (!hasNote) return null;

  return (
    <article data-testid="data-quality-note" className="method-card data-quality-card">
      <div className="info-card-title-row">
        <ShieldCheck size={22} className="green-icon" aria-hidden="true" />
        <h3 data-testid="data-quality-heading">Public data quality note</h3>
      </div>
      {currentMonth?.data_quality_status && <p data-testid="data-quality-status" className="data-quality-status">{currentMonth.data_quality_status}</p>}
      {currentMonth?.data_quality_public_note && <p data-testid="data-quality-public-note">{currentMonth.data_quality_public_note}</p>}
      {currentMonth?.next_review_window && <p data-testid="next-review-window" className="source-note">Next public review window: {currentMonth.next_review_window}</p>}
    </article>
  );
};
