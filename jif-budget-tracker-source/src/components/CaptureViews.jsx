import { CalendarDays, FileCheck2, Gauge, Landmark, Link2, ScrollText } from "lucide-react";
import { LOGO_URL } from "../config.js";
import { LatestUpdateStatus } from "./LatestUpdateStatus.jsx";
import { PublicSummaryCard } from "./PublicSummaryCard.jsx";
import { SourceSection } from "./SourceSection.jsx";
import { StatusBadge } from "./StatusBadge.jsx";
import { WhatChangedCard } from "./WhatChangedCard.jsx";

const CAPTURE_MODES = new Set(["hero", "kpi", "sources"]);

const metricTones = {
  on_track: "metric-green",
  watch: "metric-amber",
  under_pressure: "metric-red",
  kpis_tracked: "metric-black",
};

const countItems = (counts = {}) => [
  { key: "kpis_tracked", label: "KPIs Tracked", value: counts.kpis_tracked || 0 },
  { key: "on_track", label: "On Track", value: counts.on_track || 0 },
  { key: "watch", label: "Watch", value: counts.watch || 0 },
  { key: "under_pressure", label: "Under Pressure", value: counts.under_pressure || 0 },
];

export const getCaptureMode = () => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("capture")?.toLowerCase() || "";

  return CAPTURE_MODES.has(mode) ? mode : "";
};

const CaptureBrand = ({ monthLabel, kicker = "Screenshot capture" }) => (
  <header className="capture-brand" data-testid="capture-brand">
    <div className="capture-lockup">
      <img src={LOGO_URL} alt="Jamaica In Focus logo" className="capture-logo" data-testid="capture-logo" />
      <div>
        <p className="brand-name">Jamaica In Focus</p>
        <p className="brand-tagline">Budget Performance Tracker</p>
      </div>
    </div>
    <div className="capture-month-block">
      <p>{kicker}</p>
      <strong data-testid="capture-month-label">{monthLabel || "Month pending"}</strong>
    </div>
  </header>
);

const CaptureMetric = ({ item }) => (
  <article className="capture-metric" data-testid={`capture-${item.key}-metric`}>
    <p className="metric-label">{item.label}</p>
    <p className={`metric-value ${metricTones[item.key] || "metric-black"}`}>{item.value}</p>
  </article>
);

const KpiReadoutCards = ({ kpis = [] }) => {
  const visibleKpis = kpis.slice(0, 6);

  if (!visibleKpis.length) return null;

  return (
    <div className="capture-kpi-readouts" data-testid="capture-kpi-readout-cards">
      {visibleKpis.map((kpi, index) => (
        <article key={`${kpi.kpi_label}-${index}`} className="capture-kpi-card" data-testid={`capture-kpi-readout-${index}`}>
          <div>
            <p className="source-label">{kpi.kpi_label || "KPI not reported"}</p>
            <p>{kpi.read_variance_text || kpi.monthly_outturn_value || "Readout not reported"}</p>
          </div>
          <StatusBadge status={kpi.status} testId={`capture-kpi-status-${index}`} />
        </article>
      ))}
    </div>
  );
};

export const HeroCaptureView = ({ currentMonth }) => (
  <div className="capture-page capture-hero-page" data-testid="capture-hero-view" data-screenshot-mode="hero">
    <CaptureBrand monthLabel={currentMonth?.month_label} kicker="Selected tracker month" />
    <main className="capture-hero-grid">
      <section className="capture-hero-copy">
        <div className="tracker-pill" data-testid="capture-tracker-state-pill">
          <CalendarDays size={16} aria-hidden="true" />
          {currentMonth?.tracker_state || "Tracker state pending"}
        </div>
        <h1 data-testid="capture-dashboard-title">Jamaica Budget Performance Tracker</h1>
        <p className="subtitle">Monthly central government outturn against the FY 2026/27 budget baseline.</p>
        <div className="hero-status-row">
          <div className="month-chip">{currentMonth?.month_label || "Month pending"}</div>
          <StatusBadge status={currentMonth?.status_headline} testId="capture-overall-status-badge" />
        </div>
      </section>
      <aside className="capture-hero-stack">
        <LatestUpdateStatus currentMonth={currentMonth} />
        <div className="capture-current-summary scorecard" data-testid="capture-current-month-summary">
          <div className="scorecard-header"><p>Current month KPI summary</p></div>
          <div className="capture-metric-grid">
            {countItems(currentMonth?.counts).map((item) => <CaptureMetric key={item.key} item={item} />)}
          </div>
        </div>
      </aside>
    </main>
    <p className="capture-hero-footer">Receipts checked. Public finance tracked.</p>
  </div>
);

export const KpiCaptureView = ({ currentMonth, kpis }) => (
  <div className="capture-page capture-kpi-page" data-testid="capture-kpi-view" data-screenshot-mode="kpi">
    <CaptureBrand monthLabel={currentMonth?.month_label} kicker="KPI overview capture" />
    <main className="capture-kpi-layout">
      <section className="capture-kpi-intro">
        <p className="eyebrow">Current month overview</p>
        <h1>{currentMonth?.month_label || "Month pending"} KPI readout</h1>
        <StatusBadge status={currentMonth?.status_headline} testId="capture-kpi-overall-status-badge" />
      </section>
      <section className="capture-metric-grid capture-kpi-metrics" aria-label="KPI counts">
        {countItems(currentMonth?.counts).map((item) => <CaptureMetric key={item.key} item={item} />)}
      </section>
      <section className="capture-kpi-notes">
        <WhatChangedCard currentMonth={currentMonth} />
        <article className="info-card" data-testid="capture-monthly-note-card">
          <div className="info-card-title-row">
            <Gauge size={22} className="green-icon" aria-hidden="true" />
            <h2>Monthly note</h2>
          </div>
          <p>{currentMonth?.monthly_note || "No note reported for this month."}</p>
        </article>
        <PublicSummaryCard summary={currentMonth?.approved_email_summary} />
      </section>
      <KpiReadoutCards kpis={kpis} />
    </main>
  </div>
);

export const SourcesCaptureView = ({ currentMonth }) => (
  <div className="capture-page capture-sources-page" data-testid="capture-sources-view" data-screenshot-mode="sources">
    <CaptureBrand monthLabel={currentMonth?.month_label} kicker="Official source documents" />
    <main className="capture-sources-layout">
      <section className="capture-sources-intro">
        <p className="eyebrow">Receipts and source basis</p>
        <h1>Official documents behind the tracker</h1>
        <div className="capture-source-icons" aria-hidden="true">
          <FileCheck2 /><Landmark /><ScrollText /><Link2 />
        </div>
      </section>
      <SourceSection currentMonth={currentMonth} />
    </main>
  </div>
);

export const CaptureView = ({ mode, data }) => {
  if (mode === "hero") return <HeroCaptureView currentMonth={data.current_month} />;
  if (mode === "kpi") return <KpiCaptureView currentMonth={data.current_month} kpis={data.kpis || []} />;
  if (mode === "sources") return <SourcesCaptureView currentMonth={data.current_month} />;

  return null;
};
