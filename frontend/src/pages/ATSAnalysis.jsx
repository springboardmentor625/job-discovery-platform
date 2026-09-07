
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

      <div className="page">

        <div className="form-container ats-container">

          <div className="success-icon">
            ...
          </div>

          <h1>
            ATS Analysis
          </h1>

          <p className="form-subtitle">
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

      <div className="page">

        <div className="form-container ats-container">

          <h1>
            ATS Analysis
          </h1>

          <p className="error-message">
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
  // UI
  // =========================================================

  return (

    <div className="page">

      <div className="form-container ats-container">


        {/* ===================================================
            SUCCESS ICON
        =================================================== */}

        <div className="success-icon">
          ✓
        </div>


        {/* ===================================================
            TITLE
        =================================================== */}

        <h1>
          ATS Analysis
        </h1>


        <p className="form-subtitle">
          Your resume has been analyzed against
          the selected job.
        </p>


        {/* ===================================================
            SELECTED JOB
        =================================================== */}

        {job && (

          <div className="analysis-value">

            <strong>
              Selected Job
            </strong>

            <br />

            <strong>
              {job.title}
            </strong>


            {(job.company_name ||
              job.company) && (

              <>
                {" "}at{" "}

                <strong>
                  {job.company_name ||
                    job.company}
                </strong>
              </>

            )}

          </div>

        )}


        {/* ===================================================
            ATS SCORE
        =================================================== */}

        <div className="ats-score-section">

          <div className="ats-score-circle">

            <span className="ats-score">
              {atsScore}
            </span>

            <span className="ats-score-label">
              / 100
            </span>

          </div>


          <h2>
            ATS Compatibility Score
          </h2>


          <p>

            Match Percentage:

            {" "}

            <strong>
              {matchPercentage}%
            </strong>

          </p>

        </div>


        {/* ===================================================
            MATCHED SKILLS
        =================================================== */}

        <div className="analysis-section">

          <h2>
            Matched Skills
          </h2>


          {matchedSkills.length > 0 ? (

            <div className="skills-container">

              {matchedSkills.map(
                (skill, index) => (

                  <span
                    className="skill-tag"
                    key={`${skill}-${index}`}
                  >
                    {skill}
                  </span>

                )
              )}

            </div>

          ) : (

            <div className="analysis-value">
              No matched skills.
            </div>

          )}

        </div>


        {/* ===================================================
            MISSING SKILLS
        =================================================== */}

        <div className="analysis-section">

          <h2>
            Missing Skills
          </h2>


          {missingSkills.length > 0 ? (

            <div className="skills-container">

              {missingSkills.map(
                (skill, index) => (

                  <span
                    className="skill-tag"
                    key={`${skill}-${index}`}
                  >
                    {skill}
                  </span>

                )
              )}

            </div>

          ) : (

            <div className="analysis-value">
              No missing skills.
            </div>

          )}

        </div>


        {/* ===================================================
            SUGGESTIONS
        =================================================== */}

        <div className="ats-info">

          <h3>
            Suggestions
          </h3>

          <p>
            {suggestions}
          </p>

        </div>


        {/* ===================================================
            REPORT INFORMATION
        =================================================== */}

        {atsReport?.ats_report_id && (

          <div className="analysis-info">

            <p>

              ATS Report ID:

              {" "}

              <strong>
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
            marginTop: "25px",
          }}
        >
          View Recommended Jobs
        </button>


      </div>

    </div>

  );
}

export default ATSAnalysis;
