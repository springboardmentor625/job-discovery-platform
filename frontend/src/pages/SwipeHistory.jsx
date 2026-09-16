import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaHistory,
  FaMapMarkerAlt,
  FaCheck,
  FaBookmark,
  FaTimes,
  FaSync,
  FaCompass,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import JobDetailsModal from "../components/JobDetailsModal";

function SwipeHistory() {
  const navigate = useNavigate();
  const [swipes, setSwipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'interested' | 'saved' | 'skipped'
  const [selectedJob, setSelectedJob] = useState(null);
  const [removingSwipeId, setRemovingSwipeId] = useState(null);

  const fetchSwipes = async () => {
    try {
      setLoading(true);
      const url = filter === "all" ? "swipes/" : `swipes/?decision=${filter}`;
      const res = await api.get(url);
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
        ? res.data.results
        : [];
      setSwipes(data);
    } catch (error) {
      console.error("Swipes error:", error);
      toast.error("Unable to load swipe history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleRemoveSwipe = async (e, swipe) => {
    e.stopPropagation();
    const jobTitle = swipe.job?.title || "this job";
    const confirmed = window.confirm(
      `Remove this swipe on "${jobTitle}"? The job will be eligible to appear again in recommendations.`
    );
    if (!confirmed) return;

    try {
      setRemovingSwipeId(swipe.id);
      await api.delete(`swipes/${swipe.id}/`);
      setSwipes((prev) => prev.filter((s) => s.id !== swipe.id));
      toast.success("Swipe removed. The job can appear again in recommendations.");
    } catch (error) {
      console.error("Failed to remove swipe:", error);
      toast.error(error.response?.data?.detail || "Unable to remove swipe.");
    } finally {
      setRemovingSwipeId(null);
    }
  };

  const getDecisionBadge = (decision) => {
    const d = (decision || "").toLowerCase();
    if (d === "interested" || d === "right") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <FaCheck className="text-[10px]" /> Interested
        </span>
      );
    }
    if (d === "saved") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <FaBookmark className="text-[10px]" /> Saved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <FaTimes className="text-[10px]" /> Skipped
      </span>
    );
  };

  const getEmptyMessage = () => {
    if (filter === "interested") {
      return {
        title: "No Interested Jobs",
        desc: "You haven't marked any jobs as Interested yet. Explore recommendations and mark jobs you'd like to pursue.",
      };
    }
    if (filter === "saved") {
      return {
        title: "No Saved Jobs",
        desc: "You haven't saved any jobs yet. Save jobs during recommendations or search to review them later.",
      };
    }
    if (filter === "skipped") {
      return {
        title: "No Skipped Jobs",
        desc: "You haven't skipped any jobs yet.",
      };
    }
    return {
      title: "No Swipe History Yet",
      desc: "Start exploring and swiping job opportunities in Recommendations to build your personalized discovery history.",
    };
  };
  const handleUnsaveSuccess = (jobId) => {
  setSwipes((prev) =>
    prev.filter(
      (swipe) =>
        !(swipe.job?.id === jobId && swipe.decision === "saved")
    )
  );

  setSelectedJob((prev) =>
    prev ? { ...prev, is_saved: false } : prev
  );
};

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FaHistory className="text-indigo-600" /> Swipe History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your interested, saved, and skipped career opportunities.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSwipes}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shrink-0"
        >
          <FaSync /> Refresh
        </button>
      </div>

      {/* FILTER TABS (All, Interested, Saved, Skipped) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "All" },
          { id: "interested", label: "Interested" },
          { id: "saved", label: "Saved" },
          { id: "skipped", label: "Skipped" },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`
                px-5 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0
                ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-8 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : swipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {swipes.map((swipe, idx) => {
            const job = swipe.job || {};
            const swipeDate = swipe.created_at
              ? new Date(swipe.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "";

            return (
              <div
                key={swipe.id || idx}
                onClick={() => setSelectedJob(job)}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer p-6 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* TOP ROW: COMPANY, ROLE */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-base shrink-0 border border-indigo-100">
                        {job.company ? job.company.charAt(0).toUpperCase() : "C"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">
                          {job.title || "Job Title"}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                          {job.company}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* LOCATION & WORK MODE */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 truncate">
                      <FaMapMarkerAlt className="text-slate-400 shrink-0" />
                      <span className="truncate">{job.location || "Remote"}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      {job.work_mode || "On-site"}
                    </span>
                    {job.employment_type && (
                      <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 font-bold text-[10px]">
                        {job.employment_type}
                      </span>
                    )}
                  </div>

                  {/* METRICS */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Salary</p>
                      <p className="font-semibold text-slate-800 truncate mt-0.5">
                        {job.salary &&
                        !["competitive", "nan", "none", "null", "not specified"].includes(
                          String(job.salary).toLowerCase().trim()
                        )
                          ? job.salary
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">ATS Score</p>
                      <p className="font-bold text-indigo-600 truncate mt-0.5">
                        {job.ats_score ? `${job.ats_score}%` : "Analyzed"}
                      </p>
                    </div>
                  </div>

                  {/* SHORT DESCRIPTION */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description || "Click to view full job description and requirements."}
                  </p>
                </div>

                {/* BOTTOM FOOTER: DECISION BADGE, DATE & REMOVE SWIPE */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getDecisionBadge(swipe.decision)}
                    {swipeDate && (
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        {swipeDate}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleRemoveSwipe(e, swipe)}
                    disabled={removingSwipeId === swipe.id}
                    className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    title="Remove this swipe to allow job to reappear in recommendations"
                  >
                    {removingSwipeId === swipe.id ? "Removing..." : "Remove Swipe"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* EMPTY STATE PER TAB */
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
            <FaHistory />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            {getEmptyMessage().title}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {getEmptyMessage().desc}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate("/recommendations")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
            >
              <FaCompass /> Go to Recommendations
            </button>
          </div>
        </div>
      )}

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUnsaveSuccess={handleUnsaveSuccess}
        />
      )}
    </div>
  );
}

export default SwipeHistory;
