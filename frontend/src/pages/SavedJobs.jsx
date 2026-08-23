import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Toast from "../components/Toast";


function SavedJobs() {

  const navigate = useNavigate();


  // ==========================================
  // STATE
  // ==========================================

  const [savedJobs, setSavedJobs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [removingId, setRemovingId] = useState(null);


  // ==========================================
  // SWIPEX TOAST
  // ==========================================

  const [toast, setToast] = useState({
    message: "",
    type: "success"
  });


  // ==========================================
  // SHOW TOAST
  // ==========================================

  const showToast = (
    message,
    type = "success"
  ) => {

    setToast({
      message,
      type
    });

  };


  // ==========================================
  // CLOSE TOAST
  // ==========================================

  const closeToast = () => {

    setToast({
      message: "",
      type: "success"
    });

  };


  // ==========================================
  // LOAD SAVED JOBS
  // ==========================================

  useEffect(() => {

    const loadSavedJobs = async () => {

      try {

        const response = await api.get(
          "/api/saved-jobs"
        );

        setSavedJobs(
          response.data || []
        );

      } catch (err) {

        console.error(
          "SwipeX saved jobs loading error:",
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


        setError(
          err.response?.data?.detail ||
          "Unable to load saved jobs."
        );

      } finally {

        setLoading(false);

      }

    };


    loadSavedJobs();

  }, [navigate]);


  // ==========================================
  // REMOVE SAVED JOB
  // ==========================================

  const handleRemove = async (
    jobId
  ) => {

    if (removingId !== null) {
      return;
    }


    setRemovingId(
      jobId
    );


    setError("");


    try {

      // ======================================
      // DELETE FROM BACKEND
      // ======================================

      await api.delete(
        `/api/saved-jobs/${jobId}`
      );


      // ======================================
      // UPDATE FRONTEND
      // ======================================

      setSavedJobs(
        previousJobs =>
          previousJobs.filter(
            job =>
              job.job_id !== jobId
          )
      );


      // ======================================
      // SWIPEX SUCCESS NOTIFICATION
      // ======================================

      showToast(
        "Job removed from saved jobs.",
        "info"
      );


    } catch (err) {

      console.error(
        "SwipeX remove saved job error:",
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
      // ERROR MESSAGE
      // ======================================

      const errorMessage =
        err.response?.data?.detail ||
        "Unable to remove saved job.";


      setError(
        errorMessage
      );


      // ======================================
      // SWIPEX ERROR NOTIFICATION
      // ======================================

      showToast(
        errorMessage,
        "error"
      );

    } finally {

      setRemovingId(
        null
      );

    }

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="dashboard-loading">

        Loading your saved jobs...

      </div>

    );

  }


  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="saved-jobs-page">


      {/* =====================================
          SWIPEX TOAST
      ====================================== */}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />


      <div className="saved-jobs-container">


        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="saved-jobs-header">


          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate("/candidate")
            }
          >

            ← Back to Dashboard

          </button>


          <p className="section-label">

            CANDIDATE WORKSPACE

          </p>


          <h1>

            Saved Jobs

          </h1>


          <p>

            Jobs you've saved for later.

          </p>

        </div>


        {/* ================================= */}
        {/* ERROR */}
        {/* ================================= */}

        {error && (

          <div className="login-error">

            {error}

          </div>

        )}


        {/* ================================= */}
        {/* EMPTY STATE */}
        {/* ================================= */}

        {!error &&
          savedJobs.length === 0 && (

            <div className="empty-saved-jobs">


              <div className="empty-saved-icon">

                ☆

              </div>


              <h2>

                No saved jobs yet

              </h2>


              <p>

                Save interesting jobs while
                discovering opportunities and
                come back to them later.

              </p>


              <button
                type="button"
                className="dashboard-button"
                onClick={() =>
                  navigate(
                    "/candidate/jobs"
                  )
                }
              >

                Discover Jobs

              </button>


            </div>

          )}


        {/* ================================= */}
        {/* SAVED JOBS */}
        {/* ================================= */}

        {savedJobs.length > 0 && (

          <div className="saved-jobs-grid">


            {savedJobs.map(
              (job) => (

                <div
                  className="saved-job-card"
                  key={
                    job.saved_job_id
                  }
                >


                  {/* ==========================
                      TOP
                  =========================== */}

                  <div className="saved-job-top">


                    <div className="saved-job-icon">

                      💼

                    </div>


                    <span className="saved-badge">

                      ★ Saved

                    </span>


                  </div>


                  {/* ==========================
                      JOB TITLE
                  =========================== */}

                  <h2>

                    {job.title ||
                      "Untitled Position"}

                  </h2>


                  {/* ==========================
                      COMPANY
                  =========================== */}

                  <h3>

                    {job.company ||
                      "Company not specified"}

                  </h3>


                  {/* ==========================
                      DETAILS
                  =========================== */}

                  <div className="saved-job-details">


                    <span>

                      📍{" "}

                      {job.location ||
                        "Location not specified"}

                    </span>


                    <span>

                      💼{" "}

                      {job.employment_type ||
                        "Not specified"}

                    </span>


                    <span>

                      💰{" "}

                      {job.salary ||
                        "Salary not specified"}

                    </span>


                  </div>


                  {/* ==========================
                      SKILLS
                  =========================== */}

                  {job.skills && (

                    <div className="saved-job-skills">


                      {job.skills
                        .split(",")
                        .map(
                          skill =>
                            skill.trim()
                        )
                        .filter(Boolean)
                        .map(
                          skill => (

                            <span
                              key={skill}
                              className="saved-job-skill"
                            >

                              {skill}

                            </span>

                          )
                        )}


                    </div>

                  )}


                  {/* ==========================
                      DESCRIPTION
                  =========================== */}

                  <p className="saved-job-description">


                    {job.description

                      ? job.description.length > 180

                        ? `${job.description.substring(
                            0,
                            180
                          )}...`

                        : job.description

                      : "No description available."}


                  </p>


                  {/* ==========================
                      ACTIONS
                  =========================== */}

                  <div className="saved-job-actions">


                    {/* VIEW JOB */}

                    <button
                      type="button"
                      className="view-saved-job-button"
                      onClick={() =>
                        navigate(
                          `/candidate/jobs/${job.job_id}`
                        )
                      }
                    >

                      View Job →

                    </button>


                    {/* REMOVE */}

                    <button
                      type="button"
                      className="remove-saved-job-button"
                      onClick={() =>
                        handleRemove(
                          job.job_id
                        )
                      }
                      disabled={
                        removingId ===
                        job.job_id
                      }
                    >

                      {removingId ===
                      job.job_id

                        ? "Removing..."

                        : "Remove"}

                    </button>


                  </div>


                  {/* ==========================
                      SAVED DATE
                  =========================== */}

                  <small className="saved-job-date">

                    Saved on{" "}

                    {job.saved_at

                      ? new Date(
                          job.saved_at
                        ).toLocaleDateString(
                          "en-IN"
                        )

                      : "N/A"}

                  </small>


                </div>

              )
            )}


          </div>

        )}


      </div>

    </div>

  );

}


export default SavedJobs;