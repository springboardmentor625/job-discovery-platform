import { useEffect, useState } from "react";
import { fetchApplications } from "../services/api";

const STATUS_STYLES = {
  saved: "bg-yellow-50 text-yellow-700",
  applied: "bg-brand-50 text-brand-700",
  interview: "bg-blue-50 text-blue-700",
  shortlisted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchApplications(filter || undefined)
      .then(({ data }) => setApplications(data))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Your applications</h1>
      <p className="text-gray-500 mb-6">Jobs you've saved or applied to.</p>

      <div className="flex gap-2 mb-6">
        {["", "saved", "applied"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm capitalize transition ${
              filter === s
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : applications.length === 0 ? (
        <p className="text-gray-400">Nothing here yet — go swipe on some jobs.</p>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{app.job.title}</h3>
                <p className="text-sm text-gray-500">
                  {app.job.company} · {app.job.location || "Location N/A"}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                  STATUS_STYLES[app.status] || "bg-gray-100 text-gray-600"
                }`}
              >
                {app.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}