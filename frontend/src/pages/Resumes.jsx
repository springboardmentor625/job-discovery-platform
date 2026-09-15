import { useEffect, useState } from "react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Star,
  Zap,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Plus,
  X,
  RotateCw,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Check
} from "lucide-react";

function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculatingId, setRecalculatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/resumes/");
      setResumes(response.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to load resumes."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    const file = e.target.resume_file.files[0];

    if (!file) {
      setError("Please select a PDF resume to upload.");
      return;
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Only PDF files are supported for ATS analysis.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", file);

      await api.post("/resumes/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Resume uploaded and analyzed successfully with ATS scoring!");
      e.target.reset();
      setShowForm(false);
      await fetchResumes();

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to upload resume. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateATS = async (resumeId) => {
    try {
      setRecalculatingId(resumeId);
      setError("");
      setSuccess("");

      const response = await api.post(`/resumes/${resumeId}/recalculate-ats`);
      
      setResumes((prev) =>
        prev.map((r) => (r.resume_id === resumeId ? response.data : r))
      );

      setSuccess("ATS Score & breakdown recalculated successfully.");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to recalculate ATS score for this resume."
      );
    } finally {
      setRecalculatingId(null);
    }
  };

  const handleSetDefault = async (resume) => {
    try {
      setError("");
      setSuccess("");

      await Promise.all(
        resumes.map((item) =>
          api.put(`/resumes/${item.resume_id}`, {
            is_default: item.resume_id === resume.resume_id,
          })
        )
      );

      setSuccess("Default application resume updated.");
      await fetchResumes();

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to update default resume."
      );
    }
  };

  const handleDelete = async (resumeId, resumeName) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${resumeName || 'this resume'}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(resumeId);
      setError("");
      setSuccess("");

      await api.delete(`/resumes/${resumeId}`);
      setSuccess(`Resume "${resumeName || ''}" deleted successfully.`);
      await fetchResumes();

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to delete resume. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSuggestions = (resumeId) => {
    setExpandedSuggestions((prev) => ({
      ...prev,
      [resumeId]: !prev[resumeId],
    }));
  };

  const normalizeSkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    if (typeof skills === "string") {
      return skills.replace(";", ",").split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const getScoreBadgeProps = (score) => {
    if (score >= 80) {
      return {
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/30",
        label: "Excellent (ATS Ready)",
        barColor: "bg-gradient-to-r from-emerald-500 to-teal-400"
      };
    }
    if (score >= 65) {
      return {
        color: "text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/30",
        label: "Good (Competitive)",
        barColor: "bg-gradient-to-r from-blue-500 to-indigo-400"
      };
    }
    if (score >= 45) {
      return {
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/30",
        label: "Fair (Needs Polish)",
        barColor: "bg-gradient-to-r from-amber-500 to-orange-400"
      };
    }
    return {
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/30",
      label: "Needs Improvement",
      barColor: "bg-gradient-to-r from-rose-500 to-red-400"
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" />
              ATS Resume Center
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              My Resumes & ATS Profiles
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Upload PDF resumes, evaluate 5-dimension ATS scores, and get actionable suggestions to beat recruiter filters.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setSuccess("");
            }}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer"
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Upload New Resume</span>
              </>
            )}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-400 text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-400 text-sm flex items-start gap-2.5"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">{success}</div>
          </motion.div>
        )}

        {/* Upload Form Box */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
          >
            <h2 className="text-xl font-bold text-white mb-2">Upload Resume PDF</h2>
            <p className="text-slate-400 text-xs mb-6">
              SwipeX automatically parses your PDF, tests standard ATS sections, scans tech skills, and computes your 0–100 ATS Score.
            </p>

            <form onSubmit={handleUploadResume} className="space-y-5">
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-800/40 transition">
                <UploadCloud className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-white mb-1">
                  Choose a PDF document to upload
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Standard format (.pdf), maximum size 10MB
                </p>
                <input
                  type="file"
                  name="resume_file"
                  accept=".pdf,application/pdf"
                  required
                  className="block mx-auto text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing ATS Dimensions...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload & Calculate ATS Score</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading your resumes & ATS profiles...</p>
          </div>
        )}

        {/* Resumes Grid */}
        {!loading && !error && resumes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {resumes.map((resume) => {
              const skills = normalizeSkills(resume.extracted_skills);
              const scoreNum = parseFloat(resume.ats_score) || 0;
              const isRecalculating = recalculatingId === resume.resume_id;
              const breakdown = resume.ats_breakdown || {
                structure: 0,
                sections: 0,
                skills: 0,
                keywords: 0,
                readability: 0,
              };
              const suggestions = Array.isArray(resume.ats_suggestions)
                ? resume.ats_suggestions
                : [];
              const scoreProps = getScoreBadgeProps(scoreNum);
              const isExpanded = !!expandedSuggestions[resume.resume_id];

              return (
                <motion.div
                  key={resume.resume_id}
                  whileHover={{ y: -2 }}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 shadow-xl transition-all backdrop-blur-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Resume Name & Score Badge */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-white truncate">
                              {resume.resume_name}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {resume.is_default && (
                          <span className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Star className="w-3 h-3 fill-current" />
                            Default Application Resume
                          </span>
                        )}
                      </div>

                      {/* Score Badge (Right Side) */}
                      <div className={`text-right px-3.5 py-2 rounded-2xl border shrink-0 ${scoreProps.bg}`}>
                        <div className="flex items-center justify-end gap-1.5 mb-0.5">
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            ATS Score
                          </p>
                        </div>
                        <p className={`text-2xl font-black ${scoreProps.color} tracking-tight`}>
                          {scoreNum > 0 ? scoreNum : 0}
                          <span className="text-xs text-slate-400 font-normal"> /100</span>
                        </p>
                        <p className="text-[10px] font-semibold text-slate-300 mt-0.5">
                          {scoreNum > 0 ? scoreProps.label : "Unavailable"}
                        </p>
                      </div>
                    </div>

                    {/* Progress Gauge */}
                    <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden mb-5">
                      <div
                        className={`${scoreProps.barColor} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(scoreNum, 100)}%` }}
                      />
                    </div>

                    {/* Unparseable / Empty Warning */}
                    {scoreNum === 0 && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-5 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-amber-200">ATS Score Unavailable</p>
                          <p className="text-slate-300 text-[11px] mt-0.5">
                            Resume content could not be extracted from this PDF. Please ensure your PDF contains searchable text, or click <strong>Recalculate ATS</strong> below.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 5-Dimension ATS Breakdown */}
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>ATS Score Breakdown</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">5 Dimensions</span>
                      </div>

                      <div className="space-y-2.5">
                        {/* 1. Structure & Contact */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300 text-[11px]">Structure & Contact Info</span>
                            <span className="font-semibold text-slate-200 text-[11px]">{breakdown.structure || 0}/20</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(((breakdown.structure || 0) / 20) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* 2. Core Sections */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300 text-[11px]">Core Sections (Edu, Exp, Proj)</span>
                            <span className="font-semibold text-slate-200 text-[11px]">{breakdown.sections || 0}/20</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(((breakdown.sections || 0) / 20) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* 3. Skills Breadth */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300 text-[11px]">Skills Breadth & Tech Stack</span>
                            <span className="font-semibold text-slate-200 text-[11px]">{breakdown.skills || 0}/20</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-teal-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(((breakdown.skills || 0) / 20) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* 4. Action Verbs & Impact */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300 text-[11px]">Action Verbs & Impact Metrics</span>
                            <span className="font-semibold text-slate-200 text-[11px]">{breakdown.keywords || 0}/20</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(((breakdown.keywords || 0) / 20) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* 5. Readability & Length */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300 text-[11px]">Readability & Formatting</span>
                            <span className="font-semibold text-slate-200 text-[11px]">{breakdown.readability || 0}/20</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(((breakdown.readability || 0) / 20) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions Section */}
                    {suggestions.length > 0 && (
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={() => toggleSuggestions(resume.resume_id)}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 text-left transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-semibold text-slate-200">
                              ATS Optimization Checklist ({suggestions.length})
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 space-y-2 overflow-hidden"
                            >
                              {suggestions.map((sugg, idx) => {
                                const isWarning = sugg.type === "warning";
                                const isSuccess = sugg.type === "success";
                                const isError = sugg.type === "error";

                                return (
                                  <div
                                    key={idx}
                                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                                      isError
                                        ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                                        : isWarning
                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                                        : isSuccess
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                        : "bg-blue-500/10 border-blue-500/20 text-blue-300"
                                    }`}
                                  >
                                    {isError ? (
                                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                                    ) : isWarning ? (
                                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                                    ) : isSuccess ? (
                                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                                    ) : (
                                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                                    )}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                                          {sugg.category || "Recommendation"}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-200">
                                        {sugg.message || sugg}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Extracted Skills */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                          Extracted Tech Skills ({skills.length})
                        </p>
                      </div>
                      {skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          No tech skills recognized in this PDF.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800/80">
                    <button
                      onClick={() => handleRecalculateATS(resume.resume_id)}
                      disabled={isRecalculating}
                      title="Recalculate ATS Score"
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isRecalculating ? "animate-spin text-blue-400" : ""}`} />
                      <span>{isRecalculating ? "Scoring..." : "Recalculate ATS"}</span>
                    </button>

                    {!resume.is_default && (
                      <button
                        onClick={() => handleSetDefault(resume)}
                        className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700 cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(resume.resume_id, resume.resume_name)}
                      disabled={deletingId === resume.resume_id || isRecalculating}
                      title="Delete Resume"
                      className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === resume.resume_id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && resumes.length === 0 && (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Resumes Uploaded</h3>
            <p className="text-slate-400 text-xs mb-6">
              Upload your PDF resume to automatically calculate your ATS readiness score and extract tech skills for 1-click applications.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 mx-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Your First Resume</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Resumes;
