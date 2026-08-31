import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  FileText,
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
  Send,
  Star,
  Plus
} from "lucide-react";

function ApplyJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [jobResponse, resumeResponse] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get("/resumes/"),
      ]);

      setJob(jobResponse.data);
      setResumes(resumeResponse.data);

      const defaultResume = resumeResponse.data.find(
        (resume) => resume.is_default
      );

      if (defaultResume) {
        setSelectedResume(String(defaultResume.resume_id));
      } else if (resumeResponse.data.length > 0) {
        setSelectedResume(String(resumeResponse.data[0].resume_id));
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to load job or resumes."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedResume) {
      setError("Please select a resume before submitting your application.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await api.post("/applications/", {
        job_id: Number(jobId),
        resume_id: Number(selectedResume),
      });

      setSuccess("Application submitted successfully!");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to submit application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium">Preparing application...</p>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center bg-slate-900 border border-rose-500/30 p-8 rounded-3xl max-w-md">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p className="text-rose-300 text-sm mb-5">{error}</p>
          <button
            onClick={() => navigate("/jobs")}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 md:px-8 py-10">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back navigation */}
        <button
          onClick={() => navigate(`/jobs/${jobId}`)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Job Overview</span>
        </button>

        {/* Card Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">

          {/* Job Banner Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Direct Job Application
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {job?.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100 mt-3">
              {job?.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location}
                </span>
              )}
              {job?.employment_type && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  {job.employment_type}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Application Submitted!
                </h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
                  Your resume has been forwarded to the recruiter. Track your real-time status and notifications anytime.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => navigate("/applications")}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
                  >
                    View My Applications
                  </button>
                  <button
                    onClick={() => navigate("/jobs")}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    Discover More Jobs
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white">Select Application Resume</h2>
                  <p className="text-slate-400 text-xs mt-1">
                    Choose which uploaded resume profile you'd like to submit for this opening.
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-400 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-3">
                  {resumes.length === 0 ? (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
                      <FileText className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-white">No Resume Found</h3>
                      <p className="text-xs text-slate-400 mt-1 mb-4">
                        Please upload your PDF resume first to apply for roles.
                      </p>
                      <button
                        onClick={() => navigate("/resumes")}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 mx-auto cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Upload Resume</span>
                      </button>
                    </div>
                  ) : (
                    resumes.map((resume) => (
                      <label
                        key={resume.resume_id}
                        className={`block cursor-pointer rounded-2xl border p-4 transition ${
                          selectedResume === String(resume.resume_id)
                            ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                            : "border-slate-800 bg-slate-800/50 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="resume"
                            value={resume.resume_id}
                            checked={selectedResume === String(resume.resume_id)}
                            onChange={(e) => setSelectedResume(e.target.value)}
                            className="h-4 w-4 text-blue-600 accent-blue-600 focus:ring-blue-500"
                          />

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-400" />
                              <h3 className="text-sm font-bold text-white">
                                {resume.resume_name}
                              </h3>
                              {resume.is_default && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  Default
                                </span>
                              )}
                            </div>
                            {resume.ats_score && (
                              <p className="text-[11px] text-slate-400 mt-1">
                                ATS Readiness: <span className="text-emerald-400 font-semibold">{resume.ats_score}/100</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                {resumes.length > 0 && (
                  <button
                    onClick={handleApply}
                    disabled={submitting}
                    className="mt-8 w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Application Now</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ApplyJob;