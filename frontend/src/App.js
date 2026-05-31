import { useCallback, useEffect, useState } from "react";
import "@/App.css";
import { Header } from "@/components/Header";
import { Overview } from "@/components/Overview";
import { SummaryCards } from "@/components/SummaryCards";
import { KpiTable } from "@/components/KpiTable";
import { SourceSection } from "@/components/SourceSection";
import { ArchiveSection } from "@/components/ArchiveSection";
import { MethodologySection } from "@/components/MethodologySection";
import { ErrorState, LoadingState } from "@/components/States";
import { fetchTracker } from "@/services/trackerApi";

const logoUrl = "https://customer-assets.emergentagent.com/job_jif-budget-outturn/artifacts/ymrt983n_jamaica%20in%20focus%20new%20logo%20%281%29.png";

const Home = () => {
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTracker = useCallback(async (monthSort = "") => {
    setLoading(true);
    setError("");
    try {
      const tracker = await fetchTracker(monthSort);
      setData(tracker);
      setSelectedMonth(tracker.current_month?.month_sort || "");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Live tracker data is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracker("");
  }, [loadTracker]);

  const handleMonthChange = useCallback((monthSort) => {
    setSelectedMonth(monthSort);
    loadTracker(monthSort);
  }, [loadTracker]);

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={() => loadTracker("")} />;

  return (
    <div className="min-h-screen bg-white text-black" data-testid="dashboard-app">
      <Header months={data.available_months || []} selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />
      {error && <div data-testid="nonblocking-error-banner" className="border-b-2 border-black bg-red-100 px-4 py-3 text-center text-sm font-bold text-red-900">{error}</div>}
      <main data-testid="dashboard-main-content">
        <Overview currentMonth={data.current_month} />
        <SummaryCards counts={data.current_month?.counts} />
        <KpiTable kpis={data.kpis || []} monthLabel={data.current_month?.month_label} />
        <SourceSection currentMonth={data.current_month} />
        <ArchiveSection archive={data.archive || []} />
        <MethodologySection />
      </main>
      <footer data-testid="site-footer" className="border-t-4 border-black bg-[#f8c400] px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Jamaica In Focus logo" data-testid="footer-logo" className="h-11 w-11 rounded-full border-2 border-black bg-white object-cover" />
            <p data-testid="footer-brand-text" className="max-w-xl text-sm font-black text-black">Jamaica In Focus Budget Performance Tracker. We check the receipts.</p>
          </div>
          <p data-testid="footer-live-data-note" className="text-xs font-bold uppercase tracking-[0.12em] text-black/70">Live read-only Google Sheet feed</p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return <Home />;
}

export default App;
