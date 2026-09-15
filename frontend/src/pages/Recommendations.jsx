import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Recommendations() {
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH RECOMMENDATIONS
  // =====================================================

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError("");

      // Get JWT token
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view job recommendations.");
        setLoading(false);
        return;
      }

      // Call backend recommendation API
      const response = await fetch(
        "http://127.0.0.1:8000/api/recommendations/",
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      // Handle backend error
      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load recommendations."
        );
      }

      // Store recommendations
      setRecommendations(
        Array.isArray(data.recommendations)
          ? data.recommendations
          : []
      );

      // Store resume skills
      setResumeSkills(
        Array.isArray(data.resume_skills)
          ? data.resume_skills
          : []
      );
    } catch (err) {
      console.error("Recommendation error:", err);

      setError(
        err.message ||
          "Unable to load job recommendations."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="page">
        <div className="form-container">
          <h1>Job Recommendations</h1>

          <p className="form-subtitle">
            Finding jobs that match your profile...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="page">
        <div className="form-container">
          <h1>Job Recommendations</h1>

          <p className="form-subtitle">
            {error}
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={fetchRecommendations}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // NO RECOMMENDATIONS
  // =====================================================

  if (recommendations.length === 0) {
    return (
      <div className="page">
        <div className="form-container">
          <h1>Job Recommendations</h1>

          <p className="form-subtitle">
            No job recommendations are available
            right now.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={fetchRecommendations}
          >
            Refresh Recommendations
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="page">

      <div className="form-container recommendations-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <h1>
          Recommended Jobs
        </h1>

        <p className="form-subtitle">
          Jobs personalized using your resume,
          preferences, and swipe activity.
        </p>


        {/* =================================================
            RESUME SKILLS
        ================================================= */}

        {resumeSkills.length > 0 && (
          <div className="analysis-section">

            <h2>
              Your Resume Skills
            </h2>

            <div className="skills-container">

              {resumeSkills.map(
                (skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="skill-tag"
                  >
                    {skill}
                  </span>
                )
              )}

            </div>

          </div>
        )}


        {/* =================================================
            RECOMMENDATION COUNT
        ================================================= */}

        <div className="analysis-card">

          <p>
            <strong>
              {recommendations.length}
            </strong>{" "}
            personalized job
            {recommendations.length !== 1
              ? "s"
              : ""}{" "}
            found.
          </p>

        </div>


        {/* =================================================
            JOB LIST
        ================================================= */}

        <div className="recommendations-list">

          {recommendations.map(
            (job) => (

              <div
                className="analysis-card recommendation-card"
                key={job.job_id}
              >

                {/* -----------------------------------------
                    JOB TITLE
                ----------------------------------------- */}

                <h2>
                  {job.title}
                </h2>


                {/* -----------------------------------------
                    RECOMMENDATION SCORE
                ----------------------------------------- */}

                <div className="recommendation-score">

                  <strong>
                    {job.recommendation_score}%
                  </strong>

                  <span>
                    Recommendation Match
                  </span>

                </div>


                {/* -----------------------------------------
                    JOB DETAILS
                ----------------------------------------- */}

                <p>
                  <strong>
                    Location:
                  </strong>{" "}
                  {job.location || "Not specified"}
                </p>

                <p>
                  <strong>
                    Employment Type:
                  </strong>{" "}
                  {job.employment_type ||
                    "Not specified"}
                </p>

                <p>
                  <strong>
                    Experience Required:
                  </strong>{" "}
                  {job.experience_required ?? 0} years
                </p>


                {/* -----------------------------------------
                    DESCRIPTION
                ----------------------------------------- */}

                {job.description && (
                  <p>
                    <strong>
                      Description:
                    </strong>{" "}
                    {job.description}
                  </p>
                )}


                {/* -----------------------------------------
                    MATCHING SKILLS
                ----------------------------------------- */}

                <div className="recommendation-matching">

                  <h3>
                    Matching Skills
                  </h3>

                  {job.matched_skills &&
                  job.matched_skills.length > 0 ? (

                    <div className="skills-container">

                      {job.matched_skills.map(
                        (skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="skill-tag"
                          >
                            {skill}
                          </span>
                        )
                      )}

                    </div>

                  ) : (

                    <p className="empty-message">
                      No matching skills detected.
                    </p>

                  )}

                </div>


                {/* -----------------------------------------
                    MISSING SKILLS
                ----------------------------------------- */}

                {job.missing_skills &&
                job.missing_skills.length > 0 && (

                  <div className="recommendation-matching">

                    <h3>
                      Skills You May Need
                    </h3>

                    <div className="skills-container">

                      {job.missing_skills.map(
                        (skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="skill-tag"
                          >
                            {skill}
                          </span>
                        )
                      )}

                    </div>

                  </div>

                )}


                {/* -----------------------------------------
                    MATCH BREAKDOWN
                ----------------------------------------- */}

                <div className="analysis-card">

                  <h3>
                    Match Breakdown
                  </h3>

                  <p>
                    <strong>
                      Skill Match:
                    </strong>{" "}
                    {job.skill_match_percentage}%
                  </p>

                  <p>
                    <strong>
                      Experience Match:
                    </strong>{" "}
                    {job.experience_match_percentage}%
                  </p>

                  <p>
                    <strong>
                      Location Match:
                    </strong>{" "}
                    {job.location_match_percentage}%
                  </p>

                  <p>
                    <strong>
                      Job Type Match:
                    </strong>{" "}
                    {job.job_type_match_percentage}%
                  </p>

                  {job.swipe_adjustment !== undefined && (
                    <p>
                      <strong>
                        Swipe Adjustment:
                      </strong>{" "}
                      {job.swipe_adjustment > 0
                        ? `+${job.swipe_adjustment}`
                        : job.swipe_adjustment}
                    </p>
                  )}

                </div>


                {/* -----------------------------------------
                    RECOMMENDATION REASON
                ----------------------------------------- */}

                {job.recommendation_reason && (
                  <div className="analysis-card">

                    <h3>
                      Why This Job?
                    </h3>

                    <p>
                      {job.recommendation_reason}
                    </p>

                  </div>
                )}


                {/* -----------------------------------------
                    SALARY
                ----------------------------------------- */}

                {(job.salary_min !== null ||
                  job.salary_max !== null) && (

                  <p>
                    <strong>
                      Salary:
                    </strong>{" "}

                    {job.salary_min !== null
                      ? `₹${job.salary_min}`
                      : ""}

                    {job.salary_min !== null &&
                    job.salary_max !== null
                      ? " - "
                      : ""}

                    {job.salary_max !== null
                      ? `₹${job.salary_max}`
                      : ""}
                  </p>

                )}


                {/* -----------------------------------------
                    ACTION
                ----------------------------------------- */}

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    navigate(
                      `/jobs/${job.job_id}`
                    )
                  }
                >
                  View Job
                </button>

              </div>

            )
          )}

        </div>


        {/* =================================================
            REFRESH
        ================================================= */}

        <div className="analysis-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={fetchRecommendations}
          >
            Refresh Recommendations
          </button>

        </div>

      </div>

    </div>
  );
}

export default Recommendations;
