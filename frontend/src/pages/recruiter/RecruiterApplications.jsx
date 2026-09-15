import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import {
  Users,
  Search,
  Mail,
  Phone,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Briefcase,
  X,
  ExternalLink,
  MapPin,
  GraduationCap,
  Award,
  FolderGit2,
  Building2,
  Check,
  Download
} from "lucide-react";

export default function RecruiterApplications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedJobIdParam = searchParams.get("jobId") || "ALL";
  const selectedStatusParam = (searchParams.get("status") || "ALL").toUpperCase();

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedJobId, setSelectedJobId] = useState(selectedJobIdParam);
  const [statusFilter, setStatusFilter] = useState(selectedStatusParam);
  const [search, setSearch] = useState("");

  const [updatingAppId, setUpdatingAppId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [viewingResumeAppId, setViewingResumeAppId] = useState(null);
  const [resumeViewError, setResumeViewError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const currentJobId = searchParams.get("jobId") || "ALL";
    const currentStatus = (searchParams.get("status") || "ALL").toUpperCase();
    setSelectedJobId(currentJobId);
    setStatusFilter(currentStatus);
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [appsRes, jobsRes] = await Promise.all([
        api.get("/applications/recruiter/all"),
        api.get("/jobs/recruiter/my-jobs")
      ]);

      setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
    } catch (err) {
      console.error("Failed to load recruiter applications:", err);
      setError(
        err.response?.data?.detail || "Unable to load candidate applications."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJobFilterChange = (jobId) => {
    setSelectedJobId(jobId);
    const newParams = new URLSearchParams(searchParams);
    if (jobId === "ALL") {
      newParams.delete("jobId");
    } else {
      newParams.set("jobId", jobId);
    }
    setSearchParams(newParams);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    const newParams = new URLSearchParams(searchParams);
    if (status === "ALL") {
      newParams.delete("status");
    } else {
      newParams.set("status", status);
    }
    setSearchParams(newParams);
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setUpdatingAppId(applicationId);
      await api.put(`/applications/${applicationId}/status`, {
        status: newStatus
      });

      setApplications((prev) =>
        prev.map((app) =>
          app.application_id === applicationId
            ? { ...app, status: newStatus }
            : app
        )
      );

      if (selectedCandidate && selectedCandidate.application_id === applicationId) {
        setSelectedCandidate((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleViewResume = async (applicationId) => {
    try {
      setViewingResumeAppId(applicationId);
      setResumeViewError("");
      const res = await api.get(`/applications/${applicationId}/resume`, {
        responseType: "blob"
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error("Failed to stream candidate resume PDF:", err);
      setResumeViewError(
        "Resume PDF is currently unavailable on the server."
      );
    } finally {
      setViewingResumeAppId(null);
    }
  };

  const parseSkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills.filter(Boolean).map(String);
    if (typeof skills === "string") {
      try {
        const parsed = JSON.parse(skills);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      } catch {
        // Not JSON formatted
      }
      return skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Applied":
        return {
          badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
          icon: Clock
        };
      case "Shortlisted":
        return {
          badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          icon: Sparkles
        };
      case "Interview":
        return {
          badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
          icon: Calendar
        };
      case "Selected":
      case "Offered":
        return {
          badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          icon: CheckCircle2
        };
      case "Rejected":
        return {
          badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          icon: XCircle
        };
      default:
        return {
          badge: "bg-slate-700 text-slate-300 border-slate-600",
          icon: Clock
        };
    }
  };

  // Helper to render complex profile sections (education, projects, certs)
  const renderProfileList = (data, emptyMessage) => {
    if (!data) return <p className="text-xs text-slate-500 italic">{emptyMessage}</p>;

    let items = data;
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) items = parsed;
      } catch {
        return (
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-300 whitespace-pre-line">
            {data}
          </div>
        );
      }
    }

    if (Array.isArray(items) && items.length > 0) {
      return (
        <div className="space-y-2">
          {items.map((item, idx) => {
            if (typeof item === "object" && item !== null) {
              const primary =
                item.title ||
                item.degree ||
                item.name ||
                item.role ||
                item.certificate_name ||
                item.degree_title;
              const secondary =
                item.company ||
                item.school ||
                item.institution ||
                item.issuer ||
                item.year ||
                item.graduation_year ||
                item.date;
              const desc = item.description || item.summary || item.details;
              const tech = item.technologies || item.tech_stack || item.skills;

              return (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">
                      {primary || `Entry #${idx + 1}`}
                    </span>
                    {secondary && (
                      <span className="text-[11px] font-medium text-slate-400">
                        {secondary}
                      </span>
                    )}
                  </div>
                  {desc && (
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {desc}
                    </p>
                  )}
                  {tech && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {parseSkills(tech).map((t, tidx) => (
                        <span
                          key={tidx}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div
                key={idx}
                className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-300"
              >
                {String(item)}
              </div>
            );
          })}
        </div>
      );
    }

    return <p className="text-xs text-slate-500 italic">{emptyMessage}</p>;
  };

  // Filter applications safely
  const filteredApps = applications.filter((app) => {
    if (selectedJobId !== "ALL" && String(app.job_id) !== String(selectedJobId)) {
      return false;
    }

    const appStatus = (app.status || "Applied").toUpperCase();
    if (statusFilter !== "ALL") {
      if (statusFilter === "SHORTLISTED") {
        if (appStatus !== "SHORTLISTED") return false;
      } else if (statusFilter === "SELECTED") {
        if (appStatus !== "SELECTED" && appStatus !== "OFFERED") return false;
      } else if (statusFilter === "APPLIED") {
        if (appStatus !== "APPLIED" && appStatus !== "") return false;
      } else if (appStatus !== statusFilter) {
        return false;
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = app.candidate_name?.toLowerCase().includes(q);
      const matchEmail = app.candidate_email?.toLowerCase().includes(q);
      const matchJob = app.job_title?.toLowerCase().includes(q);
      const skills = parseSkills(app.resume_skills);
      const matchSkills = skills.some((sk) => sk.toLowerCase().includes(q));

      if (!matchName && !matchEmail && !matchJob && !matchSkills) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Candidate Pipeline
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Candidate Applications
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Review applicant resumes, assess ATS job match scores, and manage hiring stages in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
              Total: {applications.length} Candidates
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates by name, email, job, or tech skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter by Job Dropdown */}
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
              <select
                value={selectedJobId}
                onChange={(e) => handleJobFilterChange(e.target.value)}
                className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer min-w-[200px]"
              >
                <option value="ALL">All Jobs ({jobs.length})</option>
                {jobs.map((job) => (
                  <option key={job.job_id} value={String(job.job_id)}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
            {[
              { id: "ALL", label: `All (${applications.length})` },
              {
                id: "APPLIED",
                label: `Applied (${applications.filter((a) => ["APPLIED", ""].includes((a.status || "").toUpperCase())).length})`
              },
              {
                id: "SHORTLISTED",
                label: `Shortlisted (${applications.filter((a) => (a.status || "").toUpperCase() === "SHORTLISTED").length})`
              },
              {
                id: "INTERVIEW",
                label: `Interview (${applications.filter((a) => (a.status || "").toUpperCase() === "INTERVIEW").length})`
              },
              {
                id: "SELECTED",
                label: `Selected (${applications.filter((a) => ["SELECTED", "OFFERED"].includes((a.status || "").toUpperCase())).length})`
              },
              {
                id: "REJECTED",
                label: `Rejected (${applications.filter((a) => (a.status || "").toUpperCase() === "REJECTED").length})`
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStatusFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-purple-600 text-white shadow"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-medium">Loading candidate applications...</p>
          </div>
        )}

        {/* Candidate Applications List */}
        {!loading && !error && filteredApps.length > 0 && (
          <div className="space-y-4">
            {filteredApps.map((app) => {
              const statusInfo = getStatusBadge(app.status || "Applied");
              const skills = parseSkills(app.resume_skills);
              const matchScore =
                app.resume_match_score !== null && app.resume_match_score !== undefined
                  ? app.resume_match_score
                  : app.resume_ats_score ?? app.ats_score;

              return (
                <motion.div
                  key={app.application_id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    
                    {/* Candidate Info Left */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-start sm:items-center justify-between sm:justify-start gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-indigo-600/20 shrink-0">
                            {app.candidate_name ? app.candidate_name.charAt(0).toUpperCase() : "C"}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-base font-bold text-white">
                                {app.candidate_name || "Candidate"}
                              </h2>
                              
                              {/* Resume Match Score Badge */}
                              {matchScore !== null && matchScore !== undefined && matchScore > 0 ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                                  <Sparkles className="w-3 h-3 text-emerald-400" />
                                  {Math.round(matchScore)}% Match
                                </span>
                              ) : !app.has_resume ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                  No Resume Attached
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-blue-400" />
                                  Ready to Analyze
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mt-0.5">
                              Applied for <span className="text-white font-semibold">{app.job_title}</span>
                              {app.company_name && (
                                <span className="text-slate-500 ml-1.5 font-normal">at {app.company_name}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contact details & Date */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {app.candidate_email && (
                          <a
                            href={`mailto:${app.candidate_email}`}
                            className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 hover:text-blue-400 transition"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {app.candidate_email}
                          </a>
                        )}
                        {app.candidate_phone && (
                          <a
                            href={`tel:${app.candidate_phone}`}
                            className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 hover:text-blue-400 transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {app.candidate_phone}
                          </a>
                        )}
                        {app.candidate_location && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {app.candidate_location}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "Recent"}
                        </span>
                      </div>

                      {/* Resume Extracted Skills */}
                      {skills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Resume Skills:
                          </span>
                          {skills.slice(0, 7).map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              {sk}
                            </span>
                          ))}
                          {skills.length > 7 && (
                            <span className="text-[10px] text-slate-500">
                              +{skills.length - 7} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Actions & Status Changer */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800 justify-between lg:justify-end">
                      
                      {/* Status Selector Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Status:
                        </span>
                        <select
                          value={app.status || "Applied"}
                          disabled={updatingAppId === app.application_id}
                          onChange={(e) =>
                            handleStatusChange(app.application_id, e.target.value)
                          }
                          className={`text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            statusInfo.badge
                          } bg-slate-900`}
                        >
                          <option value="Applied">Applied</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interview">Interview</option>
                          <option value="Selected">Selected</option>
                          <option value="Offered">Offered</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      {/* Candidate Detail Button */}
                      <button
                        onClick={() => {
                          setResumeViewError("");
                          setSelectedCandidate(app);
                        }}
                        className="px-3.5 py-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 text-blue-300 hover:text-white rounded-xl text-xs font-bold border border-blue-500/30 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Profile & Details</span>
                      </button>

                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredApps.length === 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {search || statusFilter !== "ALL" || selectedJobId !== "ALL"
                ? "No applications found"
                : "No Candidate Applications Yet"}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {search || statusFilter !== "ALL" || selectedJobId !== "ALL"
                ? "Try clearing your filters or search keywords to view all candidate applications."
                : "When candidates discover and apply to your open job listings, they will appear here with full ATS match scores and resume details."}
            </p>
            {search || statusFilter !== "ALL" || selectedJobId !== "ALL" ? (
              <button
                onClick={() => {
                  setSearch("");
                  handleStatusFilterChange("ALL");
                  handleJobFilterChange("ALL");
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => navigate("/recruiter/jobs")}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                <span>View Your Job Postings</span>
              </button>
            )}
          </div>
        )}

      </div>

      {/* Candidate Profile Details Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto relative"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-600/30 shrink-0">
                    {selectedCandidate.candidate_name
                      ? selectedCandidate.candidate_name.charAt(0).toUpperCase()
                      : "C"}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">
                      {selectedCandidate.candidate_name || "Candidate Profile"}
                    </h3>
                    {selectedCandidate.candidate_headline ? (
                      <p className="text-xs font-medium text-purple-300 mt-0.5">
                        {selectedCandidate.candidate_headline}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Candidate Applicant
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Applied Job Info Banner */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Applied Job Position
                  </span>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <span>{selectedCandidate.job_title}</span>
                    {selectedCandidate.company_name && (
                      <span className="text-slate-400 font-normal">
                        at {selectedCandidate.company_name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                    {selectedCandidate.job_location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {selectedCandidate.job_location}
                      </span>
                    )}
                    {selectedCandidate.job_employment_type && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                        {selectedCandidate.job_employment_type}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Current Status
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                      getStatusBadge(selectedCandidate.status || "Applied").badge
                    }`}
                  >
                    {selectedCandidate.status || "Applied"}
                  </span>
                </div>
              </div>

              {/* 1. Job-Specific Resume Match Score & Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Job-Specific Resume Match Analysis</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Calculated against applied job requirements
                  </span>
                </div>

                {selectedCandidate.resume_match_score !== null &&
                selectedCandidate.resume_match_score !== undefined &&
                selectedCandidate.resume_match_score > 0 ? (
                  <div className="p-4 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl space-y-4">
                    {/* Score Header & Progress Bar */}
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-2xl font-black text-emerald-400">
                          {Math.round(selectedCandidate.resume_match_score)}%
                          <span className="text-xs font-semibold text-emerald-300 ml-1.5 font-normal">
                            Resume Match Score
                          </span>
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {selectedCandidate.resume_match_score >= 80
                            ? "Strong Match"
                            : selectedCandidate.resume_match_score >= 60
                            ? "Moderate Match"
                            : "Developing Match"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 shadow-sm"
                          style={{
                            width: `${Math.min(Math.max(selectedCandidate.resume_match_score, 5), 100)}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Matched & Missing Skills Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      
                      {/* Matched Skills */}
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-emerald-500/20 space-y-2">
                        <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Matched Skills ({(selectedCandidate.matched_skills || []).length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedCandidate.matched_skills || []).length > 0 ? (
                            selectedCandidate.matched_skills.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic">
                              No overlapping keywords detected.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Missing Job Skills */}
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-amber-500/20 space-y-2">
                        <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          Missing Job Skills ({(selectedCandidate.missing_skills || []).length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedCandidate.missing_skills || []).length > 0 ? (
                            selectedCandidate.missing_skills.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-emerald-400 font-medium">
                              All required job skills present!
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Suggestions / Insights */}
                    {selectedCandidate.match_suggestions && (
                      <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          ATS Match Insights
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedCandidate.match_suggestions}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      Resume Match Score unavailable — resume could not be analyzed.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      The candidate's resume may be missing searchable text or no required skills were specified.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Candidate Contact & Profile Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Candidate Information
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-2.5 text-slate-300">
                    <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] font-semibold text-slate-500 block">Email Address</span>
                      {selectedCandidate.candidate_email ? (
                        <a
                          href={`mailto:${selectedCandidate.candidate_email}`}
                          className="text-white hover:text-blue-400 transition underline underline-offset-2"
                        >
                          {selectedCandidate.candidate_email}
                        </a>
                      ) : (
                        <span className="text-slate-500">Not provided</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-2.5 text-slate-300">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] font-semibold text-slate-500 block">Phone Number</span>
                      {selectedCandidate.candidate_phone ? (
                        <a
                          href={`tel:${selectedCandidate.candidate_phone}`}
                          className="text-white hover:text-emerald-400 transition underline underline-offset-2"
                        >
                          {selectedCandidate.candidate_phone}
                        </a>
                      ) : (
                        <span className="text-slate-500">Not provided</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-2.5 text-slate-300">
                    <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block">Location</span>
                      <span className="text-white">
                        {selectedCandidate.candidate_location || "Not specified"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-2.5 text-slate-300">
                    <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block">Total Experience</span>
                      <span className="text-white">
                        {selectedCandidate.candidate_experience_years !== null &&
                        selectedCandidate.candidate_experience_years !== undefined
                          ? `${selectedCandidate.candidate_experience_years} Years`
                          : "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Candidate Summary / Bio */}
                {selectedCandidate.candidate_summary && (
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Professional Summary / Bio
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {selectedCandidate.candidate_summary}
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Education Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  <span>Education</span>
                </h4>
                {renderProfileList(
                  selectedCandidate.candidate_education,
                  "No formal education history provided in candidate profile."
                )}
              </div>

              {/* 4. Projects & Portfolio */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-indigo-400" />
                  <span>Key Projects & Portfolio</span>
                </h4>
                {renderProfileList(
                  selectedCandidate.candidate_projects,
                  "No project portfolio details provided in candidate profile."
                )}
              </div>

              {/* 5. Certifications */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Certifications & Licenses</span>
                </h4>
                {renderProfileList(
                  selectedCandidate.candidate_certifications,
                  "No certifications added to profile."
                )}
              </div>

              {/* 6. Extracted Tech Skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Extracted Tech Skills
                </h4>
                <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 min-h-[50px]">
                  {parseSkills(selectedCandidate.resume_skills).length > 0 ? (
                    parseSkills(selectedCandidate.resume_skills).map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-blue-300 border border-slate-700"
                      >
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      No parsed skills extracted from resume.
                    </span>
                  )}
                </div>
              </div>

              {/* 7. Dedicated Resume Section with View Resume Button */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Candidate Resume Document</span>
                </h4>

                <div className="p-4 bg-gradient-to-r from-slate-800/60 via-slate-800/40 to-slate-800/60 rounded-2xl border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">
                        {selectedCandidate.resume_name || "Candidate_Resume.pdf"}
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        {selectedCandidate.has_resume
                          ? "Official candidate application PDF document"
                          : "No resume attached to this application"}
                      </p>
                    </div>
                  </div>

                  {selectedCandidate.has_resume && (
                    <button
                      onClick={() =>
                        handleViewResume(
                          selectedCandidate.application_id
                        )
                      }
                      disabled={viewingResumeAppId === selectedCandidate.application_id}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-60"
                    >
                      {viewingResumeAppId === selectedCandidate.application_id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Opening Resume PDF...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          <span>View Resume PDF</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {resumeViewError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resumeViewError}</span>
                  </div>
                )}
              </div>

              {/* 8. Recruiter Action Buttons */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Update Application Stage
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedCandidate.application_id,
                        "Shortlisted"
                      )
                    }
                    disabled={updatingAppId === selectedCandidate.application_id}
                    className={`py-2.5 px-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      selectedCandidate.status === "Shortlisted"
                        ? "bg-amber-500 text-slate-950 border-amber-400"
                        : "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Shortlist</span>
                  </button>

                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedCandidate.application_id,
                        "Interview"
                      )
                    }
                    disabled={updatingAppId === selectedCandidate.application_id}
                    className={`py-2.5 px-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      selectedCandidate.status === "Interview"
                        ? "bg-purple-500 text-white border-purple-400"
                        : "bg-purple-500/15 hover:bg-purple-500/25 border-purple-500/30 text-purple-300"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Interview</span>
                  </button>

                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedCandidate.application_id,
                        "Selected"
                      )
                    }
                    disabled={updatingAppId === selectedCandidate.application_id}
                    className={`py-2.5 px-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      selectedCandidate.status === "Selected"
                        ? "bg-emerald-500 text-slate-950 border-emerald-400"
                        : "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Select / Offer</span>
                  </button>

                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedCandidate.application_id,
                        "Rejected"
                      )
                    }
                    disabled={updatingAppId === selectedCandidate.application_id}
                    className={`py-2.5 px-3 rounded-xl font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      selectedCandidate.status === "Rejected"
                        ? "bg-rose-500 text-white border-rose-400"
                        : "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Close Footer */}
              <div className="pt-3 border-t border-slate-800 text-right">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
