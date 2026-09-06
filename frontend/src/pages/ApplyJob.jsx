import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";

import {
  FaArrowLeft,
  FaBriefcase,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaFilePdf,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardCheck,
} from "react-icons/fa";

import api from "../services/api";

function ApplyJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    resume: null,
    portfolio_url: "",
    linkedin_url: "",
    github_url: "",
    expected_salary: "",
    available_from: "",
  });

  // ============================================
  // LOAD JOB
  // ============================================

  useEffect(() => {
    const loadJob = async () => {
      try {
        const response = await api.get(`jobs/${id}/`);

        console.log("JOB RESPONSE:", response.data);

        setJob(response.data);
      } catch (error) {
        console.error(
          "JOB LOAD ERROR:",
          error.response?.status,
          error.response?.data || error.message
        );

        toast.error("Unable to load job.");

        setTimeout(() => {
          navigate("/applications");
        }, 1200);
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id, navigate]);

  // ============================================
  // NORMALIZE SKILLS
  // ============================================

  const normalizeSkills = (value) => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .map((skill) => String(skill).trim())
        .filter(Boolean);
    }

    return String(value)
      .replace(/\n/g, ",")
      .replace(/;/g, ",")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  };

  // ============================================
  // GET MATCHED SKILLS
  // ============================================

  const matchedSkills = normalizeSkills(job?.matched_skills);

  // ============================================
  // GET MISSING SKILLS
  // ============================================

  const missingSkills = normalizeSkills(job?.missing_skills);

  // ============================================
  // GET REQUIRED SKILLS
  // ============================================

  const requiredSkills = normalizeSkills(job?.required_skills);

  // ============================================
  // MATCH PERCENTAGE
  // ============================================

  const matchPercentage =
    Number(job?.match_percentage ?? job?.skill_match_percentage ?? 0);

  // ============================================
  // FORM CHANGE
  // ============================================

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "resume") {
      const file = files?.[0];

      if (!file) {
        setForm((previous) => ({
          ...previous,
          resume: null,
        }));

        return;
      }

      // PDF only
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file.");

        e.target.value = "";

        setForm((previous) => ({
          ...previous,
          resume: null,
        }));

        return;
      }

      // 5 MB maximum
      if (file.size > 5 * 1024 * 1024) {
        toast.error("PDF must be smaller than 5 MB.");

        e.target.value = "";

        setForm((previous) => ({
          ...previous,
          resume: null,
        }));

        return;
      }

      setForm((previous) => ({
        ...previous,
        resume: file,
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================
  // SUBMIT APPLICATION
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    if (!form.resume) {
      toast.error("Please upload your resume PDF.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("job_id", id);
      formData.append("resume", form.resume);

      if (form.portfolio_url) {
        formData.append(
          "portfolio_url",
          form.portfolio_url
        );
      }

      if (form.linkedin_url) {
        formData.append(
          "linkedin_url",
          form.linkedin_url
        );
      }

      if (form.github_url) {
        formData.append(
          "github_url",
          form.github_url
        );
      }

      if (form.expected_salary) {
        formData.append(
          "expected_salary",
          form.expected_salary
        );
      }

      if (form.available_from) {
        formData.append(
          "available_from",
          form.available_from
        );
      }

      console.log("SUBMITTING APPLICATION");

      await api.post("applications/", formData);

      toast.success(
        "Application submitted successfully!"
      );

      setTimeout(() => {
        navigate("/applications");
      }, 1000);
    } catch (error) {
      console.error(
        "APPLICATION SUBMIT ERROR:",
        error.response?.status,
        error.response?.data || error.message
      );

      const data = error.response?.data;

      let message = "Unable to submit application.";

      if (data?.detail) {
        message = data.detail;
      } else if (data?.resume) {
        message = Array.isArray(data.resume)
          ? data.resume.join(", ")
          : data.resume;
      } else if (data?.job_id) {
        message = Array.isArray(data.job_id)
          ? data.job_id.join(", ")
          : data.job_id;
      } else if (data?.portfolio_url) {
        message = Array.isArray(data.portfolio_url)
          ? data.portfolio_url.join(", ")
          : data.portfolio_url;
      } else if (data?.linkedin_url) {
        message = Array.isArray(data.linkedin_url)
          ? data.linkedin_url.join(", ")
          : data.linkedin_url;
      } else if (data?.github_url) {
        message = Array.isArray(data.github_url)
          ? data.github_url.join(", ")
          : data.github_url;
      }

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Toaster position="top-right" />

        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">
            💼
          </div>

          <h2 className="text-xl font-bold text-indigo-700">
            Loading Job...
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Preparing your application form.
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // PAGE
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-6">

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <div className="max-w-7xl mx-auto">

        {/* ========================================
            BACK BUTTON
        ======================================== */}

        <button
          type="button"
          onClick={() => navigate("/applications")}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-semibold text-sm mb-5"
        >
          <FaArrowLeft />
          Back to Applications
        </button>

        {/* ========================================
            JOB HEADER
        ======================================== */}

        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 sm:p-7 mb-5">

          <div className="flex items-start gap-4">

            <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <FaBriefcase className="text-indigo-600 text-2xl" />
            </div>

            <div className="min-w-0 flex-1">

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Apply for {job?.title || "Job"}
              </h1>

              {job?.company && (
                <p className="text-indigo-600 font-semibold mt-1">
                  {job.company}
                </p>
              )}

              {job?.location && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                  <FaMapMarkerAlt />
                  {job.location}
                </div>
              )}

            </div>

            {/* MATCH SCORE */}

            <div className="hidden sm:flex flex-col items-center justify-center bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-3">

              <span className="text-xs text-gray-500 font-semibold">
                Match
              </span>

              <span className="text-2xl font-bold text-indigo-600">
                {matchPercentage}%
              </span>

            </div>

          </div>

        </div>

        {/* ========================================
            TWO COLUMN LAYOUT
        ======================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* ======================================
              LEFT SIDE - JOB MATCH
          ====================================== */}

          <div className="space-y-5">

            {/* MATCH SUMMARY */}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7">

              <div className="flex items-center gap-2 mb-5">

                <FaClipboardCheck className="text-indigo-600 text-xl" />

                <h2 className="text-xl font-bold text-gray-800">
                  Why This Job Matches You
                </h2>

              </div>

              {/* MOBILE MATCH SCORE */}

              <div className="sm:hidden mb-5 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">

                <span className="font-semibold text-gray-700">
                  Overall Match
                </span>

                <span className="text-2xl font-bold text-indigo-600">
                  {matchPercentage}%
                </span>

              </div>

              {/* MATCHED SKILLS */}

              <div className="mb-6">

                <div className="flex items-center gap-2 mb-3">

                  <FaCheckCircle className="text-green-500" />

                  <h3 className="font-bold text-gray-800">
                    Matched Skills
                  </h3>

                  <span className="ml-auto text-sm font-semibold text-green-600">
                    {matchedSkills.length}
                  </span>

                </div>

                {matchedSkills.length > 0 ? (

                  <div className="flex flex-wrap gap-2">

                    {matchedSkills.map((skill, index) => (

                      <span
                        key={`${skill}-${index}`}
                        className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium"
                      >
                        ✓ {skill}
                      </span>

                    ))}

                  </div>

                ) : (

                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
                    No matching skills were found in your resume.
                  </div>

                )}

              </div>

              {/* MISSING SKILLS */}

              <div>

                <div className="flex items-center gap-2 mb-3">

                  <FaTimesCircle className="text-red-500" />

                  <h3 className="font-bold text-gray-800">
                    Skills You Are Missing
                  </h3>

                  <span className="ml-auto text-sm font-semibold text-red-600">
                    {missingSkills.length}
                  </span>

                </div>

                {missingSkills.length > 0 ? (

                  <div className="flex flex-wrap gap-2">

                    {missingSkills.map((skill, index) => (

                      <span
                        key={`${skill}-${index}`}
                        className="px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
                      >
                        ! {skill}
                      </span>

                    ))}

                  </div>

                ) : (

                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-700 font-medium">
                    Great! You have all the required skills for this job.
                  </div>

                )}

              </div>

            </div>

            {/* REQUIRED SKILLS */}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7">

              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Required Skills
              </h2>

              {requiredSkills.length > 0 ? (

                <div className="flex flex-wrap gap-2">

                  {requiredSkills.map((skill, index) => {

                    const isMatched = matchedSkills.some(
                      (matched) =>
                        matched.toLowerCase() ===
                        skill.toLowerCase()
                    );

                    return (
                      <span
                        key={`${skill}-${index}`}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          isMatched
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {isMatched ? "✓" : "!"} {skill}
                      </span>
                    );
                  })}

                </div>

              ) : (

                <p className="text-sm text-gray-500">
                  No specific skills listed for this position.
                </p>

              )}

            </div>

            {/* JOB DESCRIPTION */}

            {job?.description && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7">

                <h2 className="text-lg font-bold text-gray-800 mb-3">
                  Job Description
                </h2>

                <div className="text-sm text-gray-600 leading-6 whitespace-pre-line max-h-96 overflow-y-auto pr-2">
                  {job.description}
                </div>

              </div>
            )}

          </div>

          {/* ======================================
              RIGHT SIDE - APPLICATION FORM
          ====================================== */}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7 lg:sticky lg:top-5"
          >

            <div className="flex items-center gap-2 mb-5">

              <FaFilePdf className="text-red-500" />

              <h2 className="text-xl font-bold text-gray-800">
                Application Details
              </h2>

            </div>

            {/* RESUME */}

            <div className="mb-6">

              <label className="block text-sm font-bold text-gray-700 mb-2">
                Resume
                <span className="text-red-500 ml-1">*</span>
              </label>

              <label
                htmlFor="resume"
                className="block border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 rounded-2xl p-6 text-center cursor-pointer transition"
              >

                <FaFilePdf className="mx-auto text-red-500 text-4xl mb-3" />

                {form.resume ? (
                  <>
                    <p className="font-bold text-gray-700 break-all">
                      {form.resume.name}
                    </p>

                    <p className="text-sm text-green-600 mt-1 font-medium">
                      PDF selected successfully
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      Click to choose a different PDF
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-gray-700">
                      Upload your Resume
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Click here to select a PDF file
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      PDF only • Maximum 5 MB
                    </p>
                  </>
                )}

                <input
                  id="resume"
                  type="file"
                  name="resume"
                  accept="application/pdf,.pdf"
                  onChange={handleChange}
                  className="hidden"
                />

              </label>

            </div>

            {/* PORTFOLIO */}

            <div className="mb-5">

              <label className="block text-sm font-bold text-gray-700 mb-2">
                Portfolio URL
              </label>

              <input
                type="url"
                name="portfolio_url"
                value={form.portfolio_url}
                onChange={handleChange}
                placeholder="https://yourportfolio.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>

            {/* LINKEDIN */}

            <div className="mb-5">

              <label className="block text-sm font-bold text-gray-700 mb-2">
                LinkedIn URL
              </label>

              <input
                type="url"
                name="linkedin_url"
                value={form.linkedin_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourname"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>

            {/* GITHUB */}

            <div className="mb-5">

              <label className="block text-sm font-bold text-gray-700 mb-2">
                GitHub URL
              </label>

              <input
                type="url"
                name="github_url"
                value={form.github_url}
                onChange={handleChange}
                placeholder="https://github.com/yourname"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>

            {/* EXPECTED SALARY */}

            <div className="mb-5">

              <label className="block text-sm font-bold text-gray-700 mb-2">
                Expected Salary
              </label>

              <input
                type="number"
                name="expected_salary"
                value={form.expected_salary}
                onChange={handleChange}
                placeholder="500000"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>

            {/* AVAILABLE FROM */}

            <div className="mb-6">

              <label className="block text-sm font-bold text-gray-700 mb-2">
                Available From
              </label>

              <input
                type="date"
                name="available_from"
                value={form.available_from}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >

              <FaPaperPlane />

              {submitting
                ? "Submitting..."
                : "Submit Application"}

            </button>

          </form>

        </div>

      </div>
    </div>
  );
}

export default ApplyJob;
