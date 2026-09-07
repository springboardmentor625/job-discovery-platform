import { useLocation, useNavigate } from "react-router-dom";

function ApplicationSuccess() {
  const location = useLocation();

  const navigate = useNavigate();

  const job = location.state?.job;

  const applied = location.state?.applied;

  const saved = location.state?.saved;

  const favorite = location.state?.favorite;

  return (
    <div className="page application-success-page">

      <div className="application-success-wrapper">

        {/* =====================================================
            SUCCESS CARD
        ===================================================== */}

        <div className="application-success-card">

          {/* ===================================================
              SUCCESS ICON
          =================================================== */}

          <div className="application-success-icon-wrapper">

            <div className="application-success-icon">
              ✓
            </div>

          </div>


          {/* ===================================================
              HEADER
          =================================================== */}

          <div className="application-success-header">

            <p className="application-success-eyebrow">
              SWIPEX APPLICATION
            </p>

            <h1>
              Job Action Completed
            </h1>

            {job && (
              <p className="application-success-subtitle">

                Your right swipe was recorded for{" "}

                <strong>
                  {job.title}
                </strong>

                {" "}at{" "}

                <strong>
                  {job.company}
                </strong>.

              </p>
            )}

          </div>


          {/* ===================================================
              ACTION STATUS
          =================================================== */}

          <div className="application-success-status">

            {applied && (
              <div className="application-success-status-item">

                <div className="application-success-status-icon">
                  ✓
                </div>

                <div className="application-success-status-content">

                  <strong>
                    Job application submitted
                  </strong>

                  <span>
                    Your application has been successfully recorded.
                  </span>

                </div>

              </div>
            )}


            {saved && (
              <div className="application-success-status-item">

                <div className="application-success-status-icon saved">
                  ★
                </div>

                <div className="application-success-status-content">

                  <strong>
                    Job saved
                  </strong>

                  <span>
                    This opportunity has been saved to your jobs.
                  </span>

                </div>

              </div>
            )}


            {favorite && (
              <div className="application-success-status-item">

                <div className="application-success-status-icon favorite">
                  ♥
                </div>

                <div className="application-success-status-content">

                  <strong>
                    Added to favorites
                  </strong>

                  <span>
                    You can easily find this opportunity again.
                  </span>

                </div>

              </div>
            )}

          </div>


          {/* ===================================================
              EXPLANATION
          =================================================== */}

          <div className="application-success-info">

            <div className="application-success-info-icon">
              ✦
            </div>

            <div>

              <strong>
                Your interest has been recorded
              </strong>

              <p>
                Your right swipe means you are interested
                in this opportunity.
              </p>

              <p>
                SwipeX has recorded the application, saved
                the job and added it to your favorites.
              </p>

            </div>

          </div>


          {/* ===================================================
              CONTINUE
          =================================================== */}

          <div className="application-success-footer">

            <button
              type="button"
              className="application-success-button"
              onClick={() =>
                navigate("/recommended-jobs")
              }
            >
              <span>
                View More Recommended Jobs
              </span>

              <span className="application-success-button-arrow">
                →
              </span>

            </button>

          </div>


          {/* ===================================================
              SECURITY / INFO NOTE
          =================================================== */}

          <p className="application-success-note">
            ✦ SwipeX will continue to personalize your
            job recommendations based on your interests.
          </p>

        </div>

      </div>

    </div>
  );
}

export default ApplicationSuccess;
