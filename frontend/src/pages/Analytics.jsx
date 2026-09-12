import { useEffect, useState } from "react";
import { fetchAnalyticsSummary } from "../services/api";

const STATUS_LABELS = {
  saved: "Saved", applied: "Applied", interview: "Interview",
  shortlisted: "Shortlisted", rejected: "Rejected",
};

const DIRECTION_LABELS = { left: "Skipped", save: "Saved", right: "Applied" };

function BarRow({ label, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-ink">{label}</span>
        <span className="text-slate">{count}</span>
      </div>
      <div className="h-2 bg-line rounded-full overflow-hidden">
        <div className="h-full bg-cobalt-600 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsSummary().then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-slate">Loading...</div>;
  }

  if (!data) {
    return <div className="flex-1 flex items-center justify-center text-slate">Couldn't load analytics.</div>;
  }

  const statusEntries = Object.entries(data.applications_by_status || {});
  const directionEntries = Object.entries(data.swipes_by_direction || {});
  const maxStatus = Math.max(1, ...statusEntries.map(([, c]) => c));
  const maxDirection = Math.max(1, ...directionEntries.map(([, c]) => c));
  const maxSkill = Math.max(1, ...(data.top_skills_in_your_applications || []).map((s) => s.count));

  return (
    <div className="flex-1 px-6 sm:px-10 py-14 max-w-3xl mx-auto w-full">
      <h1 className="font-display text-3xl font-semibold text-ink mb-1">Your analytics</h1>
      <p className="text-slate mb-8">A real read on your job search so far.</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <div className="border border-line rounded-2xl bg-white p-5">
          <p className="text-xs text-slate mb-1">Average match score</p>
          <p className="font-display text-3xl font-semibold text-cobalt-600">
            {data.average_match_score !== null ? `${data.average_match_score}%` : "—"}
          </p>
        </div>
        <div className="border border-line rounded-2xl bg-white p-5">
          <p className="text-xs text-slate mb-1">Applications sent</p>
          <p className="font-display text-3xl font-semibold text-ink">
            {statusEntries.reduce((sum, [, c]) => sum + c, 0)}
          </p>
        </div>
        <div className="border border-line rounded-2xl bg-white p-5">
          <p className="text-xs text-slate mb-1">Jobs on platform</p>
          <p className="font-display text-3xl font-semibold text-ink">
            {data.total_jobs_in_platform}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Application funnel</h2>
          {statusEntries.length === 0 ? (
            <p className="text-sm text-slate">No applications yet.</p>
          ) : (
            statusEntries.map(([status, count]) => (
              <BarRow key={status} label={STATUS_LABELS[status] || status} count={count} max={maxStatus} />
            ))
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Swipe activity</h2>
          {directionEntries.length === 0 ? (
            <p className="text-sm text-slate">No swipes yet.</p>
          ) : (
            directionEntries.map(([direction, count]) => (
              <BarRow key={direction} label={DIRECTION_LABELS[direction] || direction} count={count} max={maxDirection} />
            ))
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink mb-4">
          Most common skills in jobs you've applied to
        </h2>
        {(!data.top_skills_in_your_applications || data.top_skills_in_your_applications.length === 0) ? (
          <p className="text-sm text-slate">Apply to a few jobs to see this.</p>
        ) : (
          data.top_skills_in_your_applications.map(({ skill, count }) => (
            <BarRow key={skill} label={skill} count={count} max={maxSkill} />
          ))
        )}
      </div>
    </div>
  );
}