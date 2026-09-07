import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

function ResumeParsing() {
  const navigate = useNavigate();
  const location = useLocation();

  const resume =
    location.state?.resume;

  const [progress, setProgress] =
    useState(0);

  const [currentStep, setCurrentStep] =
    useState(
      "Preparing your resume..."
    );

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!resume) {
      setError(
        "Resume information was not found. Please upload your resume again."
      );

      return;
    }

    /*
     * The backend has already received
     * and processed the uploaded file.
     *
     * This progress is only a visual
     * transition and does NOT pretend
     * that parsing is happening here.
     */

    setProgress(25);
    setCurrentStep(
      "Resume uploaded successfully..."
    );

    const timer1 = setTimeout(() => {
      setProgress(60);
      setCurrentStep(
        "Resume processing completed by SwipeX..."
      );
    }, 500);

    const timer2 = setTimeout(() => {
      setProgress(100);
      setCurrentStep(
        "Resume analysis completed!"
      );
    }, 1000);

    const timer3 = setTimeout(() => {
      navigate(
        "/resume-analysis",
        {
          state: {
            resume,
          },
        }
      );
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };

  }, [resume, navigate]);

  return (
    <div className="profile-page parsing-page">

      {/* =====================================================
          TOP NAVIGATION
      ===================================================== */}

      <header className="profile-header">

        <div className="profile-brand">

          <div className="profile-brand-icon">
            SX
          </div>

          <div>

            <div className="profile-brand-name">
              SwipeX
            </div>

            <div className="profile-brand-subtitle">
              Career Discovery Platform
            </div>

          </div>

        </div>


        <div className="profile-step">

          <span className="step-dot completed">
            ✓
          </span>

          <span>
            Profile
          </span>

          <span className="step-line completed-line"></span>

          <span className="step-dot active">
            3
          </span>

          <span>
            Resume
          </span>

          <span className="step-line"></span>

          <span className="step-dot">
            4
          </span>

          <span>
            Analysis
          </span>

        </div>

      </header>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="profile-main parsing-main">

        <div className="parsing-wrapper">

          {/* =================================================
              HEADER / INTRO
          ================================================= */}

          <div className="parsing-intro">

            <div className="parsing-intro-icon">
              {error ? "!" : "✦"}
            </div>

            <div>

              <p className="profile-eyebrow">
                RESUME PROCESSING
              </p>

              <h1>
                Analyzing Your Resume
              </h1>

              <p className="profile-description">
                SwipeX is processing your uploaded resume
                and preparing your information for analysis.
              </p>

            </div>

          </div>


          {/* =================================================
              MAIN PARSING CARD
          ================================================= */}

          <div className="parsing-card">

            {error ? (

              /* =================================================
                  ERROR STATE
              ================================================= */

              <div className="parsing-error-state">

                <div className="parsing-error-icon">
                  !
                </div>

                <h2>
                  Resume information not found
                </h2>

                <p className="parsing-error-message">
                  {error}
                </p>

                <button
                  type="button"
                  className="profile-submit-button"
                  onClick={() =>
                    navigate(
                      "/upload-resume"
                    )
                  }
                >
                  Upload Resume Again
                  <span className="button-arrow">
                    →
                  </span>
                </button>

              </div>

            ) : (

              /* =================================================
                  PROCESSING STATE
              ================================================= */

              <>

                {/* ---------------------------------------------
                    RESUME ICON
                --------------------------------------------- */}

                <div className="parsing-file-icon">
                  📄
                </div>


                {/* ---------------------------------------------
                    STATUS
                --------------------------------------------- */}

                <div className="parsing-status">

                  <span className="parsing-status-label">
                    RESUME ANALYSIS
                  </span>

                  <h2 className="parsing-step">
                    {currentStep}
                  </h2>

                  <p className="parsing-status-description">
                    Please wait while SwipeX prepares
                    your extracted resume information.
                  </p>


                  {/* -------------------------------------------
                      PROGRESS BAR
                  ------------------------------------------- */}

                  <div className="parsing-progress-wrapper">

                    <div className="parsing-progress-header">

                      <span>
                        Processing progress
                      </span>

                      <strong>
                        {progress}%
                      </strong>

                    </div>

                    <div className="progress-bar-container">

                      <div
                        className="progress-bar"
                        style={{
                          width: `${progress}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                </div>


                {/* =================================================
                    PROCESSING STEPS
                ================================================= */}

                <div className="parsing-details">

                  {/* STEP 1 */}

                  <div
                    className={
                      progress >= 25
                        ? "parsing-item completed"
                        : "parsing-item"
                    }
                  >

                    <div className="parsing-item-icon">

                      {progress >= 25
                        ? "✓"
                        : "○"}

                    </div>

                    <div className="parsing-item-content">

                      <strong>
                        Resume uploaded
                      </strong>

                      <span>
                        Your resume has been successfully
                        received by SwipeX.
                      </span>

                    </div>

                  </div>


                  {/* STEP 2 */}

                  <div
                    className={
                      progress >= 60
                        ? "parsing-item completed"
                        : "parsing-item"
                    }
                  >

                    <div className="parsing-item-icon">

                      {progress >= 60
                        ? "✓"
                        : "○"}

                    </div>

                    <div className="parsing-item-content">

                      <strong>
                        Resume processed
                      </strong>

                      <span>
                        Resume content has been processed
                        successfully.
                      </span>

                    </div>

                  </div>


                  {/* STEP 3 */}

                  <div
                    className={
                      progress >= 100
                        ? "parsing-item completed"
                        : "parsing-item"
                    }
                  >

                    <div className="parsing-item-icon">

                      {progress >= 100
                        ? "✓"
                        : "○"}

                    </div>

                    <div className="parsing-item-content">

                      <strong>
                        Analysis completed
                      </strong>

                      <span>
                        Extracted resume information is
                        ready to review.
                      </span>

                    </div>

                  </div>

                </div>


                {/* =================================================
                    INFORMATION MESSAGE
                ================================================= */}

                <div className="parsing-note">

                  <span className="parsing-note-icon">
                    ✨
                  </span>

                  <div>

                    <strong>
                      Almost ready
                    </strong>

                    <p>
                      SwipeX is preparing your extracted
                      skills, experience and education.
                    </p>

                  </div>

                </div>

              </>

            )}

          </div>

        </div>

      </main>

    </div>
  );
}

export default ResumeParsing;
