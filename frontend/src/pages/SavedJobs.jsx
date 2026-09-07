import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getSavedJobs,
} from "../api/swipes";

function SavedJobs() {
  const navigate = useNavigate();

  const [savedJobs, setSavedJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================================
  // LOAD SAVED JOBS
  // =========================================================

  useEffect(() => {
    const loadSavedJobs =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getSavedJobs();

          console.log(
            "Saved jobs:",
            response
          );

          setSavedJobs(
            response.saved_jobs || []
          );

        } catch (error) {
          console.error(
            "Saved jobs error:",
            error
          );

          setError(
            error.response?.data?.detail ||
            "Failed to load saved jobs."
          );

        } finally {
          setLoading(false);
        }
      };

    loadSavedJobs();

  }, []);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="page">

        <div className="form-container">

          <h1>
            Saved Jobs
          </h1>

          <p className="form-subtitle">
            Loading your saved jobs...
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="page">

      <div className="form-container saved-jobs-container">

        <h1>
          Saved Jobs
        </h1>

        <p className="form-subtitle">
          Jobs saved through your
          SwipeX interactions.
        </p>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {savedJobs.length === 0 ? (

          <p className="empty-message">
            You haven't saved any
            jobs yet.
          </p>

        ) : (

          savedJobs.map(
            (job, index) => {

              const jobId =
                job.job_id ??
                job.id ??
                index;

              const salaryText =
                job.salary_min != null ||
                job.salary_max != null
                  ? `₹${job.salary_min ?? 0} - ₹${job.salary_max ?? 0}`
                  : "Salary not specified";

              return (
                <div
                  className="saved-job-card"
                  key={jobId}
                >

                  <h2>
                    {job.title}
                  </h2>

                  <p>
                    {job.company_name ||
                      job.company ||
                      `Company #${job.company_id}`}
                  </p>

                  <div className="saved-job-details">

                    <span>
                      📍{" "}
                      {job.location ||
                        "Location not specified"}
                    </span>

                    <span>
                      💰 {salaryText}
                    </span>

                  </div>

                  <div className="saved-job-status">

                    <span>
                      ★ Saved
                    </span>

                  </div>

                </div>
              );
            }
          )

        )}

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate(
              "/recommended-jobs"
            )
          }
        >
          Continue Exploring Jobs
        </button>

      </div>

    </div>
  );
}

export default SavedJobs;
