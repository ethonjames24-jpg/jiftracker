import { useCallback, useEffect, useState } from "react";
import { fetchTracker } from "@/services/trackerApi";

const DEFAULT_TRACKER_ERROR = "Live tracker data is unavailable.";

export const useTrackerData = (trackerFetcher = fetchTracker) => {
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getTrackerMonthSort = useCallback((tracker) => tracker?.current_month?.month_sort || "", []);

  const getTrackerErrorMessage = useCallback((requestError) => {
    return requestError?.response?.data?.detail || requestError?.message || DEFAULT_TRACKER_ERROR;
  }, []);

  const applyTrackerData = useCallback((tracker) => {
    setData(tracker);
    setSelectedMonth(getTrackerMonthSort(tracker));
  }, [getTrackerMonthSort, setData, setSelectedMonth]);

  const applyTrackerError = useCallback((requestError) => {
    setError(getTrackerErrorMessage(requestError));
  }, [getTrackerErrorMessage, setError]);

  const loadTracker = useCallback(async (monthSort = "") => {
    setLoading(true);
    setError("");

    try {
      const tracker = await trackerFetcher(monthSort);
      applyTrackerData(tracker);
    } catch (requestError) {
      applyTrackerError(requestError);
    } finally {
      setLoading(false);
    }
  }, [applyTrackerData, applyTrackerError, setError, setLoading, trackerFetcher]);

  const handleMonthChange = useCallback((monthSort) => {
    setSelectedMonth(monthSort);
    loadTracker(monthSort);
  }, [loadTracker, setSelectedMonth]);

  useEffect(() => {
    loadTracker("");
  }, [loadTracker]);

  return {
    data,
    selectedMonth,
    loading,
    error,
    loadTracker,
    handleMonthChange,
  };
};