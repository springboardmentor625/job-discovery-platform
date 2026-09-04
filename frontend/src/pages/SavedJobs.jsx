import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRegBookmark,
  FaBookmark,
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import api from "../api";
import Toast from "../components/Toast";
import JobDetailsModal from "../components/JobDetailsModal";

function SavedJobs() {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // ==========================================
  // SWIPEX TOAST
  // ==========================================

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  // ==========================================
  // SHOW TOAST
  // ==========================================

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // ==========================================
  // CLOSE TOAST
  // ==========================================

  const closeToast = () => {
    setToast({ message: "", type: "success" });
  };

  // ==========================================
  // LOAD SAVED JOBS
  // ==========================================

  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const response = await api.get("/api/saved-jobs");
        setSavedJobs(response.data || []);
      } catch (err) {
        console.error("SwipeX saved jobs loading error:", err);

        // ======================================
        // AUTH ERROR
        // ======================================

        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user_id");
          localStorage.removeItem("role");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.detail || "Unable to load saved jobs."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSavedJobs();
  }, [navigate]);

  // ==========================================
  // REMOVE SAVED JOB
  // ==========================================

  const handleRemove = async (jobId) => {
    if (removingId !== null) {
      return;
    }

    setRemovingId(jobId);
    setError("");

    try {
      // ======================================
      // DELETE FROM BACKEND
      // ======================================

      await api.delete(`/api/saved-jobs/${jobId}`);

      // ======================================
      // UPDATE FRONTEND
      // ======================================

      setSavedJobs((previousJobs) =>
        previousJobs.filter((job) => job.job_id !== jobId)
      );

      // ======================================
      // SWIPEX SUCCESS NOTIFICATION
      // ======================================

      showToast("Job removed from saved jobs.", "info");
    } catch (err) {
      console.error("SwipeX remove saved job error:", err);

      // ======================================
      // AUTH ERROR
      // ======================================

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");
        navigate("/login");
        return;
      }

      // ======================================
      // ERROR MESSAGE
      // ======================================

      const errorMessage =
        err.response?.data?.detail || "Unable to remove saved job.";

      setError(errorMessage);

      // ======================================
      // SWIPEX ERROR NOTIFICATION
      // ======================================

      showToast(errorMessage, "error");
    } finally {
      setRemovingId(null);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sx-text-secondary">
        Loading your saved jobs...
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="px-6 py-10">
      {/* =====================================
          SWIPEX TOAST
      ====================================== */}

      <Toast message={toast.message} type={toast.type} onClose={closeToast} />

      <div className="mx-auto max-w-6xl">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-sx-primary">
            CANDIDATE WORKSPACE
          </p>

          <h1 className="text-3xl font-bold text-sx-text">Saved Jobs</h1>

          <p className="text-sm text-sx-text-secondary">
            Jobs you've saved for later.
          </p>
        </div>

        {/* ================================= */}
        {/* ERROR */}
        {/* ================================= */}

        {error && (
          <div className="mb-6 rounded-lg border border-sx-danger-border bg-sx-danger-bg px-4 py-3 text-sm text-sx-danger">
            {error}
          </div>
        )}

        {/* ================================= */}
        {/* EMPTY STATE */}
        {/* ================================= */}

        {!error && savedJobs.length === 0 && (
          <div className="mx-auto max-w-lg rounded-2xl border border-sx-border bg-sx-card px-8 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sx-bg-soft text-2xl text-sx-primary">
              <FaRegBookmark />
            </div>
            <h2 className="mt-4 text-lg font-bold text-sx-text">
              No saved jobs yet
            </h2>
            <p className="mt-1 text-sm text-sx-text-secondary">
              Save interesting jobs while discovering opportunities and come
              back to them later.
            </p>
            <button
              type="button"
              onClick={() => navigate("/candidate/jobs")}
              className="mt-5 rounded-lg bg-sx-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sx-primary-dark"
            >
              Discover Jobs
            </button>
          </div>
        )}

        {/* ================================= */}
        {/* SAVED JOBS */}
        {/* ================================= */}

        {savedJobs.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {savedJobs.map((job) => (
              <div
                key={job.saved_job_id}
                className="flex flex-col rounded-2xl border border-sx-border bg-sx-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* ==========================
                    TOP
                =========================== */}

                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sx-bg-soft text-lg text-sx-primary">
                    <FaBriefcase />
                  </div>

                  <span className="flex items-center gap-1.5 rounded-full bg-sx-primary-soft px-3 py-1 text-xs font-semibold text-sx-primary-dark">
                    <FaBookmark className="text-[10px]" /> Saved
                  </span>
                </div>

                {/* ==========================
                    JOB TITLE
                =========================== */}

                <h2 className="text-lg font-bold text-sx-text">
                  {job.title || "Untitled Position"}
                </h2>

                {/* ==========================
                    COMPANY
                =========================== */}

                <h3 className="text-sm text-sx-text-secondary">
                  {job.company || "Company not specified"}
                </h3>

                {/* ==========================
                    DETAILS
                =========================== */}

                <div className="mt-3 flex flex-col gap-1 text-xs text-sx-text-muted">
                  <span className="flex items-center gap-2">
                    <FaMapMarkerAlt />
                    {job.location || "Location not specified"}
                  </span>
                  <span className="flex items-center gap-2">
                    <FaBriefcase />
                    {job.employment_type || "Not specified"}
                  </span>
                  <span className="flex items-center gap-2">
                    <FaMoneyBillWave />
                    {job.salary || "Salary not specified"}
                  </span>
                </div>

                {/* ==========================
                    SKILLS
                =========================== */}

                {job.skills && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills
                      .split(",")
                      .map((skill) => skill.trim())
                      .filter(Boolean)
                      .map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-sx-bg-soft px-2.5 py-1 text-xs font-medium text-sx-text-secondary"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                )}

                {/* ==========================
                    DESCRIPTION
                =========================== */}

                <p className="mt-3 flex-1 text-sm leading-relaxed text-sx-text-secondary">
                  {job.description
                    ? job.description.length > 180
                      ? `${job.description.substring(0, 180)}...`
                      : job.description
                    : "No description available."}
                </p>

                {/* ==========================
                    ACTIONS
                =========================== */}

                <div className="mt-4 flex gap-2">
                  {/* VIEW JOB */}

                  <button
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="flex-1 rounded-lg border border-sx-border bg-sx-bg-soft px-3 py-2 text-sm font-semibold text-sx-primary-dark transition hover:bg-sx-primary-soft"
                  >
                    View Job →
                  </button>

                  {/* REMOVE */}

                  <button
                    type="button"
                    onClick={() => handleRemove(job.job_id)}
                    disabled={removingId === job.job_id}
                    className="rounded-lg border border-sx-danger-border px-3 py-2 text-sm font-semibold text-sx-danger transition hover:bg-sx-danger-bg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {removingId === job.job_id ? "Removing..." : "Remove"}
                  </button>
                </div>

                {/* ==========================
                    SAVED DATE
                =========================== */}

                <small className="mt-3 text-xs text-sx-text-muted">
                  Saved on{" "}
                  {job.saved_at
                    ? new Date(job.saved_at).toLocaleDateString("en-IN")
                    : "N/A"}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>

      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}

export default SavedJobs;
