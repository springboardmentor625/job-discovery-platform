import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaFileAlt,
  FaCheckCircle,
  FaBriefcase,
  FaEnvelope,
  FaArrowRight,
  FaFire,
  FaRobot,
  FaStar,
} from "react-icons/fa";

import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [resume, setResume] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loadingCandidate, setLoadingCandidate] = useState(true);
  const [loadingResume, setLoadingResume] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplications, setLoadingApplications] =
    useState(true);

  // ============================================
  // LOAD DASHBOARD DATA
  // ============================================

  useEffect(() => {
    fetchCandidate();
    fetchResume();

    // These are intentionally loaded independently.
    // A slow jobs API will NOT block the dashboard.
    fetchJobs();
    fetchApplications();
  }, []);

  // ============================================
  // LOAD CANDIDATE
  // ============================================

  const fetchCandidate = async () => {
    try {
      const response = await api.get("candidates/");

      const candidates = Array.isArray(response.data)
        ? response.data
        : [];

      setCandidate(
        candidates.length > 0
          ? candidates[candidates.length - 1]
          : null
      );
    } catch (error) {
      console.error(
        "LOAD CANDIDATE ERROR:",
        error.response?.data || error
      );

      setCandidate(null);
    } finally {
      setLoadingCandidate(false);
    }
  };

  // ============================================
  // LOAD RESUME
  // ============================================

  const fetchResume = async () => {
    try {
      const response = await api.get("resumes/");

      const resumes = Array.isArray(response.data)
        ? response.data
        : [];

      setResume(
        resumes.length > 0
          ? resumes[resumes.length - 1]
          : null
      );
    } catch (error) {
      console.error(
        "LOAD RESUME ERROR:",
        error.response?.data || error
      );

      setResume(null);
    } finally {
      setLoadingResume(false);
    }
  };

  // ============================================
  // LOAD JOBS
  // ============================================

  const fetchJobs = async () => {
    try {
      const response = await api.get("jobs/");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setJobs(data);
    } catch (error) {
      console.error(
        "LOAD JOBS ERROR:",
        error.response?.data || error
      );

      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  // ============================================
  // LOAD APPLICATIONS
  // ============================================

  const fetchApplications = async () => {
    try {
      const response = await api.get("applications/");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setApplications(data);
    } catch (error) {
      console.error(
        "LOAD APPLICATIONS ERROR:",
        error.response?.data || error
      );

      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  // ============================================
  // PROFILE COMPLETION
  // ============================================

  const getProfileCompletion = () => {
    if (!candidate) {
      return 0;
    }

    const metrics = [
      Boolean(candidate.full_name?.trim()),
      Boolean(candidate.phone?.trim()),
      Boolean(candidate.skills?.trim()),
      Boolean(candidate.experience?.trim()),
      Boolean(candidate.education?.trim()),
      Boolean(candidate.projects?.trim()),
      Boolean(candidate.certifications?.trim()),
      Boolean(resume?.resume_file),
    ];

    const completed = metrics.filter(Boolean).length;

    return Math.round(
      (completed / metrics.length) * 100
    );
  };

  const profileCompletion = getProfileCompletion();

  // ============================================
  // SWIPE COUNT
  // ============================================

  const swipeCount =
    Number(candidate?.swipe_count) || 0;

  // ============================================
  // PROFILE COLOR
  // ============================================

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) {
      return "bg-emerald-500";
    }

    if (percentage >= 50) {
      return "bg-indigo-500";
    }

    return "bg-cyan-500";
  };

  // ============================================
  // RESUME FILE NAME
  // ============================================

  const getFileName = () => {
    if (!resume) {
      return "No resume uploaded";
    }

    return (
      resume.original_filename ||
      resume.resume_file?.split("/").pop() ||
      "Resume"
    );
  };

  // ============================================
  // USER NAME
  // ============================================

  const getUserName = () => {
    if (loadingCandidate) {
      return "there";
    }

    if (candidate?.full_name) {
      return candidate.full_name
        .trim()
        .split(" ")[0];
    }

    return "there";
  };

  // ============================================
  // TOP RECOMMENDED JOB
  // ============================================

  const topJob =
    jobs.length > 0 ? jobs[0] : null;

  // ============================================
  // PAGE
  // ============================================

  return (
    <div className="p-4 sm:p-6 md:p-10 bg-slate-50 min-h-screen">

      <div className="max-w-7xl mx-auto">

        {/* ========================================
            1. WELCOME
        ======================================== */}

        <section className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-cyan-600 rounded-3xl p-7 md:p-9 text-white shadow-xl">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-7">

            <div>

              <p className="text-cyan-200 text-sm font-semibold mb-2">
                YOUR JOB SEARCH
              </p>

              <h1 className="text-3xl md:text-4xl font-bold">
                Welcome back, {getUserName()} 👋
              </h1>

              <p className="text-indigo-100 mt-3 text-base md:text-lg max-w-xl">
                Your resume is ready. Discover
                opportunities that match your
                skills and career goals.
              </p>

              <button
                type="button"
                onClick={() => navigate("/jobs")}
                className="mt-6 bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-cyan-50 transition shadow-lg flex items-center gap-2"
              >
                <FaFire />
                Explore Jobs
                <FaArrowRight />
              </button>

            </div>

            {/* ATS SCORE */}

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 min-w-[210px]">

              <div className="flex items-center gap-3">

                <div className="bg-white/20 p-3 rounded-xl">
                  <FaChartLine className="text-2xl text-cyan-200" />
                </div>

                <div>

                  <p className="text-xs text-indigo-200 uppercase tracking-wide">
                    ATS Score
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {loadingResume
                      ? "--"
                      : resume?.ats_score != null
                      ? `${resume.ats_score}%`
                      : "--"}
                  </p>

                </div>

              </div>

              <p className="text-indigo-100 text-sm mt-4">
                Resume compatibility score
              </p>

            </div>

          </div>

        </section>

        {/* ========================================
            2. STATISTICS
        ======================================== */}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-7">

          {/* ATS */}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            <div className="flex justify-between items-start">

              <div>

                <p className="text-gray-500 text-sm">
                  ATS Score
                </p>

                <p className="text-3xl font-bold text-indigo-600 mt-2">
                  {loadingResume
                    ? "--"
                    : resume?.ats_score != null
                    ? `${resume.ats_score}%`
                    : "--"}
                </p>

              </div>

              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl">
                <FaFileAlt />
              </div>

            </div>

            <p className="text-xs text-gray-400 mt-4">
              Resume compatibility
            </p>

          </div>

          {/* JOBS */}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            <div className="flex justify-between items-start">

              <div>

                <p className="text-gray-500 text-sm">
                  Recommended Jobs
                </p>

                <p className="text-3xl font-bold text-cyan-600 mt-2">
                  {loadingJobs ? "..." : jobs.length}
                </p>

              </div>

              <div className="bg-cyan-100 text-cyan-600 p-3 rounded-xl">
                <FaBriefcase />
              </div>

            </div>

            <p className="text-xs text-gray-400 mt-4">
              Opportunities for you
            </p>

          </div>

          {/* APPLICATIONS */}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            <div className="flex justify-between items-start">

              <div>

                <p className="text-gray-500 text-sm">
                  Applications
                </p>

                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {loadingApplications
                    ? "..."
                    : applications.length}
                </p>

              </div>

              <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
                <FaEnvelope />
              </div>

            </div>

            <p className="text-xs text-gray-400 mt-4">
              Jobs you've applied to
            </p>

          </div>

          {/* SWIPES */}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            <div className="flex justify-between items-start">

              <div>

                <p className="text-gray-500 text-sm">
                  Swipes
                </p>

                <p className="text-3xl font-bold text-orange-500 mt-2">
                  {swipeCount}
                </p>

              </div>

              <div className="bg-orange-100 text-orange-500 p-3 rounded-xl">
                <FaFire />
              </div>

            </div>

            <p className="text-xs text-gray-400 mt-4">
              Your job preferences
            </p>

          </div>

        </section>

        {/* ========================================
            3. AI RECOMMENDED JOB
        ======================================== */}

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-7 mt-7">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>

              <div className="flex items-center gap-2">

                <FaRobot className="text-indigo-600" />

                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  Recommended Job
                </h2>

              </div>

              <p className="text-gray-500 text-sm mt-1">
                A job selected from your current
                recommendations.
              </p>

            </div>

            <Link
              to="/jobs"
              className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-2"
            >
              View all
              <FaArrowRight />
            </Link>

          </div>

          {loadingJobs ? (

            <div className="mt-6 border border-gray-100 rounded-2xl p-7">

              <div className="animate-pulse">

                <div className="flex items-center gap-4">

                  <div className="w-14 h-14 bg-gray-200 rounded-xl" />

                  <div className="flex-1">

                    <div className="h-5 bg-gray-200 rounded w-1/2" />

                    <div className="h-4 bg-gray-200 rounded w-1/3 mt-3" />

                    <div className="h-3 bg-gray-200 rounded w-1/4 mt-3" />

                  </div>

                </div>

              </div>

            </div>

          ) : topJob ? (

            <div className="mt-6 border border-gray-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div className="flex items-start gap-4 min-w-0">

                  <div className="bg-indigo-100 text-indigo-600 p-4 rounded-xl shrink-0">
                    <FaBriefcase className="text-2xl" />
                  </div>

                  <div className="min-w-0">

                    <h3 className="text-xl font-bold text-gray-800 truncate">
                      {topJob.title ||
                        topJob.job_title ||
                        "Job Opportunity"}
                    </h3>

                    <p className="text-gray-500 mt-1">
                      {topJob.company ||
                        topJob.company_name ||
                        "Company"}
                    </p>

                    {(topJob.location ||
                      topJob.job_location) && (

                      <p className="text-sm text-gray-400 mt-2">
                        📍{" "}
                        {topJob.location ||
                          topJob.job_location}
                      </p>

                    )}

                  </div>

                </div>

                <div className="flex items-center gap-3">

                  <div className="text-center bg-green-50 rounded-xl px-5 py-3">

                    <FaStar className="text-yellow-400 mx-auto mb-1" />

                    <p className="text-xs text-gray-500">
                      Match
                    </p>

                    <p className="font-bold text-green-600">
                      {topJob.recommendation_score !=
                      null
                        ? `${topJob.recommendation_score}`
                        : "AI"}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/jobs")}
                    className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition whitespace-nowrap"
                  >
                    Explore →
                  </button>

                </div>

              </div>

            </div>

          ) : (

            <div className="mt-6 bg-gray-50 rounded-2xl p-8 text-center">

              <FaBriefcase className="text-4xl text-gray-300 mx-auto mb-4" />

              <h3 className="font-bold text-gray-700">
                No recommendations yet
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                Upload your resume and complete
                your profile to discover suitable
                jobs.
              </p>

              <button
                type="button"
                onClick={() => navigate("/jobs")}
                className="mt-5 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Explore Jobs
              </button>

            </div>

          )}

        </section>

        {/* ========================================
            4 + 5. PROFILE + RESUME
        ======================================== */}

        <section className="grid md:grid-cols-2 gap-6 mt-7 mb-10">

          {/* ======================================
              PROFILE
          ====================================== */}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-7">

            <div className="flex items-start justify-between gap-4">

              <div className="flex items-center gap-4">

                <div className="bg-indigo-100 text-indigo-600 p-4 rounded-xl">
                  <FaCheckCircle className="text-2xl" />
                </div>

                <div>

                  <h3 className="text-xl font-bold text-gray-800">
                    Profile Completion
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    Keep your candidate information
                    up to date.
                  </p>

                </div>

              </div>

              <span className="text-lg font-bold text-indigo-600 whitespace-nowrap">
                {loadingCandidate
                  ? "..."
                  : `${profileCompletion}%`}
              </span>

            </div>

            <div className="mt-6">

              <div className="w-full bg-gray-100 rounded-full h-2.5">

                <div
                  className={`${getCompletionColor(
                    profileCompletion
                  )} h-2.5 rounded-full transition-all duration-500`}
                  style={{
                    width: `${profileCompletion}%`,
                  }}
                />

              </div>

            </div>

            <p className="text-sm text-gray-500 mt-3">

              {profileCompletion === 100
                ? "Your profile is complete."
                : "Complete your profile to improve your job matches."}

            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/view-profile")
              }
              className="mt-5 text-indigo-600 font-semibold hover:text-indigo-800 transition"
            >
              Update Profile →
            </button>

          </div>

          {/* ======================================
              RESUME
          ====================================== */}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-7">

            <div className="flex items-start gap-4">

              <div className="bg-purple-100 text-purple-600 p-4 rounded-xl">
                <FaFileAlt className="text-2xl" />
              </div>

              <div className="flex-1 min-w-0">

                <h3 className="text-xl font-bold text-gray-800">
                  Resume
                </h3>

                <p className="text-gray-500 text-sm mt-1">
                  Your resume powers your AI job
                  matching.
                </p>

              </div>

            </div>

            {loadingResume ? (

              <div className="mt-6 animate-pulse">

                <div className="h-14 bg-gray-100 rounded-xl" />

                <div className="h-4 bg-gray-100 rounded w-2/3 mt-4" />

              </div>

            ) : resume ? (

              <div className="mt-6">

                <div className="flex items-center gap-3 bg-green-50 rounded-xl p-4">

                  <FaCheckCircle className="text-green-500 flex-shrink-0" />

                  <p className="text-gray-700 font-medium truncate">
                    {getFileName()}
                  </p>

                </div>

                <div className="flex items-center justify-between mt-4 gap-4">

                  <p className="text-sm text-green-600 font-medium">
                    Resume uploaded successfully
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/resume")
                    }
                    className="text-indigo-600 font-semibold hover:text-indigo-800 whitespace-nowrap"
                  >
                    Manage →
                  </button>

                </div>

              </div>

            ) : (

              <div className="mt-6">

                <div className="bg-orange-50 rounded-xl p-4">

                  <p className="text-orange-700 font-medium">
                    No resume uploaded
                  </p>

                  <p className="text-orange-600 text-sm mt-1">
                    Upload your resume to improve
                    your AI recommendations.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/resume")
                  }
                  className="mt-5 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition"
                >
                  Upload Resume →
                </button>

              </div>

            )}

          </div>

        </section>

      </div>
    </div>
  );
}

export default Dashboard;
