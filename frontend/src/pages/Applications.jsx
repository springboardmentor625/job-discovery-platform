import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

import {
  FaHeart,
  FaCheckCircle,
  FaBriefcase,
  FaMapMarkerAlt,
  FaArrowRight,
  FaClock,
  FaFilePdf,
  FaStar,
  FaCheck,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

import api from "../services/api";

function Applications() {
  const navigate = useNavigate();

  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [visibleSaved, setVisibleSaved] = useState(6);
  const [visibleApplications, setVisibleApplications] = useState(6);

  const [expandedApplications, setExpandedApplications] = useState({});

  // ============================================
  // GET API ERROR MESSAGE
  // ============================================

  const getApiError = (error, fallback) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    console.error(`${fallback}:`, {
      status,
      data,
      message: error?.message,
    });

    if (data) {
      if (typeof data === "string") {
        return `${fallback} (${status || "Error"}): ${data}`;
      }

      if (data.detail) {
        return `${fallback} (${status || "Error"}): ${data.detail}`;
      }

      if (data.message) {
        return `${fallback} (${status || "Error"}): ${data.message}`;
      }

      try {
        return `${fallback} (${status || "Error"}): ${JSON.stringify(data)}`;
      } catch {
        return `${fallback} (${status || "Error"})`;
      }
    }

    if (status) {
      return `${fallback} (${status})`;
    }

    return `${fallback}: ${error?.message || "Unknown error"}`;
  };

  // ============================================
  // NORMALIZE PAGINATED RESPONSE
  // ============================================

  const getResults = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  };

  // ============================================
  // GET REQUIRED SKILLS
  // ============================================

  const getRequiredSkills = (skills) => {
    if (!skills) {
      return [];
    }

    let text = String(skills);

    text = text.replace(
      /this position requires the following skills\s*:/gi,
      ""
    );

    text = text.replace(
      /required skills\s*:/gi,
      ""
    );

    const result = text
      .split(/[,;\n]+/)
      .map((skill) => skill.trim())
      .filter(Boolean);

    return [...new Set(result)];
  };

  // ============================================
  // LOAD LIKED / SAVED JOBS
  // ============================================

  const loadSwipes = async () => {
    try {
      const response = await api.get("swipes/");

      console.log("SWIPES API RESPONSE:", response.data);

      const swipes = getResults(response.data);

      const rightSwipes = swipes.filter(
        (swipe) => swipe.decision === "right"
      );

      return rightSwipes
        .map((swipe) => {
          if (
            swipe.job &&
            typeof swipe.job === "object"
          ) {
            return {
              ...swipe.job,
              swipeId: swipe.id,
            };
          }

          if (
            swipe.job !== null &&
            swipe.job !== undefined
          ) {
            return {
              id: swipe.job,
              title: "Job",
              company: "",
              location: "",
              description: "",
              required_skills: "",
              swipeId: swipe.id,
            };
          }

          return null;
        })
        .filter(Boolean);
    } catch (error) {
      const message = getApiError(
        error,
        "Unable to load liked jobs"
      );

      throw new Error(message);
    }
  };

  // ============================================
  // LOAD APPLICATIONS
  // ============================================

  const loadApplications = async () => {
    try {
      const response = await api.get("applications/");

      console.log(
        "APPLICATIONS API RESPONSE:",
        response.data
      );

      return getResults(response.data);
    } catch (error) {
      const message = getApiError(
        error,
        "Unable to load applications"
      );

      throw new Error(message);
    }
  };

  // ============================================
  // LOAD EVERYTHING
  // ============================================

  const loadData = useCallback(async () => {
    setLoading(true);

    let swipedJobs = [];
    let appliedJobs = [];

    try {
      swipedJobs = await loadSwipes();
    } catch (error) {
      toast.error(error.message, {
        duration: 6000,
      });
    }

    try {
      appliedJobs = await loadApplications();
    } catch (error) {
      toast.error(error.message, {
        duration: 6000,
      });
    }

    setApplications(appliedJobs);

    const appliedJobIds = new Set(
      appliedJobs
        .map(
          (application) =>
            application?.job?.id ||
            application?.job_id
        )
        .filter(Boolean)
    );

    const saved = swipedJobs.filter(
      (job) => !appliedJobIds.has(job.id)
    );

    setSavedJobs(saved);

    setVisibleSaved(6);
    setVisibleApplications(6);

    setLoading(false);
  }, []);

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // APPLY NOW
  // ============================================

  const applyToJob = (jobId) => {
    if (!jobId) {
      toast.error("Invalid job.");
      return;
    }

    navigate(`/apply/${jobId}`);
  };

  // ============================================
  // DATE FORMAT
  // ============================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================
  // NORMALIZE SKILLS
  // ============================================

  const normalizeSkills = (skills) => {
    if (!skills) {
      return [];
    }

    if (Array.isArray(skills)) {
      return skills
        .map((skill) => {
          if (
            typeof skill === "object" &&
            skill !== null
          ) {
            return (
              skill.name ||
              skill.skill ||
              skill.title ||
              skill.value ||
              ""
            );
          }

          return String(skill);
        })
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    if (typeof skills === "string") {
      try {
        const parsed = JSON.parse(skills);

        if (Array.isArray(parsed)) {
          return normalizeSkills(parsed);
        }
      } catch {
        // Continue with text parsing
      }

      return skills
        .replace(/\n/g, ",")
        .replace(/;/g, ",")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    return [];
  };

  // ============================================
  // GET MATCH ANALYSIS
  // ============================================

  const getMatchAnalysis = (application) => {
    return (
      application?.match_analysis ||
      application?.matchAnalysis ||
      application?.skill_analysis ||
      application?.skillAnalysis ||
      application?.resume_analysis ||
      application?.resumeAnalysis ||
      {}
    );
  };

  // ============================================
  // MATCH SCORE
  // ============================================

  const getMatchScore = (application) => {
    const analysis = getMatchAnalysis(application);

    const value =
      application?.match_score ??
      application?.match_percentage ??
      application?.matchScore ??
      application?.score ??
      analysis?.match_score ??
      analysis?.match_percentage ??
      analysis?.matchScore ??
      analysis?.score ??
      null;

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return null;
    }

    if (number > 0 && number <= 1) {
      return Math.round(number * 100);
    }

    return Math.min(
      100,
      Math.max(0, Math.round(number))
    );
  };

  // ============================================
  // MATCH COLORS
  // ============================================

  const getMatchColor = (score) => {
    if (score >= 80) {
      return {
        text: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-100",
        bar: "bg-green-500",
      };
    }

    if (score >= 60) {
      return {
        text: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "border-yellow-100",
        bar: "bg-yellow-500",
      };
    }

    return {
      text: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
      bar: "bg-orange-500",
    };
  };

  // ============================================
  // GET SKILL DATA
  // ============================================

  const getSkillData = (application) => {
    const analysis = getMatchAnalysis(application);

    const extractedSkills = normalizeSkills(
      application?.extracted_skills ??
        application?.extractedSkills ??
        application?.resume_skills ??
        application?.resumeSkills ??
        analysis?.extracted_skills ??
        analysis?.extractedSkills ??
        analysis?.resume_skills ??
        analysis?.resumeSkills
    );

    const matchedSkills = normalizeSkills(
      application?.matched_skills ??
        application?.matchedSkills ??
        application?.matching_skills ??
        application?.matchingSkills ??
        analysis?.matched_skills ??
        analysis?.matchedSkills ??
        analysis?.matching_skills ??
        analysis?.matchingSkills
    );

    const missingSkills = normalizeSkills(
      application?.missing_skills ??
        application?.missingSkills ??
        analysis?.missing_skills ??
        analysis?.missingSkills
    );

    return {
      extractedSkills,
      matchedSkills,
      missingSkills,
    };
  };

  // ============================================
  // TOGGLE
  // ============================================

  const toggleExpanded = (applicationId) => {
    setExpandedApplications((previous) => ({
      ...previous,
      [applicationId]:
        !previous[applicationId],
    }));
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
            Loading Applications...
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Getting your saved and applied jobs...
          </p>
        </div>
      </div>
    );
  }

  const displayedSavedJobs = savedJobs.slice(
    0,
    visibleSaved
  );

  const displayedApplications =
    applications.slice(
      0,
      visibleApplications
    );

  // ============================================
  // PAGE
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-6 md:px-8 md:py-8">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            My Applications
          </h1>

          <p className="text-gray-500 text-sm md:text-base mt-2">
            Manage jobs you liked and understand why
            each job matched your profile.
          </p>
        </div>

        {/* ========================================
            SAVED JOBS
        ======================================== */}

        <section className="mb-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <FaHeart className="text-green-500" />

                <h2 className="text-xl font-bold text-gray-800">
                  Jobs You Liked
                </h2>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                Jobs you saved by swiping right.
              </p>
            </div>

            <span className="self-start sm:self-auto bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">
              {savedJobs.length} Saved
            </span>
          </div>

          {savedJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
                <FaHeart className="text-green-400 text-2xl" />
              </div>

              <h3 className="font-bold text-gray-700 text-lg mt-4">
                No liked jobs yet
              </h3>

              <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                Swipe right on jobs you are interested
                in. They will appear here so you can
                apply later.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedSavedJobs.map((job) => {
                  const requiredSkills =
                    getRequiredSkills(
                      job.required_skills
                    );

                  return (
                    <div
                      key={job.id}
                      className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 hover:shadow-lg hover:-translate-y-1 hover:border-green-200 transition-all duration-200 min-h-[350px] flex flex-col"
                    >
                      <div className="flex flex-col h-full">

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-800 text-lg line-clamp-2 min-h-[56px]">
                                {job.title || "Job"}
                              </h3>

                              {job.company ? (
                                <p className="text-gray-600 font-medium text-sm mt-2 line-clamp-2 min-h-[40px]">
                                  {job.company}
                                </p>
                              ) : (
                                <div className="min-h-[40px]" />
                              )}
                            </div>

                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                              <FaBriefcase className="text-green-500" />
                            </div>
                          </div>

                          {job.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                              <FaMapMarkerAlt className="text-gray-400 shrink-0" />

                              <span className="truncate">
                                {job.location}
                              </span>
                            </div>
                          )}

                          {job.description && (
                            <p className="text-sm text-gray-500 mt-3 line-clamp-2 min-h-[40px]">
                              {job.description}
                            </p>
                          )}

                          {requiredSkills.length > 0 && (
                            <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                              <span className="font-semibold text-gray-600">
                                Skills:
                              </span>{" "}
                              {requiredSkills.join(", ")}
                            </p>
                          )}
                        </div>

                        <div className="border-t border-gray-100 pt-4 mt-5">
                          <button
                            type="button"
                            onClick={() =>
                              applyToJob(job.id)
                            }
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition"
                          >
                            Apply Now
                            <FaArrowRight />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {visibleSaved < savedJobs.length && (
                <div className="flex justify-center mt-7">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleSaved(
                        (previous) =>
                          previous + 6
                      )
                    }
                    className="px-6 py-2.5 bg-white border border-indigo-200 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition"
                  >
                    Load{" "}
                    {Math.min(
                      6,
                      savedJobs.length -
                        visibleSaved
                    )}{" "}
                    More Jobs
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ========================================
            APPLIED JOBS
        ======================================== */}

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-indigo-500" />

                <h2 className="text-xl font-bold text-gray-800">
                  Applied Jobs
                </h2>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                See your resume skills, matched skills,
                and skills you are missing.
              </p>
            </div>

            <span className="self-start sm:self-auto bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold">
              {applications.length} Applied
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
                <FaBriefcase className="text-indigo-400 text-2xl" />
              </div>

              <h3 className="font-bold text-gray-700 text-lg mt-4">
                No applications yet
              </h3>

              <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                When you apply to a job, it will appear
                here along with its skill match analysis.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedApplications.map(
                  (application) => {
                    const job = application?.job;

                    if (!job) {
                      return null;
                    }

                    const matchScore =
                      getMatchScore(application);

                    const matchColors =
                      matchScore !== null
                        ? getMatchColor(
                            matchScore
                          )
                        : null;

                    const {
                      extractedSkills,
                      matchedSkills,
                      missingSkills,
                    } = getSkillData(
                      application
                    );

                    const requiredSkills =
                      getRequiredSkills(
                        job.required_skills
                      );

                    const hasAnalysis =
                      matchScore !== null ||
                      extractedSkills.length > 0 ||
                      matchedSkills.length > 0 ||
                      missingSkills.length > 0;

                    const isExpanded =
                      expandedApplications[
                        application.id
                      ];

                    return (
                      <div
                        key={application.id}
                        className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200 transition-all duration-200 min-h-[360px] flex flex-col"
                      >
                        <div className="flex flex-col h-full">

                          <div className="flex-1">
                            {/* JOB HEADER */}

                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-gray-800 text-lg line-clamp-2 min-h-[56px]">
                                  {job.title || "Job"}
                                </h3>

                                {job.company ? (
                                  <p className="text-gray-600 font-medium text-sm mt-2 line-clamp-2 min-h-[40px]">
                                    {job.company}
                                  </p>
                                ) : (
                                  <div className="min-h-[40px]" />
                                )}
                              </div>

                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                <FaBriefcase className="text-indigo-500" />
                              </div>
                            </div>

                            {job.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                                <FaMapMarkerAlt className="text-gray-400 shrink-0" />

                                <span className="truncate">
                                  {job.location}
                                </span>
                              </div>
                            )}

                            {/* DESCRIPTION */}

                            {job.description && (
                              <p className="text-sm text-gray-500 mt-3 line-clamp-2 min-h-[40px]">
                                {job.description}
                              </p>
                            )}

                            {/* REQUIRED SKILLS */}

                            {requiredSkills.length > 0 && (
                              <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                                <span className="font-semibold text-gray-600">
                                  Skills:
                                </span>{" "}
                                {requiredSkills.join(", ")}
                              </p>
                            )}
                          </div>

                          {/* WHY MATCHED */}

                          <div className="border-t border-gray-100 mt-5 pt-4">
                            <button
                              type="button"
                              onClick={() =>
                                toggleExpanded(
                                  application.id
                                )
                              }
                              className="w-full flex items-center justify-between gap-3 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                                  <FaStar className="text-yellow-500 text-sm" />
                                </div>

                                <div>
                                  <h4 className="font-bold text-gray-800 text-sm">
                                    Why This Job Matched You
                                  </h4>

                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Resume & skill analysis
                                  </p>
                                </div>
                              </div>

                              {isExpanded ? (
                                <FaChevronUp className="text-gray-400 text-sm" />
                              ) : (
                                <FaChevronDown className="text-gray-400 text-sm" />
                              )}
                            </button>
                          </div>

                          {/* MATCH ANALYSIS */}

                          {isExpanded && (
                            <div className="mt-4">
                              {!hasAnalysis ? (
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                                  <FaStar className="text-gray-300 mx-auto text-xl mb-2" />

                                  <p className="text-sm font-semibold text-gray-600">
                                    Match analysis not available
                                  </p>

                                  <p className="text-xs text-gray-400 mt-1">
                                    Your backend did not return
                                    resume matching data.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">

                                  {/* MATCH SCORE */}

                                  {matchScore !== null && (
                                    <div
                                      className={`${matchColors.bg} ${matchColors.border} border rounded-xl p-4`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <FaStar
                                            className={
                                              matchColors.text
                                            }
                                          />

                                          <span className="text-xs font-bold text-gray-700">
                                            Overall Match
                                          </span>
                                        </div>

                                        <span
                                          className={`text-lg font-extrabold ${matchColors.text}`}
                                        >
                                          {matchScore}%
                                        </span>
                                      </div>

                                      <div className="w-full h-2.5 bg-white/80 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full ${matchColors.bar} rounded-full`}
                                          style={{
                                            width: `${matchScore}%`,
                                          }}
                                        />
                                      </div>

                                      <p className="text-xs text-gray-500 mt-2">
                                        Based on the skills found
                                        in your resume compared
                                        with this job.
                                      </p>
                                    </div>
                                  )}

                                  {/* EXTRACTED SKILLS */}

                                  {extractedSkills.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                          <FaFilePdf className="text-[10px]" />
                                        </div>

                                        <h5 className="text-xs font-bold text-gray-700">
                                          Skills Extracted From Resume
                                        </h5>
                                      </div>

                                      <div className="flex flex-wrap gap-1.5">
                                        {extractedSkills.map(
                                          (
                                            skill,
                                            index
                                          ) => (
                                            <span
                                              key={`${skill}-${index}`}
                                              className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                                            >
                                              {skill}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* MATCHED SKILLS */}

                                  {matchedSkills.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                          <FaCheck className="text-[10px]" />
                                        </div>

                                        <div>
                                          <h5 className="text-xs font-bold text-gray-700">
                                            Matched Skills
                                          </h5>

                                          <p className="text-[10px] text-gray-400">
                                            Skills you have that
                                            this job requires
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap gap-1.5">
                                        {matchedSkills.map(
                                          (
                                            skill,
                                            index
                                          ) => (
                                            <span
                                              key={`${skill}-${index}`}
                                              className="bg-green-50 text-green-700 border border-green-100 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                            >
                                              ✓ {skill}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* MISSING SKILLS */}

                                  {missingSkills.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                          <FaExclamationTriangle className="text-[10px]" />
                                        </div>

                                        <div>
                                          <h5 className="text-xs font-bold text-gray-700">
                                            Missing Skills
                                          </h5>

                                          <p className="text-[10px] text-gray-400">
                                            Skills this job asks
                                            for that are not in
                                            your resume
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap gap-1.5">
                                        {missingSkills.map(
                                          (
                                            skill,
                                            index
                                          ) => (
                                            <span
                                              key={`${skill}-${index}`}
                                              className="bg-orange-50 text-orange-700 border border-orange-100 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                            >
                                              ! {skill}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {missingSkills.length ===
                                    0 &&
                                    matchedSkills.length >
                                      0 && (
                                      <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl p-3">
                                        <FaCheckCircle className="text-green-500 shrink-0" />

                                        <p className="text-xs font-semibold text-green-700">
                                          Great! No missing
                                          skills were identified
                                          for this job.
                                        </p>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* APPLICATION STATUS */}

                          <div className="border-t border-gray-100 mt-5 pt-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl">
                                <FaClock />

                                <span>
                                  Applied
                                  {application.applied_at
                                    ? ` • ${formatDate(
                                        application.applied_at
                                      )}`
                                    : ""}
                                </span>
                              </div>

                              <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                                Submitted
                              </span>
                            </div>

                            {application.applied_resume && (
                              <div className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 font-semibold text-sm">
                                <FaFilePdf />
                                Resume Submitted
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {visibleApplications <
                applications.length && (
                <div className="flex justify-center mt-7">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleApplications(
                        (previous) =>
                          previous + 6
                      )
                    }
                    className="px-6 py-2.5 bg-white border border-indigo-200 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition"
                  >
                    Load{" "}
                    {Math.min(
                      6,
                      applications.length -
                        visibleApplications
                    )}{" "}
                    More Applications
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Applications;
