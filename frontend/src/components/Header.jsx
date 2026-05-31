import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, FileText, ShieldCheck } from "lucide-react";

const logoUrl = "https://customer-assets.emergentagent.com/job_jif-budget-outturn/artifacts/ymrt983n_jamaica%20in%20focus%20new%20logo%20%281%29.png";

export const Header = ({ months, selectedMonth, onMonthChange }) => {
  const links = [
    { href: "#overview", label: "Overview", icon: BarChart3, testId: "nav-overview-link" },
    { href: "#archive", label: "Archive", icon: FileText, testId: "nav-archive-link" },
    { href: "#methodology", label: "Methodology", icon: ShieldCheck, testId: "nav-methodology-link" },
  ];

  return (
    <header data-testid="site-header" className="sticky top-0 z-40 border-b-4 border-black bg-[#f8c400] shadow-[0_6px_0_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-center gap-3" data-testid="brand-lockup">
          <img src={logoUrl} alt="Jamaica In Focus logo" data-testid="header-logo" className="h-12 w-12 shrink-0 rounded-full border-2 border-black bg-white object-cover" />
          <div className="min-w-0">
            <p data-testid="brand-name" className="truncate text-sm font-black uppercase tracking-[0.12em] text-black">Jamaica In Focus</p>
            <p data-testid="brand-tagline" className="text-xs font-bold text-black/70">Receipts checked. Public finance tracked.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <nav className="flex flex-wrap gap-2" aria-label="Dashboard sections" data-testid="primary-navigation">
            {links.map(({ href, label, icon: Icon, testId }) => (
              <Button key={href} asChild variant="outline" size="sm" className="border-2 border-black bg-white text-black shadow-[2px_2px_0_#111] transition-transform hover:-translate-y-0.5 hover:bg-[#fff7ca]">
                <a href={href} data-testid={testId}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </a>
              </Button>
            ))}
          </nav>
          <Select value={selectedMonth || ""} onValueChange={onMonthChange} data-testid="month-select-root">
            <SelectTrigger data-testid="month-select-trigger" className="min-w-[160px] border-2 border-black bg-black font-bold text-white shadow-[2px_2px_0_#ffffff]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent data-testid="month-select-menu" className="border-2 border-black">
              {months.map((month) => (
                <SelectItem key={month.month_sort} value={month.month_sort} data-testid={`month-select-option-${month.month_sort}`}>
                  {month.month_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
};