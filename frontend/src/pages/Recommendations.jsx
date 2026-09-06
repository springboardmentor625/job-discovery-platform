import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";

import {
  FaRobot,
  FaBriefcase,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight,
  FaBookmark,
  FaFileAlt,
  FaLightbulb,
  FaSearch,
  FaSortAmountDown,
  FaStar,
} from "react-icons/fa";

import api from "../services/api";

function Recommendations() {
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search + sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("match");

  // ============================================
  // LOAD RECOMMENDATIONS
  // ============================================

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const response = await api.get("recommendations/");

        console.log(
          "RECOMMENDATIONS:",
          response.data
        );

        setRecommendations(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "RECOMMENDATIONS ERROR:",
          error.response?.status,
          error.response?.data || error.message
        );

        toast.error(
          "Unable to load AI recommendations."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  // ============================================
  // SCORE COLOR
  // ============================================

  const getScoreColor = (score) => {
    if (score >= 90) {
      return {
        text: "text-green-600",
        bg: "bg-green-500",
        light: "bg-green-100",
        border: "border-green-200",
      };
    }

    if (score >= 80) {
      return {
        text: "text-blue-600",
        bg: "bg-blue-500",
        light: "bg-blue-100",
        border: "border-blue-200",
      };
    }

    if (score >= 65) {
      return {
        text: "text-yellow-600",
        bg: "bg-yellow-500",
        light: "bg-yellow-100",
        border: "border-yellow-200",
      };
    }

    return {
      text: "text-gray-600",
      bg: "bg-gray-400",
      light: "bg-gray-100",
      border: "border-gray-200",
    };
  };

  // ============================================
  // MATCH LABEL
  // ============================================

  const getMatchLabel = (score) => {
    if (score >= 90) {
      return "Excellent Match";
    }

    if (score >= 80) {
      return "Strong Match";
    }

    if (score >= 65) {
      return "Good Match";
    }

    return "Potential Match";
  };

  // ============================================
  // DESCRIPTION
  // ============================================

  const getShortDescription = (description) => {
    if (!description) {
      return "This role matches your resume and career profile.";
    }

    const cleanDescription = String(description)
      .replace(/\s+/g, " ")
      .trim();

    if (cleanDescription.length <= 150) {
      return cleanDescription;
    }

    return `${cleanDescription.slice(0, 150)}...`;
  };

  // ============================================
  // DYNAMIC AI REASONS
  // ============================================

  const getAIReasons = (recommendation) => {
  const reasons = [];

  const matchedSkills =
    recommendation.matched_skills || [];

  const missingSkills =
    recommendation.missing_skills || [];

  const skillPercentage =
    recommendation.skill_match_percentage;

  const matchScore =
    recommendation.match_score || 0;

  // ============================================
  // MATCHED SKILLS
  // ============================================

  if (matchedSkills.length > 0) {
    const skillNames =
      matchedSkills.join(", ");

    reasons.push(
      `Your resume matches ${skillNames}.`
    );
  }

  // ============================================
  // SKILL MATCH PERCENTAGE
  // ============================================

  if (
    skillPercentage !== undefined &&
    skillPercentage !== null
  ) {
    reasons.push(
      `${skillPercentage}% of required skills matched`
    );
  }

  // ============================================
  // STRONG PROFILE
  // ============================================

  if (matchScore >= 90) {
    reasons.push(
      "Your overall profile is highly compatible with this role."
    );
  } else if (matchScore >= 80) {
    reasons.push(
      "Your experience and skills strongly match this role."
    );
  }

  // ============================================
  // NO MISSING SKILLS
  // ============================================

  if (missingSkills.length === 0) {
    reasons.push(
      "No additional skills required."
    );
  }

  // ============================================
  // FALLBACK
  // ============================================

  if (!reasons.length) {
    reasons.push(
      "This role matches your current career profile."
    );
  }

  return reasons.slice(0, 3);
};

  // ============================================
  // SEARCH + SORT
  // ============================================

  const filteredRecommendations = useMemo(() => {
    let results = [...recommendations];

    const search = searchTerm
      .trim()
      .toLowerCase();

    if (search) {
      results = results.filter(
        (recommendation) => {
          const job =
            recommendation.job || {};

          const title =
            String(job.title || "").toLowerCase();

          const company =
            String(job.company || "").toLowerCase();

          const location =
            String(job.location || "").toLowerCase();

          const skills = [
            ...(recommendation.matched_skills || []),
            ...(recommendation.missing_skills || []),
          ]
            .join(" ")
            .toLowerCase();

          return (
            title.includes(search) ||
            company.includes(search) ||
            location.includes(search) ||
            skills.includes(search)
          );
        }
      );
    }

    if (sortBy === "match") {
      results.sort(
        (a, b) =>
          (b.match_score || 0) -
          (a.match_score || 0)
      );
    }

    if (sortBy === "skills") {
      results.sort(
        (a, b) =>
          (b.matched_skills?.length || 0) -
          (a.matched_skills?.length || 0)
      );
    }

    if (sortBy === "company") {
      results.sort((a, b) =>
        String(
          a.job?.company || ""
        ).localeCompare(
          String(
            b.job?.company || ""
          )
        )
      );
    }

    if (sortBy === "location") {
      results.sort((a, b) =>
        String(
          a.job?.location || ""
        ).localeCompare(
          String(
            b.job?.location || ""
          )
        )
      );
    }

    return results;
  }, [
    recommendations,
    searchTerm,
    sortBy,
  ]);

  // ============================================
  // SAVE JOB
  // ============================================

  const saveJob = async (jobId) => {
    try {
      await api.post("swipes/", {
        job_id: jobId,
        decision: "right",
      });

      toast.success("Job saved!");

      setRecommendations((previous) =>
        previous.filter(
          (item) =>
            item.job?.id !== jobId
        )
      );
    } catch (error) {
      console.error(
        "SAVE JOB ERROR:",
        error.response?.data ||
          error.message
      );

      toast.error(
        error.response?.data?.detail ||
          "Unable to save job."
      );
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center px-4">
        <Toaster position="top-right" />

        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 flex items-center justify-center mb-4 animate-pulse">
            <FaRobot className="text-indigo-600 text-3xl" />
          </div>

          <h2 className="text-xl font-bold text-indigo-700">
            AI is finding your best jobs...
          </h2>

          <p className="text-gray-500 text-sm mt-2">
            Analyzing your resume and skills.
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================

  if (!recommendations.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-8">
        <Toaster position="top-right" />

        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-indigo-100 shadow-sm p-8 text-center">

            <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-100 flex items-center justify-center mb-5">
              <FaRobot className="text-indigo-600 text-4xl" />
            </div>

            <h1 className="text-2xl font-bold text-gray-800">
              No AI Recommendations Yet
            </h1>

            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Upload your resume and complete
              your profile so SwipeX can find
              jobs that match your skills.
            </p>

            <button
              onClick={() =>
                navigate("/resume")
              }
              className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              <FaFileAlt />
              Check My Resume
            </button>

          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // PROFILE SUMMARY
  // ============================================

  const allResumeSkills = [
    ...new Set(
      recommendations.flatMap(
        (item) =>
          item.resume_skills || []
      )
    ),
  ];

  const bestRecommendation =
    [...recommendations].sort(
      (a, b) =>
        (b.match_score || 0) -
        (a.match_score || 0)
    )[0];

  const bestScore =
    bestRecommendation?.match_score || 0;

  const missingSkills = [
    ...new Set(
      recommendations.flatMap(
        (item) =>
          item.missing_skills || []
      )
    ),
  ];

  const bestJob =
    bestRecommendation?.job || {};

  const bestColors =
    getScoreColor(bestScore);

  // ============================================
  // PAGE
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-6 sm:px-6">

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <div className="max-w-7xl mx-auto">

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="mb-6">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <FaRobot className="text-indigo-600 text-xl" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
                AI Recommendations
              </h1>

              <p className="text-gray-500 text-sm mt-1">
                Personalized jobs selected using
                your resume, skills and interests.
              </p>
            </div>

          </div>

        </div>

        {/* ================================= */}
        {/* AI CAREER INSIGHTS */}
        {/* ================================= */}

        <div className="bg-white rounded-3xl border border-indigo-100 shadow-sm p-5 sm:p-6 mb-7">

          <div className="flex flex-col lg:flex-row gap-6">

            {/* SCORE */}

            <div className="lg:w-64 shrink-0 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white">

              <div className="flex items-center gap-2 text-indigo-100 text-sm font-semibold">
                <FaRobot />
                AI Career Insights
              </div>

              <div className="text-5xl font-extrabold mt-3">
                {bestScore}%
              </div>

              <p className="text-indigo-100 text-sm mt-1">
                Highest Match Score
              </p>

              {/* MEANINGFUL PROGRESS */}

              <div className="w-full bg-indigo-400/40 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      bestScore,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="text-indigo-100 text-xs mt-3">
                Based on your resume,
                ATS score and matching skills.
              </p>

            </div>

            {/* RESUME STRENGTHS */}

            <div className="flex-1">

              <h2 className="font-bold text-gray-800 text-lg">
                Your Resume Strengths
              </h2>

              <p className="text-gray-500 text-sm mt-1 mb-3">
                Skills SwipeX found in your resume.
              </p>

              <div className="flex flex-wrap gap-2">

                {allResumeSkills.map(
                  (skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-semibold"
                    >
                      {skill}
                    </span>
                  )
                )}

              </div>

              {missingSkills.length > 0 && (
                <div className="mt-6">

                  <h3 className="font-bold text-gray-700 text-sm mb-2">
                    Suggested Skills to Learn
                  </h3>

                  <div className="flex flex-wrap gap-2">

                    {missingSkills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100 text-sm font-semibold"
                        >
                          {skill}
                        </span>
                      )
                    )}

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* ================================= */}
        {/* BEST MATCH */}
        {/* ================================= */}

        {bestRecommendation && (
          <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-sm p-5 sm:p-6 mb-8">

            <div className="flex items-center gap-2 mb-4">
              <FaStar className="text-yellow-500" />

              <h2 className="text-lg sm:text-xl font-extrabold text-gray-800">
                Best Match For You
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center gap-5">

              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                <FaBriefcase className="text-indigo-600 text-2xl" />
              </div>

              <div className="flex-1">

                <h3 className="text-xl font-bold text-gray-800">
                  {bestJob.title}
                </h3>

                <p className="text-gray-600 font-semibold mt-1">
                  {bestJob.company}
                </p>

                {bestJob.location && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <FaMapMarkerAlt />
                    {bestJob.location}
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-3 max-w-2xl">
                  Highest compatibility with your
                  resume, skills and career profile.
                </p>

              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">

                <div
                  className={`${bestColors.light} ${bestColors.border} border rounded-2xl px-5 py-3 text-center min-w-[150px]`}
                >
                  <div
                    className={`text-3xl font-extrabold ${bestColors.text}`}
                  >
                    {bestScore}%
                  </div>

                  <p
                    className={`text-xs font-bold ${bestColors.text}`}
                  >
                    {getMatchLabel(bestScore)}
                  </p>
                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      navigate(
                        `/apply/${bestJob.id}`
                      )
                    }
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold transition"
                  >
                    Apply
                  </button>

                  <button
                    onClick={() =>
                      saveJob(bestJob.id)
                    }
                    className="border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-4 py-2.5 rounded-xl font-bold transition"
                  >
                    <FaBookmark />
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ================================= */}
        {/* TOP RECOMMENDATIONS HEADER */}
        {/* ================================= */}

        <div className="mb-5">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800">
                Top AI Recommendations
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                {filteredRecommendations.length}{" "}
                recommendations based on your profile.
              </p>

            </div>

            <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
              <FaLightbulb />
              AI Powered
            </div>

          </div>

        </div>

        {/* ================================= */}
        {/* SEARCH + SORT */}
        {/* ================================= */}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 mb-6">

          <div className="flex flex-col md:flex-row gap-3">

            {/* SEARCH */}

            <div className="relative flex-1">

              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search jobs by title, company, location or skill..."
                className="
                  w-full
                  pl-11
                  pr-4
                  py-3
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  text-gray-700
                  outline-none
                  focus:border-indigo-400
                  focus:ring-2
                  focus:ring-indigo-100
                  transition
                "
              />

            </div>

            {/* SORT */}

            <div className="relative md:w-56">

              <FaSortAmountDown className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value
                  )
                }
                className="
                  w-full
                  appearance-none
                  pl-11
                  pr-4
                  py-3
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  text-gray-700
                  font-semibold
                  outline-none
                  focus:border-indigo-400
                  focus:ring-2
                  focus:ring-indigo-100
                "
              >
                <option value="match">
                  Highest Match
                </option>

                <option value="skills">
                  Most Skills Matched
                </option>

                <option value="company">
                  Company A-Z
                </option>

                <option value="location">
                  Location A-Z
                </option>
              </select>

            </div>

          </div>

        </div>

        {/* ================================= */}
        {/* NO SEARCH RESULTS */}
        {/* ================================= */}

        {!filteredRecommendations.length && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <FaSearch className="text-indigo-500 text-2xl" />
            </div>

            <h3 className="text-lg font-bold text-gray-800">
              No matching jobs found
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              Try another job title, company,
              location or skill.
            </p>

            <button
              onClick={() =>
                setSearchTerm("")
              }
              className="mt-4 text-indigo-600 font-bold hover:underline"
            >
              Clear Search
            </button>

          </div>
        )}

        {/* ================================= */}
        {/* JOB GRID */}
        {/* ================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {filteredRecommendations.map(
            (recommendation, index) => {

              const job =
                recommendation.job || {};

              const score =
                recommendation.match_score || 0;

              const colors =
                getScoreColor(score);

              const matchedSkills =
                recommendation.matched_skills ||
                [];

              const missing =
                recommendation.missing_skills ||
                [];

              const reasons =
                getAIReasons(
                  recommendation
                );

              return (
                <div
                  key={job.id || index}
                  className="
                    bg-white
                    rounded-3xl
                    border
                    border-gray-100
                    shadow-sm
                    hover:shadow-lg
                    hover:-translate-y-0.5
                    transition-all
                    duration-300
                    overflow-hidden
                  "
                >

                  <div className="p-5">

                    {/* ================================= */}
                    {/* CARD HEADER */}
                    {/* ================================= */}

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-start gap-3 min-w-0">

                        <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                          <FaBriefcase className="text-indigo-600" />
                        </div>

                        <div className="min-w-0">

                          <h3 className="text-lg font-bold text-gray-800 leading-tight">
                            {job.title}
                          </h3>

                          <p className="text-gray-600 font-semibold mt-1">
                            {job.company}
                          </p>

                          {job.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <FaMapMarkerAlt />
                              <span>
                                {job.location}
                              </span>
                            </div>
                          )}

                        </div>

                      </div>

                      {/* MATCH BADGE */}

                      <div
                        className={`${colors.light} ${colors.border} border rounded-xl px-3 py-2 text-center shrink-0`}
                      >

                        <div
                          className={`text-2xl font-extrabold ${colors.text}`}
                        >
                          {score}%
                        </div>

                        <p
                          className={`text-[10px] font-bold ${colors.text}`}
                        >
                          {getMatchLabel(score)}
                        </p>

                      </div>

                    </div>

                    {/* ================================= */}
                    {/* DESCRIPTION */}
                    {/* ================================= */}

                    <p className="text-sm text-gray-500 leading-relaxed mt-4">
                      {getShortDescription(
                        job.description
                      )}
                    </p>

                    {/* ================================= */}
                    {/* SKILLS */}
                    {/* ================================= */}

                    <div className="grid grid-cols-2 gap-3 mt-5">

                      {/* MATCHED */}

                      <div className="rounded-2xl bg-green-50 border border-green-100 p-3">

                        <div className="flex items-center gap-2 mb-2">

                          <FaCheckCircle className="text-green-500 text-sm" />

                          <h4 className="text-xs font-bold text-gray-700">
                            Matched Skills
                          </h4>

                        </div>

                        <div className="flex flex-wrap gap-1.5">

                          {matchedSkills.length > 0 ? (
                            matchedSkills.map(
                              (skill) => (
                                <span
                                  key={skill}
                                  className="px-2 py-1 rounded-full bg-white border border-green-200 text-green-700 text-[11px] font-semibold"
                                >
                                  {skill}
                                </span>
                              )
                            )
                          ) : (
                            <span className="text-xs text-gray-400">
                              None
                            </span>
                          )}

                        </div>

                      </div>

                      {/* MISSING */}

                      <div className="rounded-2xl bg-orange-50 border border-orange-100 p-3">

                        <div className="flex items-center gap-2 mb-2">

                          <FaTimesCircle className="text-orange-500 text-sm" />

                          <h4 className="text-xs font-bold text-gray-700">
                            Need to Learn
                          </h4>

                        </div>

                        <div className="flex flex-wrap gap-1.5">

                          {missing.length > 0 ? (
                            missing.map(
                              (skill) => (
                                <span
                                  key={skill}
                                  className="px-2 py-1 rounded-full bg-white border border-orange-200 text-orange-700 text-[11px] font-semibold"
                                >
                                  {skill}
                                </span>
                              )
                            )
                          ) : (
                            <span className="text-xs text-green-600 font-semibold">
                              ✓ None required
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                    {/* ================================= */}
                    {/* AI REASONS */}
                    {/* ================================= */}

                    <div className="mt-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 p-3">

                      <div className="flex items-center gap-2 mb-2">

                        <FaRobot className="text-indigo-600 text-sm" />

                        <h4 className="text-xs font-bold text-indigo-800">
                          Why AI Recommended This
                        </h4>

                      </div>

                      <div className="space-y-1.5">

                        {reasons.map(
                          (reason, reasonIndex) => (
                            <div
                              key={reasonIndex}
                              className="flex items-start gap-2 text-xs text-gray-700"
                            >
                              <FaCheckCircle className="text-indigo-500 mt-0.5 shrink-0" />

                              <span>
                                {reason}
                              </span>
                            </div>
                          )
                        )}

                      </div>

                    </div>

                    {/* ================================= */}
                    {/* ACTIONS */}
                    {/* ================================= */}

                    <div className="flex gap-3 mt-5">

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/apply/${job.id}`
                          )
                        }
                        className="
                          flex-1
                          flex
                          items-center
                          justify-center
                          gap-2
                          bg-indigo-600
                          hover:bg-indigo-700
                          text-white
                          py-2.5
                          rounded-xl
                          font-bold
                          text-sm
                          transition
                        "
                      >
                        Apply Now
                        <FaArrowRight className="text-xs" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          saveJob(job.id)
                        }
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                          border
                          border-indigo-200
                          text-indigo-700
                          hover:bg-indigo-50
                          px-5
                          py-2.5
                          rounded-xl
                          font-bold
                          text-sm
                          transition
                        "
                      >
                        <FaBookmark />
                        Save
                      </button>

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>

    </div>
  );
}

export default Recommendations;
