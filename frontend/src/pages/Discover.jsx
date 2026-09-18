import { useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import useSavedJobs from "../hooks/useSavedJobs";
import Toast from "../components/Toast";
import useAllJobs from "../hooks/useAllJobs";
import JobDetailsModal from "../components/JobDetailsModal";

// DISCOVER now uses the former AI Recommendations visual presentation.
// The data source remains useAllJobs(), so this page still shows the
// complete active-job listing rather than personalized AI scores.
function Discover() {
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [searchQuery, setSearchQuery] = useState("");

  const showToast = (message, type = "success") => setToast({ message, type });
  const closeToast = () => setToast({ message: "", type: "success" });

  const {
    jobs,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    totalActiveJobs,
    remainingUnswiped,
  } = useAllJobs();
  const { savedJobIds, isSaved, toggleSave } = useSavedJobs();

  const handleSave = async (job) => {
    if (actionLoading) return;

    const jobId = job.job_id;
    const currentlySaved = isSaved(jobId);
    setActionLoading(true);

    try {
      await toggleSave(jobId, job);
      showToast(
        currentlySaved ? "Removed from saved jobs." : "Job saved.",
        currentlySaved ? "info" : "success"
      );
    } catch (err) {
      console.error("Save job error:", err);
      showToast(err.response?.data?.detail || "Unable to save job.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Client-side filtering — instant, no extra API call.
  const filteredJobs = searchQuery.trim()
    ? jobs.filter((job) => {
        const q = searchQuery.trim().toLowerCase();
        return [
          job.title,
          job.company,
          job.location,
          job.employment_type,
          job.experience_required,
          job.skills,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
    : jobs;

  if (loading) {
    return (
      <div className="px-8 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-sx-border bg-sx-card px-8 py-14 text-center shadow-sm">
          <h2 className="text-lg font-bold text-sx-text">Loading jobs...</h2>
          <p className="mt-1 text-sm text-sx-text-secondary">
            Finding available jobs for you.
          </p>
        </div>
      </div>
    );
  }

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
            type="button"
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

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-sx-primary">
            SWIPEX DISCOVERY
          </p>
          <h1 className="mt-2 text-3xl font-bold text-sx-text">Discover</h1>
          <p className="mt-1 text-sm text-sx-text-secondary">
            Browse all active jobs and save the opportunities you want to explore.
          </p>
        </div>

        {totalActiveJobs !== null && (
          <div className="flex items-center gap-2 rounded-lg border border-sx-border bg-sx-card px-3 py-1.5 shadow-sm">
            <span className="text-base font-extrabold leading-none text-sx-primary-dark">
              {totalActiveJobs.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide text-sx-text-muted">
              Active Jobs
            </span>
          </div>
        )}
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sx-text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            id="discover-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, company, location, skills…"
            className="w-full rounded-xl border border-sx-border bg-sx-card py-2.5 pl-10 pr-10 text-sm text-sx-text placeholder-sx-text-muted shadow-sm outline-none transition focus:border-sx-primary focus:ring-2 focus:ring-sx-primary/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sx-text-muted transition hover:text-sx-text"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery.trim() && (
          <span className="whitespace-nowrap rounded-full border border-sx-border bg-sx-card px-3 py-1 text-xs font-semibold text-sx-text-secondary shadow-sm">
            {filteredJobs.length} result{filteredJobs.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {filteredJobs.length === 0 && searchQuery.trim() && (
        <div className="mb-6 rounded-xl border border-sx-border bg-sx-card px-6 py-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-sx-text">No jobs match this search</p>
          <p className="mt-1 text-xs text-sx-text-muted">
            Try a different keyword or{" "}
            <button type="button" onClick={() => setSearchQuery("")} className="text-sx-primary underline">
              clear the search
            </button>
            .
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredJobs.map((job) => {
          const jobSaved = savedJobIds.has(job.job_id);

          return (
            <article
              key={job.job_id}
              className="flex min-h-[250px] flex-col rounded-2xl border border-sx-border bg-sx-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sx-primary text-lg font-bold text-white">
                  {(job.company || job.title || "J").charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-sx-text-secondary">
                    {job.company || "Company"}
                  </p>
                  <h2 className="mt-1 text-lg font-bold leading-snug text-sx-text">
                    {job.title || "Untitled Job"}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-sx-text-secondary">
                    {job.location && (
                      <span className="rounded-full bg-sx-bg-soft px-2.5 py-1">
                        {job.location}
                      </span>
                    )}
                    {job.employment_type && (
                      <span className="rounded-full bg-sx-bg-soft px-2.5 py-1">
                        {job.employment_type}
                      </span>
                    )}
                    {job.experience_required && (
                      <span className="rounded-full bg-sx-bg-soft px-2.5 py-1">
                        {job.experience_required}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSave(job)}
                  disabled={actionLoading}
                  className={`flex-shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    jobSaved
                      ? "border-sx-primary-light bg-sx-primary-soft text-sx-primary-dark"
                      : "border-sx-border bg-sx-bg-soft text-sx-text-secondary hover:bg-sx-primary-soft hover:text-sx-primary-dark"
                  }`}
                >
                  {jobSaved ? "Saved" : "Save"}
                </button>
              </div>

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => setSelectedJob(job)}
                  className="block w-full rounded-lg border border-sx-border bg-sx-bg-soft py-2.5 text-center text-sm font-semibold text-sx-primary-dark transition hover:bg-sx-primary-soft"
                >
                  View Job Details
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {jobs.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-xs text-sx-text-muted">
            {searchQuery.trim()
              ? `${filteredJobs.length} match${filteredJobs.length !== 1 ? "es" : ""} out of ${jobs.length.toLocaleString()} loaded jobs`
              : `Showing ${jobs.length.toLocaleString()} of ${(remainingUnswiped ?? totalActiveJobs ?? jobs.length).toLocaleString()} available jobs`}
          </p>
          {hasMore && !searchQuery.trim() && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-lg border border-sx-border bg-sx-card px-5 py-2 text-sm font-semibold text-sx-primary-dark shadow-sm transition hover:bg-sx-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? "Loading more jobs..." : "Load More Jobs"}
            </button>
          )}
        </div>
      )}

      <JobDetailsModal
        key={selectedJob?.job_id || "empty"}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}

export default Discover;
