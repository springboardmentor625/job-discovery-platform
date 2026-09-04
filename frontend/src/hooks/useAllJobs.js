import { useEffect, useState } from "react";
import api from "../api";

// ==========================================
// useAllJobs
//
// Plain job listing — active jobs the current candidate has NOT swiped,
// newest first, with NO AI scoring or personalization.
// Powers Discover.
//
// This is deliberately a SEPARATE hook from
// useJobs.js, not a variant of it. The two have
// different shapes on purpose:
//
//   useAllJobs()  -> GET /api/jobs
//                    "what's available"
//                    no match_score on returned jobs
//
//   useJobs(userId) -> GET /api/recommendations/{userId}
//                    "what fits you"
//                    profile + resume + swipe-history
//                    scored, includes match_score
//
// Keeping them separate avoids the earlier bug
// where Discover and AI Recommendations quietly
// called the same personalized endpoint and were
// indistinguishable except by a `limit` param.
// ==========================================

export default function useAllJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchJobs = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/api/jobs");

        if (!cancelled) {
          setJobs(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        console.error("useAllJobs fetch error:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.detail || "Unable to load jobs."
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
  }, []);

  const removeJob = (jobId) => {
    setJobs((previous) => previous.filter((job) => job.job_id !== jobId));
  };

  return { jobs, loading, error, removeJob };
}
