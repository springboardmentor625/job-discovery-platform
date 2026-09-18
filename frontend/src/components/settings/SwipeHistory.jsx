import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHistory, FaArrowLeft, FaChevronDown } from "react-icons/fa";
import api from "../../api";
import JobDetailsModal from "../JobDetailsModal";
import Toast from "../Toast";

// Swipe History is intentionally a normal list.
// The current swipe state can be changed with a dropdown;
// there is no drag/swipe interaction on this page.
function SwipeHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.get("/api/swipes/history");
        setHistory(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err.response?.data?.detail || "Unable to load swipe history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const changeSwipe = async (swipe, nextAction) => {
    if (!nextAction || swipe.action === nextAction || updatingId !== null) {
      return;
    }

    setUpdatingId(swipe.swipe_id);
    setError("");

    try {
      await api.post("/api/swipes", {
        job_id: swipe.job_id,
        action: nextAction === "like" ? "right" : "left",
        match_score: swipe.match_score,
        calculate_match_score: false,
      });

      setHistory((previous) =>
        previous.map((item) =>
          item.swipe_id === swipe.swipe_id
            ? { ...item, action: nextAction }
            : item
        )
      );

      setToast({
        message:
          nextAction === "like"
            ? "Job marked as liked."
            : "Job marked as rejected.",
        type: "success",
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update job state.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="px-8 py-10">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/candidate/settings")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-sx-primary-dark hover:underline"
        >
          <FaArrowLeft />
          Back to Settings
        </button>

        <section className="rounded-2xl border border-sx-border bg-sx-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sx-primary-soft text-sx-primary-dark">
                <FaHistory />
              </div>
              <div>
                <h2 className="text-lg font-bold text-sx-text">Swipe History</h2>
                <p className="mt-1 text-sm text-sx-text-secondary">
                  Your current state is shown first. Use the arrow to switch to the opposite action.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-md border border-sx-border bg-sx-bg-soft px-2 py-1 sm:ml-auto">
              <div className="text-sm font-extrabold leading-none text-sx-primary-dark">
                {history.length}
              </div>
              <div className="text-[8px] font-bold uppercase tracking-wide text-sx-text-muted">
                Total Swipes
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-sx-danger-border bg-sx-danger-bg px-4 py-3 text-sm text-sx-danger">
              {error}
            </div>
          )}

          {loading && (
            <p className="mt-6 text-sm text-sx-text-secondary">
              Loading swipe history...
            </p>
          )}

          {!loading && history.length === 0 && (
            <p className="mt-6 rounded-lg bg-sx-bg-soft px-4 py-5 text-sm text-sx-text-secondary">
              Your swipe history will appear here after you review jobs.
            </p>
          )}

          {!loading && history.length > 0 && (
            <div className="mt-5 space-y-3">
              {history.map((swipe) => {
                const liked = swipe.action === "like";
                const disabled = updatingId !== null && updatingId !== swipe.swipe_id;
                const oppositeAction = liked ? "reject" : "like";
                const isMenuOpen = openMenuId === swipe.swipe_id;

                return (
                  <div
                    key={swipe.swipe_id}
                    className="flex flex-col gap-4 rounded-xl border border-sx-border bg-sx-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedJob(swipe)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sx-primary-soft text-sm font-extrabold uppercase text-sx-primary-dark">
                          {(swipe.company || swipe.title || "J").charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-sx-text">
                            {swipe.title || "Untitled Job"}
                          </h3>
                          <p className="mt-1 truncate text-xs text-sx-text-secondary">
                            {swipe.company || "Company"} ·{" "}
                            {swipe.location || "Location not specified"}
                          </p>
                        </div>
                      </div>
                    </button>

                    <div className="relative flex flex-shrink-0 items-center">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : swipe.swipe_id)}
                          disabled={disabled || updatingId === swipe.swipe_id}
                          className={`flex min-w-[104px] items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            liked
                              ? "border-sx-success-border bg-sx-success-bg text-sx-success hover:brightness-95"
                              : "border-sx-danger-border bg-sx-danger-bg text-sx-danger hover:brightness-95"
                          }`}
                          aria-expanded={isMenuOpen}
                          aria-haspopup="menu"
                          aria-label={`Current state: ${liked ? "Liked" : "Rejected"}. Change state.`}
                        >
                          <span>{liked ? "Liked" : "Rejected"}</span>
                          <FaChevronDown className={`text-xs transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-[calc(100%+4px)] z-30 min-w-[104px] overflow-hidden rounded-lg border border-sx-border bg-sx-card p-0.5 shadow-md">
                            <button
                              type="button"
                              role="menuitem"
                              disabled={disabled || updatingId === swipe.swipe_id}
                              onClick={() => {
                                setOpenMenuId(null);
                                changeSwipe(swipe, oppositeAction);
                              }}
                              className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs font-bold transition disabled:opacity-50 ${
                                oppositeAction === "like"
                                  ? "text-sx-success hover:bg-sx-success-bg"
                                  : "text-sx-danger hover:bg-sx-danger-bg"
                              }`}
                            >
                              {oppositeAction === "like" ? "Liked" : "Rejected"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <JobDetailsModal
          key={selectedJob?.job_id || "empty"}
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      </div>
    </div>
  );
}

export default SwipeHistory;
