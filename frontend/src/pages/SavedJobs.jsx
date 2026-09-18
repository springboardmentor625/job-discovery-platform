import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRegBookmark,
  FaBookmark,
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaHeart,
  FaTimes,
} from "react-icons/fa";
import useSavedJobs from "../hooks/useSavedJobs";
import Toast from "../components/Toast";
import JobDetailsModal from "../components/JobDetailsModal";
import api, { clearAuth } from "../api";

function SavedJobs() {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const { savedJobs, loading, error, removeJob } = useSavedJobs();
  const [removingId, setRemovingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  // Job pending a like/reject decision. Taking a saved job out of this list
  // means finally deciding on it, so instead of a plain "remove", we ask
  // whether it should count as a like or a reject.
  const [confirmJob, setConfirmJob] = useState(null);

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
  // REMOVE = FINAL LIKE/REJECT DECISION
  // ==========================================
  // Taking a job out of Saved isn't a neutral delete — it means the
  // candidate is done deciding on it. So instead of just unsaving it, we
  // record the actual swipe decision (like or reject) via the same
  // endpoint the swipe deck uses, then take it out of the saved list.

  const decideJob = async (jobId, direction) => {
    if (removingId !== null) {
      return;
    }

    setRemovingId(jobId);
    try {
      // ======================================
      // RECORD THE LIKE/REJECT SWIPE
      // ======================================

      await api.post("/api/swipes", {
        job_id: jobId,
        action: direction, // "right" = like, "left" = reject
        calculate_match_score: false,
      });

      // ======================================
      // TAKE IT OUT OF SAVED JOBS
      // ======================================

      await removeJob(jobId);

      // ======================================
      // SWIPEX SUCCESS NOTIFICATION
      // ======================================

      showToast(
        direction === "right"
          ? "Marked as liked and moved out of saved jobs."
          : "Marked as rejected and moved out of saved jobs.",
        direction === "right" ? "success" : "info"
      );
    } catch (err) {
      console.error("SwipeX saved job decision error:", err);

      // ======================================
      // AUTH ERROR
      // ======================================

      if (err.response?.status === 401) {
        clearAuth();
        navigate("/login");
        return;
      }

      // ======================================
      // ERROR MESSAGE
      // ======================================

      const errorMessage =
        err.response?.data?.detail || "Unable to update this job.";

      // ======================================
      // SWIPEX ERROR NOTIFICATION
      // ======================================

      showToast(errorMessage, "error");
    } finally {
      setRemovingId(null);
    }
  };

  // ==========================================
  // DECISION CONFIRMATION
  // ==========================================
  // "Remove" opens a confirmation dialog asking whether the job should
  // be marked liked or rejected, instead of deleting it silently.

  const requestRemove = (job) => {
    if (removingId !== null) return;
    setConfirmJob(job);
  };

  const cancelRemove = () => setConfirmJob(null);

  const confirmDecision = async (direction) => {
    if (!confirmJob) return;
    const jobId = confirmJob.job_id;
    setConfirmJob(null);
    await decideJob(jobId, direction);
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
    <div className="px-8 py-10">
      {/* =====================================
          SWIPEX TOAST
      ====================================== */}

      <Toast message={toast.message} type={toast.type} onClose={closeToast} />

      <div className="mx-auto max-w-6xl">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-sx-text">Saved Jobs</h1>
            <p className="mt-1 text-sm text-sx-text-secondary">
              Jobs you've saved for later.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-sx-border bg-sx-card px-2 py-1 shadow-sm sm:ml-auto">
            <div className="text-sm font-extrabold leading-none text-sx-primary-dark">
              {savedJobs.length}
            </div>
            <div className="text-[8px] font-bold uppercase tracking-wide text-sx-text-muted">
              Total Saved Jobs
            </div>
          </div>
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
                    onClick={() => requestRemove(job)}
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
        key={selectedJob?.job_id || "empty"}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />

      {/* =====================================
          LIKE / REJECT DECISION DIALOG
      ====================================== */}

      {confirmJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={cancelRemove}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-sx-border bg-sx-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-sx-text">
              Like or reject this job?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-sx-text-secondary">
              <strong className="text-sx-text">
                {confirmJob.title || "This job"}
              </strong>
              {confirmJob.company ? ` at ${confirmJob.company}` : ""} will be
              taken off your saved list either way — pick whether it counts
              as a like or a reject.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => confirmDecision("left")}
                disabled={removingId === confirmJob.job_id}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sx-danger-border bg-sx-danger-bg px-3 py-2.5 text-sm font-semibold text-sx-danger transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaTimes className="text-xs" /> Reject
              </button>
              <button
                type="button"
                onClick={() => confirmDecision("right")}
                disabled={removingId === confirmJob.job_id}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sx-success px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaHeart className="text-xs" /> Like
              </button>
            </div>

            <button
              type="button"
              onClick={cancelRemove}
              disabled={removingId === confirmJob.job_id}
              className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold text-sx-text-secondary transition hover:text-sx-text disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SavedJobs;
