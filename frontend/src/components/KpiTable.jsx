import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";

const displayValue = (value) => value || "Not reported";

export const KpiTable = ({ kpis, monthLabel }) => (
  <section className="section-band bg-[#f5f5f0]" data-testid="kpi-breakdown-section">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-5 max-w-3xl">
        <p data-testid="kpi-table-eyebrow" className="text-xs font-black uppercase tracking-[0.18em] text-[#0b6b3a]">KPI breakdown</p>
        <h2 data-testid="kpi-table-heading" className="font-display text-3xl font-black text-black sm:text-4xl">Budget lines for {monthLabel}</h2>
      </div>
      <Card data-testid="kpi-table-card" className="overflow-hidden rounded-[8px] border-2 border-black bg-white shadow-[8px_8px_0_#111]">
        <CardContent className="p-0">
          <Table data-testid="kpi-breakdown-table">
            <TableHeader className="bg-black">
              <TableRow className="border-black hover:bg-black">
                <TableHead data-testid="kpi-table-head-kpi" className="min-w-[190px] px-4 py-4 font-black uppercase text-white">KPI</TableHead>
                <TableHead data-testid="kpi-table-head-baseline" className="min-w-[180px] px-4 py-4 font-black uppercase text-white">FY 2026/27 Annual Baseline</TableHead>
                <TableHead data-testid="kpi-table-head-outturn" className="min-w-[180px] px-4 py-4 font-black uppercase text-white">Monthly Outturn</TableHead>
                <TableHead data-testid="kpi-table-head-variance" className="min-w-[260px] px-4 py-4 font-black uppercase text-white">Read / Variance</TableHead>
                <TableHead data-testid="kpi-table-head-status" className="min-w-[150px] px-4 py-4 font-black uppercase text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpis.map((kpi, index) => (
                <TableRow key={`${kpi.kpi_label}-${index}`} data-testid={`kpi-table-row-${index}`} className="border-black odd:bg-white even:bg-[#fff9df] hover:bg-[#f8c400]/20">
                  <TableCell data-testid={`kpi-label-${index}`} className="px-4 py-4 font-black text-black">{displayValue(kpi.kpi_label)}</TableCell>
                  <TableCell data-testid={`kpi-baseline-${index}`} className="px-4 py-4 font-semibold text-zinc-800">{displayValue(kpi.annual_baseline_value)}</TableCell>
                  <TableCell data-testid={`kpi-outturn-${index}`} className="px-4 py-4 font-semibold text-zinc-800">{displayValue(kpi.monthly_outturn_value)}</TableCell>
                  <TableCell data-testid={`kpi-variance-${index}`} className="px-4 py-4 leading-6 text-zinc-800">{displayValue(kpi.read_variance_text)}</TableCell>
                  <TableCell className="px-4 py-4"><StatusBadge status={kpi.status} testId={`kpi-status-${index}`} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </section>
);