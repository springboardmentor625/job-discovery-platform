import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "framer-motion";
import { Zap, TrendingUp, Briefcase, MapPin, DollarSign, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Recommendations() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobsData, setJobsData] = useState({});
  const [companiesData, setCompaniesData] = useState({});

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const recResponse = await api.get("/recommendations/");
      setRecommendations(recResponse.data);

      // Fetch job details for all recommendations
      if (recResponse.data.length > 0) {
        const jobIds = recResponse.data.map((r) => r.job_id);
        const jobPromises = jobIds.map((id) =>
          api.get(`/jobs/${id}`).catch(() => null)
        );
        const jobResponses = await Promise.all(jobPromises);

        const jobs = {};
        const companies = new Set();

        jobResponses.forEach((res) => {
          if (res?.data) {
            jobs[res.data.job_id] = res.data;
            companies.add(res.data.company_id);
          }
        });

        setJobsData(jobs);

        // Fetch company details
        if (companies.size > 0) {
          const companyPromises = Array.from(companies).map((id) =>
            api.get(`/companies/${id}`).catch(() => null)
          );
          const companyResponses = await Promise.all(companyPromises);
          const companyMap = {};

          companyResponses.forEach((res) => {
            if (res?.data) {
              companyMap[res.data.company_id] = res.data;
            }
          });

          setCompaniesData(companyMap);
        }
      }

      setError(null);
    } catch (err) {
      setError("Failed to load recommendations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 80) return "from-green-500 to-emerald-600";
    if (numScore >= 60) return "from-blue-500 to-cyan-600";
    if (numScore >= 40) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-pink-600";
  };

  const getScoreBadge = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 80) return "bg-green-100 text-green-800";
    if (numScore >= 60) return "bg-blue-100 text-blue-800";
    if (numScore >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading recommendations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-500 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Recommended Jobs
              </h1>
              <p className="text-slate-400">
                Personalized opportunities matched to your profile
              </p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Recommendations Grid */}
        {recommendations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              No recommendations yet. Complete your profile to get personalized job matches!
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {recommendations.map((rec, index) => {
              const job = jobsData[rec.job_id];
              const company = job ? companiesData[job.company_id] : null;
              const score = parseFloat(rec.recommendation_score);

              return (
                <motion.div
                  key={rec.recommendation_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-6 mb-4">
                      <div className="flex-1">
                        {job ? (
                          <>
                            <h3 className="text-xl font-bold text-white mb-1">
                              {job.title}
                            </h3>
                            <p className="text-blue-400 mb-3">
                              {company?.company_name || "Unknown Company"}
                            </p>
                          </>
                        ) : (
                          <p className="text-slate-400">Job not found</p>
                        )}

                        {/* Job Details */}
                        {job && (
                          <div className="flex flex-wrap gap-3 mb-4">
                            {job.location && (
                              <div className="flex items-center gap-1 text-slate-300 text-sm">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </div>
                            )}
                            {job.employment_type && (
                              <div className="flex items-center gap-1 text-slate-300 text-sm">
                                <Briefcase className="w-4 h-4" />
                                {job.employment_type}
                              </div>
                            )}
                            {job.salary_min && job.salary_max && (
                              <div className="flex items-center gap-1 text-slate-300 text-sm">
                                <DollarSign className="w-4 h-4" />
                                ${job.salary_min}k - ${job.salary_max}k
                              </div>
                            )}
                          </div>
                        )}

                        {/* Recommendation Reason */}
                        <p className="text-slate-300 text-sm mb-3">
                          {rec.recommendation_reason}
                        </p>

                        {/* Skills */}
                        {rec.matching_skills && rec.matching_skills.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-slate-400 mb-1">
                              Matching Skills:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rec.matching_skills.slice(0, 5).map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-green-500 bg-opacity-20 text-green-300 text-xs rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                              {rec.matching_skills.length > 5 && (
                                <span className="text-slate-400 text-xs px-2 py-1">
                                  +{rec.matching_skills.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Missing Skills */}
                        {rec.missing_skills && rec.missing_skills.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                              <AlertCircle className="w-3 h-3" />
                              Missing Skills:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {rec.missing_skills.slice(0, 3).map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-red-500 bg-opacity-20 text-red-300 text-xs rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                              {rec.missing_skills.length > 3 && (
                                <span className="text-slate-400 text-xs px-2 py-1">
                                  +{rec.missing_skills.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Score Card */}
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className={`w-24 h-24 rounded-lg bg-gradient-to-br ${getScoreColor(
                            rec.recommendation_score
                          )} flex items-center justify-center shadow-lg`}
                        >
                          <div className="text-center">
                            <div className="text-3xl font-bold text-white">
                              {Math.round(score)}
                            </div>
                            <div className="text-xs text-white opacity-75">
                              Match
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getScoreBadge(
                            rec.recommendation_score
                          )}`}
                        >
                          {score >= 80
                            ? "Excellent"
                            : score >= 60
                            ? "Good"
                            : score >= 40
                            ? "Fair"
                            : "Low"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate(`/apply/${rec.job_id}`)}
                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                      >
                        Apply Now
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate(`/jobs/${rec.job_id}`)}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                      >
                        View Details
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg"
          >
            <p className="text-blue-300 text-sm">
              💡 Tip: Complete your profile with more details about your experience and
              skills to get even better recommendations!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
