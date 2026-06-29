import { useCallback, useEffect, useState } from "react";
import { fetchTrackerData } from "../services/googleSheets.js";

const DEFAULT_TRACKER_ERROR = "Live tracker data is unavailable.";

const monthFromUrl = () => new URLSearchParams(window.location.search).get("month") || "";

export const useTrackerData = (trackerFetcher = fetchTrackerData) => {
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getTrackerMonthSort = useCallback((tracker) => tracker?.current_month?.month_sort || "", []);

  const getTrackerErrorMessage = useCallback((requestError) => {
    return requestError?.message || DEFAULT_TRACKER_ERROR;
  }, []);

  const applyTrackerData = useCallback((tracker) => {
    setData(tracker);
    setSelectedMonth(getTrackerMonthSort(tracker));
  }, [getTrackerMonthSort]);

  const applyTrackerError = useCallback((requestError) => {
    setError(getTrackerErrorMessage(requestError));
  }, [getTrackerErrorMessage]);

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
  }, [applyTrackerData, applyTrackerError, trackerFetcher]);

  const handleMonthChange = useCallback((monthSort) => {
    const params = new URLSearchParams(window.location.search);
    if (monthSort) params.set("month", monthSort);
    else params.delete("month");
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;

    window.history.replaceState({}, "", nextUrl);
    setSelectedMonth(monthSort);
    loadTracker(monthSort);
  }, [loadTracker]);

  useEffect(() => {
    loadTracker(monthFromUrl());
  }, [loadTracker]);

  return { data, selectedMonth, loading, error, loadTracker, handleMonthChange };
};