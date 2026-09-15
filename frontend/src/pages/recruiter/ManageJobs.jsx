import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import {
  Briefcase,
  Search,
  PlusCircle,
  MapPin,
  DollarSign,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  X,
  ChevronRight
} from "lucide-react";

export default function ManageJobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = (searchParams.get("status") || "ALL").toUpperCase();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(statusParam);

  // Edit Modal State
  const [editingJob, setEditingJob] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    location: "",
    employment_type: "Full-time",
    experience_required: "",
    salary_min: "",
    salary_max: "",
    skills_required: "",
    description: "",
    is_active: true
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete Modal State
  const [deletingJob, setDeletingJob] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  useEffect(() => {
    const currentStatus = (searchParams.get("status") || "ALL").toUpperCase();
    setStatusFilter(currentStatus);
  }, [searchParams]);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/jobs/recruiter/my-jobs");
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load recruiter jobs:", err);
      setError(
        err.response?.data?.detail || "Unable to fetch your posted jobs."
      );
    } finally {
      setLoading(false);
    }
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

  const parseSkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills.filter(Boolean).map(String);
    if (typeof skills === "string") {
      try {
        const parsed = JSON.parse(skills);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      } catch {
        // Not JSON
      }
      return skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const handleToggleActive = async (job) => {
    try {
      const updatedStatus = !job.is_active;
      await api.put(`/jobs/${job.job_id}`, {
        is_active: updatedStatus
      });
      setJobs((prev) =>
        prev.map((j) =>
          j.job_id === job.job_id ? { ...j, is_active: updatedStatus } : j
        )
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setEditError("");
    const skills = parseSkills(job.skills_required);
    setEditFormData({
      title: job.title || "",
      location: job.location || "",
      employment_type: job.employment_type || "Full-time",
      experience_required: job.experience_required || "",
      salary_min: job.salary_min || "",
      salary_max: job.salary_max || "",
      skills_required: skills.join(", "),
      description: job.description || "",
      is_active: job.is_active !== undefined ? job.is_active : true
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      setSavingEdit(true);
      setEditError("");

      const skillsArray = editFormData.skills_required
        ? editFormData.skills_required
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        title: editFormData.title,
        location: editFormData.location,
        employment_type: editFormData.employment_type,
        experience_required: editFormData.experience_required,
        salary_min: editFormData.salary_min ? parseFloat(editFormData.salary_min) : null,
        salary_max: editFormData.salary_max ? parseFloat(editFormData.salary_max) : null,
        skills_required: skillsArray,
        description: editFormData.description,
        is_active: editFormData.is_active
      };

      const res = await api.put(`/jobs/${editingJob.job_id}`, payload);

      setJobs((prev) =>
        prev.map((j) =>
          j.job_id === editingJob.job_id
            ? { ...j, ...res.data, applicant_count: j.applicant_count }
            : j
        )
      );

      setEditingJob(null);
    } catch (err) {
      console.error("Failed to update job:", err);
      setEditError(
        err.response?.data?.detail || "Failed to update job posting."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!deletingJob) return;

    try {
      setDeletingLoading(true);
      await api.delete(`/jobs/${deletingJob.job_id}`);
      setJobs((prev) => prev.filter((j) => j.job_id !== deletingJob.job_id));
      setDeletingJob(null);
    } catch (err) {
      console.error("Failed to delete job:", err);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Filter & Search safely
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      job.location?.toLowerCase().includes(search.toLowerCase()) ||
      parseSkills(job.skills_required).some((sk) =>
        sk.toLowerCase().includes(search.toLowerCase())
      );

    if (!matchesSearch) return false;

    if (statusFilter === "ACTIVE") return job.is_active === true;
    if (statusFilter === "CLOSED") return job.is_active === false;

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Hiring Pipeline
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Manage Job Postings
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Create, edit, toggle active status, and review applicant applications for all your listings.
            </p>
          </div>

          <button
            onClick={() => navigate("/recruiter/post-job")}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm self-start sm:self-center"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Job</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, location, company, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 self-start md:self-auto">
            <button
              onClick={() => handleStatusFilterChange("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All ({jobs.length})
            </button>
            <button
              onClick={() => handleStatusFilterChange("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Active ({jobs.filter((j) => j.is_active).length})
            </button>
            <button
              onClick={() => handleStatusFilterChange("CLOSED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "CLOSED"
                  ? "bg-slate-700 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Closed ({jobs.filter((j) => !j.is_active).length})
            </button>
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
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-medium">Loading your job postings...</p>
          </div>
        )}

        {/* Job Listings Grid / Cards */}
        {!loading && !error && filteredJobs.length > 0 && (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const skills = parseSkills(job.skills_required);

              return (
                <motion.div
                  key={job.job_id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-slate-900/80 border rounded-2xl p-5 shadow-xl transition-all ${
                    job.is_active
                      ? "border-slate-800 hover:border-slate-700"
                      : "border-slate-800/60 opacity-80"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    
                    {/* Job Details Left */}
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-lg font-bold text-white">
                          {job.title}
                        </h2>

                        {/* Active Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            job.is_active
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-slate-700/60 text-slate-400 border-slate-600"
                          }`}
                        >
                          {job.is_active ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Listing
                            </>
                          ) : (
                            "Closed / Inactive"
                          )}
                        </span>

                        {/* Company Name */}
                        {job.company_name && (
                          <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-lg">
                            {job.company_name}
                          </span>
                        )}
                      </div>

                      {/* Metadata chips */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {job.location && (
                          <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {job.location}
                          </span>
                        )}
                        {job.employment_type && (
                          <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {job.employment_type}
                          </span>
                        )}
                        {(job.salary_min || job.salary_max) && (
                          <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-emerald-400">
                            <DollarSign className="w-3.5 h-3.5" />
                            {job.salary_min ? `$${job.salary_min.toLocaleString()}` : "$0"} -{" "}
                            {job.salary_max ? `$${job.salary_max.toLocaleString()}` : "Open"}
                          </span>
                        )}
                        {job.experience_required && (
                          <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {job.experience_required}
                          </span>
                        )}
                      </div>

                      {/* Skills pills */}
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {skills.map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Actions & Applicants */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800 justify-between lg:justify-end">
                      
                      {/* Applicants Counter Badge */}
                      <button
                        onClick={() =>
                          navigate(`/recruiter/applications?jobId=${job.job_id}`)
                        }
                        className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer group"
                        title="View all candidates who applied for this position"
                      >
                        <Users className="w-4 h-4 text-purple-400" />
                        <span>{job.applicant_count || 0} Candidates</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* Toggle Active / Closed Button */}
                      <button
                        onClick={() => handleToggleActive(job)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                          job.is_active
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                            : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30"
                        }`}
                        title={job.is_active ? "Close / Pause listing" : "Activate listing"}
                      >
                        {job.is_active ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Close</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(job)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                        title="Edit Job Details"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeletingJob(job)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                        title="Delete Job Posting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredJobs.length === 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {search || statusFilter !== "ALL"
                ? "No matching jobs found"
                : "No Job Postings Yet"}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {search || statusFilter !== "ALL"
                ? "Try adjusting your search query or status filter to find the position."
                : "Create your first job listing to start receiving candidate applications and smart AI match scores."}
            </p>
            {search || statusFilter !== "ALL" ? (
              <button
                onClick={() => {
                  setSearch("");
                  handleStatusFilterChange("ALL");
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => navigate("/recruiter/post-job")}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Your First Job</span>
              </button>
            )}
          </div>
        )}

      </div>

      {/* Edit Job Modal */}
      <AnimatePresence>
        {editingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Edit className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Edit Job Posting</h3>
                </div>
                <button
                  onClick={() => setEditingJob(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                {/* Job Title */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Location */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editFormData.location}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          location: e.target.value
                        })
                      }
                      placeholder="e.g. San Francisco, CA / Remote"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Employment Type
                    </label>
                    <select
                      value={editFormData.employment_type}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          employment_type: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Experience */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Experience Required
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3-5 years"
                      value={editFormData.experience_required}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          experience_required: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Salary Min */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Min Salary ($)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 80000"
                      value={editFormData.salary_min}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          salary_min: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Salary Max */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Max Salary ($)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 120000"
                      value={editFormData.salary_max}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          salary_max: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Required Tech Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Python, React, PostgreSQL, Docker"
                    value={editFormData.skills_required}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        skills_required: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Role Description
                  </label>
                  <textarea
                    rows={4}
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={editFormData.is_active}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        is_active: e.target.checked
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor="edit_is_active"
                    className="text-xs text-slate-300 font-medium cursor-pointer"
                  >
                    Listing is Active & Accepting Applications
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingJob(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingEdit ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">
                  Delete Job Posting?
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  Are you sure you want to permanently delete{" "}
                  <span className="text-white font-semibold">
                    "{deletingJob.title}"
                  </span>
                  ? This will also remove any attached applications and ATS reports. This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDeletingJob(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingLoading}
                  onClick={handleDeleteJob}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, Delete Job</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
