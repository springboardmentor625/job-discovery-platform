import { useLocation, useNavigate } from "react-router-dom";

function ApplicationSuccess() {
  const location = useLocation();

  const navigate = useNavigate();

  const job = location.state?.job;

  const applied = location.state?.applied;

  const saved = location.state?.saved;

  const favorite = location.state?.favorite;

  return (
    <div className="page">

      <div className="form-container application-container">

        {/* Success Icon */}

        <div className="application-icon">
          ✓
        </div>

        <h1>
          Job Action Completed
        </h1>

        {job && (
          <p className="form-subtitle">

            Your right swipe was recorded for

            <strong>
              {" "}{job.title}
            </strong>

            {" "}at{" "}

            <strong>
              {job.company}
            </strong>.

          </p>
        )}

        {/* Actions */}

        <div className="application-actions">

          {applied && (
            <div className="application-action-item">
              <span>✓</span>
              <p>
                Job application submitted
              </p>
            </div>
          )}

          {saved && (
            <div className="application-action-item">
              <span>★</span>
              <p>
                Job saved
              </p>
            </div>
          )}

          {favorite && (
            <div className="application-action-item">
              <span>♥</span>
              <p>
                Added to favorites
              </p>
            </div>
          )}

        </div>

        {/* Explanation */}

        <div className="application-info">

          <p>
            Your right swipe means you are interested
            in this opportunity.
          </p>

          <p>
            SwipeX has recorded the application, saved
            the job and added it to your favorites.
          </p>

        </div>

        {/* Continue */}

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate("/recommended-jobs")
          }
        >
          View More Recommended Jobs
        </button>

      </div>

    </div>
  );
}

export default ApplicationSuccess;