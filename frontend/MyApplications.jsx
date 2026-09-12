import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApplications } from "../api/applications";

function MyApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD APPLICATIONS
  // =========================================================

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getApplications();

        console.log("My Applications:", response);

        setApplications(response.applications || []);
      } catch (error) {
        console.error(
          "Failed to load applications:",
          error
        );

        setError(
          error.response?.data?.detail ||
            "Failed to load your applications."
        );
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // FORMAT SALARY
  // =========================================================

  const formatSalary = (minimum, maximum) => {
    const min = Number(minimum);
    const max = Number(maximum);

    const validMin = Number.isFinite(min) && min > 0;
    const validMax = Number.isFinite(max) && max > 0;

    if (validMin && validMax) {
      return `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString(
        "en-IN"
      )}`;
    }

    if (validMin) {
      return `₹${min.toLocaleString("en-IN")}+`;
    }

    if (validMax) {
      return `Up to ₹${max.toLocaleString("en-IN")}`;
    }

    return "Salary not disclosed";
  };

  // =========================================================
  // FORMAT EXPERIENCE
  // =========================================================

  const formatExperience = (experience) => {
    if (
      experience === null ||
      experience === undefined ||
      experience === ""
    ) {
      return "Not specified";
    }

    return String(experience);
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (status) => {
    const normalizedStatus = String(
      status || "APPLIED"
    ).toUpperCase();

    if (normalizedStatus === "SHORTLISTED") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (normalizedStatus === "SELECTED") {
      return {
        background: "#dbeafe",
        color: "#1e40af",
      };
    }

    if (normalizedStatus === "REJECTED") {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    return {
      background: "#f3f4f6",
      color: "#374151",
    };
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          color: "#475569",
          fontSize: "16px",
        }}
      >
        Loading your applications...
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              My Applications
            </h1>

            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              Track the jobs you have applied for.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            style={{
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#374151",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Back to Dashboard
          </button>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "14px 18px",
              borderRadius: "10px",
              marginBottom: "24px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {!error && applications.length === 0 && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "60px 30px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                margin: "0 0 10px",
                color: "#111827",
                fontSize: "22px",
              }}
            >
              No applications yet
            </h2>

            <p
              style={{
                margin: "0 auto 24px",
                maxWidth: "500px",
                color: "#64748b",
                fontSize: "15px",
                lineHeight: "1.6",
              }}
            >
              Jobs that you apply for through SwipeX
              will appear here.
            </p>

            <button
              onClick={() =>
                navigate("/recommended-jobs")
              }
              style={{
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                padding: "12px 22px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Explore Recommended Jobs
            </button>
          </div>
        )}

        {/* =====================================================
            APPLICATION LIST
        ===================================================== */}

        {!error && applications.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {applications.map((application) => {
              const status =
                application.status || "APPLIED";

              const statusStyle =
                getStatusStyle(status);

              return (
                <div
                  key={application.application_id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "24px",
                    boxShadow:
                      "0 2px 8px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  {/* =================================================
                      TITLE + STATUS
                  ================================================= */}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "20px",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "20px",
                          fontWeight: "700",
                          color: "#111827",
                        }}
                      >
                        {application.title ||
                          "Job Title"}
                      </h2>

                      <p
                        style={{
                          margin: "8px 0 0",
                          color: "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        Application ID:{" "}
                        {application.application_id}
                      </p>
                    </div>

                    <span
                      style={{
                        ...statusStyle,
                        padding: "6px 12px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {String(status).replace(
                        /_/g,
                        " "
                      )}
                    </span>
                  </div>

                  {/* =================================================
                      JOB DETAILS
                  ================================================= */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(4, 1fr)",
                      gap: "20px",
                      marginTop: "22px",
                      paddingTop: "20px",
                      borderTop:
                        "1px solid #f1f5f9",
                    }}
                  >
                    {/* LOCATION */}

                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#94a3b8",
                          marginBottom: "5px",
                          fontWeight: "600",
                        }}
                      >
                        LOCATION
                      </div>

                      <div
                        style={{
                          color: "#334155",
                          fontSize: "14px",
                        }}
                      >
                        {application.location ||
                          "Not specified"}
                      </div>
                    </div>

                    {/* EMPLOYMENT TYPE */}

                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#94a3b8",
                          marginBottom: "5px",
                          fontWeight: "600",
                        }}
                      >
                        EMPLOYMENT
                      </div>

                      <div
                        style={{
                          color: "#334155",
                          fontSize: "14px",
                        }}
                      >
                        {application.employment_type ||
                          "Not specified"}
                      </div>
                    </div>

                    {/* EXPERIENCE */}

                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#94a3b8",
                          marginBottom: "5px",
                          fontWeight: "600",
                        }}
                      >
                        EXPERIENCE
                      </div>

                      <div
                        style={{
                          color: "#334155",
                          fontSize: "14px",
                        }}
                      >
                        {formatExperience(
                          application.experience_required
                        )}
                      </div>
                    </div>

                    {/* APPLIED DATE */}

                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#94a3b8",
                          marginBottom: "5px",
                          fontWeight: "600",
                        }}
                      >
                        APPLIED DATE
                      </div>

                      <div
                        style={{
                          color: "#334155",
                          fontSize: "14px",
                        }}
                      >
                        {formatDate(
                          application.applied_at
                        )}
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      SALARY
                  ================================================= */}

                  <div
                    style={{
                      marginTop: "20px",
                      paddingTop: "18px",
                      borderTop:
                        "1px solid #f1f5f9",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        marginBottom: "5px",
                        fontWeight: "600",
                      }}
                    >
                      SALARY
                    </div>

                    <div
                      style={{
                        color: "#334155",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      {formatSalary(
                        application.salary_min,
                        application.salary_max
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyApplications;