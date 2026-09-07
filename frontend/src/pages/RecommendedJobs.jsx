


import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../api/api";


// =========================================================
// HELPER: CONVERT HTML / ENCODED HTML TO READABLE TEXT
// =========================================================

function cleanJobDescription(html) {

  if (!html) {
    return "";
  }

  try {

    let text = String(html);

    // -------------------------------------------------------
    // STEP 1: Decode HTML entities.
    //
    // Example:
    // &lt;p&gt;       -> <p>
    // &lt;br /&gt;   -> <br />
    //
    // Some dataset records can contain more than one level
    // of HTML encoding, so decode a few times if necessary.
    // -------------------------------------------------------

    const textarea =
      document.createElement("textarea");

    for (let i = 0; i < 3; i++) {

      textarea.innerHTML = text;

      const decodedText =
        textarea.value;

      if (decodedText === text) {
        break;
      }

      text = decodedText;

    }


    // -------------------------------------------------------
    // STEP 2: Convert common HTML formatting tags into
    // readable line breaks / bullets.
    // -------------------------------------------------------

    text =
      text
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/section>/gi, "\n")
        .replace(/<\/article>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<li[^>]*>/gi, "• ");


    // -------------------------------------------------------
    // STEP 3: Remove remaining HTML tags.
    // -------------------------------------------------------

    text =
      text.replace(/<[^>]*>/g, "");


    // -------------------------------------------------------
    // STEP 4: Decode entities one more time.
    //
    // This handles cases where entities appear after the
    // first HTML cleanup.
    // -------------------------------------------------------

    textarea.innerHTML = text;

    text =
      textarea.value;


    // -------------------------------------------------------
    // STEP 5: Clean unnecessary whitespace.
    // -------------------------------------------------------

    return text
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  } catch (error) {

    console.error(
      "Job description cleaning error:",
      error
    );


    // -------------------------------------------------------
    // FINAL FALLBACK
    // -------------------------------------------------------

    return String(html)
      .replace(/<[^>]*>/g, "")
      .trim();

  }

}


function RecommendedJobs() {

  const navigate = useNavigate();
  const location = useLocation();

  // Resume passed from ResumeAnalysis.jsx
  const resume =
    location.state?.resume || null;


  // =========================================================
  // STATE
  // =========================================================

  const [jobs, setJobs] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =========================================================
  // LOAD ML RECOMMENDATIONS
  // =========================================================

  useEffect(() => {

    const loadRecommendations = async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/api/recommendations/"
          );

        console.log(
          "SWIPEX RECOMMENDATION RESPONSE:",
          response.data
        );


        // -----------------------------------------------------
        // ONLY USE RECOMMENDATIONS FROM BACKEND
        // -----------------------------------------------------

        const recommendations =
          Array.isArray(
            response.data?.recommendations
          )
            ? response.data.recommendations
            : [];


        console.log(
          "TOTAL ML / CSV RECOMMENDATIONS:",
          recommendations.length
        );


        setJobs(
          recommendations
        );


      } catch (error) {

        console.error(
          "Recommendation error:",
          error
        );


        setError(
          error.response?.data?.detail ||
          "Failed to load AI recommendations."
        );


      } finally {

        setLoading(false);

      }

    };


    loadRecommendations();

  }, []);


  // =========================================================
  // START SWIPING
  // =========================================================

  const handleStartSwiping = () => {

    navigate(
      "/swipe-jobs",
      {
        state: {
          jobs: jobs,
          resume: resume,
        },
      }
    );

  };


  // =========================================================
  // ANALYZE ATS FOR SELECTED JOB
  // =========================================================

  const handleATSAnalysis = (selectedJob) => {

    console.log(
      "Selected job for ATS analysis:",
      selectedJob
    );


    if (
      !selectedJob ||
      !selectedJob.job_id
    ) {

      console.error(
        "Selected job does not contain a valid job_id."
      );

      return;

    }


    navigate(
      "/ats-analysis",
      {
        state: {
          resume: resume,
          job: selectedJob,
        },
      }
    );

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="page">

        <div className="form-container">

          <h1>
            AI Recommended Jobs
          </h1>

          <p className="form-subtitle">
            Analyzing your resume, profile,
            ML compatibility and swipe activity
            to find suitable jobs...
          </p>

        </div>

      </div>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (

      <div className="page">

        <div className="form-container">

          <h1>
            AI Recommended Jobs
          </h1>

          <p className="error-message">
            {error}
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>

        </div>

      </div>

    );

  }


  // =========================================================
  // NO JOBS
  // =========================================================

  if (jobs.length === 0) {

    return (

      <div className="page">

        <div className="form-container">

          <h1>
            No Recommended Jobs
          </h1>

          <p className="form-subtitle">
            No suitable jobs were returned by
            the AI recommendation system.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate("/upload-resume")
            }
          >
            Update Resume
          </button>

        </div>

      </div>

    );

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="page">

      <div
        className="jobs-container"
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "30px 20px",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="jobs-header">

          <div>

            <h1>
              AI Recommended Jobs
            </h1>

            <p>
              Personalized recommendations based
              on your resume, profile, ML matching
              and swipe activity.
            </p>

          </div>

          <div className="job-count">
            {jobs.length} Jobs
          </div>

        </div>


        {/* =================================================
            JOB CARD GRID
        ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "20px",
            width: "100%",
          }}
        >

          {jobs.map(
            (job, index) => {

              // =================================================
              // REQUIRED SKILLS
              // =================================================

              const skills =
                Array.isArray(
                  job.required_skills
                )
                  ? job.required_skills
                  : [];


              // =================================================
              // MATCHED SKILLS
              // =================================================

              const matchedSkills =
                Array.isArray(
                  job.matched_skills
                )
                  ? job.matched_skills
                  : [];


              // =================================================
              // MISSING SKILLS
              // =================================================

              const missingSkills =
                Array.isArray(
                  job.missing_skills
                )
                  ? job.missing_skills
                  : [];


              // =================================================
              // ML SCORE
              // =================================================

              const mlMatchScore =
                Number(
                  job.ml_match_percentage ?? 0
                );


              // =================================================
              // FINAL RECOMMENDATION SCORE
              // =================================================

              const recommendationScore =
                Number(
                  job.recommendation_score ??
                  mlMatchScore
                );


              // =================================================
              // MATCH BREAKDOWN
              // =================================================

              const skillMatch =
                Number(
                  job.skill_match_percentage ?? 0
                );


              const experienceMatch =
                Number(
                  job.experience_match_percentage ?? 0
                );


              const locationMatch =
                Number(
                  job.location_match_percentage ?? 0
                );


              const jobTypeMatch =
                Number(
                  job.job_type_match_percentage ?? 0
                );


              // =================================================
              // SWIPE PERSONALIZATION
              // =================================================

              const swipeAdjustment =
                Number(
                  job.swipe_adjustment ?? 0
                );


              // =================================================
              // SALARY
              // =================================================

              const salaryMin =
                Number(
                  job.salary_min ?? 0
                );


              const salaryMax =
                Number(
                  job.salary_max ?? 0
                );


              // -------------------------------------------------
              // Do not display ₹0 - ₹0.
              // -------------------------------------------------

              const hasValidSalary =
                salaryMin > 0 ||
                salaryMax > 0;


              const salaryText =
                hasValidSalary
                  ? `₹${salaryMin.toLocaleString("en-IN")} - ₹${salaryMax.toLocaleString("en-IN")}`
                  : "Salary not disclosed";


              // =================================================
              // COMPANY
              // =================================================

              const companyName =
                job.company_name ||
                job.company ||
                (
                  job.company_id != null
                    ? `Company #${job.company_id}`
                    : "Company"
                );


              const companyInitial =
                companyName
                  .charAt(0)
                  .toUpperCase();


              // =================================================
              // CLEAN JOB DESCRIPTION
              // =================================================

              const cleanDescription =
                cleanJobDescription(
                  job.description
                );


              // =================================================
              // SAFE SCORES
              // =================================================

              const safeMlScore =
                Math.min(
                  Math.max(
                    mlMatchScore,
                    0
                  ),
                  100
                );


              const safeRecommendationScore =
                Math.min(
                  Math.max(
                    recommendationScore,
                    0
                  ),
                  100
                );


              // =================================================
              // JOB CARD
              // =================================================

              return (

                <div
                  className="job-card"
                  key={
                    job.job_id ??
                    `recommendation-${index}`
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    minHeight: "620px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >

                  {/* =================================================
                      RANK
                  ================================================= */}

                  <div className="job-rank">
                    Recommendation #{index + 1}
                  </div>


                  {/* =================================================
                      COMPANY + TITLE
                  ================================================= */}

                  <div className="job-card-header">

                    <div className="company-logo">
                      {companyInitial}
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >

                      <h2
                        style={{
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {job.title ||
                          "Job Title Not Available"}
                      </h2>

                      <p className="company-name">
                        {companyName}
                      </p>

                    </div>

                  </div>


                  {/* =================================================
                      JOB DETAILS
                  ================================================= */}

                  <div className="job-details">

                    <div className="job-detail">

                      <span>📍</span>

                      {job.location ||
                        "Location not specified"}

                    </div>


                    <div className="job-detail">

                      <span>💼</span>

                      {job.employment_type ||
                        "Not specified"}

                    </div>


                    <div className="job-detail">

                      <span>🎓</span>

                      {job.experience_required != null
                        ? `${job.experience_required} years`
                        : "Not specified"}

                    </div>


                    <div className="job-detail">

                      <span>💰</span>

                      {salaryText}

                    </div>

                  </div>


                  {/* =================================================
                      ML SCORE
                  ================================================= */}

                  <div className="job-match">

                    <div className="match-header">

                      <span>
                        ML Job Match Score
                      </span>

                      <strong>
                        {mlMatchScore.toFixed(2)}%
                      </strong>

                    </div>


                    <div className="match-bar">

                      <div
                        className="match-progress"
                        style={{
                          width:
                            `${safeMlScore}%`,
                        }}
                      />

                    </div>

                  </div>


                  {/* =================================================
                      FINAL SCORE
                  ================================================= */}

                  <div className="job-match">

                    <div className="match-header">

                      <span>
                        Final Recommendation Score
                      </span>

                      <strong>
                        {recommendationScore.toFixed(2)}%
                      </strong>

                    </div>


                    <div className="match-bar">

                      <div
                        className="match-progress"
                        style={{
                          width:
                            `${safeRecommendationScore}%`,
                        }}
                      />

                    </div>

                  </div>


                  {/* =================================================
                      MATCH BREAKDOWN
                  ================================================= */}

                  <div className="analysis-section">

                    <h3>
                      Match Breakdown
                    </h3>

                    <div className="analysis-card">

                      <p>
                        <strong>
                          Skills Match:
                        </strong>{" "}
                        {skillMatch.toFixed(2)}%
                      </p>

                      <p>
                        <strong>
                          Experience Match:
                        </strong>{" "}
                        {experienceMatch.toFixed(2)}%
                      </p>

                      <p>
                        <strong>
                          Location Match:
                        </strong>{" "}
                        {locationMatch.toFixed(2)}%
                      </p>

                      <p>
                        <strong>
                          Job Type Match:
                        </strong>{" "}
                        {jobTypeMatch.toFixed(2)}%
                      </p>

                      <p>
                        <strong>
                          ML Job Match:
                        </strong>{" "}
                        {mlMatchScore.toFixed(2)}%
                      </p>


                      {swipeAdjustment !== 0 && (

                        <p>

                          <strong>
                            Swipe Personalization:
                          </strong>{" "}

                          {swipeAdjustment > 0
                            ? `+${swipeAdjustment}`
                            : swipeAdjustment}

                        </p>

                      )}

                    </div>

                  </div>


                  {/* =================================================
                      MATCHED SKILLS
                  ================================================= */}

                  {matchedSkills.length > 0 && (

                    <div className="job-skills">

                      <h3>
                        Your Matching Skills
                      </h3>

                      <div className="job-skill-list">

                        {matchedSkills.map(
                          (skill, skillIndex) => (

                            <span
                              className="job-skill"
                              key={
                                `matched-${skill}-${skillIndex}`
                              }
                            >
                              ✓ {skill}
                            </span>

                          )
                        )}

                      </div>

                    </div>

                  )}


                  {/* =================================================
                      MISSING SKILLS
                  ================================================= */}

                  {missingSkills.length > 0 && (

                    <div className="job-skills">

                      <h3>
                        Skills You May Need
                      </h3>

                      <div className="job-skill-list">

                        {missingSkills.map(
                          (skill, skillIndex) => (

                            <span
                              className="job-skill"
                              key={
                                `missing-${skill}-${skillIndex}`
                              }
                            >
                              {skill}
                            </span>

                          )
                        )}

                      </div>

                    </div>

                  )}


                  {/* =================================================
                      REQUIRED SKILLS
                  ================================================= */}

                  <div className="job-skills">

                    <h3>
                      Required Skills
                    </h3>

                    <div className="job-skill-list">

                      {skills.length > 0
                        ? (

                          skills.map(
                            (skill, skillIndex) => (

                              <span
                                className="job-skill"
                                key={
                                  `required-${skill}-${skillIndex}`
                                }
                              >
                                {skill}
                              </span>

                            )
                          )

                        )
                        : (

                          <span className="job-skill">
                            No skills specified
                          </span>

                        )}

                    </div>

                  </div>


                  {/* =================================================
                      RECOMMENDATION REASON
                  ================================================= */}

                  {job.recommendation_reason && (

                    <div className="job-description">

                      <h3>
                        Why this job is recommended
                      </h3>

                      <p>
                        {job.recommendation_reason}
                      </p>

                    </div>

                  )}


                  {/* =================================================
                      JOB DESCRIPTION
                  ================================================= */}

                  <div className="job-description">

                    <h3>
                      About this Job
                    </h3>

                    {cleanDescription ? (

                      <p
                        style={{
                          whiteSpace: "pre-line",
                          lineHeight: "1.7",
                        }}
                      >
                        {cleanDescription}
                      </p>

                    ) : (

                      <p>
                        No job description available.
                      </p>

                    )}

                  </div>


                  {/* =================================================
                      ATS ANALYSIS
                  ================================================= */}

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        handleATSAnalysis(job)
                      }
                    >
                      Analyze ATS
                    </button>

                  </div>

                </div>

              );

            }
          )}

        </div>


        {/* =================================================
            START SWIPING
        ================================================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "40px",
            marginBottom: "30px",
          }}
        >

          <button
            type="button"
            className="primary-button"
            onClick={
              handleStartSwiping
            }
          >
            Start Swiping Jobs
          </button>

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="job-navigation"
          style={{
            textAlign: "center",
            paddingBottom: "30px",
          }}
        >

          <span>
            Showing all {jobs.length}
            {" "}AI-recommended jobs
          </span>

        </div>

      </div>

    </div>

  );
}

export default RecommendedJobs;
