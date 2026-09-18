import { useCallback, useEffect, useState } from "react";
import api from "../api";

export default function useSavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshSavedJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/saved-jobs");
      setSavedJobs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load saved jobs.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => refreshSavedJobs().catch(() => {}));
  }, [refreshSavedJobs]);

  const isSaved = useCallback(
    (jobId) => savedJobs.some((job) => job.job_id === jobId),
    [savedJobs]
  );

  const saveJob = useCallback(async (jobId, jobData) => {
    await api.post(`/api/saved-jobs/${jobId}`);
    setSavedJobs((previous) =>
      previous.some((job) => job.job_id === jobId)
        ? previous
        // Previously always pushed a bare { job_id } placeholder here,
        // even when the caller already had the full job (title,
        // company, etc.) on hand — that could render a blank-looking
        // card until the next refreshSavedJobs(). Now uses the real
        // data when the caller provides it.
        : [...previous, jobData ? { ...jobData, job_id: jobId } : { job_id: jobId }]
    );
  }, []);

  const removeJob = useCallback(async (jobId) => {
    await api.delete(`/api/saved-jobs/${jobId}`);
    setSavedJobs((previous) => previous.filter((job) => job.job_id !== jobId));
  }, []);

  const toggleSave = useCallback(
    (jobId, jobData) =>
      isSaved(jobId) ? removeJob(jobId) : saveJob(jobId, jobData),
    [isSaved, removeJob, saveJob]
  );

  return {
    savedJobs,
    savedJobIds: new Set(savedJobs.map((job) => job.job_id)),
    loading,
    error,
    isSaved,
    saveJob,
    removeJob,
    toggleSave,
    refreshSavedJobs,
  };
}
