import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useAnimation,
} from "framer-motion";

import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaChartLine,
  FaStar,
  FaRedo,
  FaRobot,
  FaCheckCircle,
} from "react-icons/fa";

import api from "../services/api";

const SWIPE_TARGET = 50;

function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [swiping, setSwiping] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);

  const x = useMotionValue(0);
  const controls = useAnimation();

  const rotate = useTransform(
    x,
    [-300, 0, 300],
    [-12, 0, 12]
  );

  // =====================================================
  // NORMALIZE API RESPONSE
  // =====================================================

  const getList = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  };

  // =====================================================
  // LOAD SWIPE COUNT
  // =====================================================

  const fetchSwipeCount = useCallback(async () => {
    try {
      const response = await api.get("swipes/");

      const swipes = getList(response.data);

      setSwipeCount(swipes.length);
    } catch (error) {
      console.error(
        "LOAD SWIPE COUNT ERROR:",
        error.response?.data || error
      );
    }
  }, []);

  // =====================================================
  // LOAD JOBS
  // =====================================================

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      /*
       * Load jobs and swipes together.
       *
       * IMPORTANT:
       * We remove jobs that the user has already swiped.
       *
       * This prevents old/random jobs from appearing again.
       */

      const [jobsResult, swipesResult] =
        await Promise.all([
          api.get("jobs/"),
          api.get("swipes/"),
        ]);

      const receivedJobs = getList(
        jobsResult.data
      );

      const receivedSwipes = getList(
        swipesResult.data
      );

      // =================================================
      // GET ALREADY SWIPED JOB IDS
      // =================================================

      const swipedJobIds = new Set();

      receivedSwipes.forEach((swipe) => {
        let jobId = null;

        if (
          swipe?.job &&
          typeof swipe.job === "object"
        ) {
          jobId = swipe.job.id;
        } else {
          jobId =
            swipe?.job_id ||
            swipe?.job ||
            null;
        }

        if (
          jobId !== null &&
          jobId !== undefined
        ) {
          swipedJobIds.add(String(jobId));
        }
      });

      // =================================================
      // ONLY UNSWIPED JOBS
      // =================================================

      const availableJobs =
        receivedJobs.filter((job) => {
          if (
            job?.id === null ||
            job?.id === undefined
          ) {
            return false;
          }

          return !swipedJobIds.has(
            String(job.id)
          );
        });

      setJobs(availableJobs);

      x.set(0);

      controls.set({
        x: 0,
        rotate: 0,
        opacity: 1,
        scale: 1,
      });

      setShowDetails(false);

      setSwipeCount(
        receivedSwipes.length
      );

    } catch (error) {
      console.error(
        "LOAD JOBS ERROR:",
        error.response?.data || error
      );

      let message =
        "Unable to load jobs.";

      if (error.response?.status === 401) {
        message =
          "Your session has expired. Please login again.";
      } else if (
        error.response?.status === 403
      ) {
        message =
          "You are not allowed to view jobs.";
      } else if (
        error.response?.status === 404
      ) {
        message =
          "Jobs or swipes API endpoint was not found.";
      } else if (
        error.response?.status >= 500
      ) {
        message =
          "Server error while loading jobs.";
      } else if (!error.response) {
        message =
          "Cannot connect to the server.";
      }

      setLoadError(message);
      setJobs([]);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [controls, x]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // =====================================================
  // RESET CARD
  // =====================================================

  const resetCard = () => {
    x.set(0);

    controls.set({
      x: 0,
      rotate: 0,
      opacity: 1,
      scale: 1,
    });
  };

  // =====================================================
  // SAVE SWIPE
  // =====================================================

  const saveSwipe = async (
    jobId,
    decision
  ) => {
    return api.post("swipes/", {
      job_id: jobId,
      decision,
    });
  };

  // =====================================================
  // SWIPE JOB
  // =====================================================

  const swipeJob = async (
    job,
    decision
  ) => {
    if (
      !job ||
      swiping ||
      applying
    ) {
      return;
    }

    const direction =
      decision === "right"
        ? 1
        : -1;

    setSwiping(true);

    try {
      // Animate card away
      await controls.start({
        x: direction * 700,
        rotate: direction * 20,
        opacity: 0,
        transition: {
          duration: 0.3,
          ease: "easeIn",
        },
      });

      // Save swipe in backend
      await saveSwipe(
        job.id,
        decision
      );

      setSwipeCount(
        (previous) =>
          previous + 1
      );

      // Remove current job
      setJobs((previous) =>
        previous.filter(
          (item) =>
            String(item.id) !==
            String(job.id)
        )
      );

      setShowDetails(false);

      toast.success(
        decision === "right"
          ? "Job saved!"
          : "Job skipped!"
      );

      // Reset animation for next card
      requestAnimationFrame(() => {
        resetCard();
      });

    } catch (error) {
      console.error(
        "SWIPE ERROR:",
        error.response?.data || error
      );

      resetCard();

      await controls.start({
        x: 0,
        rotate: 0,
        opacity: 1,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 30,
        },
      });

      toast.error(
        error.response?.data?.detail ||
          "Unable to save swipe."
      );
    } finally {
      setSwiping(false);
    }
  };

  // =====================================================
  // DRAG END
  // =====================================================

  const handleDragEnd = async (
    event,
    info
  ) => {
    if (
      swiping ||
      applying ||
      jobs.length === 0
    ) {
      return;
    }

    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (
      offset > 150 ||
      velocity > 800
    ) {
      await swipeJob(
        jobs[0],
        "right"
      );
      return;
    }

    if (
      offset < -150 ||
      velocity < -800
    ) {
      await swipeJob(
        jobs[0],
        "left"
      );
      return;
    }

    await controls.start({
      x: 0,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
      },
    });

    x.set(0);
  };

  // =====================================================
  // APPLY
  // =====================================================

  const applyJob = async (jobId) => {
    if (
      applying ||
      swiping
    ) {
      return;
    }

    const job = jobs.find(
      (item) =>
        String(item.id) ===
        String(jobId)
    );

    if (!job) {
      return;
    }

    setApplying(true);

    try {
      // Submit application
      await api.post(
        "applications/",
        {
          job_id: jobId,
        }
      );

      /*
       * Application automatically counts as
       * a right swipe.
       *
       * If it already exists, don't fail
       * the application flow.
       */
      try {
        await saveSwipe(
          jobId,
          "right"
        );
      } catch (swipeError) {
        console.warn(
          "Swipe already exists or could not be created:",
          swipeError.response?.data ||
            swipeError
        );
      }

      setSwipeCount(
        (previous) =>
          previous + 1
      );

      // Animate card away
      await controls.start({
        x: 700,
        rotate: 20,
        opacity: 0,
        transition: {
          duration: 0.3,
          ease: "easeIn",
        },
      });

      // Remove applied job
      setJobs((previous) =>
        previous.filter(
          (item) =>
            String(item.id) !==
            String(jobId)
        )
      );

      setShowDetails(false);

      requestAnimationFrame(() => {
        resetCard();
      });

      toast.success(
        "Application submitted!"
      );

    } catch (error) {
      console.error(
        "APPLY ERROR:",
        error.response?.data || error
      );

      const data =
        error.response?.data;

      let message =
        "Unable to apply.";

      if (
        typeof data === "string"
      ) {
        message = data;
      } else if (
        data &&
        typeof data === "object"
      ) {
        message =
          data.detail ||
          data.message ||
          Object.entries(data)
            .map(
              ([key, value]) =>
                `${key}: ${
                  Array.isArray(value)
                    ? value.join(", ")
                    : value
                }`
            )
            .join("\n") ||
          message;
      }

      toast.error(message);

      resetCard();

      await controls.start({
        x: 0,
        rotate: 0,
        opacity: 1,
        scale: 1,
      });
    } finally {
      setApplying(false);
    }
  };

  // =====================================================
  // KEYBOARD
  // =====================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        swiping ||
        applying ||
        jobs.length === 0
      ) {
        return;
      }

      const tag =
        event.target?.tagName?.toLowerCase();

      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select"
      ) {
        return;
      }

      if (
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();

        swipeJob(
          jobs[0],
          "left"
        );
      }

      if (
        event.key === "ArrowRight"
      ) {
        event.preventDefault();

        swipeJob(
          jobs[0],
          "right"
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    jobs,
    swiping,
    applying,
  ]);

  // =====================================================
  // PROGRESS
  // =====================================================

  const progress = Math.min(
    (swipeCount /
      SWIPE_TARGET) *
      100,
    100
  );

  const aiUnlocked =
    swipeCount >= SWIPE_TARGET;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-5">
        <Toaster position="top-right" />

        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">
            🤖
          </div>

          <h2 className="text-xl font-bold text-indigo-700">
            Finding Your Jobs...
          </h2>

          <p className="text-gray-500 mt-1 text-sm">
            Loading available opportunities...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <Toaster position="top-right" />

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full"
        >
          <div className="text-5xl mb-4">
            ⚠️
          </div>

          <h2 className="text-xl font-bold text-gray-800">
            Unable to Load Jobs
          </h2>

          <p className="text-gray-500 mt-2 text-sm">
            {loadError}
          </p>

          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={fetchJobs}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 font-semibold"
            >
              <FaRedo />
              Try Again
            </button>

            <button
              onClick={() =>
                navigate("/dashboard")
              }
              className="bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold"
            >
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // =====================================================
  // NO JOBS
  // =====================================================

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <Toaster position="top-right" />

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full"
        >
          <div className="text-6xl mb-3">
            🎉
          </div>

          <h2 className="text-2xl font-bold text-gray-800">
            You're All Caught Up!
          </h2>

          <p className="text-gray-500 mt-3 text-sm">
            You've reviewed all available recommendations.
          </p>

          <div className="mt-5 bg-indigo-50 rounded-xl p-4">
            <p className="text-sm text-indigo-700 font-semibold">
              AI Learning Progress
            </p>

            <p className="text-xl font-bold text-indigo-800 mt-1">
              {Math.min(
                swipeCount,
                SWIPE_TARGET
              )}{" "}
              / {SWIPE_TARGET}
            </p>

            <div className="h-2 bg-indigo-100 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <button
              onClick={fetchJobs}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold"
            >
              <FaRedo />
              Refresh Jobs
            </button>

            <button
              onClick={() =>
                navigate(
                  "/applications"
                )
              }
              className="bg-green-100 text-green-700 px-5 py-2.5 rounded-xl font-semibold"
            >
              My Applications
            </button>

            <button
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
              className="bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold"
            >
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // =====================================================
  // CURRENT JOB
  // =====================================================

  const job = jobs[0];

  const matchedSkills =
    Array.isArray(
      job.matched_skills
    )
      ? job.matched_skills
      : [];

  const missingSkills =
    Array.isArray(
      job.missing_skills
    )
      ? job.missing_skills
      : [];

  const requiredSkills =
    Array.isArray(
      job.required_skills
    )
      ? job.required_skills
      : typeof job.required_skills ===
        "string"
      ? job.required_skills
          .split(",")
          .map((skill) =>
            skill.trim()
          )
          .filter(Boolean)
      : [];

  const visibleMatchedSkills =
    matchedSkills.slice(0, 4);

  const visibleMissingSkills =
    missingSkills.slice(0, 4);

  const matchPercentage =
    Number(
      job.match_percentage
    ) || 0;

  const atsScore =
    Number(job.ats_score) || 0;

  const jobType =
    job.job_type ||
    job.type ||
    job.employment_type ||
    "";

  const salary =
    job.salary ||
    job.salary_range ||
    job.package ||
    "";

  const companyName =
    typeof job.company ===
    "string"
      ? job.company
      : job.company?.name ||
        "Company not specified";

  const companyInitial =
    companyName
      ?.charAt(0)
      ?.toUpperCase() || "C";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-3 py-3 sm:px-4 sm:py-4">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <div className="w-full max-w-xl mx-auto">

        {/* AI PROGRESS */}

        <motion.div
          initial={{
            opacity: 0,
            y: -8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className={`rounded-xl p-3 mb-3 border ${
            aiUnlocked
              ? "bg-green-50 border-green-200"
              : "bg-white border-indigo-100"
          }`}
        >
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2.5 min-w-0">

              <div
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm ${
                  aiUnlocked
                    ? "bg-green-100 text-green-600"
                    : "bg-indigo-100 text-indigo-600"
                }`}
              >
                {aiUnlocked ? (
                  <FaCheckCircle />
                ) : (
                  <FaRobot />
                )}
              </div>

              <div className="min-w-0">

                <p className="font-bold text-gray-800 text-xs sm:text-sm truncate">
                  {aiUnlocked
                    ? "Personalized AI Mode Active"
                    : "AI Learning Your Preferences"}
                </p>

                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
                  {aiUnlocked
                    ? "Recommendations are personalized."
                    : `${Math.max(
                        SWIPE_TARGET -
                          swipeCount,
                        0
                      )} more swipes to improve personalization.`}
                </p>

              </div>
            </div>

            <div className="text-right ml-2 shrink-0">

              <p className="text-sm font-bold text-indigo-700">
                {Math.min(
                  swipeCount,
                  SWIPE_TARGET
                )}
                /{SWIPE_TARGET}
              </p>

              <p className="text-[8px] text-gray-400">
                SWIPES
              </p>

            </div>
          </div>

          <div className="h-1.5 bg-gray-200 rounded-full mt-2.5 overflow-hidden">

            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 0.5,
              }}
              className={`h-full rounded-full ${
                aiUnlocked
                  ? "bg-green-500"
                  : "bg-gradient-to-r from-indigo-500 to-cyan-500"
              }`}
            />

          </div>
        </motion.div>

        {/* JOB CARD */}

        <AnimatePresence mode="wait">

          <motion.div
            key={job.id}
            drag={
              swiping || applying
                ? false
                : "x"
            }
            dragConstraints={{
              left: 0,
              right: 0,
            }}
            dragElastic={0.7}
            style={{
              x,
              rotate,
            }}
            animate={controls}
            onDragEnd={
              handleDragEnd
            }
            initial={{
              opacity: 0,
              scale: 0.97,
            }}
            whileTap={{
              scale: 0.985,
            }}
            className="relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y select-none"
          >

            {/* JOB HEADER */}

            <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-4 py-3.5">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 shrink-0 rounded-xl bg-white text-indigo-600 font-bold text-lg flex items-center justify-center shadow-md">
                  {companyInitial}
                </div>

                <div className="min-w-0">

                  <h2 className="text-lg font-bold leading-tight truncate">
                    {job.title ||
                      "Untitled Job"}
                  </h2>

                  <p className="text-white/90 text-xs mt-0.5 truncate">
                    {companyName}
                  </p>

                </div>

              </div>

              <div className="flex flex-wrap gap-1.5 mt-3 text-[10px]">

                <span className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1">
                  <FaMapMarkerAlt />
                  {job.location ||
                    "Location not specified"}
                </span>

                {jobType && (
                  <span className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1">
                    <FaBriefcase />
                    {jobType}
                  </span>
                )}

                {salary && (
                  <span className="bg-white/15 rounded-full px-2.5 py-1">
                    💰 {salary}
                  </span>
                )}

              </div>
            </div>

            {/* BODY */}

            <div className="px-4 py-3.5">

              {/* SCORES */}

              <div className="grid grid-cols-2 gap-2.5">

                <div className="bg-indigo-50 rounded-xl p-2.5 text-center">

                  <FaChartLine className="mx-auto text-base text-indigo-600 mb-0.5" />

                  <p className="text-[10px] text-gray-500">
                    ATS Score
                  </p>

                  <p className="text-lg font-bold text-indigo-700">
                    {atsScore}%
                  </p>

                  {job.min_ats != null && (
                    <p className="text-[9px] text-gray-400">
                      Required: {job.min_ats}%
                    </p>
                  )}

                </div>

                <div className="bg-green-50 rounded-xl p-2.5 text-center">

                  <FaStar className="mx-auto text-base text-green-600 mb-0.5" />

                  <p className="text-[10px] text-gray-500">
                    AI Match
                  </p>

                  <p className="text-lg font-bold text-green-600">
                    {matchPercentage}%
                  </p>

                </div>

              </div>

              {/* MATCH BAR */}

              <div className="mt-3">

                <div className="flex justify-between text-[10px]">

                  <span className="font-semibold text-gray-700">
                    Recommendation Score
                  </span>

                  <span className="font-bold text-indigo-600">
                    {matchPercentage}%
                  </span>

                </div>

                <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">

                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${Math.min(
                        Math.max(
                          matchPercentage,
                          0
                        ),
                        100
                      )}%`,
                    }}
                    transition={{
                      duration: 0.6,
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-indigo-600"
                  />

                </div>
              </div>

              {/* MATCHED SKILLS */}

              <div className="mt-3">

                <h3 className="text-xs font-bold text-green-700 mb-1.5">
                  ✓ Skills You Match
                </h3>

                <div className="flex flex-wrap gap-1.5">

                  {visibleMatchedSkills.length >
                  0 ? (
                    visibleMatchedSkills.map(
                      (
                        skill,
                        index
                      ) => (
                        <span
                          key={`${skill}-${index}`}
                          className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium text-[10px]"
                        >
                          {skill}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-gray-400 text-[10px]">
                      No matching skills detected.
                    </span>
                  )}

                </div>
              </div>

              {/* MISSING SKILLS */}

              {visibleMissingSkills.length >
                0 && (
                <div className="mt-2.5">

                  <h3 className="text-xs font-bold text-red-600 mb-1.5">
                    Skills You Could Improve
                  </h3>

                  <div className="flex flex-wrap gap-1.5">

                    {visibleMissingSkills.map(
                      (
                        skill,
                        index
                      ) => (
                        <span
                          key={`${skill}-${index}`}
                          className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full text-[10px]"
                        >
                          {skill}
                        </span>
                      )
                    )}

                  </div>
                </div>
              )}

              {/* DETAILS */}

              <div className="mt-3">

                <button
                  onClick={() =>
                    setShowDetails(
                      (value) =>
                        !value
                    )
                  }
                  className="w-full border border-indigo-100 bg-indigo-50 text-indigo-700 py-2 rounded-lg font-semibold text-xs hover:bg-indigo-100 transition"
                >
                  {showDetails
                    ? "Hide Job Details ↑"
                    : "Why Is This Recommended? ↓"}
                </button>

              </div>

              {/* DETAILS CONTENT */}

              <AnimatePresence>

                {showDetails && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    className="overflow-hidden"
                  >

                    <div className="mt-2 bg-slate-50 rounded-xl p-3">

                      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-xs">
                        <FaRobot className="text-indigo-600" />
                        AI Recommendation Explanation
                      </h3>

                      <div className="space-y-1.5 text-[10px] text-gray-600">

                        <p className="flex gap-2">
                          <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" />

                          <span>
                            Your profile matches{" "}
                            <strong>
                              {
                                visibleMatchedSkills.length
                              }
                            </strong>{" "}
                            key job skills.
                          </span>
                        </p>

                        <p className="flex gap-2">
                          <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" />

                          <span>
                            Your ATS score is{" "}
                            <strong>
                              {atsScore}%
                            </strong>
                            .
                          </span>
                        </p>

                        <p className="flex gap-2">
                          <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" />

                          <span>
                            Overall recommendation score is{" "}
                            <strong>
                              {
                                matchPercentage
                              }%
                            </strong>
                            .
                          </span>
                        </p>

                        {requiredSkills.length >
                          0 && (
                          <p className="text-[9px] text-gray-400 pt-1">
                            Based on your profile,
                            skills, ATS score and
                            job requirements.
                          </p>
                        )}

                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* APPLY */}

              <button
                onClick={() =>
                  applyJob(job.id)
                }
                disabled={
                  applying ||
                  swiping
                }
                className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold text-sm transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {applying
                  ? "Submitting Application..."
                  : "Apply Now"}
              </button>

              {/* SWIPE INSTRUCTION */}

              <div className="mt-4 text-center">

                <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">

                  <span className="text-red-500 font-bold">
                    ←
                  </span>

                  <span className="text-[10px] font-semibold text-gray-500">
                    Swipe left to skip
                  </span>

                  <span className="text-gray-300">
                    |
                  </span>

                  <span className="text-[10px] font-semibold text-gray-500">
                    Swipe right to save
                  </span>

                  <span className="text-green-500 font-bold">
                    →
                  </span>

                </div>

              </div>

            </div>
          </motion.div>

        </AnimatePresence>

        {/* FOOTER */}

        <div className="text-center mt-2">

          <p className="text-[9px] text-gray-400">
            Drag the card left or right to make your choice.
          </p>

          {!aiUnlocked && (
            <p className="text-[9px] text-indigo-500 font-medium mt-0.5">
              Every swipe helps SwipeX understand your job preferences.
            </p>
          )}

        </div>

      </div>
    </div>
  );
}

export default Jobs;
