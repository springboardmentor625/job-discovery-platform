import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
  Building,
  ChevronLeft,
  Share2,
  Heart,
} from "lucide-react";

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [atsReport, setAtsReport] = useState(null);
  const [showATS, setShowATS] = useState(false);
  const [resumes, setResumes] = useState([]);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);

      // Fetch job details
      const jobRes = await api.get(`/jobs/${jobId}`);
      setJob(jobRes.data);

      // Fetch company details
      const companyRes = await api.get(`/companies/${jobRes.data.company_id}`);
      setCompany(companyRes.data);

      // Fetch user resumes
      const resumesRes = await api.get("/resumes/");
      setResumes(resumesRes.data);

      // Try to fetch ATS report if token exists
      if (token && resumesRes.data.length > 0) {
        try {
          const reportRes = await api.post("/ats-reports/analyze", null, {
            params: {
              resume_id: resumesRes.data[0].resume_id,
              job_id: jobId,
            },
          });
          setAtsReport(reportRes.data);
        } catch (e) {
          console.log("ATS report not available");
        }
      }

      setError(null);
    } catch (err) {
      setError("Failed to load job details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!token) {
      navigate("/login");
      return;
    }
    navigate(`/apply/${jobId}`);
  };

  const handleSaveJob = () => {
    // TODO: Implement save job functionality
    console.log("Save job for later");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading job details...</div>
      </div>
    );
  }

  if (!job || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/jobs")}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Jobs
          </button>
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-6 py-8 rounded-lg text-center">
            {error || "Job not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => navigate("/jobs")}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Jobs
        </motion.button>

        {/* Job Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8 text-white"
        >
          <h1 className="text-4xl font-bold mb-2">{job.title}</h1>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-xl opacity-90">
              {company?.company_name || "Company"}
            </p>
            {(job.competition_level || job.applicant_count !== undefined) && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                job.competition_level === 'Low' || job.is_early_applicant
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                  : job.competition_level === 'Medium'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                  : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
              }`}>
                {job.competition_level === 'Low' || job.is_early_applicant ? '🔥 Early Applicant • Low Competition' : `${job.competition_level || 'Medium'} Competition`} ({job.applicant_count || 0} applicants)
              </span>
            )}
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {job.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{job.location}</span>
              </div>
            )}
            {job.employment_type && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                <span>{job.employment_type}</span>
              </div>
            )}
            {job.salary_min && job.salary_max && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span>
                  ${job.salary_min}k - ${job.salary_max}k
                </span>
              </div>
            )}
            {job.posted_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>
                  {new Date(job.posted_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {job.description && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800 rounded-lg p-6"
              >
                <h2 className="text-2xl font-bold text-white mb-4">
                  Job Description
                </h2>
                <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                  {job.description}
                </p>
              </motion.div>
            )}

            {/* Required Skills */}
            {job.required_skills && job.required_skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800 rounded-lg p-6"
              >
                <h2 className="text-2xl font-bold text-white mb-4">
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Experience Required */}
            {job.experience_required && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800 rounded-lg p-6"
              >
                <h2 className="text-2xl font-bold text-white mb-4">
                  Experience Required
                </h2>
                <p className="text-slate-300">{job.experience_required}</p>
              </motion.div>
            )}

            {/* Company Info */}
            {company && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800 rounded-lg p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Building className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">
                    About {company.company_name}
                  </h2>
                </div>
                <div className="space-y-2 text-slate-300">
                  {company.company_type && (
                    <p>
                      <span className="font-semibold">Type:</span>{" "}
                      {company.company_type}
                    </p>
                  )}
                  {company.industry && (
                    <p>
                      <span className="font-semibold">Industry:</span>{" "}
                      {company.industry}
                    </p>
                  )}
                  {company.headquarters && (
                    <p>
                      <span className="font-semibold">Headquarters:</span>{" "}
                      {company.headquarters}
                    </p>
                  )}
                  {company.website && (
                    <p>
                      <span className="font-semibold">Website:</span>{" "}
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {company.website}
                      </a>
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ATS Analysis */}
            {atsReport && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800 rounded-lg p-6"
              >
                <h2 className="text-2xl font-bold text-white mb-4">
                  ATS Analysis
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700 p-4 rounded">
                      <p className="text-slate-400 text-sm">ATS Score</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {atsReport.ats_score}/100
                      </p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded">
                      <p className="text-slate-400 text-sm">Match</p>
                      <p className="text-2xl font-bold text-green-400">
                        {atsReport.match_percentage}%
                      </p>
                    </div>
                  </div>
                  {atsReport.suggestions && (
                    <div>
                      <p className="text-slate-400 text-sm mb-2">
                        Improvement Tips:
                      </p>
                      <p className="text-slate-300">{atsReport.suggestions}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-8 space-y-4"
            >
              {/* Apply Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleApply}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-lg transition-colors"
              >
                Apply Now
              </motion.button>

              {/* Save Job Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleSaveJob}
                className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Heart className="w-5 h-5" />
                Save Job
              </motion.button>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share
              </motion.button>

              {/* Job Stats */}
              <div className="bg-slate-800 rounded-lg p-6 space-y-3 border border-slate-700">
                <h3 className="font-bold text-white mb-4">Job Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-slate-400">Status</p>
                    <p className="text-white font-medium capitalize">
                      {job.status || "Open"}
                    </p>
                  </div>
                  {job.experience_required && (
                    <div>
                      <p className="text-slate-400">Experience Level</p>
                      <p className="text-white font-medium">
                        {job.experience_required}
                      </p>
                    </div>
                  )}
                  {job.posted_date && (
                    <div>
                      <p className="text-slate-400">Posted</p>
                      <p className="text-white font-medium">
                        {new Date(job.posted_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendation */}
              {atsReport && (
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-4 text-white">
                  <p className="text-sm font-semibold mb-2">✓ Good Match!</p>
                  <p className="text-xs">
                    Your skills align well with this position. Apply now to increase your chances!
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
