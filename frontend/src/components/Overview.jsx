import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertTriangle, CalendarDays, ClipboardList, Newspaper } from "lucide-react";

export const Overview = ({ currentMonth }) => {
  const counts = currentMonth?.counts || {};
  return (
    <section id="overview" className="section-band bg-[#fff9df]" data-testid="overview-section">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div className="animate-rise space-y-6">
          <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] shadow-[3px_3px_0_#111]" data-testid="tracker-state-pill">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {currentMonth?.tracker_state || "Tracker state pending"}
          </div>
          <div className="space-y-4">
            <h1 data-testid="dashboard-title" className="max-w-4xl font-display text-4xl font-black leading-[0.98] text-black sm:text-5xl lg:text-6xl">
              Jamaica Budget Performance Tracker
            </h1>
            <p data-testid="dashboard-subtitle" className="max-w-2xl text-base font-semibold leading-7 text-zinc-800 md:text-lg">
              Tracking monthly central government outturn against the FY 2026/27 budget.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div data-testid="current-month-label" className="border-2 border-black bg-black px-4 py-2 text-sm font-black uppercase text-white shadow-[3px_3px_0_#f8c400]">
              {currentMonth?.month_label || "Month pending"}
            </div>
            <StatusBadge status={currentMonth?.status_headline} testId="overall-status-badge" />
          </div>
        </div>
        <Card data-testid="overview-scorecard" className="animate-rise animation-delay-150 rounded-[8px] border-2 border-black bg-white shadow-[8px_8px_0_#111]">
          <CardContent className="p-0">
            <div className="border-b-2 border-black bg-[#f8c400] p-5">
              <p data-testid="scorecard-label" className="text-sm font-black uppercase tracking-[0.14em] text-black">Current month overview</p>
            </div>
            <div className="grid grid-cols-2 divide-x-2 divide-y-2 divide-black sm:grid-cols-4 sm:divide-y-0">
              <Metric label="KPIs Tracked" value={counts.kpis_tracked} testId="kpis-tracked-count" />
              <Metric label="On Track" value={counts.on_track} testId="on-track-count" tone="green" />
              <Metric label="Watch" value={counts.watch} testId="watch-count" tone="amber" />
              <Metric label="Under Pressure" value={counts.under_pressure} testId="under-pressure-count" tone="red" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <InfoCard icon={Newspaper} title="What changed" value={currentMonth?.what_changed} testId="what-changed-card" />
        <InfoCard icon={AlertTriangle} title="Monthly note" value={currentMonth?.monthly_note} testId="monthly-note-card" />
      </div>
    </section>
  );
};

const Metric = ({ label, value = 0, testId, tone = "black" }) => (
  <div className="min-h-[118px] p-4" data-testid={`${testId}-card`}>
    <p data-testid={`${testId}-label`} className="text-xs font-black uppercase tracking-[0.12em] text-zinc-600">{label}</p>
    <p data-testid={testId} className={`mt-3 font-display text-5xl font-black ${tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : tone === "red" ? "text-red-700" : "text-black"}`}>{value}</p>
  </div>
);

const InfoCard = ({ icon: Icon, title, value, testId }) => (
  <Card data-testid={testId} className="rounded-[8px] border-2 border-black bg-white shadow-[5px_5px_0_rgba(0,0,0,0.85)]">
    <CardContent className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#0b6b3a]" aria-hidden="true" />
        <h2 data-testid={`${testId}-title`} className="text-base font-black uppercase tracking-[0.1em] text-black">{title}</h2>
      </div>
      <p data-testid={`${testId}-text`} className="text-sm leading-7 text-zinc-800 md:text-base">{value || "No note reported for this month."}</p>
    </CardContent>
  </Card>
);