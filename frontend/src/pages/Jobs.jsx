import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import {
  Briefcase,
  Search,
  MapPin,
  GraduationCap,
  RotateCcw,
  Star,
  Heart,
  X,
  Zap,
  Flame,
  DollarSign,
  Filter,
  LayoutGrid,
  Layers,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ArrowRight
} from "lucide-react";

function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchScore, setMatchScore] = useState(null);
  const [viewMode, setViewMode] = useState("swipe"); // "swipe" | "grid"

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter State
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [employmentInput, setEmploymentInput] = useState("");
  const [experienceInput, setExperienceInput] = useState("");

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/jobs/");
      setJobs(response.data);
      setCurrentIndex(0);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to load jobs at this time. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchScore = async (jobId) => {
    try {
      const response = await api.get(`/jobs/${jobId}/match`);
      setMatchScore(response.data?.match_score);
    } catch (err) {
      setMatchScore(null);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setSearch(searchInput.trim());
    setLocationFilter(locationInput.trim());
    setEmploymentFilter(employmentInput);
    setExperienceFilter(experienceInput);
    setCurrentIndex(0);
  };

  const clearFilters = () => {
    setSearchInput("");
    setLocationInput("");
    setEmploymentInput("");
    setExperienceInput("");

    setSearch("");
    setLocationFilter("");
    setEmploymentFilter("");
    setExperienceFilter("");
    setCurrentIndex(0);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const searchText = search.toLowerCase();
      const matchesSearch =
        !searchText ||
        job.title?.toLowerCase().includes(searchText) ||
        job.description?.toLowerCase().includes(searchText) ||
        String(job.required_skills || "").toLowerCase().includes(searchText);

      const matchesLocation =
        !locationFilter ||
        job.location?.toLowerCase().includes(locationFilter.toLowerCase());

      const matchesEmployment =
        !employmentFilter ||
        job.employment_type?.toLowerCase() === employmentFilter.toLowerCase();

      const matchesExperience =
        !experienceFilter ||
        job.experience_required?.toLowerCase().includes(experienceFilter.toLowerCase());

      return matchesSearch && matchesLocation && matchesEmployment && matchesExperience;
    });
  }, [jobs, search, locationFilter, employmentFilter, experienceFilter]);

  const currentJob = filteredJobs.length > 0 && currentIndex < filteredJobs.length
    ? filteredJobs[currentIndex]
    : null;

  useEffect(() => {
    if (currentJob?.job_id) {
      fetchMatchScore(currentJob.job_id);
    } else {
      setMatchScore(null);
    }
  }, [currentJob?.job_id]);

  const nextJob = () => {
    if (currentIndex < filteredJobs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(filteredJobs.length);
    }
  };

  const prevJob = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handlePass = async () => {
    if (!currentJob) return;
    try {
      await api.post(`/swipes/${currentJob.job_id}?swipe_action=Pass`);
      nextJob();
    } catch (err) {
      nextJob();
    }
  };

  const handleInterested = async () => {
    if (!currentJob) return;
    try {
      await api.post(`/swipes/${currentJob.job_id}?swipe_action=Interested`);
      nextJob();
    } catch (err) {
      nextJob();
    }
  };

  const normalizeSkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    if (typeof skills === "string") {
      return skills.replace(";", ",").split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Intelligent Matching Feed
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Discover Tech Roles
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Swipe right on matching opportunities or explore all filtered jobs in grid view.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setViewMode("swipe")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                viewMode === "swipe"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Swipe Mode</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Grid View</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Keyword Search */}
              <div className="md:col-span-4 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or skills..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Location Search */}
              <div className="md:col-span-3 relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="City, State, or Remote..."
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Employment Type */}
              <div className="md:col-span-2 relative">
                <select
                  value={employmentInput}
                  onChange={(e) => setEmploymentInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value="">All Job Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              {/* Experience Level */}
              <div className="md:col-span-2 relative">
                <select
                  value={experienceInput}
                  onChange={(e) => setExperienceInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value="">All Experience</option>
                  <option value="Entry">Entry Level (0-2 yrs)</option>
                  <option value="Mid">Mid Level (2-5 yrs)</option>
                  <option value="Senior">Senior Level (5+ yrs)</option>
                  <option value="Lead">Lead / Staff</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-1 flex gap-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md"
                  title="Search"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Active Info */}
            {(search || locationFilter || employmentFilter || experienceFilter) && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-400">
                  <span>Active Filters:</span>
                  {search && <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Keyword: {search}</span>}
                  {locationFilter && <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Location: {locationFilter}</span>}
                  {employmentFilter && <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Type: {employmentFilter}</span>}
                  {experienceFilter && <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Exp: {experienceFilter}</span>}
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Scoring and loading matching jobs...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="max-w-md mx-auto text-center py-16 bg-slate-900 border border-rose-500/30 rounded-3xl p-8 shadow-2xl">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-rose-300 text-sm mb-4">{error}</p>
            <button
              onClick={fetchJobs}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SWIPE MODE INTERFACE                                      */}
        {/* ========================================================= */}
        {!loading && !error && viewMode === "swipe" && (
          <div className="max-w-2xl mx-auto">
            {currentJob ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentJob.job_id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative"
                >
                  {/* Top Bar: Progress Indicator */}
                  <div className="flex items-center justify-end mb-4">
                    <span className="text-xs text-slate-400 font-semibold bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/60">
                      Job {currentIndex + 1} of {filteredJobs.length}
                    </span>
                  </div>

                  {/* Job Title & ID */}
                  <div>
                    <h2
                      onClick={() => navigate(`/jobs/${currentJob.job_id}`)}
                      className="text-2xl md:text-3xl font-extrabold text-white tracking-tight hover:text-blue-400 transition-colors cursor-pointer"
                      title="Click to view full job details"
                    >
                      {currentJob.title}
                    </h2>
                    <p className="text-blue-400 font-medium text-sm mt-1">
                      Job ID: #{currentJob.job_id}
                    </p>
                  </div>

                  {/* Meta Tags */}
                  <div className="flex flex-wrap items-center gap-2.5 mt-4 text-xs text-slate-300">
                    {currentJob.location && (
                      <span className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/60">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {currentJob.location}
                      </span>
                    )}
                    {currentJob.employment_type && (
                      <span className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/60">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {currentJob.employment_type}
                      </span>
                    )}
                    {currentJob.experience_required && (
                      <span className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/60">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        {currentJob.experience_required}
                      </span>
                    )}
                    {currentJob.salary && (
                      <span className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/60 text-emerald-400 font-semibold">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        {currentJob.salary}
                      </span>
                    )}
                  </div>

                  {/* ATS Compatibility Bar */}
                  {matchScore !== null && matchScore !== undefined && (
                    <div className="mt-5 p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-blue-400" />
                          Resume Match Score
                        </span>
                        <span className="font-bold text-emerald-400">{matchScore}% Match</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(matchScore, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Required Skills */}
                  {normalizeSkills(currentJob.required_skills).length > 0 && (
                    <div className="mt-5">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
                        Required Tech Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {normalizeSkills(currentJob.required_skills).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {currentJob.description && (
                    <div className="mt-5">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
                        Role Overview
                      </p>
                      <p className="text-slate-300 text-xs md:text-sm leading-relaxed line-clamp-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/40">
                        {currentJob.description}
                      </p>
                    </div>
                  )}

                  {/* Swipe Action Controls: ❌ Skip/Reject, ⭐ Save/Favorite, ❤️ Interested/Apply */}
                  <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-800">
                    {/* ❌ Skip / Reject Button */}
                    <button
                      onClick={handlePass}
                      className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xl font-bold shadow-lg transition-all hover:scale-105 cursor-pointer"
                      title="Skip / Reject"
                    >
                      <X className="w-6 h-6" />
                    </button>

                    {/* ⭐ Save / Favorite (Interested) Button */}
                    <button
                      onClick={handleInterested}
                      className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 cursor-pointer"
                      title="Save / Favorite"
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>

                    {/* ❤️ Interested / Apply Button */}
                    <button
                      onClick={() => navigate(`/apply/${currentJob.job_id}`)}
                      className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 cursor-pointer"
                      title="Interested / Apply"
                    >
                      <Heart className="w-6 h-6 fill-current" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              /* Caught Up / End of Feed State */
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg shadow-blue-500/20">
                  🎉
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">You're All Caught Up!</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                  You've reviewed all available jobs for this search filter. You can restart the feed or check your saved and recommended jobs.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setCurrentIndex(0)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart Feed</span>
                  </button>
                  <button
                    onClick={() => navigate("/interested-jobs")}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    View Interested Jobs
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* GRID VIEW INTERFACE                                       */}
        {/* ========================================================= */}
        {!loading && !error && viewMode === "grid" && (
          <div>
            {filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => {
                  const skills = normalizeSkills(job.required_skills);
                  return (
                    <motion.div
                      key={job.job_id}
                      whileHover={{ y: -3 }}
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all backdrop-blur-sm"
                    >
                      <div>
                        {/* Top Badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          {job.is_early_applicant ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Flame className="w-3 h-3 text-emerald-400" />
                              Early Applicant
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              {job.competition_level || "Active"}
                            </span>
                          )}

                          <span className="text-[11px] text-slate-500">
                            {job.applicant_count || 0} applied
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
                          {job.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-slate-400">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {job.location}
                            </span>
                          )}
                          {job.employment_type && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5" />
                              {job.employment_type}
                            </span>
                          )}
                          {job.salary && (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <DollarSign className="w-3.5 h-3.5" />
                              {job.salary}
                            </span>
                          )}
                        </div>

                        {job.description && (
                          <p className="text-slate-400 text-xs mt-3 line-clamp-3 leading-relaxed">
                            {job.description}
                          </p>
                        )}

                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {skills.slice(0, 4).map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-800">
                        <button
                          onClick={() => navigate(`/jobs/${job.job_id}`)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => navigate(`/apply/${job.job_id}`)}
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          <span>Apply</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 p-8">
                <p className="text-slate-400 text-sm">No jobs match your search filters.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Jobs;
