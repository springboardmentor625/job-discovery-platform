import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Briefcase,
  Users,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  AlertCircle,
  Loader2,
  ChevronRight,
  FileText,
  PlusCircle,
  ArrowRight
} from "lucide-react";

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState({
    total_jobs: 0,
    active_jobs: 0,
    total_applicants: 0,
    shortlisted_applicants: 0,
    recent_applications: [],
    status_distribution: {},
    top_skills: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingAppId, setUpdatingAppId] = useState(null);

  useEffect(() => {
    fetchRecruiterData();
  }, []);

  const fetchRecruiterData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/analytics/recruiter");
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to fetch recruiter analytics:", err);
      setError(
        err.response?.data?.detail || "Unable to load recruiter dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setUpdatingAppId(applicationId);
      await api.put(`/applications/${applicationId}/status`, {
        status: newStatus
      });
      // Update local state
      setAnalytics((prev) => ({
        ...prev,
        recent_applications: (prev.recent_applications || []).map((app) =>
          app.application_id === applicationId
            ? { ...app, status: newStatus }
            : app
        )
      }));
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingAppId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Applied":
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
      case "Shortlisted":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "Interview":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "Selected":
      case "Offered":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "Rejected":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Recruiter Command Center
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
            </h1>
            <p className="mt-2 text-slate-400 text-sm md:text-base max-w-2xl">
              Manage your active hiring pipelines, review candidate applications, and publish new tech opportunities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={() => navigate("/recruiter/post-job")}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post New Job</span>
            </button>
            <button
              onClick={() => navigate("/recruiter/jobs")}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-sm font-semibold border border-slate-700 transition cursor-pointer"
            >
              Manage Postings
            </button>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Jobs Posted */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => navigate("/recruiter/jobs")}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Jobs Posted
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">
                {loading ? "-" : (analytics.total_jobs ?? 0)}
              </span>
              <span className="text-xs text-blue-400 group-hover:underline flex items-center gap-0.5 font-medium">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* Active Listings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate("/recruiter/jobs?status=ACTIVE")}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Listings
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">
                {loading ? "-" : (analytics.active_jobs ?? 0)}
              </span>
              <span className="text-xs text-emerald-400 group-hover:underline flex items-center gap-0.5 font-medium">
                Currently Open <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* Total Applicants */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate("/recruiter/applications")}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Applicants
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">
                {loading ? "-" : (analytics.total_applicants ?? 0)}
              </span>
              <span className="text-xs text-purple-400 group-hover:underline flex items-center gap-0.5 font-medium">
                Review candidates <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* Shortlisted Candidates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate("/recruiter/applications?status=SHORTLISTED")}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Shortlisted
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">
                {loading ? "-" : (analytics.shortlisted_applicants ?? 0)}
              </span>
              <span className="text-xs text-amber-400 group-hover:underline flex items-center gap-0.5 font-medium">
                In pipeline <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>
        </div>

        {/* Clean Single Section: Recent Candidate Applications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Recent Candidate Applications</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest candidates who applied to your open job listings
              </p>
            </div>
            <Link
              to="/recruiter/applications"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View all ({analytics.total_applicants ?? 0}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center">
              <Loader2 className="w-7 h-7 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading candidate applications...</p>
            </div>
          ) : analytics.recent_applications && analytics.recent_applications.length > 0 ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="divide-y divide-slate-800">
                {analytics.recent_applications.map((app) => {
                  const matchScore =
                    app.resume_match_score !== null && app.resume_match_score !== undefined
                      ? app.resume_match_score
                      : (app.ats_score ?? app.resume_ats_score ?? 0);
                  return (
                    <div
                      key={app.application_id}
                      className="p-4 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {app.candidate_name ? app.candidate_name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">
                              {app.candidate_name || "Candidate"}
                            </span>
                            {matchScore > 0 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                {Math.round(matchScore)}% Match
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            Applied for <span className="text-slate-200 font-medium">{app.job_title}</span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {app.applied_at
                              ? new Date(app.applied_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })
                              : "Recent"}
                          </p>
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center">
                        <select
                          value={app.status || "Applied"}
                          disabled={updatingAppId === app.application_id}
                          onChange={(e) =>
                            handleStatusChange(app.application_id, e.target.value)
                          }
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusBadge(
                            app.status || "Applied"
                          )} bg-slate-900`}
                        >
                          <option value="Applied">Applied</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interview">Interview</option>
                          <option value="Selected">Selected</option>
                          <option value="Offered">Offered</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 text-center">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Applications Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                When candidates swipe right or apply to your job postings, their profiles and match scores will appear here.
              </p>
              <button
                onClick={() => navigate("/recruiter/post-job")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Post a Job Listing
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
