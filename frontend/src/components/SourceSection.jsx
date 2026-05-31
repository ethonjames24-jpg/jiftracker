import { Card, CardContent } from "@/components/ui/card";
import { FileCheck2, Landmark, ScrollText } from "lucide-react";

export const SourceSection = ({ currentMonth }) => {
  const sources = [
    { label: "Monthly Outturn Source", value: currentMonth?.monthly_outturn_source, icon: FileCheck2, testId: "monthly-outturn-source" },
    { label: "Budget Baseline Source", value: currentMonth?.budget_baseline_source, icon: Landmark, testId: "budget-baseline-source" },
    { label: "Supporting Fiscal Context", value: currentMonth?.supporting_fiscal_context, icon: ScrollText, testId: "supporting-fiscal-context" },
  ];

  return (
    <section className="section-band bg-white" data-testid="source-documents-section">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p data-testid="sources-eyebrow" className="text-xs font-black uppercase tracking-[0.18em] text-[#0b6b3a]">Source documents</p>
            <h2 data-testid="sources-heading" className="font-display text-3xl font-black text-black sm:text-4xl">Official documents, public-interest readout</h2>
            <p data-testid="source-basis-text" className="mt-4 border-l-4 border-[#f8c400] pl-4 text-base font-semibold leading-7 text-zinc-800">
              Source basis: Central Government Operations Table, budget documents, fiscal policy documents, revenue estimates, and related official Ministry of Finance publications.
            </p>
          </div>
          <div className="grid gap-4">
            {sources.map(({ label, value, icon: Icon, testId }) => (
              <Card key={label} data-testid={`${testId}-card`} className="rounded-[8px] border-2 border-black bg-[#fffdf3] shadow-[4px_4px_0_#111]">
                <CardContent className="flex gap-4 p-5">
                  <Icon className="mt-1 h-6 w-6 shrink-0 text-[#0b6b3a]" aria-hidden="true" />
                  <div>
                    <p data-testid={`${testId}-label`} className="text-sm font-black uppercase tracking-[0.1em] text-black">{label}</p>
                    <p data-testid={testId} className="mt-2 text-sm leading-6 text-zinc-800 md:text-base">{value || "Not reported in the sheet for this month."}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};