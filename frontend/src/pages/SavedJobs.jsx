import { useNavigate } from "react-router-dom";

function SavedJobs() {
  const navigate = useNavigate();

  const savedJobs = [
    {
      id: 1,
      title: "Software Developer",
      company: "ABC Technologies",
      location: "Bangalore",
      salary: "₹5 - ₹8 LPA",
    },
  ];

  return (
    <div className="page">

      <div className="form-container saved-jobs-container">

        <h1>
          Saved Jobs
        </h1>

        <p className="form-subtitle">
          Jobs saved through your SwipeX interactions.
        </p>

        {savedJobs.length === 0 ? (

          <p className="empty-message">
            You haven't saved any jobs yet.
          </p>

        ) : (

          savedJobs.map((job) => (

            <div
              className="saved-job-card"
              key={job.id}
            >

              <h2>
                {job.title}
              </h2>

              <p>
                {job.company}
              </p>

              <div className="saved-job-details">

                <span>
                  📍 {job.location}
                </span>

                <span>
                  💰 {job.salary}
                </span>

              </div>

              <div className="saved-job-status">

                <span>
                  ✓ Applied
                </span>

                <span>
                  ★ Saved
                </span>

                <span>
                  ♥ Favorite
                </span>

              </div>

            </div>

          ))

        )}

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate("/recommended-jobs")
          }
        >
          Continue Exploring Jobs
        </button>

      </div>

    </div>
  );
}

export default SavedJobs;