import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api";
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Plus,
  X,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  FileText,
  Clock
} from "lucide-react";

export default function PostJob() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    company_mode: "existing", // "existing" or "new"
    company_id: "",
    company_name: "",
    company_industry: "Technology",
    company_website: "",
    company_headquarters: "",
    company_description: "",
    location: "",
    employment_type: "Full-time",
    experience_required: "1-3 years",
    salary_min: "",
    salary_max: "",
    description: "",
    requirements: "",
    is_active: true
  });

  const [skillsList, setSkillsList] = useState([
    "React",
    "Node.js",
    "TypeScript",
    "PostgreSQL"
  ]);
  const [newSkillInput, setNewSkillInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const commonSkills = [
    "Python",
    "React",
    "FastAPI",
    "Node.js",
    "TypeScript",
    "JavaScript",
    "SQL",
    "PostgreSQL",
    "MongoDB",
    "AWS",
    "Docker",
    "Kubernetes",
    "GraphQL",
    "Java",
    "Go",
    "Tailwind CSS"
  ];

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await api.get("/companies/");
      setCompanies(res.data);
      if (res.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          company_id: res.data[0].company_id,
          company_name: res.data[0].company_name
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          company_mode: "new"
        }));
      }
    } catch (err) {
      console.error("Failed to load companies:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || newSkillInput).trim();
    if (!trimmed) return;
    if (!skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
    }
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title.trim()) {
      setError("Please enter a job title.");
      return;
    }

    if (skillsList.length === 0) {
      setError("Please add at least one required tech skill.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: formData.title.trim(),
        location: formData.location.trim() || "Remote",
        employment_type: formData.employment_type,
        experience_required: formData.experience_required,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        skills_required: skillsList,
        description: formData.description.trim(),
        requirements: formData.requirements.trim() || null,
        is_active: formData.is_active
      };

      if (formData.company_mode === "existing" && formData.company_id) {
        payload.company_id = parseInt(formData.company_id);
      } else if (formData.company_name.trim()) {
        payload.company_name = formData.company_name.trim();
        payload.company_industry = formData.company_industry.trim() || "Information Technology";
        payload.company_website = formData.company_website.trim() || null;
        payload.company_headquarters = formData.company_headquarters.trim() || null;
        payload.company_description = formData.company_description.trim() || null;
      }

      await api.post("/jobs/", payload);

      setSuccess("Job posting published successfully! Redirecting...");
      setTimeout(() => {
        navigate("/recruiter/jobs");
      }, 1000);

    } catch (err) {
      console.error("Failed to post job:", err);
      setError(
        err.response?.data?.detail || "Failed to create job posting. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                New Opportunity
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Create & Publish Job Posting
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Fill in the role details below to match with candidate resumes and receive smart applications.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/recruiter/jobs")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            Cancel
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl"
        >
          {/* Section 1: Basic Job Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              1. Position Details
            </h2>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Job Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Full Stack Engineer, ML Engineer, DevOps Specialist"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Location & Employment Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA (Remote)"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Employment Type
                </label>
                <select
                  value={formData.employment_type}
                  onChange={(e) =>
                    setFormData({ ...formData, employment_type: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            {/* Experience & Salary Range */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Experience Level
                </label>
                <select
                  value={formData.experience_required}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience_required: e.target.value
                    })
                  }
                  className="w-full px-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                >
                  <option value="0-1 years (Entry Level)">0-1 years (Entry Level)</option>
                  <option value="1-3 years (Junior / Mid)">1-3 years (Junior / Mid)</option>
                  <option value="3-5 years (Mid-Senior)">3-5 years (Mid-Senior)</option>
                  <option value="5+ years (Senior / Lead)">5+ years (Senior / Lead)</option>
                  <option value="8+ years (Principal / Architect)">8+ years (Principal / Architect)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Min Salary ($ / yr)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    placeholder="e.g. 90000"
                    value={formData.salary_min}
                    onChange={(e) =>
                      setFormData({ ...formData, salary_min: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Max Salary ($ / yr)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    placeholder="e.g. 140000"
                    value={formData.salary_max}
                    onChange={(e) =>
                      setFormData({ ...formData, salary_max: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Section 2: Company Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              2. Company & Employer
            </h2>

            {/* Existing vs New Company Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, company_mode: "existing" })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  formData.company_mode === "existing"
                    ? "bg-purple-600 text-white shadow"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Select Existing Company
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, company_mode: "new" })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  formData.company_mode === "new"
                    ? "bg-purple-600 text-white shadow"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                + Register New Company
              </button>
            </div>

            {formData.company_mode === "existing" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Hiring Company
                </label>
                {loadingCompanies ? (
                  <div className="text-xs text-slate-400">Loading companies...</div>
                ) : companies.length > 0 ? (
                  <select
                    value={formData.company_id}
                    onChange={(e) => {
                      const selected = companies.find(
                        (c) => c.company_id === parseInt(e.target.value)
                      );
                      setFormData({
                        ...formData,
                        company_id: e.target.value,
                        company_name: selected?.company_name || ""
                      });
                    }}
                    className="w-full px-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition cursor-pointer"
                  >
                    {companies.map((comp) => (
                      <option key={comp.company_id} value={comp.company_id}>
                        {comp.company_name} ({comp.industry || "Tech"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-400">
                    No companies found. Please switch to "Register New Company" above.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/70">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme AI Corp"
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_name: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Artificial Intelligence / SaaS"
                      value={formData.company_industry}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_industry: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Website (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://example.com"
                      value={formData.company_website}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_website: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Headquarters (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New York, NY"
                      value={formData.company_headquarters}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_headquarters: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-800" />

          {/* Section 3: Tech Skills */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              3. Required Tech Skills
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Skills & Tech Stack <span className="text-rose-400">*</span>
              </label>

              {/* Selected Skills Pills */}
              <div className="flex flex-wrap gap-2 mb-3 min-h-[36px] p-2 bg-slate-800/60 rounded-xl border border-slate-700/60 items-center">
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-blue-300 border border-blue-500/40"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-white transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {skillsList.length === 0 && (
                  <span className="text-xs text-slate-500 italic">
                    No skills added yet. Type below or pick suggestions.
                  </span>
                )}
              </div>

              {/* Skill Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a skill (e.g. Docker, GraphQL) and press Enter"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={handleKeyDownSkill}
                  className="flex-1 px-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-3">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
                  Quick Add Suggestions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {commonSkills
                    .filter((s) => !skillsList.includes(s))
                    .slice(0, 10)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddSkill(s)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Section 4: Description & Requirements */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              4. Description & Responsibilities
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Role Overview & Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={5}
                required
                placeholder="Describe the role mission, day-to-day responsibilities, what makes this team unique, and expected outcomes..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Job Requirements & Qualifications <span className="text-slate-500">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Key requirements: BS in CS or equivalent experience, experience shipping production systems, excellent communication..."
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Publish Options */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_check"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="is_active_check"
                className="text-xs text-slate-300 font-medium cursor-pointer"
              >
                Publish as Active Listing immediately
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Job...</span>
                </>
              ) : (
                <>
                  <span>Publish Job Posting</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

