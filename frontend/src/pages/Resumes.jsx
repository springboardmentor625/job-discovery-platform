import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Star,
  Zap,
  Loader2,
  AlertCircle,
  Plus,
  X
} from "lucide-react";

function Resumes() {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      setResumes(response.data);
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

      setSuccess("Resume uploaded and parsed successfully!");
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

  const handleDelete = async (resumeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?"
    );
    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/resumes/${resumeId}`);
      setSuccess("Resume deleted successfully.");
      await fetchResumes();

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to delete resume."
      );
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
              Upload PDF resumes, view extracted tech skills, and monitor baseline ATS readiness.
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

        {/* Upload Form Modal/Box */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
          >
            <h2 className="text-xl font-bold text-white mb-2">Upload Resume PDF</h2>
            <p className="text-slate-400 text-xs mb-6">
              SwipeX extracts your skills, work history, and keywords to rank job compatibility automatically.
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
                      <span>Analyzing Resume...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload & Extract Skills</span>
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
            <p className="text-slate-400 text-sm font-medium">Loading your resumes...</p>
          </div>
        )}

        {/* Resumes Grid */}
        {!loading && !error && resumes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resumes.map((resume) => {
              const skills = normalizeSkills(resume.extracted_skills);
              const scoreNum = parseFloat(resume.ats_score) || 0;

              return (
                <motion.div
                  key={resume.resume_id}
                  whileHover={{ y: -3 }}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl transition-all backdrop-blur-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <h3 className="text-lg font-bold text-white">
                            {resume.resume_name}
                          </h3>
                        </div>
                        {resume.is_default && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Star className="w-3 h-3 fill-current" />
                            Default Application Resume
                          </span>
                        )}
                      </div>

                      {/* Score Badge */}
                      <div className="text-right bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
                        <p className="text-[10px] uppercase font-semibold text-slate-400">
                          ATS Score
                        </p>
                        <p className="text-xl font-black text-emerald-400">
                          {scoreNum > 0 ? scoreNum : "N/A"}
                          {scoreNum > 0 && <span className="text-xs text-slate-400 font-normal"> /100</span>}
                        </p>
                      </div>
                    </div>

                    {/* Progress Gauge */}
                    {scoreNum > 0 && (
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-5">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(scoreNum, 100)}%` }}
                        />
                      </div>
                    )}

                    {/* Extracted Skills */}
                    {skills.length > 0 ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
                          Extracted Skills ({skills.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic mb-4">
                        No parsed skills stored for this entry.
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                    {!resume.is_default && (
                      <button
                        onClick={() => handleSetDefault(resume)}
                        className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700 cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(resume.resume_id)}
                      className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
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
              Upload your PDF resume to automatically parse your skills and enable 1-click applications.
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