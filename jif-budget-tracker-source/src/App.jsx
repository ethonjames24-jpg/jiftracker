import { lazy, Suspense, useRef } from "react";
import { BackToTopButton, Header } from "./components/Header.jsx";
import { PublicToolsFooter } from "./components/PublicToolsFooter.jsx";
import { Overview } from "./components/Overview.jsx";
import { KpiTable } from "./components/KpiTable.jsx";
import { SourceSection } from "./components/SourceSection.jsx";
import { ArchiveSection } from "./components/ArchiveSection.jsx";
import { MethodologySection } from "./components/MethodologySection.jsx";
import { PublicWarnings } from "./components/PublicWarnings.jsx";
import { MonthComparison } from "./components/MonthComparison.jsx";
import { CompactSubscribeCta, FloatingSubscribeButton, SubscriptionSection } from "./components/SubscriptionSection.jsx";
import { AdminChecklist, isAdminChecklistRoute } from "./components/AdminChecklist.jsx";
import { CaptureView, getCaptureMode } from "./components/CaptureViews.jsx";
import { ErrorState, LoadingLine, LoadingState } from "./components/States.jsx";
import { useTrackerData } from "./hooks/useTrackerData.js";
import { isSpendingExplorerRoute } from "./utils/appRoute.js";
import { useSectionReveals } from "./hooks/useMotionPolish.js";

const SpendingExplorerPage = lazy(() => import("./components/spending/SpendingExplorerPage.jsx")
  .then((module) => ({ default: module.SpendingExplorerPage })));

const NonBlockingError = ({ message }) => (
  <div data-testid="nonblocking-error-banner" className="nonblocking-error">{message}</div>
);

const isDocumentLoaderPreviewRoute = () => (
  new URLSearchParams(window.location.search).get("preview") === "document-loader"
);

const MonthlyTrackerApp = () => {
  const { data, selectedMonth, loading, error, loadTracker, handleMonthChange } = useTrackerData();
  const mainRef = useRef(null);
  useSectionReveals(mainRef, Boolean(data));
  const captureMode = getCaptureMode();
  const showAdminChecklist = isAdminChecklistRoute();

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={() => loadTracker("")} />;
  if (captureMode) return <CaptureView mode={captureMode} data={data} />;
  if (showAdminChecklist) return <AdminChecklist data={data} />;

  return (
    <div className="app" data-testid="dashboard-app">
      <LoadingLine active={loading} />
      <div id="page-top" className="page-top-sentinel" aria-hidden="true" />
      <div id="back-to-top-sentinel" className="back-to-top-sentinel" aria-hidden="true" />
      <Header months={data.available_months || []} selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />
      {error && <NonBlockingError message={error} />}
      <main ref={mainRef} data-testid="dashboard-main-content">
        <PublicWarnings data={data} />
        <Overview currentMonth={data.current_month} />
        <MonthComparison comparison={data.month_comparison} />
        <CompactSubscribeCta />
        <KpiTable kpis={data.kpis || []} monthLabel={data.current_month?.month_label} />
        <ArchiveSection archive={data.archive || []} />
        <SourceSection currentMonth={data.current_month} />
        <MethodologySection currentMonth={data.current_month} />
        <SubscriptionSection monthSort={data.current_month?.month_sort || selectedMonth} />
      </main>
      <BackToTopButton />
      <FloatingSubscribeButton />
      <PublicToolsFooter />
    </div>
  );
};

export default function App() {
  if (isDocumentLoaderPreviewRoute()) return <LoadingState />;
  if (isSpendingExplorerRoute()) {
    return (
      <Suspense fallback={<LoadingState />}>
        <SpendingExplorerPage />
      </Suspense>
    );
  }
  return <MonthlyTrackerApp />;
}
