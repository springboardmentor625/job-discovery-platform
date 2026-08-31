import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Briefcase,
  DollarSign,
  Flame,
  ArrowRight,
  Heart,
  Loader2,
  AlertCircle,
  Sparkles
} from "lucide-react";

function InterestedJobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInterestedJobs();
  }, []);

  const fetchInterestedJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/swipes/interested");
      setJobs(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to load interested jobs at this time."
      );
    } finally {
      setLoading(false);
    }
  };

  const normalizeSkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    if (typeof skills === "string") {
      return skills.replace(";", ",").split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 md:px-8 py-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wider mb-3">
            <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
            Bookmarked & Starred Roles
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Interested Opportunities
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-2">
            Review roles you marked as interested while swiping. Apply directly when you're ready.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading your saved roles...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="max-w-md mx-auto text-center py-16 bg-slate-900 border border-rose-500/30 rounded-2xl p-8 shadow-xl">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-rose-300 text-sm mb-4">{error}</p>
            <button
              onClick={fetchInterestedJobs}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && !error && jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => {
              const skillsList = normalizeSkills(job.required_skills);
              return (
                <motion.div
                  key={job.job_id}
                  whileHover={{ y: -4 }}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all backdrop-blur-sm relative"
                >
                  <div>
                    {/* Top Row: Early applicant & Star badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {job.is_early_applicant ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Flame className="w-3.5 h-3.5 text-emerald-400" />
                          🔥 Early Applicant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {job.competition_level || "Active"}
                        </span>
                      )}

                      <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    </div>

                    {/* Job Title */}
                    <h2 className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
                      {job.title}
                    </h2>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs text-slate-300">
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
                      {job.salary && (
                        <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-emerald-400 font-medium">
                          <DollarSign className="w-3.5 h-3.5" />
                          {job.salary}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {job.description && (
                      <p className="text-slate-400 text-xs mt-4 line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    {/* Skills */}
                    {skillsList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {skillsList.slice(0, 5).map((skill, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-5 mt-5 border-t border-slate-800">
                    <button
                      onClick={() => navigate(`/jobs/${job.job_id}`)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => navigate(`/apply/${job.job_id}`)}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>Apply Now</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && jobs.length === 0 && (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-amber-300 flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 fill-current" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Starred Jobs Yet</h3>
            <p className="text-slate-400 text-xs mb-6">
              When swiping through roles on the Discover Jobs page, click the star button to save them here for later review.
            </p>
            <button
              onClick={() => navigate("/jobs")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>Explore & Swipe Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default InterestedJobs;