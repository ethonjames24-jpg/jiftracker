import { Clock3, ShieldCheck } from "lucide-react";
import { StatusBadge } from "./StatusBadge.jsx";

const displayValue = (value, fallback) => value || fallback;

export const LatestUpdateStatus = ({ currentMonth }) => {
  const status = displayValue(currentMonth?.latest_update_status, currentMonth?.status_headline || "Not reported");
  const label = displayValue(currentMonth?.latest_update_label, currentMonth?.month_label || "Current tracker month");
  const freshness = displayValue(currentMonth?.data_freshness_state, currentMonth?.tracker_state || "Public tracker data");
  const note = displayValue(currentMonth?.latest_update_note, "Latest public tracker update is based on the approved monthly data currently available.");

  return (
    <article data-testid="latest-update-status" className="latest-update-card animate-rise">
      <div className="latest-update-heading-row">
        <div>
          <p data-testid="latest-update-eyebrow" className="eyebrow">Latest update</p>
          <h2 data-testid="latest-update-heading">{label}</h2>
        </div>
        <StatusBadge status={status} testId="latest-update-status-badge" />
      </div>
      <div className="latest-update-meta">
        <span data-testid="latest-update-freshness"><ShieldCheck size={16} aria-hidden="true" />{freshness}</span>
        {currentMonth?.latest_update_at && <span data-testid="latest-update-at"><Clock3 size={16} aria-hidden="true" />Updated {currentMonth.latest_update_at}</span>}
      </div>
      <p data-testid="latest-update-note" className="latest-update-note">{note}</p>
    </article>
  );
};
