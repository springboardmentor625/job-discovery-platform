import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  FileText,
  Briefcase,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";

function Applications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [jobsMap, setJobsMap] = useState({});
  const [resumesMap, setResumesMap] = useState({});
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [appResponse, jobsResponse, resumesResponse] = await Promise.all([
        api.get("/applications/"),
        api.get("/jobs/"),
        api.get("/resumes/"),
      ]);

      setApplications(appResponse.data);

      const jobMap = {};
      jobsResponse.data.forEach((job) => {
        jobMap[job.job_id] = job;
      });
      setJobsMap(jobMap);

      const resumeMap = {};
      resumesResponse.data.forEach((resume) => {
        resumeMap[resume.resume_id] = resume;
      });
      setResumesMap(resumeMap);

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to load your applications."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Applied":
        return {
          bg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
          icon: Clock,
          label: "Applied",
        };
      case "Shortlisted":
        return {
          bg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          icon: Sparkles,
          label: "Shortlisted",
        };
      case "Selected":
        return {
          bg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          icon: CheckCircle2,
          label: "Selected / Offer",
        };
      case "Rejected":
        return {
          bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          icon: AlertCircle,
          label: "Not Selected",
        };
      default:
        return {
          bg: "bg-slate-700 text-slate-300 border-slate-600",
          icon: Clock,
          label: status || "Pending",
        };
    }
  };

  const filteredApps = applications.filter((app) => {
    if (filterStatus === "ALL") return true;
    return (app.status || "Applied").toUpperCase() === filterStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-wider mb-3">
            <FileText className="w-3.5 h-3.5" />
            Application Tracker
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            My Job Applications
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-2">
            Monitor real-time progress, status updates, and recruiter actions for all your submitted applications.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: "ALL", label: `All (${applications.length})` },
            { id: "APPLIED", label: "Applied" },
            { id: "SHORTLISTED", label: "Shortlisted" },
            { id: "SELECTED", label: "Selected" },
            { id: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                filterStatus === tab.id
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20"
                  : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="max-w-md mx-auto text-center py-8 bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl mb-8">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-rose-300 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading your applications...</p>
          </div>
        )}

        {/* Applications List */}
        {!loading && !error && filteredApps.length > 0 && (
          <div className="space-y-4">
            {filteredApps.map((application) => {
              const job = jobsMap[application.job_id];
              const resume = resumesMap[application.resume_id];
              const badge = getStatusBadge(application.status || "Applied");
              const StatusIcon = badge.icon;

              return (
                <motion.div
                  key={application.application_id}
                  whileHover={{ y: -2 }}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl transition-all backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h2
                        onClick={() => job && navigate(`/jobs/${job.job_id}`)}
                        className="text-xl font-bold text-white hover:text-blue-400 transition cursor-pointer"
                      >
                        {job?.title || `Position #${application.job_id}`}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      {job?.location && (
                        <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.location}
                        </span>
                      )}
                      {job?.employment_type && (
                        <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          {job.employment_type}
                        </span>
                      )}
                      {resume?.resume_name && (
                        <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-slate-300">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          {resume.resume_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        Applied on {new Date(application.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge & Action */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${badge.bg}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {badge.label}
                    </span>

                    {job && (
                      <button
                        onClick={() => navigate(`/jobs/${job.job_id}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>View Job</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredApps.length === 0 && (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {filterStatus === "ALL" ? "No Applications Yet" : `No ${filterStatus.toLowerCase()} applications`}
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              {filterStatus === "ALL"
                ? "Browse tech roles and swipe right or apply directly to track your progress here."
                : "You do not have any applications in this status category."}
            </p>
            <button
              onClick={() => navigate("/jobs")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>Discover Jobs to Apply</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Applications;