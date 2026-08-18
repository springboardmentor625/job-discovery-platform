import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function JobDiscovery() {

  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);


  // ==========================================
  // LOAD MATCHED JOBS
  // ==========================================

  useEffect(() => {

    const fetchMatchedJobs = async () => {

      try {

        const response = await api.get(
          "/api/jobs/matched"
        );

        setJobs(response.data || []);

      } catch (err) {

        console.error(err);

        if (err.response?.status === 401) {

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

        if (err.response?.status === 404) {

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


    fetchMatchedJobs();

  }, [navigate]);


  // ==========================================
  // CURRENT JOB
  // ==========================================

  const currentJob =
    jobs[currentIndex];


  const nextJob = () => {

    setCurrentIndex(
      (previous) =>
        previous + 1
    );

  };


  // ==========================================
  // LIKE
  // ==========================================

  const handleLike = async () => {

    if (
      !currentJob ||
      actionLoading
    ) {
      return;
    }


    setActionLoading(true);


    try {

      await api.post(
        `/api/jobs/${currentJob.job_id}/swipe`,
        {
          action: "like"
        }
      );

    } catch (err) {

      console.error(
        "Like error:",
        err
      );

    } finally {

      setActionLoading(false);

      nextJob();

    }

  };


  // ==========================================
  // REJECT
  // ==========================================

  const handleReject = async () => {

    if (
      !currentJob ||
      actionLoading
    ) {
      return;
    }


    setActionLoading(true);


    try {

      await api.post(
        `/api/jobs/${currentJob.job_id}/swipe`,
        {
          action: "reject"
        }
      );

    } catch (err) {

      console.error(
        "Reject error:",
        err
      );

    } finally {

      setActionLoading(false);

      nextJob();

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
  // ERROR
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
  // ALL JOBS FINISHED
  // ==========================================

  if (
    jobs.length === 0 ||
    currentIndex >= jobs.length
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
            We've shown you all the jobs
            currently matching your profile.
          </p>

          <button
            className="primary-job-button"
            onClick={() =>
              navigate("/candidate")
            }
          >
            Back to Dashboard
          </button>

        </div>

      </div>

    );

  }


  // ==========================================
  // MATCH PERCENTAGE
  // ==========================================

  const matchScore =
    Math.round(
      currentJob.match_score || 0
    );


  // ==========================================
  // UI
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
            navigate("/candidate")
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


          <div className="job-counter">

            <strong>
              {currentIndex + 1}
            </strong>

            <span>
              / {jobs.length}
            </span>

          </div>

        </div>

      </div>


      {/* ======================================
          CARD AREA
      ======================================= */}

      <div className="modern-job-area">


        {/* Background card */}

        {jobs[currentIndex + 1] && (

          <div className="modern-job-card next-card">

            <div className="next-card-content">
              Next opportunity
            </div>

          </div>

        )}


        {/* Current card */}

        <div className="modern-job-card">


          {/* ==================================
              TOP
          =================================== */}

          <div className="modern-job-top">


            <div className="modern-company-logo">

              {currentJob.company
                ? currentJob.company
                    .charAt(0)
                    .toUpperCase()
                : "J"}

            </div>


            <div className="modern-company-info">

              <span>
                {currentJob.company ||
                  "Company"}
              </span>

              <h2>
                {currentJob.title}
              </h2>

            </div>


            <div
              className={`match-badge ${
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
              DETAILS
          =================================== */}

          <div className="modern-job-details">


            <div className="modern-detail">

              <span>📍</span>

              <div>

                <small>
                  Location
                </small>

                <strong>
                  {currentJob.location ||
                    "Not specified"}
                </strong>

              </div>

            </div>


            <div className="modern-detail">

              <span>💼</span>

              <div>

                <small>
                  Employment
                </small>

                <strong>
                  {currentJob.employment_type ||
                    "Not specified"}
                </strong>

              </div>

            </div>


            <div className="modern-detail">

              <span>💰</span>

              <div>

                <small>
                  Salary
                </small>

                <strong>
                  {currentJob.salary ||
                    "Not specified"}
                </strong>

              </div>

            </div>


            <div className="modern-detail">

              <span>🎯</span>

              <div>

                <small>
                  Experience
                </small>

                <strong>
                  {currentJob.experience_required ||
                    "Not specified"}
                </strong>

              </div>

            </div>

          </div>


          {/* ==================================
              MATCHED SKILLS
          =================================== */}

          {currentJob.matched_skills?.length > 0 && (

            <div className="matched-section">

              <div className="matched-title">

                <span>
                  ✦
                </span>

                Skills matching your profile

              </div>


              <div className="modern-skills">

                {currentJob.matched_skills.map(
                  (skill) => (

                    <span
                      className="matched-skill"
                      key={skill}
                    >
                      ✓ {skill}
                    </span>

                  )
                )}

              </div>

            </div>

          )}


          {/* ==================================
              JOB SKILLS
          =================================== */}

          {currentJob.skills && (

            <div className="all-skills-section">

              <span className="skills-label">
                Required Skills
              </span>


              <div className="modern-skills">

                {currentJob.skills
                  .split(",")
                  .map(
                    (skill) =>
                      skill.trim()
                  )
                  .filter(Boolean)
                  .slice(0, 10)
                  .map(
                    (skill) => (

                      <span
                        className="normal-skill"
                        key={skill}
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

          <div className="modern-description">

            <span>
              ABOUT THE ROLE
            </span>

            <p>
              {currentJob.description ||
                "No description available."}
            </p>

          </div>


          {/* ==================================
              ACTIONS
          =================================== */}

          <div className="modern-actions">

            <button
              className="modern-reject"
              onClick={handleReject}
              disabled={actionLoading}
              title="Not interested"
            >
              ✕
            </button>


            <div className="swipe-action-label">
              <span>
                SwipeX
              </span>

              <small>
                Choose your opportunity
              </small>
            </div>


            <button
              className="modern-like"
              onClick={handleLike}
              disabled={actionLoading}
              title="Interested"
            >
              ♥
            </button>

          </div>


          <div className="modern-hint">
            <span>
              ✕
            </span>
            Not interested
            <span>
              •
            </span>
            <span>
              ♥
            </span>
            Interested
          </div>


        </div>

      </div>

    </div>

  );

}


export default JobDiscovery;