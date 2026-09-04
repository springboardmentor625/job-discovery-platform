import MatchScoreRing from "../MatchScoreRing";

// ==========================================
// RECOMMENDED
//
// Presents the strongest recommendation results.
// The match score shown here is the authoritative
// 70% skills + 20% experience + 10% role relevance
// score returned by the backend.
//
// Detailed scoring diagnostics stay out of this
// page so the experience stays focused on the jobs.
// ==========================================

function Recommended({ jobs, onSave, onViewDetails, savedJobs }) {
  // Always show the top 10 recommendations. If fewer than
  // 10 clear the high-confidence threshold, fill the list
  // with the best remaining jobs so the dashboard is useful.
  const rankedJobs = [...(jobs || [])].sort(
    (a, b) => (b.match_score || 0) - (a.match_score || 0)
  );

  const highConfidence = rankedJobs.filter(
    (job) => (job.match_score || 0) >= 80
  );

  const recommended = [
    ...highConfidence,
    ...rankedJobs.filter(
      (job) => !highConfidence.some((match) => match.job_id === job.job_id)
    ),
  ].slice(0, 10);

  const averageScore =
    recommended.length > 0
      ? recommended.reduce(
          (sum, job) => sum + (job.match_score || 0),
          0
        ) / recommended.length
      : 0;

  if (recommended.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-sx-border bg-sx-card px-8 py-14 text-center shadow-sm">
        <h2 className="text-lg font-bold text-sx-text">
          No recommendations yet
        </h2>
        <p className="mt-1 text-sm text-sx-text-secondary">
          Complete your profile and resume so SwipeX can find strong matches
          for you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sx-border bg-sx-card p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sx-primary">
              TOP MATCHES
            </p>
            <h2 className="mt-1 text-2xl font-bold text-sx-text">
              Recommended for you
            </h2>
            <p className="mt-1 text-sm text-sx-text-secondary">
              Ranked using your skills, experience, and preferred role.
            </p>
          </div>

          <div className="rounded-xl bg-sx-bg-soft px-4 py-3 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sx-text-muted">
              Average match
            </p>
            <p className="mt-0.5 text-2xl font-bold text-sx-text">
              {Math.round(averageScore)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {recommended.map((job) => {
          const isSaved = savedJobs.has(job.job_id);

          return (
            <article
              key={job.job_id}
              className="flex min-h-[250px] flex-col rounded-2xl border border-sx-border bg-sx-card p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <MatchScoreRing score={job.match_score} size={64} />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-sx-text-secondary">
                    {job.company || "Company"}
                  </p>
                  <h3 className="mt-1 text-lg font-bold leading-snug text-sx-text">
                    {job.title || "Untitled Job"}
                  </h3>

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
                  onClick={() => onSave(job.job_id)}
                  className={`flex-shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    isSaved
                      ? "border-sx-primary-light bg-sx-primary-soft text-sx-primary-dark"
                      : "border-sx-border bg-sx-bg-soft text-sx-text-secondary hover:bg-sx-primary-soft hover:text-sx-primary-dark"
                  }`}
                >
                  {isSaved ? "Saved" : "Save"}
                </button>
              </div>

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => onViewDetails(job)}
                  className="block w-full rounded-lg border border-sx-border bg-sx-bg-soft py-2.5 text-center text-sm font-semibold text-sx-primary-dark transition hover:bg-sx-primary-soft"
                >
                  View Job Details
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default Recommended;
