

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
    // STEP 2: Convert common HTML formatting tags.
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

  // ---------------------------------------------------------
  // Tracks which job cards have their description dropdown
  // opened.
  // ---------------------------------------------------------

  const [expandedJobs, setExpandedJobs] =
    useState({});


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
  // TOGGLE ABOUT THIS JOB DROPDOWN
  // =========================================================

  const toggleJobDescription = (jobId) => {

    setExpandedJobs(
      (previous) => ({
        ...previous,
        [jobId]:
          !previous[jobId],
      })
    );

  };


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
          padding: "18px 20px",
          boxSizing: "border-box",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="jobs-header"
          style={{
            marginBottom: "16px",
          }}
        >

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
            gap: "16px",
            width: "100%",
            alignItems: "stretch",
          }}
        >

          {jobs.map(
            (job, index) => {

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
              // MATCH VALUES
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


              // =================================================
              // CLEAN JOB DESCRIPTION
              // =================================================

              const cleanDescription =
                cleanJobDescription(
                  job.description
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
                    minHeight: "0",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px",
                  }}
                >

                  {/* =================================================
                      COMPANY + TITLE
                  ================================================= */}

                  <div
                    className="job-card-header"
                    style={{
                      marginBottom: "12px",
                    }}
                  >

                    <div className="company-logo">
                      {index + 1}
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
                          marginBottom: "3px",
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

                  <div
                    className="job-details"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "8px 12px",
                      marginBottom: "12px",
                    }}
                  >

                    <div
                      className="job-detail"
                      style={{
                        minWidth: 0,
                      }}
                    >

                      <span>📍</span>

                      <span
                        style={{
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {job.location ||
                          "Location not specified"}
                      </span>

                    </div>


                    <div
                      className="job-detail"
                      style={{
                        minWidth: 0,
                      }}
                    >

                      <span>💼</span>

                      <span
                        style={{
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {job.employment_type ||
                          "Not specified"}
                      </span>

                    </div>


                    <div
                      className="job-detail"
                      style={{
                        minWidth: 0,
                      }}
                    >

                      <span>🎓</span>

                      <span>
                        {job.experience_required != null
                          ? `${job.experience_required} years`
                          : "Not specified"}
                      </span>

                    </div>


                    <div
                      className="job-detail"
                      style={{
                        minWidth: 0,
                      }}
                    >

                      <span>💰</span>

                      <span
                        style={{
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {salaryText}
                      </span>

                    </div>

                  </div>


                  {/* =================================================
                      SCORES
                  ================================================= */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr",
                      gap: "6px",
                      padding:
                        "10px 0",
                      borderTop:
                        "1px solid #e5e7eb",
                      borderBottom:
                        "1px solid #e5e7eb",
                      marginBottom: "12px",
                    }}
                  >

                    <div className="match-header">

                      <span>
                        ML Job Match Score
                      </span>

                      <strong>
                        {mlMatchScore.toFixed(2)}%
                      </strong>

                    </div>


                    <div className="match-header">

                      <span>
                        Final Recommendation Score
                      </span>

                      <strong>
                        {recommendationScore.toFixed(2)}%
                      </strong>

                    </div>

                  </div>


                  {/* =================================================
                      MATCH VALUES
                  ================================================= */}

                  <div
                    className="analysis-card"
                    style={{
                      padding: "8px 10px",
                      marginBottom: "12px",
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      columnGap: "12px",
                      rowGap: "4px",
                      fontSize: "13px",
                      lineHeight: "1.35",
                    }}
                  >

                    <p
                      style={{
                        margin: 0,
                      }}
                    >
                      <strong>
                        Skills:
                      </strong>{" "}
                      {skillMatch.toFixed(2)}%
                    </p>


                    <p
                      style={{
                        margin: 0,
                      }}
                    >
                      <strong>
                        Experience:
                      </strong>{" "}
                      {experienceMatch.toFixed(2)}%
                    </p>


                    <p
                      style={{
                        margin: 0,
                      }}
                    >
                      <strong>
                        Location:
                      </strong>{" "}
                      {locationMatch.toFixed(2)}%
                    </p>


                    <p
                      style={{
                        margin: 0,
                      }}
                    >
                      <strong>
                        Job Type:
                      </strong>{" "}
                      {jobTypeMatch.toFixed(2)}%
                    </p>

                  </div>


                  {/* =================================================
                      JOB DESCRIPTION DROPDOWN
                  ================================================= */}

                  <div
                    className="job-description"
                    style={{
                      marginBottom: "12px",
                    }}
                  >

                    <button
                      type="button"
                      onClick={() =>
                        toggleJobDescription(
                          job.job_id ??
                          `recommendation-${index}`
                        )
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        background: "none",
                        border: "none",
                        padding: "0",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >

                      <h3
                        style={{
                          margin: 0,
                        }}
                      >
                        About this Job
                      </h3>

                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                        }}
                      >
                        {expandedJobs[
                          job.job_id ??
                          `recommendation-${index}`
                        ]
                          ? "−"
                          : "+"}
                      </span>

                    </button>


                    {expandedJobs[
                      job.job_id ??
                      `recommendation-${index}`
                    ] && (

                      <div
                        style={{
                          marginTop: "10px",
                        }}
                      >

                        {cleanDescription ? (

                          <p
                            style={{
                              whiteSpace: "pre-line",
                              lineHeight: "1.6",
                              margin: 0,
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

                    )}

                  </div>


                  {/* =================================================
                      ATS ANALYSIS
                  ================================================= */}

                  <div
                    style={{
                      marginTop: "auto",
                    }}
                  >

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        handleATSAnalysis(job)
                      }
                      style={{
                        width: "100%",
                      }}
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
            marginTop: "24px",
            marginBottom: "20px",
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
            paddingBottom: "20px",
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
