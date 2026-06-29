import { LOGO_URL } from "./config.js";
import { BackToTopButton, Header } from "./components/Header.jsx";
import { Overview } from "./components/Overview.jsx";
import { SummaryCards } from "./components/SummaryCards.jsx";
import { KpiTable } from "./components/KpiTable.jsx";
import { SourceSection } from "./components/SourceSection.jsx";
import { ArchiveSection } from "./components/ArchiveSection.jsx";
import { MethodologySection } from "./components/MethodologySection.jsx";
import { MonthComparison } from "./components/MonthComparison.jsx";
import { CompactSubscribeCta, MobileSubscribeButton, SubscriptionSection } from "./components/SubscriptionSection.jsx";
import { AdminChecklist, isAdminChecklistRoute } from "./components/AdminChecklist.jsx";
import { CaptureView, getCaptureMode } from "./components/CaptureViews.jsx";
import { ErrorState, LoadingState } from "./components/States.jsx";
import { useTrackerData } from "./hooks/useTrackerData.js";

const Footer = () => (
  <footer data-testid="site-footer" className="site-footer">
    <div className="footer-inner">
      <div className="footer-brand">
        <img src={LOGO_URL} alt="Jamaica In Focus logo" data-testid="footer-logo" className="footer-logo" />
        <p data-testid="footer-brand-text">Jamaica In Focus Budget Performance Tracker. We check the receipts.</p>
      </div>
      <p data-testid="footer-live-data-note" className="footer-note">Live read-only Google Sheet feed</p>
    </div>
  </footer>
);

const NonBlockingError = ({ message }) => (
  <div data-testid="nonblocking-error-banner" className="nonblocking-error">{message}</div>
);

export default function App() {
  const { data, selectedMonth, loading, error, loadTracker, handleMonthChange } = useTrackerData();
  const captureMode = getCaptureMode();
  const showAdminChecklist = isAdminChecklistRoute();

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={() => loadTracker("")} />;
  if (captureMode) return <CaptureView mode={captureMode} data={data} />;
  if (showAdminChecklist) return <AdminChecklist data={data} />;

  return (
    <div className="app" data-testid="dashboard-app">
      <div id="page-top" className="page-top-sentinel" aria-hidden="true" />
      <div id="back-to-top-sentinel" className="back-to-top-sentinel" aria-hidden="true" />
      <Header months={data.available_months || []} selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />
      {error && <NonBlockingError message={error} />}
      <main data-testid="dashboard-main-content">
        <Overview currentMonth={data.current_month} />
        <MonthComparison comparison={data.month_comparison} />
        <SubscriptionSection monthSort={data.current_month?.month_sort || selectedMonth} />
        <SummaryCards counts={data.current_month?.counts} />
        <KpiTable kpis={data.kpis || []} monthLabel={data.current_month?.month_label} />
        <ArchiveSection archive={data.archive || []} />
        <SourceSection currentMonth={data.current_month} />
        <MethodologySection currentMonth={data.current_month} />
        <CompactSubscribeCta />
      </main>
      <BackToTopButton />
      <MobileSubscribeButton />
      <Footer />
    </div>
  );
}