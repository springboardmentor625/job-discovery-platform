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
} from "react-icons/fa";

import api from "../services/api";

function Applications() {
  const navigate = useNavigate();

  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================
  // LOAD LIKED / SAVED JOBS
  // ============================================

  const loadSwipes = async () => {
    try {
      const response = await api.get("swipes/");

      console.log("SWIPES API RESPONSE:", response.data);

      const data = response.data;

      let swipes = [];

      if (Array.isArray(data)) {
        swipes = data;
      } else if (Array.isArray(data?.results)) {
        swipes = data.results;
      }

      // Only jobs swiped right
      const rightSwipes = swipes.filter(
        (swipe) => swipe.decision === "right"
      );

      const jobs = rightSwipes
        .map((swipe) => {
          // New backend serializer
          if (
            swipe.job &&
            typeof swipe.job === "object"
          ) {
            return {
              ...swipe.job,
              swipeId: swipe.id,
            };
          }

          // Old backend serializer
          if (
            swipe.job &&
            typeof swipe.job !== "object"
          ) {
            return {
              id: swipe.job,
              title: "Job",
              company: "",
              location: "",
              swipeId: swipe.id,
            };
          }

          return null;
        })
        .filter(Boolean);

      return jobs;
    } catch (error) {
      console.error(
        "SWIPES API ERROR:",
        error.response?.status,
        error.response?.data || error.message
      );

      throw new Error(
        `Unable to load liked jobs${
          error.response?.status
            ? ` (${error.response.status})`
            : ""
        }`
      );
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

      const data = response.data;

      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(data?.results)) {
        return data.results;
      }

      return [];
    } catch (error) {
      console.error(
        "APPLICATIONS API ERROR:",
        error.response?.status,
        error.response?.data || error.message
      );

      throw new Error(
        `Unable to load applications${
          error.response?.status
            ? ` (${error.response.status})`
            : ""
        }`
      );
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
      toast.error(error.message);
    }

    try {
      appliedJobs = await loadApplications();
    } catch (error) {
      toast.error(error.message);
    }

    setApplications(appliedJobs);

    // Get IDs of jobs already applied for
    const appliedJobIds = new Set(
      appliedJobs
        .map(
          (application) =>
            application.job?.id ||
            application.job_id
        )
        .filter(Boolean)
    );

    // Liked jobs that are NOT already applied
    const saved = swipedJobs.filter(
      (job) => !appliedJobIds.has(job.id)
    );

    setSavedJobs(saved);

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

    // Go to dedicated application form
    navigate(`/apply/${jobId}`);
  };

  // ============================================
  // DATE
  // ============================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
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

  // ============================================
  // PAGE
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-5">

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <div className="max-w-4xl mx-auto">

        {/* ========================================
            HEADER
        ======================================== */}

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            My Applications
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Manage jobs you liked and applications you submitted.
          </p>
        </div>

        {/* ========================================
            SAVED JOBS
        ======================================== */}

        <section className="mb-8">

          <div className="flex items-center justify-between mb-3">

            <div>
              <div className="flex items-center gap-2">
                <FaHeart className="text-green-500" />

                <h2 className="text-lg font-bold text-gray-800">
                  Jobs You Liked
                </h2>
              </div>

              <p className="text-xs text-gray-500 mt-1">
                Jobs you saved by swiping right.
              </p>
            </div>

            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
              {savedJobs.length} Saved
            </span>

          </div>

          {savedJobs.length === 0 ? (

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 text-center">

              <div className="w-14 h-14 mx-auto rounded-full bg-green-50 flex items-center justify-center">
                <FaHeart className="text-green-400 text-xl" />
              </div>

              <h3 className="font-bold text-gray-700 mt-3">
                No liked jobs yet
              </h3>

              <p className="text-gray-400 text-sm mt-1">
                Swipe right on jobs you are interested in.
                They will appear here so you can apply later.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {savedJobs.map((job) => (

                <div
                  key={job.id}
                  className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 sm:p-5"
                >

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    <div className="min-w-0">

                      <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                        {job.title || "Job"}
                      </h3>

                      {job.company && (
                        <p className="text-indigo-600 font-semibold text-sm mt-0.5">
                          {job.company}
                        </p>
                      )}

                      {job.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                          <FaMapMarkerAlt />
                          {job.location}
                        </div>
                      )}

                    </div>

                    {/* =================================
                        APPLY BUTTON
                    ================================= */}

                    <button
                      onClick={() =>
                        applyToJob(job.id)
                      }
                      className="shrink-0 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition"
                    >
                      Apply Now
                      <FaArrowRight />
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* ========================================
            APPLIED JOBS
        ======================================== */}

        <section>

          <div className="flex items-center justify-between mb-3">

            <div>
              <div className="flex items-center gap-2">

                <FaCheckCircle className="text-indigo-500" />

                <h2 className="text-lg font-bold text-gray-800">
                  Applied Jobs
                </h2>

              </div>

              <p className="text-xs text-gray-500 mt-1">
                Jobs where you have already submitted an application.
              </p>

            </div>

            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
              {applications.length} Applied
            </span>

          </div>

          {applications.length === 0 ? (

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 text-center">

              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
                <FaBriefcase className="text-indigo-400 text-xl" />
              </div>

              <h3 className="font-bold text-gray-700 mt-3">
                No applications yet
              </h3>

              <p className="text-gray-400 text-sm mt-1">
                When you apply to a job, it will appear here.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {applications.map((application) => {

                const job = application.job;

                if (!job) {
                  return null;
                }

                return (

                  <div
                    key={application.id}
                    className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-4 sm:p-5"
                  >

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                      <div>

                        <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                          {job.title || "Job"}
                        </h3>

                        {job.company && (
                          <p className="text-indigo-600 font-semibold text-sm mt-0.5">
                            {job.company}
                          </p>
                        )}

                        {job.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                            <FaMapMarkerAlt />
                            {job.location}
                          </div>
                        )}

                      </div>

                      <div className="flex items-center gap-2 text-xs text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl">

                        <FaClock />

                        Applied

                        {application.applied_at
                          ? ` • ${formatDate(
                              application.applied_at
                            )}`
                          : ""}

                      </div>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </section>

      </div>

    </div>
  );
}

export default Applications;
