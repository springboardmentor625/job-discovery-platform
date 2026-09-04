import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Heart,
  X,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  Filter,
  DollarSign
} from "lucide-react";

export default function SwipeHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // "all", "Interested", "Pass"

  useEffect(() => {
    fetchSwipeHistory();
  }, []);

  const fetchSwipeHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch newest-first swipe history (capped at 30)
      const res = await api.get("/swipe-history");
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load swipe history:", err);
      setError("Failed to load swipe history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Recently";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true;
    return item.swipe_action === filter;
  });

  const interestedCount = history.filter((h) => h.swipe_action === "Interested").length;
  const passedCount = history.filter((h) => h.swipe_action === "Pass").length;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Title Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2 border border-blue-500/20">
              <History className="w-3.5 h-3.5" />
              Activity Tracking
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Swipe History
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Review your recent 30 job discovery swipes and interactions.
            </p>
          </div>

          <button
            onClick={() => navigate("/jobs")}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover Jobs</span>
          </button>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Recent Swipes</p>
              <p className="text-xl font-extrabold text-white">{history.length} <span className="text-xs text-slate-500 font-normal">/ 30 max</span></p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Liked / Interested</p>
              <p className="text-xl font-extrabold text-emerald-400">{interestedCount}</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <X className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Passed / Skipped</p>
              <p className="text-xl font-extrabold text-rose-400">{passedCount}</p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filter === "all"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              All Swipes ({history.length})
            </button>

            <button
              onClick={() => setFilter("Interested")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filter === "Interested"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current text-emerald-300" />
              <span>Interested ({interestedCount})</span>
            </button>

            <button
              onClick={() => setFilter("Pass")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filter === "Pass"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <X className="w-3.5 h-3.5 text-rose-300" />
              <span>Passed ({passedCount})</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline">
            Showing {filteredHistory.length} of {history.length}
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-9 h-9 text-blue-500 animate-spin" />
            <p className="text-slate-400 text-xs font-medium">Loading swipe history...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-12 bg-slate-900 border border-rose-500/30 rounded-2xl p-6">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-rose-300 text-xs mb-3">{error}</p>
            <button
              onClick={fetchSwipeHistory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredHistory.length === 0 && (
          <div className="text-center py-16 bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
              <History className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Swipe Records Found</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto mb-5 leading-relaxed">
              {filter === "all"
                ? "You haven't swiped on any job roles yet. Explore the Discover Jobs feed and swipe on opportunities!"
                : `No roles marked as ${filter === "Interested" ? "Interested" : "Passed"} yet.`}
            </p>
            <button
              onClick={() => navigate("/jobs")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              Start Swiping Jobs
            </button>
          </div>
        )}

        {/* Swipe History List */}
        {!loading && !error && filteredHistory.length > 0 && (
          <div className="space-y-3">
            {filteredHistory.map((item, idx) => {
              const isInterested = item.swipe_action === "Interested";

              return (
                <motion.div
                  key={item.swipe_id || `${item.job_id}-${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all shadow-md group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Left details */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Swipe Status Icon Badge */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                          isInterested
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                            : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                        }`}
                        title={isInterested ? "Swiped Right / Interested" : "Swiped Left / Passed"}
                      >
                        {isInterested ? (
                          <Heart className="w-5 h-5 fill-current" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </div>

                      {/* Job Title & Meta */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Link
                            to={`/jobs/${item.job_id}`}
                            className="text-base font-bold text-white hover:text-blue-400 transition-colors truncate"
                          >
                            {item.job_title || `Job #${item.job_id}`}
                          </Link>

                          {/* Swipe action pill */}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isInterested
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {isInterested ? "❤️ Right Swipe • Interested" : "❌ Left Swipe • Passed"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            {item.company_name || "Company"}
                          </span>

                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              {item.location}
                            </span>
                          )}

                          {item.employment_type && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                              {item.employment_type}
                            </span>
                          )}

                          {/* Date and Time */}
                          <span className="flex items-center gap-1 text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-600" />
                            {formatDate(item.swiped_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link
                        to={`/jobs/${item.job_id}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>

                      {isInterested && (
                        <Link
                          to={`/apply/${item.job_id}`}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1 cursor-pointer"
                        >
                          Apply Now
                        </Link>
                      )}
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
