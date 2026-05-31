import { StatusBadge } from "./StatusBadge.jsx";

export const ArchiveSection = ({ archive }) => (
  <section id="archive" className="section-band archive-section" data-testid="archive-section">
    <div className="section-inner">
      <p data-testid="archive-eyebrow" className="eyebrow yellow-text">Archive</p>
      <h2 data-testid="archive-heading">Monthly tracker record</h2>
      <div className="archive-stack">
        {archive.map((item, index) => (
          <article key={`${item.month_sort}-${index}`} data-testid={`archive-item-${index}`} className="archive-card">
            <div>
              <p data-testid={`archive-month-label-${index}`} className="archive-month">{item.month_label || "Month pending"}</p>
              <p data-testid={`archive-tracker-state-${index}`} className="archive-state">{item.tracker_state || "State pending"}</p>
            </div>
            <p data-testid={`archive-note-${index}`} className="archive-note">{item.note || "No archive note reported."}</p>
            <StatusBadge status={item.status} testId={`archive-status-${index}`} />
          </article>
        ))}
      </div>
    </div>
  </section>
);