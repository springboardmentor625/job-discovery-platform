import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import useJobs from "../hooks/useJobs";
import useSavedJobs from "../hooks/useSavedJobs";
import SwipeDeck from "../components/discover/SwipeDeck";
import JobDetailsModal from "../components/JobDetailsModal";
import Toast from "../components/Toast";
import api, { clearAuth } from "../api";

// AI Recommendations now uses the former Discover swipe-card presentation.
// The data source remains useJobs(), so jobs are still personalized and
// ranked by the recommendation backend.
function AIRecommendations() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("user_id");

  const [selectedJob, setSelectedJob] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const { jobs, loading, error, removeJob, restoreJob } = useJobs(userId, {
    limit: 30,
  });
  const { savedJobIds, isSaved, toggleSave } = useSavedJobs();

  // Job IDs with a swipe/save request currently in flight — guards
  // against firing a second request for the same job (e.g. a rapid
  // double-tap) before the first one has resolved. The deck's own
  // exit animation already prevents re-committing the SAME visible
  // card twice, but this is a second, independent safety net at the
  // data layer. Replaces the old `actionLoading` boolean, which would
  // have blocked interacting with EVERY card while any one request was
  // in flight — unnecessary now that swipes/saves are optimistic and
  // per-job.
  const inFlightJobIds = useRef(new Set());

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Remove the job as soon as the swipe commits. The deck keeps rendering
  // the outgoing card from its snapshot while the next job is prepared.
  const handleSwipeCommit = (jobId, type) => {
    removeJob(jobId);

    if (type === "save") {
      showToast("Job saved.", "success");
    } else {
      showToast(
        type === "right"
          ? "Liked — added to your preferences."
          : "Passed — we won't show this again.",
        type === "right" ? "success" : "info"
      );
    }
  };

  const handleSwipe = async (jobId, direction) => {
    if (inFlightJobIds.current.has(jobId)) return true;

    const jobSnapshot = jobs.find((job) => job.job_id === jobId);
    inFlightJobIds.current.add(jobId);

    // The card was removed optimistically when the exit animation started.
    removeJob(jobId);

    try {
      await api.post("/api/swipes", {
        job_id: jobId,
        action: direction,
        calculate_match_score: false,
      });
    } catch (err) {
      console.error("Swipe error:", err);

      if (err.response?.status === 401) {
        clearAuth();
        navigate("/login");
        return true;
      }

      // The swipe didn’t save — restore the job so the user can retry.
      restoreJob(jobSnapshot);
      showToast(
        err.response?.data?.detail ||
        "Couldn’t save that swipe — the job’s back, try again.",
        "error"
      );
    } finally {
      inFlightJobIds.current.delete(jobId);
    }

    return true;
  };

  const handleSave = async (jobId) => {
    if (inFlightJobIds.current.has(jobId)) return true;

    const currentlySaved = isSaved(jobId);
    const jobSnapshot = jobs.find((job) => job.job_id === jobId);
    inFlightJobIds.current.add(jobId);

    // The card was removed optimistically when the exit animation started.
    removeJob(jobId);

    try {
      await toggleSave(jobId, jobSnapshot);
    } catch (err) {
      console.error("Save job error:", err);

      if (err.response?.status === 401) {
        clearAuth();
        navigate("/login");
        return true;
      }

      if (!currentlySaved) {
        restoreJob(jobSnapshot);
      }
      showToast(
        err.response?.data?.detail ||
        "Couldn’t save that job — it’s back, try again.",
        "error"
      );
    } finally {
      inFlightJobIds.current.delete(jobId);
    }

    return true;
  };

  return (
    <div className="px-8 py-10">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      <div className="mb-8">
        <p className="text-xs font-bold tracking-widest text-sx-primary">
          SWIPEX INTELLIGENCE
        </p>
        <h1 className="mt-2 text-3xl font-bold text-sx-text">
          AI Recommendations
        </h1>
        <p className="mt-1 text-sm text-sx-text-secondary">
          Your strongest matches, ranked by your profile and resume. Swipe or
          save a job to move it out of the current recommendation deck.
        </p>
      </div>

      {loading && (
        <div className="mx-auto max-w-lg rounded-2xl border border-sx-border bg-sx-card px-8 py-14 text-center shadow-sm">
          <h2 className="text-lg font-bold text-sx-text">
            Finding your best matches...
          </h2>
        </div>
      )}

      {!loading && error && (
        <div className="mx-auto max-w-lg rounded-2xl border border-sx-border bg-sx-card px-8 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sx-bg-soft text-2xl text-sx-primary">
            <FaExclamationTriangle />
          </div>
          <h2 className="mt-4 text-lg font-bold text-sx-text">
            {error.toLowerCase().includes("resume")
              ? "Upload your resume first"
              : error.toLowerCase().includes("profile")
                ? "Complete your profile first"
                : "Something went wrong"}
          </h2>
          <p className="mt-1 text-sm text-sx-text-secondary">{error}</p>
          <button
            type="button"
            onClick={() =>
              navigate(
                error.toLowerCase().includes("swipe")
                  ? "/candidate/jobs"
                  : error.toLowerCase().includes("resume")
                    ? "/candidate/resume"
                    : {
                      pathname: "/candidate/settings/profile",
                      state: { returnTo: location.pathname },
                    }
              )
            }
            className="mt-5 rounded-lg bg-sx-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sx-primary-dark"
          >
            {error.toLowerCase().includes("resume")
              ? "Upload Resume"
              : "Update Profile"}
          </button>
        </div>
      )}

      {!loading && !error && (
        <SwipeDeck
          jobs={jobs}
          onSwipe={handleSwipe}
          onSave={handleSave}
          savedJobs={savedJobIds}
          actionLoading={false}
          onViewDetails={setSelectedJob}
          onSwipeCommit={handleSwipeCommit}
        />
      )}

      <JobDetailsModal
        key={selectedJob?.job_id || "empty"}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}

export default AIRecommendations;
