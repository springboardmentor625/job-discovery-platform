import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHistory } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa";
import api from "../../api";
import JobDetailsModal from "../JobDetailsModal";

function SwipeHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.get("/api/swipes/history");
        setHistory(response.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || "Unable to load swipe history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const changeSwipe = async (swipe, action) => {
    if (swipe.action === action || updatingId !== null) {
      return;
    }

    setUpdatingId(swipe.swipe_id);
    setError("");

    try {
      await api.post("/api/swipes", {
        job_id: swipe.job_id,
        action: action === "like" ? "right" : "left",
        match_score: swipe.match_score,
      });

      setHistory((previous) =>
        previous.map((item) =>
          item.swipe_id === swipe.swipe_id ? { ...item, action } : item
        )
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update swipe.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="px-6 py-10">
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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sx-primary-soft text-sx-primary-dark">
            <FaHistory />
          </div>
          <div>
            <h2 className="text-lg font-bold text-sx-text">Swipe History</h2>
            <p className="text-sm text-sx-text-secondary">
              Change a previous like or reject at any time.
            </p>
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

              return (
                <div
                  key={swipe.swipe_id}
                  className="flex flex-col rounded-xl border border-sx-border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-sx-text">
                        {swipe.title}
                      </h3>
                      <p className="mt-1 text-xs text-sx-text-secondary">
                        {swipe.company} · {swipe.location || "Location not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-4">
                    <label
                      className="sr-only"
                      htmlFor={`swipe-action-${swipe.swipe_id}`}
                    >
                      Change swipe decision for {swipe.title}
                    </label>
                    <select
                      id={`swipe-action-${swipe.swipe_id}`}
                      value={swipe.action}
                      onChange={(event) => changeSwipe(swipe, event.target.value)}
                      disabled={updatingId !== null}
                      className={`w-28 rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        liked
                          ? "border-sx-success-border bg-sx-success-bg text-sx-success"
                          : "border-sx-danger-border bg-sx-danger-bg text-sx-danger"
                      }`}
                    >
                      <option value="like">Like</option>
                      <option value="reject">Reject</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSelectedJob(swipe)}
                      className="rounded-lg border border-sx-border px-2.5 py-1.5 text-xs font-semibold text-sx-primary-dark transition hover:border-sx-primary hover:bg-sx-primary-soft"
                    >
                      View job details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </section>

        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      </div>
    </div>
  );
}

export default SwipeHistory;
