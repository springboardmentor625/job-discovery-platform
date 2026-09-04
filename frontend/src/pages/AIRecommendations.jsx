import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import api from "../api";
import useJobs from "../hooks/useJobs";
import Recommended from "../components/recommendations/Recommended";
import JobDetailsModal from "../components/JobDetailsModal";
import Toast from "../components/Toast";

// ==========================================
// AI RECOMMENDATIONS PAGE
//
// Hosts the "Recommended" experience that used
// to be a mode inside Discover — hero stat,
// score breakdown, and "improve this match"
// tips. Uses the same shared useJobs() hook,
// just as its own page's data source rather
// than one of Discover's three modes.
// ==========================================

function AIRecommendations() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("user_id");

  const [savedJobs, setSavedJobs] = useState(new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const { jobs, loading, error } = useJobs(userId, { limit: 10 });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

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

  const handleSave = async (jobId) => {
    const isSaved = savedJobs.has(jobId);

    showToast(
      isSaved ? "Removed from saved jobs." : "Job saved.",
      isSaved ? "info" : "success"
    );

    try {
      if (isSaved) {
        await api.delete(`/api/saved-jobs/${jobId}`);

        setSavedJobs((previous) => {
          const updated = new Set(previous);
          updated.delete(jobId);
          return updated;
        });
      } else {
        await api.post(`/api/saved-jobs/${jobId}`);

        setSavedJobs((previous) => {
          const updated = new Set(previous);
          updated.add(jobId);
          return updated;
        });
      }
    } catch (err) {
      console.error("Save job error:", err);

      showToast(err.response?.data?.detail || "Unable to save job.", "error");

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");
        navigate("/login");
      }
    }
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
          Your strongest matches, ranked from your profile and preferences.
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
            {error.toLowerCase().includes("swipe")
              ? "Swipe on a few more jobs first"
              : error.toLowerCase().includes("profile")
              ? "Complete your profile first"
              : "Something went wrong"}
          </h2>
          <p className="mt-1 text-sm text-sx-text-secondary">{error}</p>
          <button
            onClick={() =>
              navigate(
                error.toLowerCase().includes("swipe")
                  ? "/candidate/jobs"
                  : {
                      pathname: "/candidate/settings/profile",
                      state: { returnTo: location.pathname },
                    }
              )
            }
            className="mt-5 rounded-lg bg-sx-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sx-primary-dark"
          >
            {error.toLowerCase().includes("swipe")
              ? "Go to Discover"
              : "Update Profile"}
          </button>
        </div>
      )}

      {!loading && !error && (
        <Recommended
          jobs={jobs}
          onSave={handleSave}
          onViewDetails={setSelectedJob}
          savedJobs={savedJobs}
        />
      )}

      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}

export default AIRecommendations;
