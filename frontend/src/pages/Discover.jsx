import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import api from "../api";
import Toast from "../components/Toast";
import useAllJobs from "../hooks/useAllJobs";
import SwipeDeck from "../components/discover/SwipeDeck";
import JobDetailsModal from "../components/JobDetailsModal";

// ==========================================
// DISCOVER
//
// Browse every active job in the dataset —
// no AI scoring, no personalization. Uses
// useAllJobs(), a plain listing hook that is
// deliberately SEPARATE from useJobs() (which
// powers the AI Recommendations page and scores
// jobs against the candidate's profile, resume,
// and swipe history).
//
// Swiping here still logs to /api/swipes either
// way — that swipe data is what trains the
// personalization model AI Recommendations uses,
// regardless of whether the job being swiped on
// was AI-ranked or just browsed.
// ==========================================

function Discover() {
  const navigate = useNavigate();

  const [savedJobs, setSavedJobs] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ message, type });
  const closeToast = () => setToast({ message: "", type: "success" });

  // ==========================================
  // SHARED DATA SOURCE — plain job list, not
  // personalized recommendations.
  // ==========================================

  const { jobs, loading, error, removeJob } = useAllJobs();

  // ==========================================
  // LOAD SAVED JOBS (once)
  // ==========================================

  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const response = await api.get("/api/saved-jobs");

        if (Array.isArray(response.data)) {
          setSavedJobs(new Set(response.data.map((job) => job.job_id)));
        }
      } catch (err) {
        console.error("Saved jobs load error:", err);
      }
    };

    loadSavedJobs();
  }, []);

  // ==========================================
  // SWIPE HANDLER
  // Posts to /api/swipes and updates the shared
  // job list.
  // ==========================================

  const handleSwipe = async (jobId, direction) => {
    if (actionLoading) {
      return;
    }

    setActionLoading(true);

    try {
      await api.post("/api/swipes", { job_id: jobId, action: direction, match_score: jobs.find((job) => job.job_id === jobId)?.match_score ?? null });

      if (direction === "right") {
        showToast("Liked — added to your preferences.", "success");
      } else {
        showToast("Passed — we won't show this again.", "info");
      }

      removeJob(jobId);
    } catch (err) {
      console.error("Swipe error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");
        navigate("/login");
        return;
      }

      showToast(err.response?.data?.detail || "Unable to record swipe.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // SAVE HANDLER
  // ==========================================

  const handleSave = async (jobId) => {
    const isSaved = savedJobs.has(jobId);

    try {
      if (isSaved) {
        await api.delete(`/api/saved-jobs/${jobId}`);

        setSavedJobs((previous) => {
          const updated = new Set(previous);
          updated.delete(jobId);
          return updated;
        });

        showToast("Removed from saved jobs.", "info");
      } else {
        await api.post(`/api/saved-jobs/${jobId}`);

        setSavedJobs((previous) => {
          const updated = new Set(previous);
          updated.add(jobId);
          return updated;
        });

        showToast("Job saved.", "success");
      }
    } catch (err) {
      console.error("Save job error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");
        navigate("/login");
        return;
      }

      showToast(err.response?.data?.detail || "Unable to save job.", "error");
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="px-8 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-sx-border bg-sx-card px-8 py-14 text-center shadow-sm">
          <h2 className="text-lg font-bold text-sx-text">
            Loading jobs...
          </h2>
          <p className="mt-1 text-sm text-sx-text-secondary">
            Finding available jobs for you.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="px-8 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-sx-border bg-sx-card px-8 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sx-bg-soft text-2xl text-sx-primary">
            <FaExclamationTriangle />
          </div>
          <h2 className="mt-4 text-lg font-bold text-sx-text">
            Something went wrong
          </h2>
          <p className="mt-1 text-sm text-sx-text-secondary">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-sx-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sx-primary-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />

      <div className="mb-6">
        <span className="text-xs font-bold tracking-widest text-sx-primary">
          SWIPEX DISCOVERY
        </span>
        <h1 className="mt-2 text-3xl font-bold text-sx-text">Discover</h1>
        <p className="mt-1 text-sm text-sx-text-secondary">
          Every active job currently listed — swipe to explore.
        </p>
      </div>

      <SwipeDeck
        jobs={jobs}
        onSwipe={handleSwipe}
        onSave={handleSave}
        savedJobs={savedJobs}
        actionLoading={actionLoading}
        onViewDetails={setSelectedJob}
      />

      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}

export default Discover;
