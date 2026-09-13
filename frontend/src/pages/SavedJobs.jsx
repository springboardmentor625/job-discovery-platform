import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getSavedJobs,
} from "../api/swipes";

function SavedJobs() {
  const navigate = useNavigate();

  const [savedJobs, setSavedJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedJob, setSelectedJob] =
    useState(null);

  // =========================================================
  // LOAD SAVED JOBS
  // =========================================================

  useEffect(() => {
    const loadSavedJobs =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getSavedJobs();

          console.log(
            "Saved jobs:",
            response
          );

          setSavedJobs(
            response.saved_jobs || []
          );

        } catch (error) {
          console.error(
            "Saved jobs error:",
            error
          );

          setError(
            error.response?.data?.detail ||
            "Failed to load saved jobs."
          );

        } finally {
          setLoading(false);
        }
      };

    loadSavedJobs();

  }, []);

  // =========================================================
  // CLEAN HTML JOB DESCRIPTION
  // =========================================================

  const cleanJobDescription = (description) => {
    if (!description) {
      return "";
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = description;

    return tempDiv.textContent
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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
        Loading your saved jobs...
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
              Saved Jobs
            </h1>

            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              Jobs saved through your
              SwipeX interactions.
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
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

        {!error &&
          savedJobs.length === 0 && (
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
                No saved jobs yet
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
                Jobs that you save through
                SwipeX will appear here.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/recommended-jobs"
                  )
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
            SAVED JOB LIST
        ===================================================== */}

        {!error &&
          savedJobs.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {savedJobs.map(
                (job, index) => {
                  const jobId =
                    job.job_id ??
                    job.id ??
                    index;

                  const salaryMin =
                    Number(job.salary_min);

                  const salaryMax =
                    Number(job.salary_max);

                  const hasSalary =
                    (Number.isFinite(
                      salaryMin
                    ) &&
                      salaryMin > 0) ||
                    (Number.isFinite(
                      salaryMax
                    ) &&
                      salaryMax > 0);

                  const salaryText =
                    hasSalary
                      ? `₹${salaryMin || 0} - ₹${salaryMax || 0}`
                      : "Salary not disclosed";

                  return (
                    <div
                      key={jobId}
                      onClick={() =>
                        setSelectedJob(job)
                      }
                      style={{
                        background: "#ffffff",
                        border:
                          "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "24px",
                        boxShadow:
                          "0 2px 8px rgba(15, 23, 42, 0.04)",
                        cursor: "pointer",
                      }}
                    >
                      {/* =========================================
                          TITLE + SAVED STATUS
                      ========================================= */}

                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "flex-start",
                          justifyContent:
                            "space-between",
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
                            {job.title}
                          </h2>

                          <p
                            style={{
                              margin:
                                "8px 0 0",
                              color: "#64748b",
                              fontSize:
                                "14px",
                            }}
                          >
                            {job.company_name ||
                              job.company ||
                              `Company #${job.company_id}`}
                          </p>
                        </div>

                        <span
                          style={{
                            background:
                              "#fef3c7",
                            color: "#92400e",
                            padding:
                              "6px 12px",
                            borderRadius:
                              "999px",
                            fontSize: "12px",
                            fontWeight:
                              "700",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          Saved
                        </span>
                      </div>

                      {/* =========================================
                          JOB DETAILS
                      ========================================= */}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(2, 1fr)",
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
                              marginBottom:
                                "5px",
                              fontWeight:
                                "600",
                            }}
                          >
                            LOCATION
                          </div>

                          <div
                            style={{
                              color: "#334155",
                              fontSize:
                                "14px",
                            }}
                          >
                            {job.location ||
                              "Location not specified"}
                          </div>
                        </div>

                        {/* SALARY */}

                        <div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#94a3b8",
                              marginBottom:
                                "5px",
                              fontWeight:
                                "600",
                            }}
                          >
                            SALARY
                          </div>

                          <div
                            style={{
                              color: "#334155",
                              fontSize:
                                "14px",
                              fontWeight:
                                "600",
                            }}
                          >
                            {salaryText}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

        {/* =====================================================
            CONTINUE EXPLORING
        ===================================================== */}

        <div
          style={{
            marginTop: "28px",
          }}
        >
          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate(
                "/recommended-jobs"
              )
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
            Continue Exploring Jobs
          </button>
        </div>
      </div>

      {/* =======================================================
          JOB INFORMATION MODAL
      ======================================================= */}

      {selectedJob && (
        <div
          onClick={() =>
            setSelectedJob(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "30px",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "800px",
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "30px",
              boxShadow:
                "0 20px 50px rgba(15, 23, 42, 0.2)",
            }}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent:
                  "space-between",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "26px",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {selectedJob.title ||
                    "Job Details"}
                </h2>

                <p
                  style={{
                    margin:
                      "8px 0 0",
                    color: "#64748b",
                    fontSize: "15px",
                  }}
                >
                  {selectedJob.company_name ||
                    selectedJob.company ||
                    `Company #${selectedJob.company_id}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedJob(null)
                }
                style={{
                  border:
                    "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#374151",
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "20px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* JOB INFORMATION */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, 1fr)",
                gap: "20px",
                paddingTop: "20px",
                borderTop:
                  "1px solid #f1f5f9",
              }}
            >
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
                  {selectedJob.location ||
                    "Location not specified"}
                </div>
              </div>

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
                  {selectedJob.employment_type ||
                    "Not specified"}
                </div>
              </div>

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
                  {selectedJob.experience_required ||
                    "Not specified"}
                </div>
              </div>

              <div>
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
                  {(() => {
                    const min =
                      Number(
                        selectedJob.salary_min
                      );

                    const max =
                      Number(
                        selectedJob.salary_max
                      );

                    const validMin =
                      Number.isFinite(min) &&
                      min > 0;

                    const validMax =
                      Number.isFinite(max) &&
                      max > 0;

                    if (
                      validMin &&
                      validMax
                    ) {
                      return `₹${min.toLocaleString(
                        "en-IN"
                      )} - ₹${max.toLocaleString(
                        "en-IN"
                      )}`;
                    }

                    if (validMin) {
                      return `₹${min.toLocaleString(
                        "en-IN"
                      )}+`;
                    }

                    if (validMax) {
                      return `Up to ₹${max.toLocaleString(
                        "en-IN"
                      )}`;
                    }

                    return "Salary not disclosed";
                  })()}
                </div>
              </div>
            </div>

            {/* REQUIRED SKILLS */}

            {selectedJob.required_skills && (
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "20px",
                  borderTop:
                    "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginBottom: "10px",
                    fontWeight: "600",
                  }}
                >
                  REQUIRED SKILLS
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {(Array.isArray(
                    selectedJob.required_skills
                  )
                    ? selectedJob.required_skills
                    : []
                  ).map(
                    (skill, index) => (
                      <span
                        key={index}
                        style={{
                          background:
                            "#eff6ff",
                          color:
                            "#1d4ed8",
                          padding:
                            "6px 10px",
                          borderRadius:
                            "6px",
                          fontSize:
                            "13px",
                          fontWeight:
                            "500",
                        }}
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* ABOUT THIS JOB */}

            <div
              style={{
                marginTop: "24px",
                paddingTop: "20px",
                borderTop:
                  "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  marginBottom: "10px",
                  fontWeight: "600",
                }}
              >
                ABOUT THIS JOB
              </div>

              <div
                style={{
                  color: "#475569",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  whiteSpace: "pre-line",
                }}
              >
                {cleanJobDescription(
                  selectedJob.description
                ) ||
                  "Job description not available."}
              </div>
            </div>

            {/* CLOSE */}

            <div
              style={{
                marginTop: "28px",
                textAlign: "right",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setSelectedJob(null)
                }
                style={{
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  padding:
                    "11px 22px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SavedJobs;
