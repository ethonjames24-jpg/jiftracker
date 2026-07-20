import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  FileCheck2,
  Filter,
  Landmark,
  LoaderCircle,
  MinusCircle,
  RefreshCw,
  RotateCcw,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import { LOGO_URL } from "../../config.js";
import { useSpendingExplorerData } from "../../hooks/useSpendingExplorerData.js";
import {
  buildFilterOptions,
  EMPTY_EXPLORER_FILTERS,
  filterSpendingRows,
  formatJmd,
  formatPercent,
  groupSpendingRows,
  measureTypeLabel,
  sumSpendingRows,
} from "../../utils/spendingExplorerModel.js";

const PAGE_SIZE = 25;

const ExplorerHeader = ({ released = false }) => (
  <>
    <header className="spending-explorer-header">
      <div className="spending-explorer-header-inner">
        <a className="spending-explorer-brand" href="/" aria-label="Jamaica In Focus monthly tracker">
          <img src={LOGO_URL} alt="Jamaica In Focus logo" />
          <span>
            <strong>Jamaica In Focus</strong>
            <small>Receipts checked. Public finance tracked.</small>
          </span>
        </a>
        <div className={`spending-explorer-release-pill ${released ? "is-released" : "is-gated"}`}>
          {released ? <BadgeCheck size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
          {released ? "Approved data" : "Release gate"}
        </div>
      </div>
    </header>
    {released && (
      <nav className="spending-explorer-nav" aria-label="Spending Explorer sections">
        <div>
          <a href="#spending-overview">Overview</a>
          <a href="#every-100">Every J$100</a>
          <a href="#spending-breakdown">Explore spending</a>
          <a href="#spending-sources">Sources</a>
          <a href="#spending-methodology">Methodology</a>
        </div>
      </nav>
    )}
  </>
);

const ExplorerFooter = () => (
  <footer className="spending-explorer-footer">
    <div>
      <span className="spending-explorer-footer-brand">
        <img src={LOGO_URL} alt="" />
        <strong>Jamaica In Focus</strong>
      </span>
      <a href="/"><ArrowLeft size={16} aria-hidden="true" /> Return to the monthly tracker</a>
    </div>
  </footer>
);

const ExplorerState = ({ type, title, message, onRetry }) => (
  <div className="spending-explorer spending-explorer-state-page">
    <ExplorerHeader />
    <main className="spending-explorer-state-shell">
      <article className={`spending-explorer-state-card is-${type}`}>
        {type === "loading" ? <LoaderCircle className="spending-explorer-spinner" size={34} aria-hidden="true" /> : <ShieldCheck size={34} aria-hidden="true" />}
        <p className="spending-explorer-kicker">Government Spending Explorer</p>
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="spending-explorer-state-actions">
          {onRetry && <button type="button" onClick={onRetry}><RefreshCw size={17} aria-hidden="true" /> Try again</button>}
          <a href="/"><ArrowLeft size={17} aria-hidden="true" /> Open monthly tracker</a>
        </div>
      </article>
    </main>
    <ExplorerFooter />
  </div>
);

const SelectFilter = ({ label, value, onChange, options, allLabel }) => (
  <label>
    <span>{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{allLabel}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>
);

const Every100Section = ({ rows }) => {
  const maximumPositive = Math.max(...rows.map((row) => Math.max(row.per_j100, 0)), 1);

  return (
    <section id="every-100" className="spending-explorer-section spending-explorer-every100">
      <div className="spending-explorer-section-heading">
        <div>
          <p className="spending-explorer-kicker">A simpler way to read the budget</p>
          <h2>Where every J$100 goes</h2>
        </div>
        <p>Each amount uses the net approved expenditure envelope as its denominator. The values reconcile to J$100 before display rounding.</p>
      </div>
      <div className="spending-explorer-every100-list">
        {rows.map((row) => {
          const isOffset = row.amount_jmd < 0;
          const width = Math.max(2, (Math.abs(row.per_j100) / maximumPositive) * 100);
          return (
            <article key={row.record_id} className={`spending-explorer-every100-row ${isOffset ? "is-offset" : ""}`}>
              <div className="spending-explorer-every100-rank">{isOffset ? <MinusCircle aria-hidden="true" /> : String(row.display_order).padStart(2, "0")}</div>
              <div className="spending-explorer-every100-body">
                <div className="spending-explorer-every100-label">
                  <strong>{row.public_category_name}</strong>
                  <span>{formatJmd(row.amount_jmd, true)}</span>
                </div>
                <div className="spending-explorer-bar-track" aria-hidden="true">
                  <span style={{ width: `${width}%` }} />
                </div>
                {isOffset && <small>Appropriations-in-Aid is presented as a transparent negative offset.</small>}
              </div>
              <div className="spending-explorer-every100-value">
                <strong>{row.per_j100 < 0 ? "−" : ""}J${Math.abs(row.per_j100).toFixed(2)}</strong>
                <span>of every J$100</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

const SummaryCard = ({ icon: Icon, label, value, note, tone = "" }) => (
  <article className={`spending-explorer-summary-card ${tone}`}>
    <Icon size={23} aria-hidden="true" />
    <p>{label}</p>
    <strong>{value}</strong>
    <small>{note}</small>
  </article>
);

const CategoryBreakdown = ({ rows, denominator }) => {
  const grouped = groupSpendingRows(rows, "public_category_id", "public_category_name");
  const maximumPositive = Math.max(...grouped.map((group) => Math.max(group.amount_jmd, 0)), 1);

  return (
    <div className="spending-explorer-category-list">
      {grouped.map((group) => {
        const isOffset = group.amount_jmd < 0;
        return (
          <article key={group.id} className={isOffset ? "is-offset" : ""}>
            <div>
              <strong>{group.name}</strong>
              <span>{group.row_count} public data {group.row_count === 1 ? "row" : "rows"}</span>
            </div>
            <div className="spending-explorer-category-bar" aria-hidden="true">
              <span style={{ width: `${Math.max(2, (Math.abs(group.amount_jmd) / maximumPositive) * 100)}%` }} />
            </div>
            <div className="spending-explorer-category-amount">
              <strong>{formatJmd(group.amount_jmd, true)}</strong>
              <span>{formatPercent((group.amount_jmd / denominator) * 100)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
};

const SpendingTable = ({ rows, page, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!rows.length) {
    return (
      <div className="spending-explorer-empty">
        <SearchX size={28} aria-hidden="true" />
        <strong>No budget lines match this combination.</strong>
        <span>Reset one or more filters to widen the view.</span>
      </div>
    );
  }

  return (
    <>
      <div className="spending-explorer-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Organisation / programme</th>
              <th>Public category</th>
              <th>Economic classification</th>
              <th>Budget / measure</th>
              <th className="is-numeric">Amount</th>
              <th className="is-numeric">Share</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.record_id} className={row.amount_jmd < 0 ? "is-offset" : ""}>
                <td><strong>{row.organisation_name}</strong><span>{row.programme_name || "Programme not repeated at this grain"}</span></td>
                <td>{row.public_category_name}</td>
                <td>{row.economic_name}</td>
                <td><strong>{row.recurrent_or_capital}</strong><span>{measureTypeLabel(row.measure_type)}</span></td>
                <td className="is-numeric"><strong>{formatJmd(row.amount_jmd)}</strong></td>
                <td className="is-numeric">{formatPercent(row.share_of_total_pct, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="spending-explorer-pagination">
        <p>Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length} rows</p>
        <div>
          <button type="button" disabled={safePage === 1} onClick={() => onPageChange(safePage - 1)} aria-label="Previous table page"><ChevronLeft aria-hidden="true" /></button>
          <span>Page {safePage} of {totalPages}</span>
          <button type="button" disabled={safePage === totalPages} onClick={() => onPageChange(safePage + 1)} aria-label="Next table page"><ChevronRight aria-hidden="true" /></button>
        </div>
      </div>
    </>
  );
};

const SourceSection = ({ sources }) => (
  <section id="spending-sources" className="spending-explorer-section spending-explorer-sources">
    <div className="spending-explorer-section-heading">
      <div>
        <p className="spending-explorer-kicker">Official source</p>
        <h2>Source for this Explorer</h2>
      </div>
      <p>These figures come from Jamaica’s official Estimates of Expenditure As Passed.</p>
    </div>
    <div className="spending-explorer-source-grid">
      {sources.map((source) => (
        <article key={source.source_id}>
          <FileCheck2 size={25} aria-hidden="true" />
          <p>{String(source.source_type || "Official source").replaceAll("_", " ")}</p>
          <h3>{source.source_title}</h3>
          <span>{source.publisher}{source.publication_date ? ` · ${source.publication_date}` : ""}</span>
          <p className="spending-explorer-source-scope">{source.data_scope}</p>
          <a href={source.source_url} target="_blank" rel="noreferrer">Open official source <ExternalLink size={16} aria-hidden="true" /></a>
        </article>
      ))}
    </div>
  </section>
);

export const SpendingExplorerPage = () => {
  const { data, loading, error, loadExplorer } = useSpendingExplorerData();
  const [filters, setFilters] = useState(EMPTY_EXPLORER_FILTERS);
  const [page, setPage] = useState(1);

  const spendingRows = data?.spending || [];
  const every100Rows = data?.every_100 || [];
  const filteredRows = useMemo(() => filterSpendingRows(spendingRows, filters), [spendingRows, filters]);
  const filteredTotal = useMemo(() => sumSpendingRows(filteredRows), [filteredRows]);
  const approvedNetTotal = every100Rows[0]?.denominator_amount_jmd || 0;
  const aiaOffset = every100Rows.find((row) => row.amount_jmd < 0)?.amount_jmd || 0;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => setPage(1), [filters]);

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const resetFilters = () => setFilters(EMPTY_EXPLORER_FILTERS);

  if (loading && !data) {
    return <ExplorerState type="loading" title="Loading the Explorer" message="Loading the approved government spending figures." />;
  }
  if (error && !data) {
    return <ExplorerState type="error" title="Explorer temporarily unavailable" message={error} onRetry={loadExplorer} />;
  }
  if (!data?.release?.authorized) {
    return <ExplorerState type="gated" title="Prepared, not yet published" message={data?.release?.message || "Public release has not been authorized."} />;
  }

  const optionSets = {
    public_category_id: buildFilterOptions(spendingRows, "public_category_id"),
    function_id: buildFilterOptions(spendingRows, "function_id"),
    organisation_id: buildFilterOptions(spendingRows, "organisation_id"),
    programme_id: buildFilterOptions(spendingRows, "programme_id"),
    economic_id: buildFilterOptions(spendingRows, "economic_id"),
    recurrent_or_capital: buildFilterOptions(spendingRows, "recurrent_or_capital"),
    measure_type: buildFilterOptions(spendingRows, "measure_type").map((option) => ({ ...option, label: measureTypeLabel(option.value) })),
  };

  return (
    <div className="spending-explorer" data-testid="spending-explorer-app">
      <ExplorerHeader released />
      <main>
        {error && <div className="spending-explorer-inline-warning">{error}</div>}
        <section id="spending-overview" className="spending-explorer-hero">
          <div className="spending-explorer-hero-copy">
            <p className="spending-explorer-kicker">FY {data.fiscal_year} · Estimates As Passed</p>
            <h1>Government spending, made easier to inspect.</h1>
            <p>Explore Jamaica’s approved Central Government expenditure by public category, organisation, function, programme and economic classification.</p>
            <div className="spending-explorer-hero-actions">
              <a href="#every-100"><CircleDollarSign size={18} aria-hidden="true" /> See every J$100</a>
              <a href="#spending-breakdown"><Filter size={18} aria-hidden="true" /> Explore the detail</a>
            </div>
          </div>
          <aside className="spending-explorer-hero-total">
            <span>Net approved expenditure</span>
            <strong>{formatJmd(approvedNetTotal, true)}</strong>
            <p>Gross estimates less the approved Appropriations-in-Aid offset.</p>
            <div><BadgeCheck size={18} aria-hidden="true" /> Approved FY {data.fiscal_year} figures</div>
          </aside>
        </section>

        <section className="spending-explorer-summary" aria-label="Approved budget summary">
          <SummaryCard icon={Landmark} label="Approved net total" value={formatJmd(approvedNetTotal, true)} note="As Passed expenditure envelope" />
          <SummaryCard icon={CircleDollarSign} label="Appropriations-in-Aid" value={formatJmd(aiaOffset, true)} note="Transparent negative offset" tone="is-offset" />
          <SummaryCard icon={BarChart3} label="Public categories" value={String(every100Rows.length)} note="Including the AIA offset" />
          <SummaryCard icon={BookOpenCheck} label="Budget records" value={new Intl.NumberFormat("en-JM").format(spendingRows.length)} note="Detailed approved estimates" />
        </section>

        <Every100Section rows={every100Rows} />

        <section id="spending-breakdown" className="spending-explorer-section spending-explorer-breakdown">
          <div className="spending-explorer-section-heading">
            <div>
              <p className="spending-explorer-kicker">Filter the approved estimates</p>
              <h2>Explore government spending</h2>
            </div>
            <p>Choose one or more filters to narrow the results. Appropriations-in-Aid is shown as a negative offset.</p>
          </div>

          <div className="spending-explorer-filter-panel">
            <div className="spending-explorer-filter-heading">
              <span><Filter size={18} aria-hidden="true" /> Filters {activeFilterCount > 0 && <strong>{activeFilterCount}</strong>}</span>
              <button type="button" onClick={resetFilters} disabled={!activeFilterCount}><RotateCcw size={16} aria-hidden="true" /> Reset all</button>
            </div>
            <div className="spending-explorer-filter-grid">
              <SelectFilter label="Public category" allLabel="All public categories" value={filters.public_category_id} options={optionSets.public_category_id} onChange={(value) => updateFilter("public_category_id", value)} />
              <SelectFilter label="Official function" allLabel="All functions" value={filters.function_id} options={optionSets.function_id} onChange={(value) => updateFilter("function_id", value)} />
              <SelectFilter label="Organisation" allLabel="All organisations" value={filters.organisation_id} options={optionSets.organisation_id} onChange={(value) => updateFilter("organisation_id", value)} />
              <SelectFilter label="Programme" allLabel="All programmes" value={filters.programme_id} options={optionSets.programme_id} onChange={(value) => updateFilter("programme_id", value)} />
              <SelectFilter label="Economic class" allLabel="All economic classes" value={filters.economic_id} options={optionSets.economic_id} onChange={(value) => updateFilter("economic_id", value)} />
              <SelectFilter label="Budget type" allLabel="Recurrent and capital" value={filters.recurrent_or_capital} options={optionSets.recurrent_or_capital} onChange={(value) => updateFilter("recurrent_or_capital", value)} />
              <SelectFilter label="Measure" allLabel="All approved measures" value={filters.measure_type} options={optionSets.measure_type} onChange={(value) => updateFilter("measure_type", value)} />
            </div>
          </div>

          <div className="spending-explorer-selection-summary">
            <div><span>Selected net amount</span><strong>{formatJmd(filteredTotal, true)}</strong></div>
            <div><span>Share of approved net total</span><strong>{approvedNetTotal ? formatPercent((filteredTotal / approvedNetTotal) * 100) : "—"}</strong></div>
            <div><span>Matching records</span><strong>{new Intl.NumberFormat("en-JM").format(filteredRows.length)}</strong></div>
          </div>

          <div className="spending-explorer-breakdown-grid">
            <article className="spending-explorer-panel">
              <div className="spending-explorer-panel-heading"><h3>Selection by public category</h3><span>Signed net amounts</span></div>
              <CategoryBreakdown rows={filteredRows} denominator={approvedNetTotal || 1} />
            </article>
            <article className="spending-explorer-panel spending-explorer-table-panel">
              <div className="spending-explorer-panel-heading"><h3>Detailed spending records</h3><span>Approved budget figures</span></div>
              <SpendingTable rows={filteredRows} page={page} onPageChange={setPage} />
            </article>
          </div>
        </section>

        {data.warnings.length > 0 && (
          <aside className="spending-explorer-data-warning" role="status">{data.warnings.join(" ")}</aside>
        )}
        <SourceSection sources={data.sources} />

        <section id="spending-methodology" className="spending-explorer-section spending-explorer-methodology">
          <div>
            <p className="spending-explorer-kicker">How to read this Explorer</p>
            <h2>How to read the numbers</h2>
            <p>This is the FY {data.fiscal_year} Central Government Estimates As Passed—not a report of actual ministry spending. Actual expenditure will only be added when an official source supports it.</p>
          </div>
          <div className="spending-explorer-method-grid">
            <article><ShieldCheck aria-hidden="true" /><strong>Clear categories</strong><span>Spending is grouped into public categories for easier comparison.</span></article>
            <article><CircleDollarSign aria-hidden="true" /><strong>Net spending totals</strong><span>Appropriations-in-Aid is shown separately as a negative offset.</span></article>
            <article><BookOpenCheck aria-hidden="true" /><strong>Official figures</strong><span>The figures come from the Estimates of Expenditure As Passed.</span></article>
          </div>
        </section>
      </main>
      <ExplorerFooter />
    </div>
  );
};
