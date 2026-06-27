import { useMemo, useState } from "react";
import { StatusBadge } from "./StatusBadge.jsx";

const optionValues = (archive, keys) => Array.from(new Set(
  archive.flatMap((item) => keys.map((key) => item[key]).filter(Boolean)),
)).sort((a, b) => String(b).localeCompare(String(a)));

const matchesText = (item, searchTerm) => {
  if (!searchTerm) return true;
  const haystack = [item.month_label, item.note, item.tracker_state, item.status, item.year, item.fiscal_year].join(" ").toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
};

export const ArchiveSection = ({ archive = [] }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const statuses = useMemo(() => optionValues(archive, ["status"]), [archive]);
  const states = useMemo(() => optionValues(archive, ["tracker_state"]), [archive]);
  const years = useMemo(() => optionValues(archive, ["fiscal_year", "year"]), [archive]);

  const filteredArchive = useMemo(() => archive.filter((item) => {
    const itemYears = [item.fiscal_year, item.year].filter(Boolean);
    return (statusFilter === "all" || item.status === statusFilter)
      && (stateFilter === "all" || item.tracker_state === stateFilter)
      && (yearFilter === "all" || itemYears.includes(yearFilter))
      && matchesText(item, searchTerm.trim());
  }), [archive, searchTerm, stateFilter, statusFilter, yearFilter]);

  return (
    <section id="archive" className="section-band archive-section" data-testid="archive-section">
      <div className="section-inner">
        <p data-testid="archive-eyebrow" className="eyebrow yellow-text">Archive</p>
        <h2 data-testid="archive-heading">Monthly tracker record</h2>
        <div className="archive-filters" data-testid="archive-filters">
          <label>
            Status
            <select data-testid="archive-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label>
            Tracker state
            <select data-testid="archive-state-filter" value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
              <option value="all">All states</option>
              {states.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
          </label>
          <label>
            Year
            <select data-testid="archive-year-filter" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
              <option value="all">All years</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label>
            Search
            <input data-testid="archive-search-filter" type="search" value={searchTerm} placeholder="Month or note" onChange={(event) => setSearchTerm(event.target.value)} />
          </label>
        </div>
        <p data-testid="archive-filter-count" className="archive-filter-count">Showing {filteredArchive.length} of {archive.length} records</p>
        <div className="archive-stack">
          {filteredArchive.map((item, index) => (
            <article key={`${item.month_sort}-${index}`} data-testid={`archive-item-${index}`} className="archive-card">
              <div>
                <p data-testid={`archive-month-label-${index}`} className="archive-month">{item.month_label || "Month pending"}</p>
                <p data-testid={`archive-tracker-state-${index}`} className="archive-state">{item.tracker_state || "State pending"}</p>
              </div>
              <p data-testid={`archive-note-${index}`} className="archive-note">{item.note || "No archive note reported."}</p>
              <StatusBadge status={item.status} testId={`archive-status-${index}`} />
            </article>
          ))}
          {!filteredArchive.length && <p data-testid="archive-empty-state" className="archive-empty-state">No archive records match those filters.</p>}
        </div>
      </div>
    </section>
  );
};
