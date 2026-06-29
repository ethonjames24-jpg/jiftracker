import { AlertTriangle, CalendarDays } from "lucide-react";
import { LatestUpdateStatus } from "./LatestUpdateStatus.jsx";
import { PublicSummaryCard } from "./PublicSummaryCard.jsx";
import { StatusBadge } from "./StatusBadge.jsx";
import { WhatChangedCard } from "./WhatChangedCard.jsx";

const toneClasses = {
  green: "metric-green",
  amber: "metric-amber",
  red: "metric-red",
  black: "metric-black",
};

const Metric = ({ label, value = 0, testId, tone = "black" }) => (
  <div className="metric" data-testid={`${testId}-card`}>
    <p data-testid={`${testId}-label`} className="metric-label">{label}</p>
    <p data-testid={testId} className={`metric-value ${toneClasses[tone] || toneClasses.black}`}>{value}</p>
  </div>
);

const InfoCard = ({ icon: Icon, title, value, testId }) => (
  <article data-testid={testId} className="info-card">
    <div className="info-card-title-row">
      <Icon size={22} className="green-icon" aria-hidden="true" />
      <h2 data-testid={`${testId}-title`}>{title}</h2>
    </div>
    <p data-testid={`${testId}-text`}>{value || "No note reported for this month."}</p>
  </article>
);

export const Overview = ({ currentMonth }) => {
  const counts = currentMonth?.counts || {};
  return (
    <section id="overview" className="section-band overview-section" data-testid="overview-section" data-screenshot-target="tracker-hero">
      <div className="overview-grid">
        <div className="overview-copy animate-rise">
          <div className="tracker-pill" data-testid="tracker-state-pill">
            <CalendarDays size={16} aria-hidden="true" />
            {currentMonth?.tracker_state || "Tracker state pending"}
          </div>
          <h1 data-testid="dashboard-title">Jamaica Budget Performance Tracker</h1>
          <p data-testid="dashboard-subtitle" className="subtitle">Tracking monthly central government outturn against the FY 2026/27 budget.</p>
          <div className="hero-status-row">
            <div data-testid="current-month-label" className="month-chip">{currentMonth?.month_label || "Month pending"}</div>
            <StatusBadge status={currentMonth?.status_headline} testId="overall-status-badge" />
          </div>
        </div>
        <article data-testid="overview-scorecard" className="scorecard animate-rise" data-screenshot-target="kpi-overview">
          <div className="scorecard-header"><p data-testid="scorecard-label">Current month overview</p></div>
          <div className="metrics-grid">
            <Metric label="KPIs Tracked" value={counts.kpis_tracked} testId="kpis-tracked-count" />
            <Metric label="On Track" value={counts.on_track} testId="on-track-count" tone="green" />
            <Metric label="Watch" value={counts.watch} testId="watch-count" tone="amber" />
            <Metric label="Under Pressure" value={counts.under_pressure} testId="under-pressure-count" tone="red" />
          </div>
        </article>
      </div>
      <div className="overview-update-row">
        <LatestUpdateStatus currentMonth={currentMonth} />
      </div>
      <div className="info-grid">
        <WhatChangedCard currentMonth={currentMonth} />
        <InfoCard icon={AlertTriangle} title="Monthly note" value={currentMonth?.monthly_note} testId="monthly-note-card" />
        <PublicSummaryCard summary={currentMonth?.approved_email_summary} />
      </div>
    </section>
  );
};