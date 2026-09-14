import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../api/api";

function SwipeHistory() {
  const navigate = useNavigate();

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedJob, setSelectedJob] =
    useState(null);

  // =========================================================
  // LOAD SWIPE HISTORY
  // =========================================================

  useEffect(() => {
    const loadSwipeHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/api/swipes/history"
        );

        console.log(
          "Swipe history:",
          response.data
        );

        setHistory(
          response.data?.history || []
        );

      } catch (error) {
        console.error(
          "Swipe history error:",
          error
        );

        setError(
          error.response?.data?.detail ||
          "Failed to load swipe history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSwipeHistory();
  }, []);

  // =========================================================
  // FORMAT JOB DESCRIPTION
  // =========================================================

  const formatJobDescription = (
    description
  ) => {
    if (!description) {
      return [];
    }

    const tempDiv =
      document.createElement("div");

    tempDiv.innerHTML = description;

    // Convert line breaks
    tempDiv
      .querySelectorAll("br")
      .forEach((element) => {
        element.replaceWith("\n");
      });

    // Add spacing around common block elements
    tempDiv
      .querySelectorAll(
        "p, div, section, article, h1, h2, h3, h4, h5, h6"
      )
      .forEach((element) => {
        element.insertAdjacentText(
          "beforebegin",
          "\n"
        );

        element.insertAdjacentText(
          "afterend",
          "\n"
        );
      });

    // Convert list items into bullets
    tempDiv
      .querySelectorAll("li")
      .forEach((element) => {
        element.insertAdjacentText(
          "beforebegin",
          "\n• "
        );

        element.insertAdjacentText(
          "afterend",
          "\n"
        );
      });

    let text =
      tempDiv.textContent || "";

    text = text
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      return [];
    }

    return text
      .split(/\n/)
      .map((line) =>
        line.trim()
      )
      .filter(
        (line) =>
          line.length > 0
      );
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date not available";
    }

    const date =
      new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date not available";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================================
  // FORMAT SALARY
  // =========================================================

  const formatSalary = (
    salaryMin,
    salaryMax
  ) => {
    if (
      salaryMin == null &&
      salaryMax == null
    ) {
      return "Salary not disclosed";
    }

    if (
      salaryMin != null &&
      salaryMax != null
    ) {
      return `₹${Number(
        salaryMin
      ).toLocaleString(
        "en-IN"
      )} - ₹${Number(
        salaryMax
      ).toLocaleString(
        "en-IN"
      )}`;
    }

    if (salaryMin != null) {
      return `₹${Number(
        salaryMin
      ).toLocaleString(
        "en-IN"
      )}+`;
    }

    return `Up to ₹${Number(
      salaryMax
    ).toLocaleString(
      "en-IN"
    )}`;
  };

  // =========================================================
  // FORMAT EXPERIENCE
  // =========================================================

  const formatExperience = (
    experience
  ) => {
    if (
      experience == null ||
      experience === ""
    ) {
      return "Not specified";
    }

    const numericExperience =
      Number(experience);

    if (
      Number.isNaN(
        numericExperience
      )
    ) {
      return String(
        experience
      );
    }

    if (
      numericExperience === 0
    ) {
      return "Fresher";
    }

    return `${numericExperience}+ years`;
  };

  // =========================================================
  // FORMAT SWIPE ACTION
  // =========================================================

  const getActionLabel = (
    action
  ) => {
    if (action === "RIGHT") {
      return "Applied";
    }

    if (action === "LEFT") {
      return "Skipped";
    }

    if (action === "SAVE") {
      return "Saved";
    }

    return action || "Unknown";
  };

  // =========================================================
  // ACTION BADGE STYLE
  // =========================================================

  const getActionStyle = (
    action
  ) => {
    if (action === "RIGHT") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (action === "LEFT") {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    if (action === "SAVE") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    return {
      background: "#e2e8f0",
      color: "#475569",
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
          fontFamily:
            "Arial, sans-serif",
          color: "#475569",
          fontSize: "16px",
        }}
      >
        Loading your swipe history...
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
        fontFamily:
          "Arial, sans-serif",
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
            justifyContent:
              "space-between",
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
              Swipe History
            </h1>

            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              View the jobs you
              have interacted with
              through SwipeX.
            </p>
          </div>

          {/* BACK TO DASHBOARD */}

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            style={{
              border:
                "1px solid #d1d5db",
              background: "#ffffff",
              color: "#374151",
              padding:
                "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            ← Back to Dashboard
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
              padding: "14px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
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
          history.length === 0 && (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "50px",
                textAlign: "center",
                boxShadow:
                  "0 2px 10px rgba(15, 23, 42, 0.05)",
              }}
            >
              <h2
                style={{
                  margin:
                    "0 0 10px",
                  fontSize: "22px",
                  color: "#111827",
                }}
              >
                No Swipe History Yet
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "15px",
                }}
              >
                Start exploring jobs
                to see your swipe
                activity here.
              </p>
            </div>
          )}

        {/* =====================================================
            HISTORY LIST
        ===================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {history.map((job) => (
            <div
              key={job.swipe_id}
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "24px",
                boxShadow:
                  "0 2px 10px rgba(15, 23, 42, 0.05)",
              }}
            >
              {/* JOB HEADER */}

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
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
                    {job.title ||
                      "Job title not available"}
                  </h2>

                  <p
                    style={{
                      margin:
                        "7px 0 0",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    {job.company_name ||
                      job.company ||
                      `Company #${job.company_id}`}
                  </p>
                </div>

                {/* SWIPE ACTION */}

                <span
                  style={{
                    ...getActionStyle(
                      job.swipe_action
                    ),
                    padding:
                      "6px 12px",
                    borderRadius:
                      "999px",
                    fontSize: "12px",
                    fontWeight: "700",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {getActionLabel(
                    job.swipe_action
                  )}
                </span>
              </div>

              {/* BASIC JOB INFORMATION */}

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
                    {job.location ||
                      "Location not specified"}
                  </div>
                </div>

                {/* EMPLOYMENT TYPE */}

                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginBottom:
                        "5px",
                      fontWeight: "600",
                    }}
                  >
                    EMPLOYMENT TYPE
                  </div>

                  <div
                    style={{
                      color: "#334155",
                      fontSize: "14px",
                    }}
                  >
                    {job.employment_type ||
                      "Not specified"}
                  </div>
                </div>

                {/* EXPERIENCE */}

                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginBottom:
                        "5px",
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
                      job.experience_required
                    )}
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
                      job.salary_min,
                      job.salary_max
                    )}
                  </div>
                </div>
              </div>

              {/* SWIPE INFORMATION */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, 1fr)",
                  gap: "20px",
                  marginTop: "20px",
                  paddingTop: "20px",
                  borderTop:
                    "1px solid #f1f5f9",
                }}
              >
                {/* ACTION */}

                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginBottom:
                        "5px",
                      fontWeight: "600",
                    }}
                  >
                    SWIPE ACTION
                  </div>

                  <div
                    style={{
                      color: "#334155",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {getActionLabel(
                      job.swipe_action
                    )}
                  </div>
                </div>

                {/* DATE */}

                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginBottom:
                        "5px",
                      fontWeight: "600",
                    }}
                  >
                    SWIPED ON
                  </div>

                  <div
                    style={{
                      color: "#334155",
                      fontSize: "14px",
                    }}
                  >
                    {formatDate(
                      job.swiped_at
                    )}
                  </div>
                </div>
              </div>

              {/* VIEW JOB DETAILS */}

              <div
                style={{
                  marginTop: "22px",
                  paddingTop: "20px",
                  borderTop:
                    "1px solid #f1f5f9",
                  textAlign: "right",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedJob(job)
                  }
                  style={{
                    border: "none",
                    background:
                      "#2563eb",
                    color: "#ffffff",
                    padding:
                      "10px 18px",
                    borderRadius: "8px",
                    cursor:
                      "pointer",
                    fontSize: "14px",
                    fontWeight:
                      "600",
                  }}
                >
                  View Job Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =======================================================
          JOB DETAILS MODAL
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
              "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
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
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
              background:
                "#ffffff",
              borderRadius:
                "14px",
              padding: "30px",
              boxShadow:
                "0 20px 50px rgba(15, 23, 42, 0.25)",
            }}
          >
            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div
              style={{
                display: "flex",
                alignItems:
                  "flex-start",
                justifyContent:
                  "space-between",
                gap: "20px",
                marginBottom:
                  "24px",
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

              <span
                style={{
                  ...getActionStyle(
                    selectedJob.swipe_action
                  ),
                  padding:
                    "7px 13px",
                  borderRadius:
                    "999px",
                  fontSize: "12px",
                  fontWeight: "700",
                  whiteSpace:
                    "nowrap",
                }}
              >
                {getActionLabel(
                  selectedJob.swipe_action
                )}
              </span>
            </div>

            {/* =================================================
                JOB INFORMATION
            ================================================= */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, 1fr)",
                gap: "14px",
                marginBottom:
                  "26px",
              }}
            >
              {/* LOCATION */}

              <div
                style={{
                  background:
                    "#f8fafc",
                  borderRadius:
                    "10px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: "600",
                    marginBottom:
                      "6px",
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

              {/* EMPLOYMENT TYPE */}

              <div
                style={{
                  background:
                    "#f8fafc",
                  borderRadius:
                    "10px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: "600",
                    marginBottom:
                      "6px",
                  }}
                >
                  EMPLOYMENT TYPE
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

              {/* EXPERIENCE */}

              <div
                style={{
                  background:
                    "#f8fafc",
                  borderRadius:
                    "10px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: "600",
                    marginBottom:
                      "6px",
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
                    selectedJob.experience_required
                  )}
                </div>
              </div>

              {/* SALARY */}

              <div
                style={{
                  background:
                    "#f8fafc",
                  borderRadius:
                    "10px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: "600",
                    marginBottom:
                      "6px",
                  }}
                >
                  SALARY
                </div>

                <div
                  style={{
                    color: "#334155",
                    fontSize: "14px",
                    fontWeight:
                      "600",
                  }}
                >
                  {formatSalary(
                    selectedJob.salary_min,
                    selectedJob.salary_max
                  )}
                </div>
              </div>

              {/* SWIPE ACTION */}

              <div
                style={{
                  background:
                    "#f8fafc",
                  borderRadius:
                    "10px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: "600",
                    marginBottom:
                      "6px",
                  }}
                >
                  SWIPE ACTION
                </div>

                <div
                  style={{
                    color: "#334155",
                    fontSize: "14px",
                    fontWeight:
                      "600",
                  }}
                >
                  {getActionLabel(
                    selectedJob.swipe_action
                  )}
                </div>
              </div>

              {/* SWIPE DATE */}

              <div
                style={{
                  background:
                    "#f8fafc",
                  borderRadius:
                    "10px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: "600",
                    marginBottom:
                      "6px",
                  }}
                >
                  SWIPED ON
                </div>

                <div
                  style={{
                    color: "#334155",
                    fontSize: "14px",
                  }}
                >
                  {formatDate(
                    selectedJob.swiped_at
                  )}
                </div>
              </div>
            </div>

            {/* =================================================
                ABOUT THIS JOB
            ================================================= */}

            <div
              style={{
                marginBottom:
                  "24px",
              }}
            >
              <h3
                style={{
                  margin:
                    "0 0 10px",
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                About this Job
              </h3>

              <div
                style={{
                  color: "#475569",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  whiteSpace:
                    "pre-line",
                }}
              >
                {formatJobDescription(
                  selectedJob.description
                ).map(
                  (
                    line,
                    index
                  ) => (
                    <div
                      key={index}
                      style={{
                        marginBottom:
                          "6px",
                      }}
                    >
                      {line}
                    </div>
                  )
                )}

                {!selectedJob.description && (
                  <div>
                    Job description
                    not available.
                  </div>
                )}
              </div>
            </div>

            {/* =================================================
                REQUIRED SKILLS
            ================================================= */}

            {Array.isArray(
              selectedJob.required_skills
            ) &&
              selectedJob
                .required_skills
                .length > 0 && (
                <div>
                  <h3
                    style={{
                      margin:
                        "0 0 12px",
                      fontSize:
                        "18px",
                      fontWeight:
                        "700",
                      color:
                        "#111827",
                    }}
                  >
                    Required Skills
                  </h3>

                  <div
                    style={{
                      display:
                        "flex",
                      flexWrap:
                        "wrap",
                      gap: "8px",
                    }}
                  >
                    {selectedJob
                      .required_skills
                      .map(
                        (
                          skill,
                          index
                        ) => (
                          <span
                            key={
                              index
                            }
                            style={{
                              background:
                                "#eff6ff",
                              color:
                                "#1d4ed8",
                              padding:
                                "6px 10px",
                              borderRadius:
                                "7px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "600",
                            }}
                          >
                            {
                              skill
                            }
                          </span>
                        )
                      )}
                  </div>
                </div>
              )}

            {/* =================================================
                CLOSE
            ================================================= */}

            <div
              style={{
                marginTop:
                  "28px",
                textAlign:
                  "right",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setSelectedJob(null)
                }
                style={{
                  border: "none",
                  background:
                    "#2563eb",
                  color:
                    "#ffffff",
                  padding:
                    "11px 22px",
                  borderRadius:
                    "8px",
                  cursor:
                    "pointer",
                  fontSize:
                    "14px",
                  fontWeight:
                    "600",
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

export default SwipeHistory;