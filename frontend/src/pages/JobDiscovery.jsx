import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function JobDiscovery() {

  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);

  const [savedJobs, setSavedJobs] = useState(
    new Set()
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] =
    useState(null);

  const [saveError, setSaveError] =
    useState("");


  // ==========================================
  // LOAD MATCHED JOBS + SAVED JOBS
  // ==========================================

  useEffect(() => {

    const fetchJobs = async () => {

      try {

        setLoading(true);
        setError("");


        // ======================================
        // LOAD MATCHED JOBS
        // ======================================

        const jobsResponse =
          await api.get(
            "/api/jobs/matched"
          );


        console.log(
          "========== SWIPEX JOB DEBUG =========="
        );

        console.log(
          "Matched jobs response:",
          jobsResponse.data
        );

        console.log(
          "Is array:",
          Array.isArray(
            jobsResponse.data
          )
        );

        console.log(
          "Job count:",
          jobsResponse.data?.length
        );


        if (
          Array.isArray(
            jobsResponse.data
          )
        ) {

          setJobs(
            jobsResponse.data
          );

        } else {

          setJobs([]);

        }


        // ======================================
        // LOAD SAVED JOBS
        // ======================================

        try {

          const savedResponse =
            await api.get(
              "/api/saved-jobs"
            );


          console.log(
            "SwipeX saved jobs:",
            savedResponse.data
          );


          if (
            Array.isArray(
              savedResponse.data
            )
          ) {

            const savedIds =
              new Set(
                savedResponse.data.map(
                  savedJob =>
                    savedJob.job_id
                )
              );


            setSavedJobs(
              savedIds
            );

          } else {

            setSavedJobs(
              new Set()
            );

          }

        } catch (savedError) {

          console.error(
            "SwipeX saved jobs loading error:",
            savedError
          );


          // Don't break Discover Jobs
          // if saved jobs fail to load.

          setSavedJobs(
            new Set()
          );

        }

      } catch (err) {

        console.error(
          "SwipeX job loading error:",
          err
        );


        // ======================================
        // AUTH ERROR
        // ======================================

        if (
          err.response?.status === 401
        ) {

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "user_id"
          );

          localStorage.removeItem(
            "role"
          );

          navigate("/login");

          return;

        }


        // ======================================
        // PROFILE NOT FOUND
        // ======================================

        if (
          err.response?.status === 404
        ) {

          setError(
            "Please complete your candidate profile first."
          );

        } else {

          setError(
            err.response?.data?.detail ||
            "Unable to load matched jobs."
          );

        }

      } finally {

        setLoading(false);

      }

    };


    fetchJobs();

  }, [navigate]);


  // ==========================================
  // LIKE / REJECT JOB
  // ==========================================

  const handleSwipe = async (
    jobId,
    action
  ) => {

    if (
      actionLoading
    ) {

      return;

    }


    setActionLoading(
      jobId
    );


    try {

      await api.post(
        `/api/jobs/${jobId}/swipe`,
        {
          action
        }
      );


      // ======================================
      // REMOVE FROM DISCOVER JOBS
      // ======================================

      setJobs(
        previousJobs =>
          previousJobs.filter(
            job =>
              job.job_id !== jobId
          )
      );


    } catch (err) {

      console.error(
        "SwipeX swipe error:",
        err
      );


      // ======================================
      // AUTH ERROR
      // ======================================

      if (
        err.response?.status === 401
      ) {

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "user_id"
        );

        localStorage.removeItem(
          "role"
        );

        navigate("/login");

        return;

      }


      console.error(
        "Swipe error response:",
        err.response?.data
      );

    } finally {

      setActionLoading(
        null
      );

    }

  };


  // ==========================================
  // SAVE / UNSAVE JOB
  // ==========================================

  const handleSaveJob = async (
    jobId
  ) => {

    if (
      actionLoading
    ) {

      return;

    }


    setSaveError("");

    setActionLoading(
      jobId
    );


    const isSaved =
      savedJobs.has(
        jobId
      );


    try {

      // ======================================
      // REMOVE SAVED JOB
      // ======================================

      if (isSaved) {

        console.log(
          `SwipeX removing saved job: ${jobId}`
        );


        await api.delete(
          `/api/saved-jobs/${jobId}`
        );


        setSavedJobs(
          previous => {

            const updated =
              new Set(
                previous
              );


            updated.delete(
              jobId
            );


            return updated;

          }
        );


        console.log(
          "SwipeX job removed from saved jobs"
        );

      }


      // ======================================
      // SAVE JOB
      // ======================================

      else {

        console.log(
          `SwipeX saving job: ${jobId}`
        );


        await api.post(
          `/api/saved-jobs/${jobId}`
        );


        setSavedJobs(
          previous => {

            const updated =
              new Set(
                previous
              );


            updated.add(
              jobId
            );


            return updated;

          }
        );


        console.log(
          "SwipeX job saved successfully"
        );

      }

    } catch (err) {

      console.error(
        "SwipeX save job error:",
        err
      );


      console.error(
        "Save API response:",
        err.response?.data
      );


      // ======================================
      // AUTH ERROR
      // ======================================

      if (
        err.response?.status === 401
      ) {

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "user_id"
        );

        localStorage.removeItem(
          "role"
        );

        navigate("/login");

        return;

      }


      // ======================================
      // LOCAL SAVE ERROR
      // ======================================

      setSaveError(
        err.response?.data?.detail ||
        "Unable to save the job."
      );


      // IMPORTANT:
      // We DON'T call setError() here.
      //
      // Otherwise the entire Discover Jobs
      // page becomes:
      //
      // Something went wrong
      // Update Profile
      //
      // which is incorrect for a Save error.

    } finally {

      setActionLoading(
        null
      );

    }

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="job-discovery-modern">

        <div className="jobs-loading-card">

          <div className="loading-spinner">
            ✦
          </div>

          <h2>
            Finding your best matches...
          </h2>

          <p>
            SwipeX is analyzing jobs based on
            your profile and preferences.
          </p>

        </div>

      </div>

    );

  }


  // ==========================================
  // MAIN ERROR
  // ==========================================

  if (error) {

    return (

      <div className="job-discovery-modern">

        <div className="jobs-empty-card">

          <div className="empty-icon">
            ⚠
          </div>

          <h2>
            Something went wrong
          </h2>

          <p>
            {error}
          </p>

          <button
            className="primary-job-button"
            onClick={() =>
              navigate(
                "/candidate/profile/edit"
              )
            }
          >

            Update Profile

          </button>

        </div>

      </div>

    );

  }


  // ==========================================
  // NO JOBS
  // ==========================================

  if (
    jobs.length === 0
  ) {

    return (

      <div className="job-discovery-modern">

        <div className="jobs-empty-card">

          <div className="empty-icon">
            ✓
          </div>

          <h2>
            You're all caught up!
          </h2>

          <p>
            There are no more matching jobs
            available right now.
          </p>

          <button
            className="primary-job-button"
            onClick={() =>
              navigate(
                "/candidate"
              )
            }
          >

            Back to Dashboard

          </button>

        </div>

      </div>

    );

  }


  // ==========================================
  // JOB CARD
  // ==========================================

  const renderJobCard = (
    job
  ) => {

    const matchScore =
      Math.round(
        Number(
          job.match_score || 0
        )
      );


    const isSaved =
      savedJobs.has(
        job.job_id
      );


    const isLoading =
      actionLoading ===
      job.job_id;


    return (

      <div
        className="swipex-job-card"
        key={job.job_id}
      >


        {/* ==================================
            CARD HEADER
        =================================== */}

        <div className="swipex-job-header">


          <div className="swipex-company-logo">

            {job.company
              ? job.company
                  .charAt(0)
                  .toUpperCase()
              : "J"}

          </div>


          <div className="swipex-company-info">

            <span>
              {job.company ||
                "Company"}
            </span>

            <h2>
              {job.title ||
                "Untitled Job"}
            </h2>

          </div>


          {/* MATCH SCORE */}

          <div
            className={`swipex-match-score ${
              matchScore >= 80
                ? "excellent"
                : matchScore >= 60
                ? "good"
                : "average"
            }`}
          >

            <strong>
              {matchScore}%
            </strong>

            <span>
              Match
            </span>

          </div>

        </div>


        {/* ==================================
            JOB DETAILS
        =================================== */}

        <div className="swipex-job-details">


          <div>

            <span>
              📍
            </span>

            <div>

              <small>
                Location
              </small>

              <strong>
                {job.location ||
                  "Not specified"}
              </strong>

            </div>

          </div>


          <div>

            <span>
              💼
            </span>

            <div>

              <small>
                Employment
              </small>

              <strong>
                {job.employment_type ||
                  "Not specified"}
              </strong>

            </div>

          </div>


          <div>

            <span>
              💰
            </span>

            <div>

              <small>
                Salary
              </small>

              <strong>
                {job.salary ||
                  "Not specified"}
              </strong>

            </div>

          </div>


          <div>

            <span>
              🎯
            </span>

            <div>

              <small>
                Experience
              </small>

              <strong>
                {job.experience_required ||
                  "Not specified"}
              </strong>

            </div>

          </div>

        </div>


        {/* ==================================
            MATCHED SKILLS
        =================================== */}

        {job.matched_skills?.length > 0 && (

          <div className="swipex-matched-section">

            <div className="swipex-section-title">

              ✦ Skills matching your profile

            </div>


            <div className="swipex-skills">

              {job.matched_skills.map(
                skill => (

                  <span
                    key={skill}
                    className="swipex-matched-skill"
                  >

                    ✓ {skill}

                  </span>

                )
              )}

            </div>

          </div>

        )}


        {/* ==================================
            REQUIRED SKILLS
        =================================== */}

        {job.skills && (

          <div className="swipex-required-section">

            <span>
              Required Skills
            </span>


            <div className="swipex-skills">

              {job.skills
                .split(",")
                .map(
                  skill =>
                    skill.trim()
                )
                .filter(Boolean)
                .slice(0, 8)
                .map(
                  skill => (

                    <span
                      key={skill}
                      className="swipex-normal-skill"
                    >

                      {skill}

                    </span>

                  )
                )}

            </div>

          </div>

        )}


        {/* ==================================
            DESCRIPTION
        =================================== */}

        <div className="swipex-description">

          <span>
            ABOUT THE ROLE
          </span>

          <p>

            {job.description ||
              "No description available."}

          </p>

        </div>


        {/* ==================================
            VIEW DETAILS
        =================================== */}

        <button
          type="button"
          className="swipex-view-button"
          onClick={() =>
            navigate(
              `/candidate/jobs/${job.job_id}`
            )
          }
        >

          View Job Details →

        </button>


        {/* ==================================
            ACTIONS
        ================================== */}

        <div className="swipex-actions">


          {/* ==================================
              REJECT
          ================================== */}

          <button
            type="button"
            className="swipex-reject"
            onClick={() =>
              handleSwipe(
                job.job_id,
                "reject"
              )
            }
            disabled={isLoading}
            title="Not interested"
          >

            {isLoading
              ? "..."
              : "✕"}

          </button>


          {/* ==================================
              SAVE
          ================================== */}

          <button
            type="button"
            className={
              isSaved
                ? "swipex-save saved"
                : "swipex-save"
            }
            onClick={() =>
              handleSaveJob(
                job.job_id
              )
            }
            disabled={isLoading}
            title={
              isSaved
                ? "Remove from saved jobs"
                : "Save job"
            }
            aria-label={
              isSaved
                ? "Remove from saved jobs"
                : "Save job"
            }
          >

            {isLoading
              ? "..."
              : "🔖"}

          </button>


          {/* ==================================
              LIKE
          ================================== */}

          <button
            type="button"
            className="swipex-like"
            onClick={() =>
              handleSwipe(
                job.job_id,
                "like"
              )
            }
            disabled={isLoading}
            title="Interested"
          >

            {isLoading
              ? "..."
              : "♥"}

          </button>

        </div>


        {/* ==================================
            ACTION LABEL
        ================================== */}

        <div className="swipex-action-hint">

          <span>
            ✕ Reject
          </span>

          <span
            className={
              isSaved
                ? "saved-hint"
                : ""
            }
          >

            🔖{" "}
            {isSaved
              ? "Saved"
              : "Save"}

          </span>

          <span>
            ♥ Like
          </span>

        </div>


        {/* ==================================
            SAVE ERROR
        ================================== */}

        {isLoading &&
          saveError && (
            <div className="swipex-save-error">
              {saveError}
            </div>
          )}

      </div>

    );

  };


  // ==========================================
  // MAIN UI
  // ==========================================

  return (

    <div className="job-discovery-modern">


      {/* ======================================
          HEADER
      ======================================= */}

      <div className="modern-jobs-header">

        <button
          className="modern-back-button"
          onClick={() =>
            navigate(
              "/candidate"
            )
          }
        >

          ← Dashboard

        </button>


        <div className="modern-header-content">

          <div>

            <span className="modern-eyebrow">
              SWIPEX DISCOVERY
            </span>

            <h1>
              Find your next opportunity.
            </h1>

            <p>
              Jobs ranked according to your
              skills, experience and preferences.
            </p>

          </div>


          {/* JOB COUNT */}

          <div className="job-counter">

            <strong>
              {jobs.length}
            </strong>

            <span>
              Jobs
            </span>

          </div>

        </div>

      </div>


      {/* ======================================
          SAVE ERROR MESSAGE
      ======================================= */}

      {saveError && !actionLoading && (

        <div className="swipex-global-save-error">

          {saveError}

          <button
            type="button"
            onClick={() =>
              setSaveError("")
            }
          >
            ×
          </button>

        </div>

      )}


      {/* ======================================
          JOB GRID
      ======================================= */}

      <div className="swipex-jobs-grid">

        {jobs.map(
          renderJobCard
        )}

      </div>


    </div>

  );

}


export default JobDiscovery;