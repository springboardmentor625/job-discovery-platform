import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import {
  FaArrowLeft,
  FaBriefcase,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaFileAlt,
  FaUpload,
} from "react-icons/fa";

import api from "../services/api";

function ApplyJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    cover_letter: null,
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
  // TEXT INPUT CHANGE
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================
  // COVER LETTER FILE
  // ============================================

  const handleCoverLetterChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, DOC, or DOCX file.");
      e.target.value = "";
      return;
    }

    // Optional 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cover letter must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setForm((previous) => ({
      ...previous,
      cover_letter: file,
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

    // Cover letter required
    if (!form.cover_letter) {
      toast.error("Please upload your cover letter.");
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();

      data.append("job_id", id);

      data.append(
        "cover_letter",
        form.cover_letter
      );

      if (form.portfolio_url) {
        data.append(
          "portfolio_url",
          form.portfolio_url
        );
      }

      if (form.linkedin_url) {
        data.append(
          "linkedin_url",
          form.linkedin_url
        );
      }

      if (form.github_url) {
        data.append(
          "github_url",
          form.github_url
        );
      }

      if (form.expected_salary) {
        data.append(
          "expected_salary",
          form.expected_salary
        );
      }

      if (form.available_from) {
        data.append(
          "available_from",
          form.available_from
        );
      }

      console.log(
        "SUBMITTING APPLICATION:",
        {
          job_id: id,
          cover_letter: form.cover_letter?.name,
          portfolio_url: form.portfolio_url,
          linkedin_url: form.linkedin_url,
          github_url: form.github_url,
          expected_salary: form.expected_salary,
          available_from: form.available_from,
        }
      );

      await api.post(
        "applications/",
        data
      );

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

      const responseData =
        error.response?.data;

      let message =
        "Unable to submit application.";

      if (responseData?.detail) {
        message = responseData.detail;
      } else if (responseData?.job_id) {
        message = Array.isArray(
          responseData.job_id
        )
          ? responseData.job_id.join(", ")
          : responseData.job_id;
      } else if (responseData?.cover_letter) {
        message = Array.isArray(
          responseData.cover_letter
        )
          ? responseData.cover_letter.join(", ")
          : responseData.cover_letter;
      } else if (responseData?.portfolio_url) {
        message = Array.isArray(
          responseData.portfolio_url
        )
          ? responseData.portfolio_url.join(", ")
          : responseData.portfolio_url;
      } else if (responseData?.linkedin_url) {
        message = Array.isArray(
          responseData.linkedin_url
        )
          ? responseData.linkedin_url.join(", ")
          : responseData.linkedin_url;
      } else if (responseData?.github_url) {
        message = Array.isArray(
          responseData.github_url
        )
          ? responseData.github_url.join(", ")
          : responseData.github_url;
      } else if (responseData?.expected_salary) {
        message = Array.isArray(
          responseData.expected_salary
        )
          ? responseData.expected_salary.join(", ")
          : responseData.expected_salary;
      } else if (responseData?.available_from) {
        message = Array.isArray(
          responseData.available_from
        )
          ? responseData.available_from.join(", ")
          : responseData.available_from;
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

      <div className="max-w-3xl mx-auto">

        {/* ========================================
            BACK
        ======================================== */}

        <button
          type="button"
          onClick={() =>
            navigate("/applications")
          }
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

            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">

              <FaBriefcase className="text-indigo-600 text-xl" />

            </div>

            <div className="min-w-0">

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">

                Apply for{" "}

                {job?.title || "Job"}

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

          </div>

        </div>

        {/* ========================================
            APPLICATION FORM
        ======================================== */}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7"
        >

          <div className="flex items-center gap-2 mb-6">

            <FaFileAlt className="text-indigo-600" />

            <h2 className="text-xl font-bold text-gray-800">
              Application Details
            </h2>

          </div>

          {/* ========================================
              COVER LETTER UPLOAD
          ======================================== */}

          <div className="mb-6">

            <label className="block text-sm font-bold text-gray-700 mb-2">
              Cover Letter
            </label>

            <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-5 bg-indigo-50/40">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">

                  <FaFileAlt className="text-indigo-600 text-lg" />

                </div>

                <div>

                  <p className="font-bold text-gray-800">
                    Upload Cover Letter
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    PDF, DOC, or DOCX • Maximum 5 MB
                  </p>

                </div>

              </div>

              <label className="flex items-center justify-center gap-2 w-full cursor-pointer bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-600 font-bold rounded-xl py-3 transition">

                <FaUpload />

                {form.cover_letter
                  ? "Change Cover Letter"
                  : "Choose Cover Letter"}

                <input
                  type="file"
                  name="cover_letter"
                  accept=".pdf,.doc,.docx"
                  onChange={
                    handleCoverLetterChange
                  }
                  className="hidden"
                />

              </label>

              {form.cover_letter && (
                <div className="mt-4 bg-green-50 border border-green-100 rounded-xl px-4 py-3">

                  <p className="text-sm text-green-700 font-semibold break-all">

                    ✓ {form.cover_letter.name}

                  </p>

                  <p className="text-xs text-green-600 mt-1">

                    {(
                      form.cover_letter.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB

                  </p>

                </div>
              )}

            </div>

          </div>

          {/* ========================================
              PORTFOLIO
          ======================================== */}

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

          {/* ========================================
              LINKEDIN
          ======================================== */}

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

          {/* ========================================
              GITHUB
          ======================================== */}

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

          {/* ========================================
              EXPECTED SALARY
          ======================================== */}

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

          {/* ========================================
              AVAILABLE FROM
          ======================================== */}

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

          {/* ========================================
              SUBMIT
          ======================================== */}

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
  );
}

export default ApplyJob;
