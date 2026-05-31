import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

export const ArchiveSection = ({ archive }) => (
  <section id="archive" className="section-band bg-[#101010] text-white" data-testid="archive-section">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 max-w-3xl">
        <p data-testid="archive-eyebrow" className="text-xs font-black uppercase tracking-[0.18em] text-[#f8c400]">Archive</p>
        <h2 data-testid="archive-heading" className="font-display text-3xl font-black sm:text-4xl">Monthly tracker record</h2>
      </div>
      <div className="grid gap-4">
        {archive.map((item, index) => (
          <Card key={`${item.month_sort}-${index}`} data-testid={`archive-item-${index}`} className="rounded-[8px] border-2 border-[#f8c400] bg-white text-black shadow-[5px_5px_0_#f8c400]">
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[160px_1fr_180px] lg:items-center">
              <div>
                <p data-testid={`archive-month-label-${index}`} className="font-display text-2xl font-black">{item.month_label || "Month pending"}</p>
                <p data-testid={`archive-tracker-state-${index}`} className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-zinc-600">{item.tracker_state || "State pending"}</p>
              </div>
              <p data-testid={`archive-note-${index}`} className="text-sm leading-6 text-zinc-800 md:text-base">{item.note || "No archive note reported."}</p>
              <StatusBadge status={item.status} testId={`archive-status-${index}`} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);