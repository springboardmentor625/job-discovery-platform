import { useLocation, useNavigate } from "react-router-dom";

function ApplicationSuccess() {
  const location = useLocation();

  const navigate = useNavigate();

  const job = location.state?.job;

  const applied = location.state?.applied;

  const saved = location.state?.saved;

  const favorite = location.state?.favorite;

  return (
    <div
      className="page application-success-page"
      style={{
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        padding: "40px 32px",
        background: "#f4f7fb",
      }}
    >
      <div
        className="application-success-wrapper"
        style={{
          width: "100%",
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        {/* =====================================================
            SUCCESS CARD
        ===================================================== */}

        <div
          className="application-success-card"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "#ffffff",
            border: "1px solid #e3e8ef",
            borderRadius: "16px",
            boxShadow: "0 8px 30px rgba(15, 23, 42, 0.08)",
            padding: "48px 56px",
          }}
        >
          {/* ===================================================
              HEADER
          =================================================== */}

          <div
            className="application-success-header"
            style={{
              textAlign: "center",
              marginBottom: "38px",
            }}
          >
            <p
              className="application-success-eyebrow"
              style={{
                margin: "0 0 10px",
                color: "#2563eb",
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "1.5px",
              }}
            >
              SWIPEX APPLICATION
            </p>

            <h1
              style={{
                margin: "0",
                color: "#172554",
                fontSize: "38px",
                fontWeight: "700",
                lineHeight: "1.2",
              }}
            >
              Job Action Completed
            </h1>

            {job && (
              <p
                className="application-success-subtitle"
                style={{
                  margin: "14px auto 0",
                  maxWidth: "720px",
                  color: "#64748b",
                  fontSize: "16px",
                  lineHeight: "1.6",
                }}
              >
                Your right swipe was recorded for{" "}

                <strong
                  style={{
                    color: "#1e293b",
                    fontWeight: "700",
                  }}
                >
                  {job.title}
                </strong>

                {" "}at{" "}

                <strong
                  style={{
                    color: "#1e293b",
                    fontWeight: "700",
                  }}
                >
                  {job.company}
                </strong>
                .
              </p>
            )}
          </div>

          {/* ===================================================
              ACTION STATUS
          =================================================== */}

          <div
            className="application-success-status"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              marginBottom: "28px",
            }}
          >
            {applied && (
              <div
                className="application-success-status-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  padding: "20px 22px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                }}
              >
                <div
                  className="application-success-status-icon"
                  style={{
                    width: "42px",
                    height: "42px",
                    minWidth: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    color: "#16a34a",
                    fontSize: "22px",
                    fontWeight: "700",
                  }}
                >
                  ✓
                </div>

                <div
                  className="application-success-status-content"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                  }}
                >
                  <strong
                    style={{
                      color: "#172033",
                      fontSize: "16px",
                      fontWeight: "700",
                    }}
                  >
                    Job application submitted
                  </strong>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                  >
                    Your application has been successfully recorded.
                  </span>
                </div>
              </div>
            )}

            {saved && (
              <div
                className="application-success-status-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  padding: "20px 22px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                }}
              >
                <div
                  className="application-success-status-icon saved"
                  style={{
                    width: "42px",
                    height: "42px",
                    minWidth: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: "#eff6ff",
                    color: "#2563eb",
                    fontSize: "20px",
                    fontWeight: "700",
                  }}
                >
                  ★
                </div>

                <div
                  className="application-success-status-content"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                  }}
                >
                  <strong
                    style={{
                      color: "#172033",
                      fontSize: "16px",
                      fontWeight: "700",
                    }}
                  >
                    Job saved
                  </strong>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                  >
                    This opportunity has been saved to your jobs.
                  </span>
                </div>
              </div>
            )}

            {favorite && (
              <div
                className="application-success-status-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  padding: "20px 22px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                }}
              >
                <div
                  className="application-success-status-icon favorite"
                  style={{
                    width: "42px",
                    height: "42px",
                    minWidth: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: "20px",
                    fontWeight: "700",
                  }}
                >
                  ♥
                </div>

                <div
                  className="application-success-status-content"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                  }}
                >
                  <strong
                    style={{
                      color: "#172033",
                      fontSize: "16px",
                      fontWeight: "700",
                    }}
                  >
                    Added to favorites
                  </strong>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                  >
                    You can easily find this opportunity again.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ===================================================
              EXPLANATION
          =================================================== */}

          <div
            className="application-success-info"
            style={{
              padding: "22px 24px",
              background: "#eff6ff",
              border: "1px solid #dbeafe",
              borderRadius: "12px",
              marginBottom: "30px",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#1e40af",
                fontSize: "16px",
                fontWeight: "700",
              }}
            >
              Your interest has been recorded
            </strong>
          </div>

          {/* ===================================================
              CONTINUE
          =================================================== */}

          <div
            className="application-success-footer"
            style={{
              marginTop: "0",
            }}
          >
            <button
              type="button"
              className="application-success-button"
              onClick={() =>
                navigate("/recommended-jobs")
              }
              style={{
                width: "100%",
                minHeight: "58px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
                border: "none",
                borderRadius: "10px",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.22)",
              }}
            >
              <span>
                View More Recommended Jobs
              </span>

              <span
                className="application-success-button-arrow"
                style={{
                  fontSize: "20px",
                  fontWeight: "400",
                }}
              >
                →
              </span>
            </button>
          </div>

          {/* ===================================================
              SECURITY / INFO NOTE
          =================================================== */}

          <p
            className="application-success-note"
            style={{
              margin: "22px 0 0",
              paddingTop: "20px",
              borderTop: "1px solid #e5e7eb",
              textAlign: "center",
              color: "#64748b",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            SwipeX will continue to personalize your
            job recommendations based on your interests.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ApplicationSuccess;
