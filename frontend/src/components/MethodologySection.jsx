import { Card, CardContent } from "@/components/ui/card";

const indicators = ["Tax Revenue", "Non-Tax Revenue", "Total Revenue & Grants", "Primary Balance", "Fiscal Balance", "Compensation of Employees", "Capital Expenditure", "Interest"];

const categories = [
  { name: "On Track", text: "line is broadly aligned with or favorable against the baseline", color: "bg-emerald-100 text-emerald-900 border-emerald-700" },
  { name: "Watch", text: "early warning or moderate concern", color: "bg-amber-100 text-amber-950 border-amber-700" },
  { name: "Under Pressure", text: "material gap, weakness, delay, or fiscal pressure compared with the baseline", color: "bg-red-100 text-red-900 border-red-700" },
];

export const MethodologySection = () => (
  <section id="methodology" className="section-band bg-[#fff9df]" data-testid="methodology-section">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <p data-testid="methodology-eyebrow" className="text-xs font-black uppercase tracking-[0.18em] text-[#0b6b3a]">Methodology</p>
          <h2 data-testid="methodology-heading" className="font-display text-3xl font-black text-black sm:text-4xl">How the tracker reads the budget</h2>
          <p data-testid="methodology-description" className="mt-4 text-base font-semibold leading-7 text-zinc-800">
            The Jamaica In Focus Budget Performance Tracker compares Jamaica’s monthly central government outturn against the FY 2026/27 budget baseline and supporting fiscal documents. It is designed to show what the budget promised, what the monthly public finance data reports, and how key fiscal indicators are tracking over time.
          </p>
          <p data-testid="methodology-disclaimer" className="mt-5 border-2 border-black bg-white p-4 text-sm font-bold leading-6 text-zinc-900 shadow-[4px_4px_0_#111]">
            This tracker is for public-interest monitoring and civic education. It uses official public documents and does not replace formal audited government financial statements.
          </p>
        </div>
        <div className="grid gap-4">
          <Card data-testid="core-indicators-card" className="rounded-[8px] border-2 border-black bg-white shadow-[5px_5px_0_#111]">
            <CardContent className="p-5">
              <h3 data-testid="core-indicators-heading" className="text-base font-black uppercase tracking-[0.12em]">Core indicators</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {indicators.map((item) => (
                  <span key={item} data-testid={`indicator-${item.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`} className="border-2 border-black bg-[#f8c400] px-3 py-1 text-sm font-black text-black">{item}</span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card data-testid="status-categories-card" className="rounded-[8px] border-2 border-black bg-white shadow-[5px_5px_0_#111]">
            <CardContent className="space-y-3 p-5">
              <h3 data-testid="status-categories-heading" className="text-base font-black uppercase tracking-[0.12em]">Status categories</h3>
              {categories.map((item) => (
                <div key={item.name} data-testid={`category-${item.name.toLowerCase().replaceAll(" ", "-")}`} className={`rounded-[6px] border-2 p-3 ${item.color}`}>
                  <p className="font-black" data-testid={`category-${item.name.toLowerCase().replaceAll(" ", "-")}-name`}>{item.name}</p>
                  <p className="text-sm font-semibold" data-testid={`category-${item.name.toLowerCase().replaceAll(" ", "-")}-text`}>{item.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </section>
);