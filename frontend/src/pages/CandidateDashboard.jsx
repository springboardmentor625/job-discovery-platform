import { useNavigate, useLocation } from "react-router-dom";

function CandidateDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("resume_id");

    navigate("/");
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  const handleNavigation = (path) => {
    navigate(path);
  };

  // =========================================================
  // SIDEBAR ITEM
  // =========================================================

  const SidebarItem = ({
    label,
    path,
  }) => {
    const isActive = location.pathname === path;

    return (
      <button
        type="button"
        onClick={() => handleNavigation(path)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          padding: "11px 14px",
          marginBottom: "4px",
          border: "none",
          borderRadius: "8px",
          backgroundColor: isActive
            ? "#eef2ff"
            : "transparent",
          color: isActive
            ? "#4f46e5"
            : "#374151",
          fontSize: "14px",
          fontWeight: isActive ? "600" : "500",
          textAlign: "left",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(event) => {
          if (!isActive) {
            event.currentTarget.style.backgroundColor =
              "#f3f4f6";
          }
        }}
        onMouseLeave={(event) => {
          if (!isActive) {
            event.currentTarget.style.backgroundColor =
              "transparent";
          }
        }}
      >
        {label}
      </button>
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "#f8fafc",
        color: "#111827",
      }}
    >

      {/* =====================================================
          LEFT SIDEBAR
      ===================================================== */}

      <aside
        style={{
          width: "245px",
          minHeight: "100vh",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          padding: "24px 16px",
          boxSizing: "border-box",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >

        {/* BRAND */}

        <div
          style={{
            padding: "4px 10px 28px",
            borderBottom: "1px solid #f1f5f9",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#111827",
              letterSpacing: "-0.5px",
            }}
          >
            SwipeX
          </div>

          <div
            style={{
              marginTop: "5px",
              fontSize: "12px",
              color: "#6b7280",
            }}
          >
            Candidate Portal
          </div>
        </div>


        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <nav
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >

          {/* DASHBOARD */}

          <SidebarItem
            label="Dashboard"
            path="/dashboard"
          />


          {/* JOB DISCOVERY */}

          <div
            style={{
              marginTop: "24px",
              marginBottom: "8px",
              padding: "0 10px",
              fontSize: "11px",
              fontWeight: "700",
              color: "#9ca3af",
              letterSpacing: "0.8px",
            }}
          >
            JOB DISCOVERY
          </div>

          <SidebarItem
            label="AI Recommended Jobs"
            path="/recommended-jobs"
          />

          <SidebarItem
            label="Swipe Jobs"
            path="/swipe-jobs"
          />

          <SidebarItem
            label="Saved Jobs"
            path="/saved-jobs"
          />


          {/* APPLICATIONS */}

          <div
            style={{
              marginTop: "24px",
              marginBottom: "8px",
              padding: "0 10px",
              fontSize: "11px",
              fontWeight: "700",
              color: "#9ca3af",
              letterSpacing: "0.8px",
            }}
          >
            APPLICATIONS
          </div>

          <SidebarItem
            label="My Applications"
            path="/applications"
          />


          {/* RESUME & AI */}

          <div
            style={{
              marginTop: "24px",
              marginBottom: "8px",
              padding: "0 10px",
              fontSize: "11px",
              fontWeight: "700",
              color: "#9ca3af",
              letterSpacing: "0.8px",
            }}
          >
            RESUME
          </div>

          <SidebarItem
            label="Upload Resume"
            path="/upload-resume"
          />

          <SidebarItem
            label="Resume Analysis"
            path="/resume-analysis"
          />

          <SidebarItem
            label="ATS Analysis"
            path="/ats-analysis"
          />


          {/* PROFILE */}

          <div
            style={{
              marginTop: "24px",
              marginBottom: "8px",
              padding: "0 10px",
              fontSize: "11px",
              fontWeight: "700",
              color: "#9ca3af",
              letterSpacing: "0.8px",
            }}
          >
            PROFILE
          </div>

          <SidebarItem
            label="Profile"
            path="/complete-profile"
          />

        </nav>


        {/* ===================================================
            LOGOUT
        =================================================== */}

        <div
          style={{
            paddingTop: "16px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "11px 14px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#fff1f2",
              color: "#dc2626",
              fontSize: "14px",
              fontWeight: "600",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

      </aside>


      {/* =====================================================
          MAIN DASHBOARD
      ===================================================== */}

      <main
        style={{
          marginLeft: "245px",
          width: "calc(100% - 245px)",
          minHeight: "100vh",
          padding: "42px 44px",
          boxSizing: "border-box",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "7px",
            }}
          >
           
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              lineHeight: "1.2",
              fontWeight: "700",
              color: "#111827",
            }}
          >
            Welcome to SwipeX
          </h1>

          <p
            style={{
              marginTop: "9px",
              marginBottom: 0,
              fontSize: "15px",
              color: "#6b7280",
            }}
          >
            Manage your profile, resume and job search from one place.
          </p>
        </div>


        {/* ===================================================
            OVERVIEW CARDS
        =================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "18px",
            marginBottom: "30px",
          }}
        >

          {/* RECOMMENDED JOBS */}

          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "10px",
              }}
            >
              AI Recommended Jobs
            </div>

            <div
              style={{
                fontSize: "25px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Explore
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/recommended-jobs")
              }
              style={{
                marginTop: "14px",
                border: "none",
                background: "none",
                padding: 0,
                color: "#4f46e5",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              View recommendations →
            </button>
          </div>


          {/* SAVED JOBS */}

          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "10px",
              }}
            >
              Saved Jobs
            </div>

            <div
              style={{
                fontSize: "25px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Saved
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/saved-jobs")
              }
              style={{
                marginTop: "14px",
                border: "none",
                background: "none",
                padding: 0,
                color: "#4f46e5",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              View saved jobs →
            </button>
          </div>


          {/* RESUME */}

          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "10px",
              }}
            >
              Resume
            </div>

            <div
              style={{
                fontSize: "25px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Manage
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/resume-analysis")
              }
              style={{
                marginTop: "14px",
                border: "none",
                background: "none",
                padding: 0,
                color: "#4f46e5",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              View resume analysis →
            </button>
          </div>


          {/* ATS */}

          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "10px",
              }}
            >
              ATS Analysis
            </div>

            <div
              style={{
                fontSize: "25px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Analyze
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/ats-analysis")
              }
              style={{
                marginTop: "14px",
                border: "none",
                background: "none",
                padding: 0,
                color: "#4f46e5",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Open ATS analysis →
            </button>
          </div>

        </div>


        {/* ===================================================
            QUICK ACTIONS
        =================================================== */}

        <section
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "26px",
          }}
        >

          <h2
            style={{
              margin: 0,
              fontSize: "19px",
              fontWeight: "700",
              color: "#111827",
            }}
          >
            Quick Actions
          </h2>

          <p
            style={{
              marginTop: "7px",
              marginBottom: "22px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            Continue your job search from here.
          </p>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "16px",
            }}
          >

            <button
              type="button"
              onClick={() =>
                navigate("/recommended-jobs")
              }
              style={{
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "9px",
                backgroundColor: "#ffffff",
                color: "#111827",
                fontSize: "14px",
                fontWeight: "600",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              AI Recommended Jobs
              <div
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  fontWeight: "400",
                  color: "#6b7280",
                }}
              >
                Explore jobs matched to your profile.
              </div>
            </button>


            <button
              type="button"
              onClick={() =>
                navigate("/swipe-jobs")
              }
              style={{
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "9px",
                backgroundColor: "#ffffff",
                color: "#111827",
                fontSize: "14px",
                fontWeight: "600",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              Swipe Jobs
              <div
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  fontWeight: "400",
                  color: "#6b7280",
                }}
              >
                Discover jobs through swipe-based matching.
              </div>
            </button>


            <button
              type="button"
              onClick={() =>
                navigate("/upload-resume")
              }
              style={{
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "9px",
                backgroundColor: "#ffffff",
                color: "#111827",
                fontSize: "14px",
                fontWeight: "600",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              Upload Resume
              <div
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  fontWeight: "400",
                  color: "#6b7280",
                }}
              >
                Upload or update your resume.
              </div>
            </button>

          </div>

        </section>


        {/* ===================================================
            INFORMATION
        =================================================== */}

         <div
          style={{
            marginTop: "24px",
            padding: "18px 20px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            fontSize: "13px",
            color: "#6b7280",
            lineHeight: "1.6",
          }}
        >
          
        </div>

      </main>

    </div>
  );
}

export default CandidateDashboard;