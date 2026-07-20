import { useCallback, useEffect, useState } from "react";
import { fetchSpendingExplorerData } from "../services/spendingExplorer.js";

const DEFAULT_EXPLORER_ERROR = "We could not load the Government Spending Explorer right now. The monthly tracker is still available.";

export const useSpendingExplorerData = (explorerFetcher = fetchSpendingExplorerData) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadExplorer = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await explorerFetcher());
    } catch (requestError) {
      setError(DEFAULT_EXPLORER_ERROR);
    } finally {
      setLoading(false);
    }
  }, [explorerFetcher]);

  useEffect(() => {
    loadExplorer();
  }, [loadExplorer]);

  return { data, loading, error, loadExplorer };
};
