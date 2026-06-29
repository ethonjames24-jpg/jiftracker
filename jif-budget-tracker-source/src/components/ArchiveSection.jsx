import { useMemo, useState } from "react";
import { StatusBadge } from "./StatusBadge.jsx";

const PUBLIC_STATUSES = ["On Track", "Watch", "Under Pressure"];

const optionValues = (archive, keys) => Array.from(new Set(
  archive.flatMap((item) => keys.map((key) => item[key]).filter(Boolean)),
)).sort((a, b) => String(b).localeCompare(String(a)));

const normalise = (value) => String(value || "").trim().toLowerCase();

const matchesText = (item, searchTerm) => {
  if (!searchTerm) return true;
  const haystack = [item.month_label, item.month_sort, item.note, item.tracker_state, item.status, item.year, item.fiscal_year]
    .join(" ")
    .toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
};

const formatKpiSummary = (counts = {}) => {
  if (!counts.kpis_tracked && !counts.on_track && !counts.watch && !counts.under_pressure) return "";
  const total = counts.kpis_tracked || ((counts.on_track || 0) + (counts.watch || 0) + (counts.under_pressure || 0));
  return `${total} KPIs: ${counts.on_track || 0} On Track, ${counts.watch || 0} Watch, ${counts.under_pressure || 0} Under Pressure`;
};

const monthHref = (monthSort) => monthSort ? `/?month=${encodeURIComponent(monthSort)}` : "/";

export const ArchiveSection = ({ archive = [] }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const years = useMemo(() => optionValues(archive, ["fiscal_year", "year"]), [archive]);

  const filteredArchive = useMemo(() => archive.filter((item) => {
    const itemYears = [item.fiscal_year, item.year].filter(Boolean);
    return (statusFilter === "all" || normalise(item.status) === normalise(statusFilter))
      && (yearFilter === "all" || itemYears.includes(yearFilter))
      && matchesText(item, searchTerm.trim());
  }), [archive, searchTerm, statusFilter, yearFilter]);

  const resetFilters = () => {
    setStatusFilter("all");
    setYearFilter("all");
    setSearchTerm("");
  };

  return (
    <section id="archive" className="section-band archive-section" data-testid="archive-section">
      <div className="section-inner">
        <p data-testid="archive-eyebrow" className="eyebrow yellow-text">Public history</p>
        <h2 data-testid="archive-heading">Archive</h2>
        <div className="archive-filters" data-testid="archive-filters">
          <label>
            Month search
            <input data-testid="archive-search-filter" type="search" value={searchTerm} placeholder="Search month, YYYY-MM, or note" onChange={(event) => setSearchTerm(event.target.value)} />
          </label>
          <label>
            Fiscal year
            <select data-testid="archive-year-filter" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
              <option value="all">All fiscal years</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label>
            Status
            <select data-testid="archive-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {PUBLIC_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <button data-testid="archive-reset-filters" className="archive-reset-button" type="button" onClick={resetFilters}>Reset filters</button>
        </div>
        <p data-testid="archive-filter-count" className="archive-filter-count">Showing {filteredArchive.length} of {archive.length} archived months</p>
        <div className="archive-stack">
          {filteredArchive.map((item, index) => {
            const kpiSummary = formatKpiSummary(item.counts);
            return (
              <article key={`${item.month_sort}-${index}`} data-testid={`archive-item-${index}`} className="archive-card">
                <div className="archive-card-main">
                  <p data-testid={`archive-month-label-${index}`} className="archive-month">{item.month_label || item.month_sort || "Month pending"}</p>
                  <StatusBadge status={item.status} testId={`archive-status-${index}`} />
                </div>
                <div className="archive-card-details">
                  {kpiSummary && <p data-testid={`archive-kpi-summary-${index}`} className="archive-kpi-summary">{kpiSummary}</p>}
                  <p data-testid={`archive-note-${index}`} className="archive-note">{item.note || "No archive note reported."}</p>
                </div>
                <a data-testid={`archive-open-month-${index}`} className="archive-open-button" href={monthHref(item.month_sort)} aria-label={`Open ${item.month_label || item.month_sort || "archived month"}`}>Open month</a>
              </article>
            );
          })}
          {!filteredArchive.length && <p data-testid="archive-empty-state" className="archive-empty-state">No archived tracker month matches these filters.</p>}
        </div>
      </div>
    </section>
  );
};
