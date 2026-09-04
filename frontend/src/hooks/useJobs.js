import { useEffect, useState } from "react";
import api from "../api";

const JOB_CACHE_TTL_MS = 15000;
const jobsCache = new Map();
const jobsInflight = new Map();

const getCacheKey = (userId, limit, search) =>
  `${userId}|${limit}|${search || ""}`;

const invalidateCachedJob = (jobId) => {
  for (const [key, entry] of jobsCache.entries()) {
    const filtered = entry.jobs.filter((job) => job.job_id !== jobId);
    if (filtered.length !== entry.jobs.length) {
      jobsCache.set(key, { ...entry, jobs: filtered });
    }
  }
};

// ==========================================
// useJobs
//
// AI-scored, personalized recommendations for
// a specific candidate — profile, resume, and
// swipe history all factor into match_score.
// Powers the AI Recommendations page.
//
//   AI Recommendations -> useJobs(userId, { limit: 10 })
//
// NOT used by Discover — Discover is a plain,
// unscored listing of every active job and uses
// the separate useAllJobs() hook instead. Keeping
// these two hooks distinct (rather than one hook
// with a mode flag) is deliberate: they hit
// different endpoints and return differently
// shaped data (useAllJobs jobs have no
// match_score at all), so collapsing them back
// into one hook would just reintroduce the
// earlier bug where the two pages were
// indistinguishable.
// ==========================================

export default function useJobs(userId, options = {}) {
  const { limit = 50, search = "" } = options;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refetchIndex, setRefetchIndex] = useState(0);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    const cacheKey = getCacheKey(userId, limit, search);
    const cached = jobsCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < JOB_CACHE_TTL_MS) {
      setJobs(cached.jobs);
      setLoading(false);
      setError("");
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError("");

    const fetchJobs = async () => {
      try {
        let request = jobsInflight.get(cacheKey);

        if (!request) {
          request = api
            .get(`/api/recommendations/${userId}`, {
              params: {
                limit,
                ...(search ? { search } : {}),
              },
            })
            .then((response) =>
              Array.isArray(response.data) ? response.data : []
            )
            .finally(() => {
              jobsInflight.delete(cacheKey);
            });

          jobsInflight.set(cacheKey, request);
        }

        const result = await request;
        jobsCache.set(cacheKey, { timestamp: Date.now(), jobs: result });

        if (!cancelled) {
          setJobs(result);
        }
      } catch (err) {
        console.error("useJobs fetch error:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
              "Unable to load job recommendations."
          );
          setJobs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [userId, limit, search, refetchIndex]);

  // ==========================================
  // REMOVE A JOB LOCALLY
  // Called after a successful swipe so the
  // active mode reflects it immediately without
  // a full refetch.
  // ==========================================

  const removeJob = (jobId) => {
    invalidateCachedJob(jobId);
    setJobs((previous) => previous.filter((job) => job.job_id !== jobId));
  };

  const refetch = () => setRefetchIndex((previous) => previous + 1);

  return {
    jobs,
    loading,
    error,
    refetch,
    removeJob,
  };
}
