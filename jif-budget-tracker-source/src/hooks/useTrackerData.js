import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTrackerData } from "../services/googleSheets.js";

const DEFAULT_TRACKER_ERROR = "We could not load the tracker right now. Please try again later.";

const monthFromUrl = () => new URLSearchParams(window.location.search).get("month") || "";

export const useTrackerData = (trackerFetcher = fetchTrackerData) => {
  const requestId = useRef(0);
  const requestedMonthRef = useRef(null);
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getTrackerMonthSort = useCallback((tracker) => tracker?.current_month?.month_sort || "", []);

  const getTrackerErrorMessage = useCallback((requestError) => {
    return DEFAULT_TRACKER_ERROR;
  }, []);

  const applyTrackerData = useCallback((tracker) => {
    setData(tracker);
    setSelectedMonth(getTrackerMonthSort(tracker));
  }, [getTrackerMonthSort]);

  const applyTrackerError = useCallback((requestError) => {
    setError(getTrackerErrorMessage(requestError));
  }, [getTrackerErrorMessage]);

  const loadTracker = useCallback(async (monthSort = "") => {
    const id = ++requestId.current;
    requestedMonthRef.current = monthSort;
    setLoading(true);
    setError("");

    try {
      const tracker = await trackerFetcher(monthSort);
      if (id === requestId.current) applyTrackerData(tracker);
    } catch (requestError) {
      if (id === requestId.current) {
        setData(null);
        applyTrackerError(requestError);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [applyTrackerData, applyTrackerError, trackerFetcher]);

  const handleMonthChange = useCallback((monthSort) => {
    const params = new URLSearchParams(window.location.search);
    if (monthSort) params.set("month", monthSort);
    else params.delete("month");
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;

    window.history.pushState({}, "", nextUrl);
    setSelectedMonth(monthSort);
    loadTracker(monthSort);
  }, [loadTracker]);

  useEffect(() => {
    loadTracker(monthFromUrl());
    const restoreMonth = () => {
      const month = monthFromUrl();
      if (month !== requestedMonthRef.current) loadTracker(month);
    };
    window.addEventListener("popstate", restoreMonth);
    return () => {
      window.removeEventListener("popstate", restoreMonth);
      requestId.current += 1;
    };
  }, [loadTracker]);

  return { data, selectedMonth, loading, error, loadTracker, handleMonthChange };
};