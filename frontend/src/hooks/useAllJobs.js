import { useCallback, useEffect, useState } from "react";
import api from "../api";

const PAGE_SIZE = 100;

export default function useAllJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalActiveJobs, setTotalActiveJobs] = useState(null);
  const [remainingUnswiped, setRemainingUnswiped] = useState(null);

  const fetchPage = useCallback(async (pageCursor, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/jobs", {
        params: {
          limit: PAGE_SIZE,
          ...(pageCursor
            ? {
                before_created_at: pageCursor.created_at,
                before_job_id: pageCursor.job_id,
              }
            : {}),
        },
      });
      const page = Array.isArray(response.data) ? response.data : [];

      setJobs((previous) => {
        if (!append) return page;
        const existing = new Set(previous.map((job) => job.job_id));
        return [...previous, ...page.filter((job) => !existing.has(job.job_id))];
      });
      const lastJob = page[page.length - 1];
      setCursor(
        lastJob
          ? { created_at: lastJob.created_at, job_id: lastJob.job_id }
          : pageCursor
      );
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      console.error("useAllJobs fetch error:", err);
      setError(err.response?.data?.detail || "Unable to load jobs.");
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchPage(null, false));

    const fetchStatus = async () => {
      try {
        const response = await api.get("/api/jobs/discovery-status");
        setTotalActiveJobs(Number(response.data?.total_active_jobs ?? 0));
        setRemainingUnswiped(Number(response.data?.remaining_unswiped ?? 0));
      } catch (err) {
        console.warn("useAllJobs status fetch error:", err);
      }
    };

    fetchStatus();
  }, [fetchPage]);

  const removeJob = (jobId) => {
    setJobs((previous) => previous.filter((job) => job.job_id !== jobId));
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) fetchPage(cursor, true);
  }, [fetchPage, hasMore, loadingMore, cursor]);

  return {
    jobs,
    loading,
    loadingMore,
    hasMore,
    error,
    removeJob,
    loadMore,
    totalActiveJobs,
    remainingUnswiped,
  };
}
