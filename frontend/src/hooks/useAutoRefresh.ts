import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoRefreshOptions {
  enabled?: boolean;
  interval?: number;
}

/**
 * Custom hook for auto-refreshing feed data based on localStorage settings
 * 
 * @param onRefresh Callback function to execute on refresh
 * @param options Optional configuration
 */
export function useAutoRefresh(
  onRefresh: () => Promise<void>,
  options?: UseAutoRefreshOptions
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshFeed = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Failed to refresh feed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    const autoRefreshEnabled =
      options?.enabled ?? localStorage.getItem("auto_refresh_enabled") === "true";
    const autoRefreshInterval =
      options?.interval ??
      parseInt(localStorage.getItem("auto_refresh_interval") || "60", 10);

    if (autoRefreshEnabled && autoRefreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refreshFeed();
      }, autoRefreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [options?.enabled, options?.interval, refreshFeed]);

  return { isRefreshing, refreshFeed };
}
