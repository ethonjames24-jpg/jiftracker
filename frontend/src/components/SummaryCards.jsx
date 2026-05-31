import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Eye, Gauge, ShieldCheck } from "lucide-react";

export const SummaryCards = ({ counts }) => {
  const items = [
    { label: "On Track", value: counts?.on_track || 0, icon: ShieldCheck, color: "#0b6b3a", testId: "summary-on-track" },
    { label: "Watch", value: counts?.watch || 0, icon: Eye, color: "#b45309", testId: "summary-watch" },
    { label: "Under Pressure", value: counts?.under_pressure || 0, icon: AlertTriangle, color: "#b91c1c", testId: "summary-under-pressure" },
    { label: "KPIs Tracked", value: counts?.kpis_tracked || 0, icon: Gauge, color: "#111111", testId: "summary-kpis-tracked" },
  ];

  return (
    <section className="section-band bg-white" data-testid="status-summary-section">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p data-testid="summary-eyebrow" className="text-xs font-black uppercase tracking-[0.18em] text-[#0b6b3a]">Status summary</p>
            <h2 data-testid="summary-heading" className="font-display text-3xl font-black text-black sm:text-4xl">Where the fiscal lines stand</h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ label, value, icon: Icon, color, testId }, index) => (
            <Card key={label} data-testid={`${testId}-card`} className="animate-rise rounded-[8px] border-2 border-black bg-[#fffdf3] shadow-[5px_5px_0_#111] transition-transform hover:-translate-y-1" style={{ animationDelay: `${index * 70}ms` }}>
              <CardContent className="p-5">
                <div className="mb-6 flex items-center justify-between">
                  <p data-testid={`${testId}-label`} className="text-sm font-black uppercase tracking-[0.12em] text-zinc-700">{label}</p>
                  <Icon className="h-6 w-6" style={{ color }} aria-hidden="true" />
                </div>
                <p data-testid={`${testId}-count`} className="font-display text-5xl font-black" style={{ color }}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};