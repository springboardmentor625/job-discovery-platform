import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import api from "../api";

function JobDiscovery() {

  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ==========================================
  // LOAD JOBS
  // ==========================================

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await api.get(
        "/api/candidate/jobs"
      );

      setJobs(response.data);

    } catch (err) {

      console.error(err);

      if (err.response?.status === 401) {

        localStorage.removeItem("access_token");

        navigate("/login");

        return;
      }

      setError(
        err.response?.data?.detail ||
        "Unable to load jobs."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================
  // SAVE SWIPE
  // ==========================================

  const saveSwipe = async (action) => {

    if (
      jobs.length === 0 ||
      swiping
    ) {
      return;
    }

    const currentJob = jobs[0];

    try {

      setSwiping(true);

      setError("");

      setMessage("");


      await api.post(
        `/api/candidate/jobs/${currentJob.job_id}/swipe`,
        null,
        {
          params: {
            action: action
          }
        }
      );


      // Remove current job

      setJobs((previousJobs) =>
        previousJobs.slice(1)
      );


      if (action === "liked") {

        setMessage(
          "Job added to your liked jobs ❤️"
        );

      } else {

        setMessage(
          "Job rejected."
        );

      }

    } catch (err) {

      console.error(err);

      if (
        err.response?.status === 401
      ) {

        localStorage.removeItem(
          "access_token"
        );

        navigate("/login");

        return;
      }

      setError(
        err.response?.data?.detail ||
        "Unable to save your swipe."
      );

    } finally {

      setSwiping(false);

    }

  };


  // ==========================================
  // DRAG END
  // ==========================================

  const handleDragEnd = (
    event,
    info
  ) => {

    if (swiping) {
      return;
    }

    const swipeDistance =
      info.offset.x;

    const swipeVelocity =
      info.velocity.x;


    // Swipe RIGHT = LIKE

    if (
      swipeDistance > 120 ||
      swipeVelocity > 700
    ) {

      saveSwipe("liked");

      return;
    }


    // Swipe LEFT = REJECT

    if (
      swipeDistance < -120 ||
      swipeVelocity < -700
    ) {

      saveSwipe("rejected");

      return;
    }

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="job-loading">

        Loading jobs...

      </div>

    );

  }


  return (

    <div className="job-discovery-page">

      <div className="job-discovery-container">


        {/* =================================
            HEADER
        ================================== */}

        <div className="job-discovery-header">

          <button
            className="back-button"
            onClick={() =>
              navigate("/candidate")
            }
          >
            ← Dashboard
          </button>


          <div>

            <p className="section-label">
              SWIPEX DISCOVERY
            </p>

            <h1>
              Discover Jobs
            </h1>

            <p>
              Swipe right if you're interested
              and left if you're not.
            </p>

          </div>

        </div>


        {/* =================================
            ERROR
        ================================== */}

        {error && (

          <div className="login-error">

            {error}

          </div>

        )}


        {/* =================================
            MESSAGE
        ================================== */}

        {message && (

          <div className="success-message">

            {message}

          </div>

        )}


        {/* =================================
            NO JOBS
        ================================== */}

        {jobs.length === 0 && !error && (

          <div className="no-jobs-card">

            <div className="no-jobs-icon">
              ✓
            </div>

            <h2>
              You're all caught up!
            </h2>

            <p>
              There are no more jobs available
              for you right now.
            </p>

            <button
              className="dashboard-button"
              onClick={() =>
                navigate("/candidate")
              }
            >
              Back to Dashboard
            </button>

          </div>

        )}


        {/* =================================
            SWIPE CARDS
        ================================== */}

        {jobs.length > 0 && (

          <div className="swipe-card-container">

            {/* NEXT CARD */}

            {jobs.length > 1 && (

              <div className="job-card next-job-card">

                <div className="job-card-top">

                  <div className="company-logo">

                    {jobs[1].company
                      ?.charAt(0)
                      .toUpperCase()}

                  </div>

                  <div>

                    <p className="job-company">
                      {jobs[1].company}
                    </p>

                    <h2>
                      {jobs[1].title}
                    </h2>

                  </div>

                </div>

              </div>

            )}


            {/* CURRENT CARD */}

            <SwipeCard
              job={jobs[0]}
              onSwipe={handleDragEnd}
              swiping={swiping}
            />

          </div>

        )}


      </div>

    </div>

  );

}


// ==========================================
// SWIPE CARD COMPONENT
// ==========================================

function SwipeCard({
  job,
  onSwipe,
  swiping
}) {

  const x = useMotionValue(0);

  const rotate = useTransform(
    x,
    [-300, 300],
    [-15, 15]
  );

  const likeOpacity = useTransform(
    x,
    [0, 150],
    [0, 1]
  );

  const rejectOpacity = useTransform(
    x,
    [-150, 0],
    [1, 0]
  );


  return (

    <motion.div
      className="job-card swipe-card"
      style={{
        x,
        rotate
      }}
      drag="x"
      dragConstraints={{
        left: 0,
        right: 0
      }}
      dragElastic={1}
      onDragEnd={onSwipe}
      whileDrag={{
        cursor: "grabbing"
      }}
      animate={{
        scale: swiping ? 0.98 : 1
      }}
    >


      {/* LIKE INDICATOR */}

      <motion.div
        className="swipe-indicator like-indicator"
        style={{
          opacity: likeOpacity
        }}
      >
        LIKE ❤️
      </motion.div>


      {/* REJECT INDICATOR */}

      <motion.div
        className="swipe-indicator reject-indicator"
        style={{
          opacity: rejectOpacity
        }}
      >
        NOPE ✕
      </motion.div>


      {/* JOB HEADER */}

      <div className="job-card-top">

        <div className="company-logo">

          {job.company
            ?.charAt(0)
            .toUpperCase()}

        </div>


        <div>

          <p className="job-company">
            {job.company}
          </p>

          <h2>
            {job.title}
          </h2>

        </div>

      </div>


      {/* JOB DETAILS */}

      <div className="job-details">

        <div className="job-detail">
          📍 {job.location}
        </div>

        <div className="job-detail">
          💼 {job.employment_type}
        </div>


        {job.experience_required && (

          <div className="job-detail">
            🎓 {job.experience_required}
          </div>

        )}


        {job.salary && (

          <div className="job-detail">
            💰 {job.salary}
          </div>

        )}

      </div>


      {/* SKILLS */}

      {job.skills && (

        <div className="job-skills">

          {job.skills
            .split(",")
            .map((skill, index) => (

              <span
                key={index}
                className="skill-tag"
              >
                {skill.trim()}
              </span>

            ))}

        </div>

      )}


      {/* DESCRIPTION */}

      <div className="job-description">

        <h3>
          About the role
        </h3>

        <p>
          {job.description}
        </p>

      </div>


      {/* BUTTON FALLBACK */}

      <div className="swipe-actions">

        <button
          className="reject-button"
          onClick={() =>
            onSwipe(
              null,
              {
                offset: {
                  x: -200
                },
                velocity: {
                  x: 0
                }
              }
            )
          }
          disabled={swiping}
        >
          ✕
        </button>


        <button
          className="like-button"
          onClick={() =>
            onSwipe(
              null,
              {
                offset: {
                  x: 200
                },
                velocity: {
                  x: 0
                }
              }
            )
          }
          disabled={swiping}
        >
          ♥
        </button>

      </div>


      <p className="swipe-hint">
        Drag right to like • Drag left to reject
      </p>

    </motion.div>

  );

}


export default JobDiscovery;