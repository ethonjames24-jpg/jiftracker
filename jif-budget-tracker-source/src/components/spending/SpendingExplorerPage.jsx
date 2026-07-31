import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  ExternalLink,
  FileCheck2,
  Filter,
  GitCompareArrows,
  Landmark,
  LoaderCircle,
  MinusCircle,
  RefreshCw,
  RotateCcw,
  SearchX,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { LOGO_URL } from "../../config.js";
import { BackToTopButton } from "../Header.jsx";
import { PublicToolsFooter } from "../PublicToolsFooter.jsx";
import { useSpendingExplorerData } from "../../hooks/useSpendingExplorerData.js";
import {
  buildSpendingCsv,
  buildFilterOptions,
  EMPTY_EXPLORER_FILTERS,
  explorerFiltersFromSearch,
  explorerFiscalYearFromSearch,
  filterRowsByFiscalYear,
  filterSpendingRows,
  formatJmd,
  formatPercent,
  groupSpendingRows,
  measureTypeLabel,
  searchWithExplorerFilters,
  selectLatestAnnualComparison,
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
          <a className="spending-explorer-tracker-link" href="/" data-testid="spending-explorer-tracker-link">
            <ArrowLeft size={16} aria-hidden="true" />
            Budget Tracker
          </a>
          <a href="#spending-overview">Overview</a>
          <a href="#annual-comparison">Compare years</a>
          <a href="#every-100">Every J$100</a>
          <a href="#spending-breakdown">Explore spending</a>
          <a href="#spending-glossary">Glossary</a>
          <a href="#spending-sources">Sources</a>
          <a href="#spending-methodology">Methodology</a>
        </div>
      </nav>
    )}
  </>
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
    <PublicToolsFooter sourceHref="#spending-sources" />
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
        <p>See how the approved budget is divided when the total is scaled down to J$100.</p>
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
              </div>
              <div className="spending-explorer-every100-value">
                <strong>{row.per_j100 < 0 ? "−" : ""}J${Math.abs(row.per_j100).toFixed(2)}</strong>
                <span>of every J$100</span>
              </div>
            </article>
          );
        })}
      </div>
      <aside className="spending-explorer-aia-explainer">
        <strong>What is Appropriations-in-Aid?</strong>
        <span>It is money government organisations expect to collect and use. It appears as a negative amount because it reduces the funding needed from the central budget.</span>
      </aside>
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

const YearSelector = ({ years, value, onChange }) => (
  <label className="spending-explorer-year-selector">
    <span>Fiscal year</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Select fiscal year">
      {years.map((year) => <option key={year} value={year}>FY {year}</option>)}
    </select>
  </label>
);

const AnnualComparison = ({ rows, every100Rows }) => {
  const {
    currentFiscalYear,
    priorFiscalYear,
    rows: comparisonRows,
  } = selectLatestAnnualComparison(rows);

  if (!comparisonRows.length) {
    return (
      <section id="annual-comparison" className="spending-explorer-section spending-explorer-comparison is-unavailable">
        <GitCompareArrows aria-hidden="true" />
        <div><h2>Compare fiscal years</h2><p>No released year-over-year comparison is available yet.</p></div>
      </section>
    );
  }

  const currentTotal = every100Rows.find((row) => row.fiscal_year === currentFiscalYear)?.denominator_amount_jmd || 0;
  const priorTotal = every100Rows.find((row) => row.fiscal_year === priorFiscalYear)?.denominator_amount_jmd || 0;
  const totalChange = currentTotal - priorTotal;
  const totalPercent = priorTotal ? (totalChange / priorTotal) * 100 : null;
  const categories = comparisonRows.filter((row) => row.entity_id !== "CAT_AIA_OFFSET")
    .sort((a, b) => Math.abs(b.amount_change_jmd) - Math.abs(a.amount_change_jmd));

  return (
    <section id="annual-comparison" className="spending-explorer-section spending-explorer-comparison">
      <div className="spending-explorer-section-heading">
        <div><p className="spending-explorer-kicker">Year-over-year view</p><h2>FY {currentFiscalYear} vs FY {priorFiscalYear}</h2></div>
        <p>This fixed comparison stays visible while you explore either fiscal year. It compares approved Estimates As Passed—not actual spending.</p>
      </div>
      <div className="spending-explorer-comparison-summary">
        <article><span>Approved budget change</span><strong>{formatJmd(totalChange, true)}</strong><small>{totalPercent === null ? "Not comparable" : `${formatPercent(totalPercent)} from FY ${priorFiscalYear} to FY ${currentFiscalYear}`}</small></article>
        <article><span>FY {currentFiscalYear}</span><strong>{formatJmd(currentTotal, true)}</strong><small>Net approved expenditure</small></article>
        <article><span>FY {priorFiscalYear}</span><strong>{formatJmd(priorTotal, true)}</strong><small>Net approved expenditure</small></article>
      </div>
      <div className="spending-explorer-comparison-list" role="table" aria-label={`Approved category changes from FY ${priorFiscalYear} to FY ${currentFiscalYear}`}>
        <div className="is-header" role="row"><span>Public category</span><span>Amount change</span><span>Percentage</span><span>Movement</span></div>
        {categories.map((row) => (
          <div key={row.comparison_id} role="row">
            <strong>{row.entity_name}</strong>
            <span className={row.amount_change_jmd < 0 ? "is-down" : "is-up"}>{row.amount_change_jmd > 0 ? "+" : ""}{formatJmd(row.amount_change_jmd, true)}</span>
            <span>{row.percent_change === null ? "Not comparable" : `${row.percent_change > 0 ? "+" : ""}${formatPercent(row.percent_change)}`}</span>
            <span>{row.rank_change > 0 ? `Up ${row.rank_change}` : row.rank_change < 0 ? `Down ${Math.abs(row.rank_change)}` : "No change"}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

const PlainLanguageAnswers = ({ every100Rows, spendingRows }) => {
  const largestCategory = [...every100Rows]
    .filter((row) => row.amount_jmd > 0)
    .sort((a, b) => b.amount_jmd - a.amount_jmd)[0];
  const largestOrganisation = groupSpendingRows(spendingRows, "organisation_id", "organisation_name")
    .filter((group) => group.amount_jmd > 0)[0];
  const budgetTypes = groupSpendingRows(spendingRows, "recurrent_or_capital", "recurrent_or_capital");
  const recurrent = budgetTypes.find((group) => group.id === "RECURRENT")?.amount_jmd || 0;
  const capital = budgetTypes.find((group) => group.id === "CAPITAL")?.amount_jmd || 0;

  return (
    <section className="spending-explorer-section spending-explorer-questions" aria-labelledby="spending-questions-title">
      <div className="spending-explorer-section-heading">
        <div>
          <p className="spending-explorer-kicker">Start with the big picture</p>
          <h2 id="spending-questions-title">Three questions people ask</h2>
        </div>
        <p>Quick answers from the approved budget, before you explore the detail.</p>
      </div>
      <div className="spending-explorer-question-grid">
        <article tabIndex="0">
          <BarChart3 aria-hidden="true" />
          <h3>Which area receives the most?</h3>
          <strong>{largestCategory?.public_category_name || "—"}</strong>
          <span>{largestCategory ? formatJmd(largestCategory.amount_jmd, true) : "No figure available"}</span>
        </article>
        <article tabIndex="0">
          <Landmark aria-hidden="true" />
          <h3>Which organisation manages the most?</h3>
          <strong>{largestOrganisation?.name || "—"}</strong>
          <span>{largestOrganisation ? formatJmd(largestOrganisation.amount_jmd, true) : "No figure available"}</span>
        </article>
        <article tabIndex="0">
          <CircleDollarSign aria-hidden="true" />
          <h3>How much is recurrent versus capital?</h3>
          <strong>{formatJmd(recurrent, true)} recurrent</strong>
          <span>{formatJmd(capital, true)} capital</span>
        </article>
      </div>
    </section>
  );
};

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

const GlossarySection = () => (
  <section id="spending-glossary" className="spending-explorer-section spending-explorer-glossary">
    <div className="spending-explorer-section-heading">
      <div>
        <p className="spending-explorer-kicker">Budget terms, simply explained</p>
        <h2>Quick glossary</h2>
      </div>
      <p>Short definitions for the terms used throughout the Explorer.</p>
    </div>
    <dl className="spending-explorer-glossary-grid">
      <div><dt>Recurrent spending</dt><dd>Day-to-day government costs such as salaries, operations, grants and debt payments.</dd></div>
      <div><dt>Capital spending</dt><dd>Investment in projects and assets such as roads, schools, hospitals and major equipment.</dd></div>
      <div><dt>Voted estimate</dt><dd>Spending that Parliament approves through the annual budget process.</dd></div>
      <div><dt>Public debt</dt><dd>Money allocated to repay government borrowing and the interest or other costs attached to it.</dd></div>
    </dl>
  </section>
);

export const SpendingExplorerPage = () => {
  const { data, loading, error, loadExplorer } = useSpendingExplorerData();
  const [filters, setFilters] = useState(() => (
    typeof window === "undefined" ? EMPTY_EXPLORER_FILTERS : explorerFiltersFromSearch(window.location.search)
  ));
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(() => (
    typeof window === "undefined" ? "" : explorerFiscalYearFromSearch(window.location.search)
  ));
  const [page, setPage] = useState(1);
  const [shareStatus, setShareStatus] = useState("");

  const fiscalYears = data?.fiscal_years || [];
  const activeFiscalYear = fiscalYears.includes(selectedFiscalYear) ? selectedFiscalYear : (data?.fiscal_year || fiscalYears[0] || "");
  const allSpendingRows = data?.spending || [];
  const allEvery100Rows = data?.every_100 || [];
  const spendingRows = useMemo(() => filterRowsByFiscalYear(allSpendingRows, activeFiscalYear), [allSpendingRows, activeFiscalYear]);
  const every100Rows = useMemo(() => filterRowsByFiscalYear(allEvery100Rows, activeFiscalYear), [allEvery100Rows, activeFiscalYear]);
  const visibleSources = (data?.sources || []).filter((source) => !source.fiscal_year || source.fiscal_year === activeFiscalYear);
  const filteredRows = useMemo(() => filterSpendingRows(spendingRows, filters), [spendingRows, filters]);
  const filteredTotal = useMemo(() => sumSpendingRows(filteredRows), [filteredRows]);
  const approvedNetTotal = every100Rows[0]?.denominator_amount_jmd || 0;
  const aiaOffset = every100Rows.find((row) => row.amount_jmd < 0)?.amount_jmd || 0;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => setPage(1), [filters]);
  useEffect(() => {
    if (activeFiscalYear && activeFiscalYear !== selectedFiscalYear) setSelectedFiscalYear(activeFiscalYear);
  }, [activeFiscalYear, selectedFiscalYear]);

  const commitFilters = (nextFilters) => {
    setFilters(nextFilters);
    const nextSearch = searchWithExplorerFilters(window.location.search, nextFilters, activeFiscalYear);
    window.history.replaceState(null, "", `${window.location.pathname}${nextSearch}${window.location.hash}`);
    setShareStatus("");
  };
  const updateFilter = (field, value) => commitFilters({ ...filters, [field]: value });
  const resetFilters = () => commitFilters(EMPTY_EXPLORER_FILTERS);
  const updateFiscalYear = (fiscalYear) => {
    setSelectedFiscalYear(fiscalYear);
    setFilters(EMPTY_EXPLORER_FILTERS);
    setPage(1);
    const nextSearch = searchWithExplorerFilters(window.location.search, EMPTY_EXPLORER_FILTERS, fiscalYear);
    window.history.replaceState(null, "", `${window.location.pathname}${nextSearch}${window.location.hash}`);
    setShareStatus("");
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("Link copied");
    } catch {
      setShareStatus("Copy the link from your address bar");
    }
  };

  const downloadFilteredRows = () => {
    const blob = new Blob([buildSpendingCsv(filteredRows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jif-government-spending-${activeFiscalYear.replace("/", "-")}${activeFilterCount ? "-filtered" : ""}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
      <div id="page-top" className="page-top-sentinel" aria-hidden="true" />
      <div id="back-to-top-sentinel" className="back-to-top-sentinel" aria-hidden="true" />
      <ExplorerHeader released />
      <main>
        {error && <div className="spending-explorer-inline-warning">{error}</div>}
        <section id="spending-overview" className="spending-explorer-hero">
          <div className="spending-explorer-hero-copy">
            <YearSelector years={fiscalYears} value={activeFiscalYear} onChange={updateFiscalYear} />
            <p className="spending-explorer-kicker">FY {activeFiscalYear} · Estimates As Passed</p>
            <h1>Government spending, made easier to inspect.</h1>
            <p>Explore Jamaica’s approved Central Government expenditure by public category, organisation, function, programme and economic classification.</p>
            <div className="spending-explorer-hero-actions">
              <a href="#annual-comparison"><GitCompareArrows size={18} aria-hidden="true" /> Compare fiscal years</a>
              <a href="#spending-breakdown"><Filter size={18} aria-hidden="true" /> Explore the detail</a>
            </div>
          </div>
          <aside className="spending-explorer-hero-total">
            <span>Net approved expenditure</span>
            <strong>{formatJmd(approvedNetTotal, true)}</strong>
            <p>The approved expenditure total after offsets.</p>
            <div><BadgeCheck size={18} aria-hidden="true" /> Approved FY {activeFiscalYear} figures</div>
          </aside>
        </section>

        <section className="spending-explorer-summary" aria-label="Approved budget summary">
          <SummaryCard icon={Landmark} label="Approved net total" value={formatJmd(approvedNetTotal, true)} note="As Passed expenditure envelope" />
          <SummaryCard icon={CircleDollarSign} label="Appropriations-in-Aid" value={formatJmd(aiaOffset, true)} note="Shown separately in Every J$100" tone="is-offset" />
          <SummaryCard icon={BarChart3} label="Public categories" value={String(every100Rows.length)} note="Including the AIA offset" />
          <SummaryCard icon={BookOpenCheck} label="Budget records" value={new Intl.NumberFormat("en-JM").format(spendingRows.length)} note="Detailed approved estimates" />
        </section>

        <AnnualComparison rows={data.comparison || []} every100Rows={allEvery100Rows} />
        <Every100Section rows={every100Rows} />
        <PlainLanguageAnswers every100Rows={every100Rows} spendingRows={spendingRows} />

        <section id="spending-breakdown" className="spending-explorer-section spending-explorer-breakdown">
          <div className="spending-explorer-section-heading">
            <div>
              <p className="spending-explorer-kicker">Filter the approved estimates</p>
              <h2>Explore government spending</h2>
            </div>
            <p>Choose one or more filters to narrow the results and answer your own questions.</p>
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

          <div className="spending-explorer-filter-actions" aria-label="Share or download these results">
            <button type="button" onClick={copyShareLink}><Share2 size={17} aria-hidden="true" /> Copy link to this view</button>
            <button type="button" onClick={downloadFilteredRows}><Download size={17} aria-hidden="true" /> Download {activeFilterCount ? "filtered " : ""}CSV</button>
            {shareStatus && <span role="status">{shareStatus}</span>}
          </div>

          {activeFilterCount > 0 && (
            <section className="spending-explorer-your-selection" aria-labelledby="your-selection-title">
              <div className="spending-explorer-panel-heading"><h3 id="your-selection-title">Your selection</h3><span>{activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}</span></div>
              <div className="spending-explorer-selection-summary">
                <div><span>Selected net amount</span><strong>{formatJmd(filteredTotal, true)}</strong></div>
                <div><span>Share of approved net total</span><strong>{approvedNetTotal ? formatPercent((filteredTotal / approvedNetTotal) * 100) : "—"}</strong></div>
                <div><span>Matching records</span><strong>{new Intl.NumberFormat("en-JM").format(filteredRows.length)}</strong></div>
              </div>
              <CategoryBreakdown rows={filteredRows} denominator={approvedNetTotal || 1} />
            </section>
          )}

          <details className="spending-explorer-details">
            <summary>
              <span>View detailed spending records</span>
              <small>{new Intl.NumberFormat("en-JM").format(filteredRows.length)} records match the current filters</small>
            </summary>
            <SpendingTable rows={filteredRows} page={page} onPageChange={setPage} />
          </details>
        </section>

        {data.warnings.length > 0 && (
          <aside className="spending-explorer-data-warning" role="status">{data.warnings.join(" ")}</aside>
        )}
        <GlossarySection />
        <SourceSection sources={visibleSources} />

        <section id="spending-methodology" className="spending-explorer-section spending-explorer-methodology">
          <div>
            <p className="spending-explorer-kicker">How to read this Explorer</p>
            <h2>How to read the numbers</h2>
            <p>This is the FY {activeFiscalYear} Central Government Estimates As Passed—not a report of actual ministry spending. Actual expenditure will only be added when an official source supports it.</p>
          </div>
          <div className="spending-explorer-method-grid">
            <article><ShieldCheck aria-hidden="true" /><strong>Clear categories</strong><span>Spending is grouped into public categories for easier comparison.</span></article>
            <article><CircleDollarSign aria-hidden="true" /><strong>Approved budget</strong><span>These are planned allocations—not reports of money already spent.</span></article>
            <article><BookOpenCheck aria-hidden="true" /><strong>Official figures</strong><span>The figures come from the Estimates of Expenditure As Passed.</span></article>
          </div>
        </section>
      </main>
      <BackToTopButton />
      <PublicToolsFooter sourceHref="#spending-sources" />
    </div>
  );
};
