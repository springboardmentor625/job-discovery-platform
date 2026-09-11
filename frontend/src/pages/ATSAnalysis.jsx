
import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../api/api";


function ATSAnalysis() {

  const navigate = useNavigate();
  const location = useLocation();


  // =========================================================
  // DATA PASSED FROM RECOMMENDED JOBS
  // =========================================================

  const resumeFromState =
    location.state?.resume || null;

  const jobFromState =
    location.state?.job || null;


  // =========================================================
  // STATES
  // =========================================================

  const [resume, setResume] =
    useState(resumeFromState);

  const [resumeId, setResumeId] =
    useState(
      resumeFromState?.resume_id ||
      localStorage.getItem("resume_id") ||
      null
    );

  const [job, setJob] =
    useState(jobFromState);

  const [atsReport, setAtsReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =========================================================
  // RUN ATS ANALYSIS
  // =========================================================

  useEffect(() => {

    const runATSAnalysis = async () => {

      try {

        setLoading(true);
        setError("");


        // =====================================================
        // STEP 1 — GET RESUME
        // =====================================================

        let currentResume =
          resumeFromState;

        let currentResumeId =
          resumeFromState?.resume_id ||
          localStorage.getItem("resume_id");


        console.log(
          "Resume from state:",
          resumeFromState
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


          setResume(
            currentResume
          );

          setResumeId(
            currentResumeId
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
        // STEP 5 — REQUIRE USER TO SELECT A JOB
        // =====================================================

        let currentJob =
          jobFromState;


        console.log(
          "Selected job from previous page:",
          currentJob
        );


        if (
          !currentJob ||
          !currentJob.job_id
        ) {

          throw new Error(
            "Please select a job from AI Recommended Jobs before running ATS analysis."
          );

        }


        setJob(
          currentJob
        );


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


        setError(
          errorMessage
        );

      }


      // =======================================================
      // FINALLY
      // =======================================================

      finally {

        setLoading(false);

      }

    };


    runATSAnalysis();

  }, [
    resumeFromState,
    jobFromState,
  ]);


  // =========================================================
  // VIEW RECOMMENDED JOBS
  // =========================================================

  const handleContinue = () => {

    navigate(
      "/recommended-jobs",
      {
        state: {
          resume: resume,
        },
      }
    );

  };


  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {

    return (

      <div
        className="page"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 20px",
          boxSizing: "border-box",
        }}
      >

        <div
          className="form-container ats-container"
          style={{
            width: "100%",
            maxWidth: "620px",
            padding: "40px",
            borderRadius: "18px",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >

          <h1
            style={{
              marginBottom: "12px",
            }}
          >
            ATS Analysis
          </h1>

          <p
            className="form-subtitle"
            style={{
              lineHeight: "1.6",
            }}
          >
            Analyzing your resume against
            the selected job...
          </p>

        </div>

      </div>

    );

  }


  // =========================================================
  // ERROR SCREEN
  // =========================================================

  if (error) {

    return (

      <div
        className="page"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 20px",
          boxSizing: "border-box",
        }}
      >

        <div
          className="form-container ats-container"
          style={{
            width: "100%",
            maxWidth: "620px",
            padding: "40px",
            borderRadius: "18px",
            boxSizing: "border-box",
          }}
        >

          <h1
            style={{
              marginBottom: "16px",
            }}
          >
            ATS Analysis
          </h1>

          <p
            className="error-message"
            style={{
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          >
            {error}
          </p>


          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate(
                "/recommended-jobs",
                {
                  state: {
                    resume: resume,
                  },
                }
              )
            }
            style={{
              width: "100%",
            }}
          >
            View Recommended Jobs
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
  // UI
  // =========================================================

  return (

    <div
      className="page"
      style={{
        minHeight: "100vh",
        padding: "30px 20px 50px",
        boxSizing: "border-box",
      }}
    >

      <div
        className="form-container ats-container"
        style={{
          width: "100%",
          maxWidth: "720px",
          margin: "0 auto",
          padding: "34px",
          borderRadius: "20px",
          boxSizing: "border-box",
          boxShadow:
            "0 12px 35px rgba(0, 0, 0, 0.08)",
        }}
      >


        {/* ===================================================
            TITLE
        =================================================== */}

        <div
          style={{
            marginBottom: "28px",
          }}
        >

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "32px",
              fontWeight: "700",
              letterSpacing: "-0.5px",
            }}
          >
            ATS Analysis
          </h1>


          <p
            className="form-subtitle"
            style={{
              margin: 0,
              lineHeight: "1.6",
            }}
          >
            Your resume has been analyzed against
            the selected job.
          </p>

        </div>


        {/* ===================================================
            SELECTED JOB
        =================================================== */}

        {job && (

          <div
            style={{
              background:
                "linear-gradient(135deg, #f8fafc, #f1f5f9)",
              border:
                "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "18px 20px",
              marginBottom: "22px",
            }}
          >

            <p
              style={{
                margin: "0 0 7px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Selected Job
            </p>


            <div
              style={{
                fontSize: "19px",
                fontWeight: "700",
                color: "#1e293b",
                lineHeight: "1.4",
              }}
            >
              {job.title}
            </div>


            {(job.company_name ||
              job.company) && (

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "14px",
                  color: "#64748b",
                }}
              >
                {job.company_name ||
                  job.company}
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
            borderRadius: "16px",
            padding: "30px 20px",
            marginBottom: "22px",
            textAlign: "center",
          }}
        >

          {/* =================================================
              CIRCULAR PROGRESS
          ================================================= */}

          <div
            style={{
              width: "170px",
              height: "170px",
              margin: "0 auto 20px",
              borderRadius: "50%",
              background:
                `conic-gradient(#2563eb ${safeMatchPercentage}%, #e2e8f0 ${safeMatchPercentage}% 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >

            <div
              style={{
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "inset 0 0 0 1px #f1f5f9",
              }}
            >

              <span
                style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color: "#2563eb",
                  lineHeight: "1",
                }}
              >
                {atsScore}
              </span>


              <span
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  color: "#64748b",
                  fontWeight: "500",
                }}
              >
                / 100
              </span>

            </div>

          </div>


          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "20px",
              fontWeight: "700",
              color: "#1e293b",
            }}
          >
            ATS Compatibility Score
          </h2>


          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            Match Percentage:{" "}
            <strong
              style={{
                color: "#2563eb",
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
            marginBottom: "18px",
            padding: "20px",
            border:
              "1px solid #e2e8f0",
            borderRadius: "14px",
            background: "#ffffff",
          }}
        >

          <h2
            style={{
              margin: "0 0 14px",
              fontSize: "17px",
              fontWeight: "700",
              color: "#1e293b",
            }}
          >
            Matched Skills
          </h2>


          {matchedSkills.length > 0 ? (

            <div
              className="skills-container"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >

              {matchedSkills.map(
                (skill, index) => (

                  <span
                    className="skill-tag"
                    key={`${skill}-${index}`}
                    style={{
                      padding: "7px 11px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
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
                color: "#64748b",
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
            marginBottom: "18px",
            padding: "20px",
            border:
              "1px solid #e2e8f0",
            borderRadius: "14px",
            background: "#ffffff",
          }}
        >

          <h2
            style={{
              margin: "0 0 14px",
              fontSize: "17px",
              fontWeight: "700",
              color: "#1e293b",
            }}
          >
            Missing Skills
          </h2>


          {missingSkills.length > 0 ? (

            <div
              className="skills-container"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >

              {missingSkills.map(
                (skill, index) => (

                  <span
                    className="skill-tag"
                    key={`${skill}-${index}`}
                    style={{
                      padding: "7px 11px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
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
                color: "#64748b",
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
            marginBottom: "18px",
            padding: "20px",
            borderRadius: "14px",
            background:
              "#eff6ff",
            border:
              "1px solid #dbeafe",
          }}
        >

          <h3
            style={{
              margin: "0 0 8px",
              fontSize: "16px",
              fontWeight: "700",
              color: "#1e3a8a",
            }}
          >
            Suggestions
          </h3>


          <p
            style={{
              margin: 0,
              lineHeight: "1.6",
              fontSize: "14px",
              color: "#475569",
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
              marginBottom: "20px",
              padding: "14px 16px",
              borderRadius: "10px",
              background: "#f8fafc",
              border:
                "1px solid #e2e8f0",
            }}
          >

            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#64748b",
              }}
            >

              ATS Report ID:

              {" "}

              <strong
                style={{
                  color: "#334155",
                }}
              >
                {atsReport.ats_report_id}
              </strong>

            </p>

          </div>

        )}


        {/* ===================================================
            CONTINUE
        =================================================== */}

        <button
          type="button"
          className="primary-button"
          onClick={
            handleContinue
          }
          style={{
            width: "100%",
            marginTop: "8px",
            padding: "13px 20px",
            fontSize: "15px",
            fontWeight: "600",
            borderRadius: "10px",
          }}
        >
          View Recommended Jobs
        </button>


      </div>

    </div>

  );
}

export default ATSAnalysis;
