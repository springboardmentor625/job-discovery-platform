
import { useNavigate, useLocation } from "react-router-dom";

import { useEffect, useState } from "react";

import api from "../api/api";


function CandidateDashboard() {

  const navigate = useNavigate();

  const location = useLocation();


  // =========================================================
  // DASHBOARD DATA
  // =========================================================

  const [email, setEmail] = useState("");

  const [resumeStatus, setResumeStatus] = useState("Loading...");

  const [applicationsCount, setApplicationsCount] = useState(0);

  const [savedJobsCount, setSavedJobsCount] = useState(0);


  // =========================================================
  // LOAD OVERVIEW DATA
  // =========================================================

  useEffect(() => {

    const loadDashboardData = async () => {

      try {

        const [
          userResponse,
          resumeResponse,
          applicationsResponse,
          savedJobsResponse,
        ] = await Promise.all([

          api.get("/api/auth/me"),

          api.get("/api/resumes/me"),

          api.get("/api/applications"),

          api.get("/api/swipes/saved"),

        ]);


        // EMAIL

        setEmail(
          userResponse.data?.email || ""
        );


        // RESUME STATUS

        const resumes =
          Array.isArray(resumeResponse.data)

            ? resumeResponse.data

            : Array.isArray(
                resumeResponse.data?.resumes
              )

            ? resumeResponse.data.resumes

            : resumeResponse.data

            ? [resumeResponse.data]

            : [];


        if (resumes.length > 0) {

          const latestResume =
            resumes.reduce(
              (latest, current) => {

                const latestDate =
                  new Date(
                    latest?.updated_at ||
                      latest?.uploaded_at ||
                      latest?.created_at ||
                      0
                  ).getTime();


                const currentDate =
                  new Date(
                    current?.updated_at ||
                      current?.uploaded_at ||
                      current?.created_at ||
                      0
                  ).getTime();


                return currentDate > latestDate
                  ? current
                  : latest;

              },
              resumes[0]
            );


          const resumeDate =
            latestResume?.updated_at ||
            latestResume?.uploaded_at ||
            latestResume?.created_at;


          if (resumeDate) {

            const formattedDate =
              new Date(
                resumeDate
              ).toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              );


            setResumeStatus(
              `Last updated — ${formattedDate}`
            );

          } else {

            setResumeStatus("Uploaded");

          }

        } else {

          setResumeStatus("Not uploaded");

        }


        // APPLICATIONS

        const applications =
          Array.isArray(
            applicationsResponse.data
          )

            ? applicationsResponse.data

            : Array.isArray(
                applicationsResponse.data?.applications
              )

            ? applicationsResponse.data.applications

            : [];


        setApplicationsCount(
          applications.length
        );


        // SAVED JOBS

        const savedJobs =
          Array.isArray(
            savedJobsResponse.data
          )

            ? savedJobsResponse.data

            : Array.isArray(
                savedJobsResponse.data?.jobs
              )

            ? savedJobsResponse.data.jobs

            : Array.isArray(
                savedJobsResponse.data?.saved_jobs
              )

            ? savedJobsResponse.data.saved_jobs

            : [];


        setSavedJobsCount(
          savedJobs.length
        );


      } catch (error) {

        console.error(
          "Failed to load dashboard data:",
          error
        );


        setEmail("");

        setResumeStatus(
          "Unable to load"
        );

        setApplicationsCount(0);

        setSavedJobsCount(0);

      }

    };


    loadDashboardData();

  }, []);


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {

    const confirmed =
      window.confirm(
        "Are you sure you want to logout?"
      );


    if (!confirmed) {

      return;

    }


    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "token_type"
    );

    localStorage.removeItem(
      "resume_id"
    );


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

    const isActive =
      location.pathname === path;


    return (

      <button

        type="button"

        onClick={() =>
          handleNavigation(path)
        }

        style={{

          width: "100%",

          display: "flex",

          alignItems: "center",

          padding: "11px 14px",

          marginBottom: "4px",

          border: "none",

          borderRadius: "8px",

          backgroundColor:
            isActive
              ? "#eef2ff"
              : "transparent",

          color:
            isActive
              ? "#4f46e5"
              : "#374151",

          fontSize: "14px",

          fontWeight:
            isActive
              ? "600"
              : "500",

          textAlign: "left",

          cursor: "pointer",

          transition:
            "all 0.2s ease",

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

          borderRight:
            "1px solid #e5e7eb",

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

            padding:
              "4px 10px 28px",

            borderBottom:
              "1px solid #f1f5f9",

            marginBottom: "22px",

          }}

        >

          <div

            style={{

              fontSize: "24px",

              fontWeight: "800",

              color: "#111827",

              letterSpacing:
                "-0.5px",

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

              letterSpacing:
                "0.8px",

            }}

          >

            JOB DISCOVERY

          </div>


          <SidebarItem

            label="AI Recommended Jobs"

            path="/recommended-jobs"

          />


          <SidebarItem

            label="Saved Jobs"

            path="/saved-jobs"

          />


          {/* SWIPE HISTORY */}

          <SidebarItem

            label="Swipe History"

            path="/swipe-history"

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

              letterSpacing:
                "0.8px",

            }}

          >

            APPLICATIONS

          </div>


          <SidebarItem

            label="My Applications"

            path="/applications"

          />


          {/* RESUME */}


          <div

            style={{

              marginTop: "24px",

              marginBottom: "8px",

              padding: "0 10px",

              fontSize: "11px",

              fontWeight: "700",

              color: "#9ca3af",

              letterSpacing:
                "0.8px",

            }}

          >

            RESUME

          </div>


          <SidebarItem

            label="Upload Resume"

            path="/upload-resume"

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

              letterSpacing:
                "0.8px",

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

            borderTop:
              "1px solid #f1f5f9",

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

              backgroundColor:
                "#fff1f2",

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

          width:
            "calc(100% - 245px)",

          minHeight: "100vh",

          padding: "42px 44px",

          boxSizing: "border-box",

        }}

      >


        {/* HEADER */}


        <div

          style={{

            marginBottom: "32px",

            position: "relative",

          }}

        >

          <div

            style={{

              fontSize: "13px",

              color: "#6b7280",

              marginBottom: "7px",

            }}

          >

            &#x20;

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

            Welcome to SwipeX!

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


          {/* EMAIL */}


          {email && (

            <div

              style={{

                position: "absolute",

                top: "0",

                right: "0",

                fontSize: "20px",

                color: "#374151",

                fontWeight: "500",

              }}

            >

              {email}

            </div>

          )}


        </div>


        {/* ===================================================
            OVERVIEW CARDS
        ===================================================== */}


        <div

          style={{

            display: "grid",

            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",

            gap: "18px",

            marginBottom: "30px",

          }}

        >


          {/* RESUME STATUS */}


          <div

            style={{

              backgroundColor: "#ffffff",

              border:
                "1px solid #e5e7eb",

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

              Resume Status

            </div>


            <div

              style={{

                fontSize: "21px",

                fontWeight: "700",

                color: "#111827",

                lineHeight: "1.4",

              }}

            >

              {resumeStatus}

            </div>

          </div>


          {/* APPLICATIONS */}


          <div

            style={{

              backgroundColor: "#ffffff",

              border:
                "1px solid #e5e7eb",

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

              Applications

            </div>


            <div

            style={{

                fontSize: "25px",

                fontWeight: "700",

                color: "#111827",

              }}

            >

              {applicationsCount}

            </div>

          </div>


          {/* SAVED JOBS */}


          <div

            style={{

              backgroundColor: "#ffffff",

              border:
                "1px solid #e5e7eb",

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

              {savedJobsCount}

            </div>

          </div>


        </div>


        {/* ===================================================
            QUICK ACTIONS
        ===================================================== */}


        <section

          style={{

            backgroundColor: "#ffffff",

            border:
              "1px solid #e5e7eb",

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

            

          </p>


          <div

            style={{

              display: "grid",

              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",

              gap: "16px",

            }}

          >


            <button

              type="button"

              onClick={() =>
                navigate(
                  "/recommended-jobs"
                )
              }

              style={{

                padding: "16px",

                border:
                  "1px solid #e5e7eb",

                borderRadius: "9px",

                backgroundColor:
                  "#ffffff",

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
                navigate(
                  "/upload-resume"
                )
              }

              style={{

                padding: "16px",

                border:
                  "1px solid #e5e7eb",

                borderRadius: "9px",

                backgroundColor:
                  "#ffffff",

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
        ===================================================== */}


        <div

          style={{

            marginTop: "24px",

            padding: "18px 20px",

            backgroundColor: "#f8fafc",

            border:
              "1px solid #e5e7eb",

            borderRadius: "10px",

            fontSize: "13px",

            color: "#6b7280",

            lineHeight: "1.6",

          }}

        >

          &#x20;

        </div>


      </main>


    </div>

  );

}


export default CandidateDashboard;
