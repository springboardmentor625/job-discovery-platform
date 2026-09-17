import { useEffect, useState } from "react";
import { Briefcase, MapPin, Heart, Bookmark, X } from "lucide-react";
import { fetchApplications, submitSwipe } from "../services/api";
import Avatar from "../components/Avatar";
import { SkeletonList } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

const STATUS_STYLES = {
  saved: "bg-amber-50 text-amber-700",
  interested: "bg-violet-50 text-violet-700",
  skipped: "bg-gray-100 text-muted",
  interview: "bg-blue-50 text-blue-700",
  shortlisted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const FILTER_TABS = [
  { value: "", label: "All" },
  { value: "saved", label: "Saved" },
  { value: "interested", label: "Interested" },
  { value: "skipped", label: "Skipped" },
];

// The three swipe-controlled statuses, and the button that represents each
// one. Every row in one of these statuses shows all three buttons in the
// same order, with whichever one matches the row's current status shown as
// active/disabled instead of being hidden — so every row has an identical
// layout, and only the highlighting changes.
const SWIPE_ACTIONS = [
  { status: "skipped", direction: "left", icon: X, label: "Skip" },
  { status: "saved", direction: "save", icon: Bookmark, label: "Save" },
  { status: "interested", direction: "right", icon: Heart, label: "Interested" },
];
const SWIPE_STATUSES = SWIPE_ACTIONS.map((a) => a.status);

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const load = () => {
    setLoading(true);
    fetchApplications(filter || undefined).then(({ data }) => setApplications(data)).finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const handleAction = async (jobId, direction) => {
    setActioningId(jobId);
    try {
      await submitSwipe(jobId, direction);
      load();
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="px-8 sm:px-12 py-12">
      <h1 className="font-display text-3xl font-bold text-ink mb-1">Your applications</h1>
      <p className="text-muted mb-6">Every job you've saved, liked, or skipped.</p>

      <div className="flex gap-2 mb-6">
        {FILTER_TABS.map((t) => (
          <button
            key={t.value || "all"}
            onClick={() => setFilter(t.value)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === t.value ? "bg-violet-600 text-white" : "bg-white border border-line text-muted hover:border-violet-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : applications.length === 0 ? (
        <EmptyState icon={Briefcase} title="Nothing here yet" description="Go swipe on some jobs to start tracking applications." />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const canAct = SWIPE_STATUSES.includes(app.status);
            return (
              <div key={app.id} className="bg-white border border-line rounded-xl p-4 flex items-center gap-3">
                <Avatar name={app.job.company} size={44} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-ink truncate">{app.job.title}</h3>
                  <p className="text-sm text-muted flex items-center gap-1">
                    {app.job.company} <span className="mx-0.5">·</span> <MapPin size={12} /> {app.job.location || "Not specified"}
                  </p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize shrink-0 w-28 text-center ${STATUS_STYLES[app.status] || "bg-gray-50 text-muted"}`}>
                  {app.status}
                </span>
                {canAct && (
                  <div className="flex items-center gap-1 shrink-0 border-l border-line pl-3 ml-1">
                    {SWIPE_ACTIONS.map(({ status, direction, icon: Icon, label }) => {
                      const isCurrent = app.status === status;
                      return (
                        <button
                          key={status}
                          onClick={() => !isCurrent && handleAction(app.job.id, direction)}
                          disabled={isCurrent || actioningId === app.job.id}
                          title={isCurrent ? `Currently ${label.toLowerCase()}` : label}
                          className={`p-2 rounded-lg transition-colors disabled:cursor-default ${isCurrent ? "bg-gray-100 text-ink" : "text-muted hover:text-ink hover:bg-paper"} ${actioningId === app.job.id ? "opacity-40" : ""}`}
                        >
                          <Icon size={16} fill={isCurrent ? "currentColor" : "none"} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}