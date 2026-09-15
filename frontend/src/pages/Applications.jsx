import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaPaperPlane,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaSync,
  FaCompass,
  FaCheckCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import JobDetailsModal from "../components/JobDetailsModal";

function Applications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get("applications/");
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
        ? res.data.results
        : [];
      setApplications(data);
    } catch (error) {
      console.error("Applications fetch error:", error);
      toast.error("Unable to load your applications.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExternal = (e, url) => {
    e.stopPropagation();
    if (!url) {
      toast.error("Application link not available for this job.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Opening company application page.");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FaPaperPlane className="text-indigo-600" /> Applications
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {applications.length} Recorded
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage your external job applications and company links.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchApplications}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <FaSync className={loading ? "animate-spin" : ""} /> Refresh
        </button>
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
      ) : applications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {applications.map((app) => {
            const job = app.job || {};
            const appliedDate = app.applied_at
              ? new Date(app.applied_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recently";

            const salaryText =
              job.salary &&
              !["competitive", "nan", "none", "null", "not specified"].includes(
                job.salary.toLowerCase()
              )
                ? job.salary
                : "Not specified";

            return (
              <div
                key={app.id}
                onClick={() => setSelectedJob(job)}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer p-6 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* TOP ROW: COMPANY, ROLE */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-base shrink-0 border border-indigo-100">
                        {job.company
                          ? job.company.charAt(0).toUpperCase()
                          : "C"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">
                          {job.title || "Job Title"}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                          {job.company || "Company"}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <FaCheckCircle className="text-[9px]" />
                      External Application
                    </span>
                  </div>

                  {/* LOCATION & WORK MODE */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 truncate">
                      <FaMapMarkerAlt className="text-slate-400 shrink-0" />
                      <span className="truncate">
                        {job.location || "Remote"}
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      {job.work_mode || "On-site"}
                    </span>
                  </div>

                  {/* METRICS */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Salary
                      </p>
                      <p className="font-semibold text-slate-800 truncate mt-0.5">
                        {salaryText}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Status
                      </p>
                      <p className="font-bold text-emerald-600 truncate mt-0.5">
                        Application link opened
                      </p>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description ||
                      "Click to view full job description and qualifications."}
                  </p>
                </div>

                {/* BOTTOM FOOTER: APPLICATION DATE & EXTERNAL LINK */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Applied on {appliedDate}
                  </span>

                  {job.application_url ? (
                    <button
                      type="button"
                      onClick={(e) =>
                        handleOpenExternal(e, job.application_url)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition border border-indigo-200 cursor-pointer"
                    >
                      <FaExternalLinkAlt className="text-[10px]" />
                      Apply on Company Website
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Direct record
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-xs text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
            <FaPaperPlane />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            No Applications Yet
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            When you apply for opportunities via “Apply on Company Website”,
            your application history will appear here for easy tracking.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate("/recommendations")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <FaCompass /> Discover Recommendations
            </button>
          </div>
        </div>
      )}

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApplySuccess={() => fetchApplications()}
        />
      )}
    </div>
  );
}

export default Applications;
