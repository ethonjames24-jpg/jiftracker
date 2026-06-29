import { Newspaper } from "lucide-react";

const bulletItems = (value) => String(value || "").split(/\||\n/).map((item) => item.trim()).filter(Boolean);

export const WhatChangedCard = ({ currentMonth }) => {
  const bullets = bulletItems(currentMonth?.what_changed_bullets);
  const hasEnhancedContent = currentMonth?.what_changed_headline || bullets.length || currentMonth?.what_changed_source_note;

  return (
    <article data-testid="what-changed-card" className="info-card what-changed-card">
      <div className="info-card-title-row">
        <Newspaper size={22} className="green-icon" aria-hidden="true" />
        <h2 data-testid="what-changed-card-title">What Changed This Month</h2>
      </div>
      {hasEnhancedContent ? (
        <>
          {currentMonth?.what_changed_headline && <p data-testid="what-changed-headline" className="what-changed-headline">{currentMonth.what_changed_headline}</p>}
          {bullets.length ? (
            <ul data-testid="what-changed-bullets" className="what-changed-bullets">
              {bullets.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : currentMonth?.what_changed ? <p data-testid="what-changed-card-text">{currentMonth.what_changed}</p> : null}
          {currentMonth?.what_changed_source_note && <p data-testid="what-changed-source-note" className="source-note">{currentMonth.what_changed_source_note}</p>}
        </>
      ) : (
        <p data-testid="what-changed-card-text">{currentMonth?.what_changed || "No note reported for this month."}</p>
      )}
    </article>
  );
};
