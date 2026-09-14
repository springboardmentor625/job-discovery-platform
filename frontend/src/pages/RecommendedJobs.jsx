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
  // Tracks which job is currently opened.
  // ---------------------------------------------------------

  const [expandedJob, setExpandedJob] =
    useState(null);


  // ---------------------------------------------------------
  // ATS ANALYSIS STATE
  // ---------------------------------------------------------

  const [atsJob, setAtsJob] =
    useState(null);

  const [atsReport, setAtsReport] =
    useState(null);

  const [atsLoading, setAtsLoading] =
    useState(false);

  const [atsError, setAtsError] =
    useState("");

  const [atsResume, setAtsResume] =
    useState(resume);


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
  // TOGGLE FULL JOB CARD
  // =========================================================

  const toggleJobCard = (jobId) => {

    setExpandedJob(
      (previous) =>
        previous === jobId
          ? null
          : jobId
    );

  };


  // =========================================================
  // BACK TO DASHBOARD
  // =========================================================

  const handleBackToDashboard = () => {

    navigate(
      "/dashboard"
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

  const handleATSAnalysis = async (selectedJob) => {

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


    try {

      setAtsLoading(true);
      setAtsError("");
      setAtsReport(null);
      setAtsJob(selectedJob);


      // =====================================================
      // STEP 1 — GET RESUME
      // =====================================================

      let currentResume =
        resume;

      let currentResumeId =
        resume?.resume_id ||
        localStorage.getItem("resume_id");


      console.log(
        "Resume from state:",
        resume
      );

      console.log(
        "Resume ID:",
        currentResumeId
      );


      // =====================================================
      // STEP 2 — FETCH RESUME IF NOT AVAILABLE
      // =====================================================

      if (
        !currentResume ||
        !currentResumeId
      ) {

        console.log(
          "Fetching user's resumes..."
        );


        const resumeResponse =
          await api.get(
            "/api/resumes/me"
          );


        console.log(
          "Resume API response:",
          resumeResponse.data
        );


        const resumes =
          Array.isArray(
            resumeResponse.data?.resumes
          )
            ? resumeResponse.data.resumes
            : [];


        if (
          resumes.length === 0
        ) {

          throw new Error(
            "No resumes found. Please upload a resume first."
          );

        }


        // ---------------------------------------------------
        // DEFAULT RESUME WITH EXTRACTED SKILLS
        // ---------------------------------------------------

        const defaultResumeWithSkills =
          resumes.find(
            (item) =>
              item.is_default === true &&
              Array.isArray(
                item.extracted_skills
              ) &&
              item.extracted_skills.length > 0
          );


        // ---------------------------------------------------
        // ANY RESUME WITH EXTRACTED SKILLS
        // ---------------------------------------------------

        const resumeWithSkills =
          resumes.find(
            (item) =>
              Array.isArray(
                item.extracted_skills
              ) &&
              item.extracted_skills.length > 0
          );


        // ---------------------------------------------------
        // DEFAULT RESUME
        // ---------------------------------------------------

        const defaultResume =
          resumes.find(
            (item) =>
              item.is_default === true
          );


        // ---------------------------------------------------
        // SELECT RESUME
        // ---------------------------------------------------

        currentResume =
          defaultResumeWithSkills ||
          resumeWithSkills ||
          defaultResume ||
          resumes[0];


        currentResumeId =
          currentResume.resume_id;


        setAtsResume(
          currentResume
        );


        localStorage.setItem(
          "resume_id",
          String(currentResumeId)
        );

      }


      // =====================================================
      // STEP 3 — VALIDATE RESUME ID
      // =====================================================

      if (
        !currentResumeId
      ) {

        throw new Error(
          "Resume ID is missing."
        );

      }


      currentResumeId =
        Number(currentResumeId);


      console.log(
        "Final resume ID:",
        currentResumeId
      );


      // =====================================================
      // STEP 4 — CHECK RESUME SKILLS
      // =====================================================

      const extractedSkills =
        currentResume?.extracted_skills;


      console.log(
        "Resume extracted skills:",
        extractedSkills
      );


      if (
        !Array.isArray(
          extractedSkills
        ) ||
        extractedSkills.length === 0
      ) {

        throw new Error(
          "No extracted skills found in your resume. Please upload your resume again."
        );

      }


      // =====================================================
      // STEP 5 — VALIDATE SELECTED JOB
      // =====================================================

      const currentJob =
        selectedJob;


      if (
        !currentJob ||
        !currentJob.job_id
      ) {

        throw new Error(
          "Selected job information is invalid."
        );

      }


      // =====================================================
      // STEP 6 — VALIDATE JOB ID
      // =====================================================

      const jobId =
        Number(
          currentJob.job_id
        );


      if (
        !jobId ||
        Number.isNaN(jobId)
      ) {

        throw new Error(
          "Selected job information is invalid."
        );

      }


      console.log(
        "Final ATS job ID:",
        jobId
      );


      console.log(
        "ATS Resume ID:",
        currentResumeId
      );


      console.log(
        "ATS Job ID:",
        jobId
      );


      // =====================================================
      // STEP 7 — RUN DETAILED ATS ANALYSIS
      // =====================================================

      const atsResponse =
        await api.post(
          "/api/ats/analyze",
          null,
          {
            params: {

              resume_id:
                currentResumeId,

              job_id:
                jobId,

            },
          }
        );


      console.log(
        "ATS response:",
        atsResponse.data
      );


      // =====================================================
      // STEP 8 — STORE ATS REPORT
      // =====================================================

      setAtsReport(
        atsResponse.data
      );

    }


    // =======================================================
    // ERROR
    // =======================================================

    catch (error) {

      console.error(
        "ATS analysis error:",
        error
      );


      console.error(
        "ATS error response:",
        error.response?.data
      );


      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to perform ATS analysis.";


      setAtsError(
        errorMessage
      );

    }


    // =======================================================
    // FINALLY
    // =======================================================

    finally {

      setAtsLoading(false);

    }

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
  // ATS DATA
  // =========================================================

  const atsScore =
    Number(
      atsReport?.ats_score ?? 0
    );


  const matchPercentage =
    Number(
      atsReport?.match_percentage ?? 0
    );


  const matchedSkills =
    Array.isArray(
      atsReport?.matched_skills
    )
      ? atsReport.matched_skills
      : [];


  const missingSkills =
    Array.isArray(
      atsReport?.missing_skills
    )
      ? atsReport.missing_skills
      : [];


  const suggestions =
    atsReport?.suggestions ||
    "No additional suggestions.";


  // =========================================================
  // ATS CIRCLE FILL
  // =========================================================

  const safeMatchPercentage =
    Math.min(
      100,
      Math.max(
        0,
        matchPercentage
      )
    );


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="page">

      <div
        className="jobs-container"
        style={{
          width: "100%",
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "18px 20px",
          boxSizing: "border-box",
        }}
      >

        {/* =================================================
            BACK TO DASHBOARD
        ================================================= */}

        <div
          style={{
            marginBottom: "14px",
          }}
        >

          <button
            type="button"
            className="secondary-button"
            onClick={
              handleBackToDashboard
            }
          >
            ←Back to Dashboard
          </button>

        </div>


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
            JOB LIST
        ================================================= */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
          }}
        >

          {jobs.map(
            (job, index) => {

              const jobKey =
                job.job_id ??
                `recommendation-${index}`;

              const isExpanded =
                expandedJob === jobKey;


              // =================================================
              // COLLAPSED JOB ROW
              // =================================================

              if (!isExpanded) {

                return (

                  <button
                    key={jobKey}
                    type="button"
                    onClick={() =>
                      toggleJobCard(jobKey)
                    }
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      padding: "15px 18px",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow:
                        "0 2px 6px rgba(0, 0, 0, 0.04)",
                    }}
                  >

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >

                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#111827",
                          overflowWrap: "anywhere",
                          marginBottom: "4px",
                        }}
                      >

                        {job.title ||
                          "Job Title Not Available"}

                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          overflowWrap: "anywhere",
                        }}
                      >

                        {job.company_name ||
                          job.company ||
                          (
                            job.company_id != null
                              ? `Company #${job.company_id}`
                              : "Company"
                          )}

                      </div>

                    </div>


                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: "20px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      +
                    </span>

                  </button>

                );

              }


              // =================================================
              // ML SCORE
              // =================================================

              const mlMatchScore =
                Number(
                  job.ml_match_percentage ?? 0
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
              // FULL JOB CARD
              // =================================================

              return (

                <div
                  className="job-card"
                  key={jobKey}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    minHeight: "0",
                    display: "flex",
                    flexDirection: "column",
                    padding: "18px",
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
                          marginBottom:
                            "3px",
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
                      marginBottom:
                        "12px",
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
                        setExpandedJob(null)
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
                        −
                      </span>

                    </button>


                    {cleanDescription ? (

                      <div
                        style={{
                          marginTop: "10px",
                        }}
                      >

                        <p
                          style={{
                            whiteSpace: "pre-line",
                            lineHeight: "1.6",
                            margin: 0,
                          }}
                        >

                          {cleanDescription}

                        </p>

                      </div>

                    ) : (

                      <div
                        style={{
                          marginTop: "10px",
                        }}
                      >

                        <p>
                          No job description available.
                        </p>

                      </div>

                    )}

                  </div>


                  {/* =================================================
                      ATS ANALYSIS BUTTON
                  ================================================= */}

                  <div>

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


                  {/* =================================================
                      ATS ANALYSIS — SAME PAGE
                  ================================================= */}

                  {atsJob?.job_id === job.job_id && (

                    <div
                      style={{
                        marginTop: "24px",
                        paddingTop: "24px",
                        borderTop:
                          "1px solid #e5e7eb",
                      }}
                    >

                      {/* =================================================
                          ATS LOADING
                      ================================================= */}

                      {atsLoading && (

                        <div
                          className="form-container ats-container"
                          style={{
                            width: "100%",
                            padding: "30px",
                            borderRadius: "18px",
                            boxSizing:
                              "border-box",
                            textAlign:
                              "center",
                          }}
                        >

                          <h1
                            style={{
                              marginBottom:
                                "12px",
                            }}
                          >
                            ATS Analysis
                          </h1>

                          <p
                            className="form-subtitle"
                            style={{
                              lineHeight:
                                "1.6",
                            }}
                          >
                            Analyzing your resume against
                            the selected job...
                          </p>

                        </div>

                      )}


                      {/* =================================================
                          ATS ERROR
                      ================================================= */}

                      {!atsLoading &&
                        atsError && (

                        <div
                          className="form-container ats-container"
                          style={{
                            width: "100%",
                            padding: "30px",
                            borderRadius: "18px",
                            boxSizing:
                              "border-box",
                          }}
                        >

                          <h1
                            style={{
                              marginBottom:
                                "16px",
                            }}
                          >
                            ATS Analysis
                          </h1>

                          <p
                            className="error-message"
                            style={{
                              lineHeight:
                                "1.6",
                              marginBottom:
                                "0",
                            }}
                          >
                            {atsError}
                          </p>

                        </div>

                      )}


                      {/* =================================================
                          ATS RESULT
                      ================================================= */}

                      {!atsLoading &&
                        !atsError &&
                        atsReport && (

                        <div
                          className="form-container ats-container"
                          style={{
                            width: "100%",
                            maxWidth: "720px",
                            margin:
                              "0 auto",
                            padding: "34px",
                            borderRadius: "20px",
                            boxSizing:
                              "border-box",
                            boxShadow:
                              "0 12px 35px rgba(0, 0, 0, 0.08)",
                          }}
                        >

                          {/* ===================================================
                              TITLE
                          =================================================== */}

                          <div
                            style={{
                              marginBottom:
                                "28px",
                            }}
                          >

                            <h1
                              style={{
                                margin:
                                  "0 0 8px",
                                fontSize:
                                  "32px",
                                fontWeight:
                                  "700",
                                letterSpacing:
                                  "-0.5px",
                              }}
                            >
                              ATS Analysis
                            </h1>


                            <p
                              className="form-subtitle"
                              style={{
                                margin: 0,
                                lineHeight:
                                  "1.6",
                              }}
                            >
                              Your resume has been analyzed against
                              the selected job.
                            </p>

                          </div>


                          {/* ===================================================
                              SELECTED JOB
                          =================================================== */}

                          {atsJob && (

                            <div
                              style={{
                                background:
                                  "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                                border:
                                  "1px solid #e2e8f0",
                                borderRadius:
                                  "14px",
                                padding:
                                  "18px 20px",
                                marginBottom:
                                  "22px",
                              }}
                            >

                              <p
                                style={{
                                  margin:
                                    "0 0 7px",
                                  fontSize:
                                    "13px",
                                  fontWeight:
                                    "600",
                                  color:
                                    "#64748b",
                                  textTransform:
                                    "uppercase",
                                  letterSpacing:
                                    "0.5px",
                                }}
                              >
                                Selected Job
                              </p>


                              <div
                                style={{
                                  fontSize:
                                    "19px",
                                  fontWeight:
                                    "700",
                                  color:
                                    "#1e293b",
                                  lineHeight:
                                    "1.4",
                                }}
                              >
                                {atsJob.title}
                              </div>


                              {(atsJob.company_name ||
                                atsJob.company) && (

                                <div
                                  style={{
                                    marginTop:
                                      "4px",
                                    fontSize:
                                      "14px",
                                    color:
                                      "#64748b",
                                  }}
                                >
                                  {atsJob.company_name ||
                                    atsJob.company}
                                </div>

                              )}

                            </div>

                          )}


                          {/* ===================================================
                              ATS SCORE
                          =================================================== */}

                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #f8fafc, #ffffff)",
                              border:
                                "1px solid #e2e8f0",
                              borderRadius:
                                "16px",
                              padding:
                                "30px 20px",
                              marginBottom:
                                "22px",
                              textAlign:
                                "center",
                            }}
                          >

                            {/* =================================================
                                CIRCULAR PROGRESS
                            ================================================= */}

                            <div
                              style={{
                                width:
                                  "170px",
                                height:
                                  "170px",
                                margin:
                                  "0 auto 20px",
                                borderRadius:
                                  "50%",
                                background:
                                  `conic-gradient(#2563eb ${safeMatchPercentage}%, #e2e8f0 ${safeMatchPercentage}% 100%)`,
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                position:
                                  "relative",
                              }}
                            >

                              <div
                                style={{
                                  width:
                                    "140px",
                                  height:
                                    "140px",
                                  borderRadius:
                                    "50%",
                                  background:
                                    "#ffffff",
                                  display:
                                    "flex",
                                  flexDirection:
                                    "column",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  boxShadow:
                                    "inset 0 0 0 1px #f1f5f9",
                                }}
                              >

                                <span
                                  style={{
                                    fontSize:
                                      "36px",
                                    fontWeight:
                                      "700",
                                    color:
                                      "#2563eb",
                                    lineHeight:
                                      "1",
                                  }}
                                >
                                  {atsScore}
                                </span>


                                <span
                                  style={{
                                    marginTop:
                                      "5px",
                                    fontSize:
                                      "12px",
                                    color:
                                      "#64748b",
                                    fontWeight:
                                      "500",
                                  }}
                                >
                                  / 100
                                </span>

                              </div>

                            </div>


                            <h2
                              style={{
                                margin:
                                  "0 0 6px",
                                fontSize:
                                  "20px",
                                fontWeight:
                                  "700",
                                color:
                                  "#1e293b",
                              }}
                            >
                              ATS Compatibility Score
                            </h2>


                            <p
                              style={{
                                margin: 0,
                                fontSize:
                                  "14px",
                                color:
                                  "#64748b",
                              }}
                            >
                              Match Percentage:{" "}
                              <strong
                                style={{
                                  color:
                                    "#2563eb",
                                }}
                              >
                                {matchPercentage}%
                              </strong>
                            </p>

                          </div>


                          {/* ===================================================
                              MATCHED SKILLS
                          =================================================== */}

                          <div
                            className="analysis-section"
                            style={{
                              marginBottom:
                                "18px",
                              padding:
                                "20px",
                              border:
                                "1px solid #e2e8f0",
                              borderRadius:
                                "14px",
                              background:
                                "#ffffff",
                            }}
                          >

                            <h2
                              style={{
                                margin:
                                  "0 0 14px",
                                fontSize:
                                  "17px",
                                fontWeight:
                                  "700",
                                color:
                                  "#1e293b",
                              }}
                            >
                              Matched Skills
                            </h2>


                            {matchedSkills.length > 0 ? (

                              <div
                                className="skills-container"
                                style={{
                                  display:
                                    "flex",
                                  flexWrap:
                                    "wrap",
                                  gap:
                                    "8px",
                                }}
                              >

                                {matchedSkills.map(
                                  (skill, index) => (

                                    <span
                                      className="skill-tag"
                                      key={`${skill}-${index}`}
                                      style={{
                                        padding:
                                          "7px 11px",
                                        borderRadius:
                                          "20px",
                                        fontSize:
                                          "12px",
                                        fontWeight:
                                          "600",
                                      }}
                                    >
                                      {skill}
                                    </span>

                                  )
                                )}

                              </div>

                            ) : (

                              <div
                                className="analysis-value"
                                style={{
                                  color:
                                    "#64748b",
                                }}
                              >
                                No matched skills.
                              </div>

                            )}

                          </div>


                          {/* ===================================================
                              MISSING SKILLS
                          =================================================== */}

                          <div
                            className="analysis-section"
                            style={{
                              marginBottom:
                                "18px",
                              padding:
                                "20px",
                              border:
                                "1px solid #e2e8f0",
                              borderRadius:
                                "14px",
                              background:
                                "#ffffff",
                            }}
                          >

                            <h2
                              style={{
                                margin:
                                  "0 0 14px",
                                fontSize:
                                  "17px",
                                fontWeight:
                                  "700",
                                color:
                                  "#1e293b",
                              }}
                            >
                              Missing Skills
                            </h2>


                            {missingSkills.length > 0 ? (

                              <div
                                className="skills-container"
                                style={{
                                  display:
                                    "flex",
                                  flexWrap:
                                    "wrap",
                                  gap:
                                    "8px",
                                }}
                              >

                                {missingSkills.map(
                                  (skill, index) => (

                                    <span
                                      className="skill-tag"
                                      key={`${skill}-${index}`}
                                      style={{
                                        padding:
                                          "7px 11px",
                                        borderRadius:
                                          "20px",
                                        fontSize:
                                          "12px",
                                        fontWeight:
                                          "600",
                                      }}
                                    >
                                      {skill}
                                    </span>

                                  )
                                )}

                              </div>

                            ) : (

                              <div
                                className="analysis-value"
                                style={{
                                  color:
                                    "#64748b",
                                }}
                              >
                                No missing skills.
                              </div>

                            )}

                          </div>


                          {/* ===================================================
                              SUGGESTIONS
                          =================================================== */}

                          <div
                            className="ats-info"
                            style={{
                              marginBottom:
                                "18px",
                              padding:
                                "20px",
                              borderRadius:
                                "14px",
                              background:
                                "#eff6ff",
                              border:
                                "1px solid #dbeafe",
                            }}
                          >

                            <h3
                              style={{
                                margin:
                                  "0 0 8px",
                                fontSize:
                                  "16px",
                                fontWeight:
                                  "700",
                                color:
                                  "#1e3a8a",
                              }}
                            >
                              Suggestions
                            </h3>


                            <p
                              style={{
                                margin: 0,
                                lineHeight:
                                  "1.6",
                                fontSize:
                                  "14px",
                                color:
                                  "#475569",
                              }}
                            >
                              {suggestions}
                            </p>

                          </div>


                          {/* ===================================================
                              REPORT INFORMATION
                          =================================================== */}

                          {atsReport?.ats_report_id && (

                            <div
                              className="analysis-info"
                              style={{
                                marginBottom:
                                  "0",
                                padding:
                                  "14px 16px",
                                borderRadius:
                                  "10px",
                                background:
                                  "#f8fafc",
                                border:
                                  "1px solid #e2e8f0",
                              }}
                            >

                              <p
                                style={{
                                  margin: 0,
                                  fontSize:
                                    "13px",
                                  color:
                                    "#64748b",
                                }}
                              >

                                ATS Report ID:

                                {" "}

                                <strong
                                  style={{
                                    color:
                                      "#334155",
                                  }}
                                >
                                  {atsReport.ats_report_id}
                                </strong>

                              </p>

                            </div>

                          )}

                        </div>

                      )}

                    </div>

                  )}

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
