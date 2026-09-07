import { useNavigate } from "react-router-dom";

function Start() {
  const navigate = useNavigate();

  return (
    <div className="start-page">

      {/* =====================================================
          TOP NAVIGATION
      ===================================================== */}

      <nav className="start-navbar">

        <div className="start-brand">
          <div className="start-brand-mark">
            S
          </div>

          <span>SwipeX</span>
        </div>

        <div className="start-nav-right">
          <span>Already have an account?</span>

          <button
            className="start-login-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>

      </nav>


      {/* =====================================================
          MAIN HERO SECTION
      ===================================================== */}

      <main className="start-main">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <section className="start-hero">

          <div className="start-badge">
            AI-Powered Job Discovery
          </div>


          <h1>
            Find jobs that
            <span> match you.</span>
          </h1>


          <p className="start-description">
            SwipeX uses your resume, skills, experience and
            preferences to discover job opportunities that
            fit your career goals.
          </p>


          {/* =================================================
              GET STARTED
          ================================================= */}

          <div className="start-actions">

            <button
              className="start-primary-button"
              onClick={() => navigate("/register")}
            >
              Get Started
              <span className="start-arrow">
                →
              </span>
            </button>

          </div>


          {/* =================================================
              QUICK BENEFITS
          ================================================= */}

          <div className="start-benefits">

            <div className="start-benefit">

              <div className="start-benefit-icon">
                AI
              </div>

              <div>
                <strong>
                  Smart Matching
                </strong>

                <p>
                  AI-powered job recommendations
                </p>
              </div>

            </div>


            <div className="start-benefit">

              <div className="start-benefit-icon">
                CV
              </div>

              <div>
                <strong>
                  Resume Analysis
                </strong>

                <p>
                  Understand your resume and ATS score
                </p>
              </div>

            </div>


            <div className="start-benefit">

              <div className="start-benefit-icon">
                ↔
              </div>

              <div>
                <strong>
                  Swipe & Discover
                </strong>

                <p>
                  Find opportunities in a simple way
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            RIGHT SIDE — PRODUCT PREVIEW
        ===================================================== */}

        <section className="start-preview">

          <div className="preview-glow"></div>


          <div className="preview-window">

            {/* Browser / App Header */}

            <div className="preview-topbar">

              <div className="preview-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="preview-title">
                SwipeX
              </div>

            </div>


            {/* App Content */}

            <div className="preview-content">

              <div className="preview-heading">

                <div>

                  <small>
                    AI RECOMMENDATIONS
                  </small>

                  <h3>
                    Jobs for you
                  </h3>

                </div>

                <div className="preview-count">
                  1457
                </div>

              </div>


              {/* Job Preview Card */}

              <div className="preview-job-card">

                <div className="preview-job-header">

                  <div className="preview-company-logo">
                    T
                  </div>

                  <div>

                    <h4>
                      Software Engineer
                    </h4>

                    <p>
                      Technology Company
                    </p>

                  </div>

                </div>


                <div className="preview-job-details">

                  <span>
                    Remote
                  </span>

                  <span>
                    Full Time
                  </span>

                  <span>
                    ₹8L – ₹15L
                  </span>

                </div>


                <div className="preview-match">

                  <div className="preview-match-top">

                    <span>
                      AI Match
                    </span>

                    <strong>
                      92%
                    </strong>

                  </div>

                  <div className="preview-match-bar">

                    <div></div>

                  </div>

                </div>


                <div className="preview-skills">

                  <span>React</span>
                  <span>Python</span>
                  <span>SQL</span>

                </div>


                <div className="preview-swipe">

                  <span>
                    ← Skip
                  </span>

                  <span>
                    Swipe to explore
                  </span>

                  <span>
                    Apply →
                  </span>

                </div>

              </div>


              {/* Small Cards */}

              <div className="preview-mini-cards">

                <div>
                  <strong>
                    Resume
                  </strong>

                  <span>
                    Parsed
                  </span>
                </div>

                <div>
                  <strong>
                    ATS Score
                  </strong>

                  <span>
                    87%
                  </span>
                </div>

                <div>
                  <strong>
                    Skills
                  </strong>

                  <span>
                    12 matched
                  </span>
                </div>

              </div>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="start-footer">

        <span>
          AI-powered career assistance
        </span>

        <span>
          •
        </span>

        <span>
          Resume Analysis
        </span>

        <span>
          •
        </span>

        <span>
          ATS Scoring
        </span>

        <span>
          •
        </span>

        <span>
          Personalized Recommendations
        </span>

      </footer>

    </div>
  );
}

export default Start;
