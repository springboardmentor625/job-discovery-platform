import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Applications() {

  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ==========================================
  // LOAD APPLICATIONS
  // ==========================================

  useEffect(() => {

    const fetchApplications = async () => {

      try {

        const response = await api.get(
          "/api/applications"
        );

        setApplications(
          response.data || []
        );

      } catch (err) {

        console.error(err);

        if (
          err.response?.status === 401
        ) {

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "user_id"
          );

          localStorage.removeItem(
            "role"
          );

          navigate("/login");

          return;
        }

        setError(
          err.response?.data?.detail ||
          "Unable to load applications."
        );

      } finally {

        setLoading(false);

      }

    };

    fetchApplications();

  }, [navigate]);


  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {

    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  };


  // ==========================================
  // FORMAT STATUS
  // ==========================================

  const formatStatus = (status) => {

    if (!status) {
      return "Submitted";
    }

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );

  };


  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {

    const value =
      status?.toLowerCase();

    if (
      value === "accepted" ||
      value === "shortlisted" ||
      value === "selected"
    ) {

      return "status-success";

    }

    if (
      value === "rejected"
    ) {

      return "status-rejected";

    }

    if (
      value === "interview"
    ) {

      return "status-interview";

    }

    return "status-pending";

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="dashboard-loading">

        Loading applications...

      </div>

    );

  }


  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="applications-page">

      <div className="applications-container">


        {/* ==================================
            HEADER
        =================================== */}

        <div className="applications-header">

          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate("/candidate")
            }
          >
            ← Back
          </button>


          <div>

            <p className="section-label">
              CANDIDATE WORKSPACE
            </p>

            <h1>
              My Applications
            </h1>

            <p>
              Track the jobs you have applied for.
            </p>

          </div>

        </div>


        {/* ==================================
            ERROR
        =================================== */}

        {error && (

          <div className="login-error">

            {error}

          </div>

        )}


        {/* ==================================
            EMPTY APPLICATIONS
        =================================== */}

        {!error &&
          applications.length === 0 && (

            <div className="empty-applications">

              <div className="empty-applications-icon">
                📄
              </div>

              <h2>
                No applications yet
              </h2>

              <p>
                Start discovering jobs and apply
                to positions that match your skills.
              </p>

              <button
                type="button"
                className="dashboard-button"
                onClick={() =>
                  navigate("/candidate/jobs")
                }
              >
                Discover Jobs
              </button>

            </div>

          )}


        {/* ==================================
            APPLICATION LIST
        =================================== */}

        {applications.length > 0 && (

          <div className="applications-list">

            {applications.map(
              (application) => (

                <div
                  className="application-card"
                  key={
                    application.application_id
                  }
                >


                  {/* ==========================
                      JOB ICON
                  =========================== */}

                  <div className="application-icon">

                    💼

                  </div>


                  {/* ==========================
                      JOB INFORMATION
                  =========================== */}

                  <div className="application-info">

                    <h2>

                      {application.title ||
                        `Job #${application.job_id}`}

                    </h2>


                    <p className="application-company">

                      {application.company ||
                        "Company not available"}

                    </p>


                    <div className="application-details">

                      {application.location && (

                        <span>
                          📍 {application.location}
                        </span>

                      )}


                      {application.employment_type && (

                        <span>
                          💼{" "}
                          {application.employment_type}
                        </span>

                      )}


                      {application.salary && (

                        <span>
                          💰 {application.salary}
                        </span>

                      )}

                    </div>


                    {/* ========================
                        SKILLS
                    ========================= */}

                    {application.skills && (

                      <div className="application-skills">

                        {application.skills
                          .split(",")
                          .map(
                            (skill) =>
                              skill.trim()
                          )
                          .filter(Boolean)
                          .map(
                            (skill) => (

                              <span
                                className="application-skill-tag"
                                key={skill}
                              >
                                {skill}
                              </span>

                            )
                          )}

                      </div>

                    )}


                    {/* ========================
                        APPLICATION META
                    ========================= */}

                    <div className="application-meta">

                      <span>

                        Application ID: #
                        {application.application_id}

                      </span>


                      <span>

                        Applied on{" "}

                        {formatDate(
                          application.applied_at
                        )}

                      </span>

                    </div>

                  </div>


                  {/* ==========================
                      STATUS
                  =========================== */}

                  <div className="application-status">

                    <span
                      className={
                        getStatusClass(
                          application.status
                        )
                      }
                    >

                      {formatStatus(
                        application.status
                      )}

                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>

  );

}

export default Applications;