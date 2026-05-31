import { BarChart3, FileText, ShieldCheck } from "lucide-react";
import { LOGO_URL } from "../config.js";

const links = [
  { href: "#overview", label: "Overview", icon: BarChart3, testId: "nav-overview-link" },
  { href: "#archive", label: "Archive", icon: FileText, testId: "nav-archive-link" },
  { href: "#methodology", label: "Methodology", icon: ShieldCheck, testId: "nav-methodology-link" },
];

export const Header = ({ months, selectedMonth, onMonthChange }) => (
  <header data-testid="site-header" className="site-header">
    <div className="header-inner">
      <div className="brand-lockup" data-testid="brand-lockup">
        <img src={LOGO_URL} alt="Jamaica In Focus logo" data-testid="header-logo" className="brand-logo" />
        <div>
          <p data-testid="brand-name" className="brand-name">Jamaica In Focus</p>
          <p data-testid="brand-tagline" className="brand-tagline">Receipts checked. Public finance tracked.</p>
        </div>
      </div>
      <div className="header-actions">
        <nav className="nav-links" data-testid="primary-navigation" aria-label="Dashboard sections">
          {links.map(({ href, label, icon: Icon, testId }) => (
            <a key={href} href={href} data-testid={testId} className="nav-button">
              <Icon size={16} aria-hidden="true" />
              {label}
            </a>
          ))}
        </nav>
        <select data-testid="month-select-trigger" className="month-select" value={selectedMonth || ""} onChange={(event) => onMonthChange(event.target.value)}>
          {months.map((month) => (
            <option key={month.month_sort} value={month.month_sort} data-testid={`month-select-option-${month.month_sort}`}>
              {month.month_label}
            </option>
          ))}
        </select>
      </div>
    </div>
  </header>
);