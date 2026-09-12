
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

// ---------------------------------------------------------
// PAGES
// ---------------------------------------------------------

import Start from "./pages/Start";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CompleteProfile from "./pages/CompleteProfile";

import UploadResume from "./pages/UploadResume";
import ResumeParsing from "./pages/ResumeParsing";
import ResumeAnalysis from "./pages/ResumeAnalysis";

import ATSAnalysis from "./pages/ATSAnalysis";

import RecommendedJobs from "./pages/RecommendedJobs";
import SwipeJobs from "./pages/SwipeJobs";

import SavedJobs from "./pages/SavedJobs";

import ApplicationSuccess from "./pages/ApplicationSuccess";

import CandidateDashboard from "./pages/CandidateDashboard";

import MyApplications from "./pages/MyApplications";


// =========================================================
// LOGOUT BUTTON
// =========================================================

function LogoutButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const publicPages = [
    "/",
    "/register",
    "/login",
    "/dashboard",
  ];

  const isLoggedIn =
    !!localStorage.getItem("access_token");

  const isPublicPage =
    publicPages.includes(location.pathname);

  // Do not show logout button on Start, Register,
  // Login or Dashboard.
  // Dashboard has its own sidebar Logout button.
  if (!isLoggedIn || isPublicPage) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("resume_id");

    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        position: "fixed",
        top: "20px",
        right: "25px",
        zIndex: 9999,
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: "#dc3545",
        color: "white",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow:
          "0 2px 8px rgba(0, 0, 0, 0.15)",
      }}
    >
      Logout
    </button>
  );
}


// =========================================================
// APP
// =========================================================

function App() {
  return (
    <>
      {/* Global Logout Button */}
      <LogoutButton />

      <Routes>

        {/* =================================================
            START
        ================================================= */}

        <Route
          path="/"
          element={<Start />}
        />


        {/* =================================================
            AUTHENTICATION
        ================================================= */}

        {/* Register */}

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Login */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* =================================================
            CANDIDATE DASHBOARD
        ================================================= */}

        <Route
          path="/dashboard"
          element={<CandidateDashboard />}
        />


        {/* =================================================
            CANDIDATE PROFILE
        ================================================= */}

        <Route
          path="/complete-profile"
          element={<CompleteProfile />}
        />


        {/* =================================================
            RESUME WORKFLOW
        ================================================= */}

        {/* Upload Resume */}

        <Route
          path="/upload-resume"
          element={<UploadResume />}
        />

        {/* AI Resume Parsing */}

        <Route
          path="/resume-parsing"
          element={<ResumeParsing />}
        />

        {/* Resume Analysis */}

        <Route
          path="/resume-analysis"
          element={<ResumeAnalysis />}
        />


        {/* =================================================
            ATS WORKFLOW
        ================================================= */}

        <Route
          path="/ats-analysis"
          element={<ATSAnalysis />}
        />


        {/* =================================================
            AI RECOMMENDATION WORKFLOW
        ================================================= */}

        {/* AI Recommended Jobs */}

        <Route
          path="/recommended-jobs"
          element={<RecommendedJobs />}
        />


        {/* =================================================
            SWIPE-BASED JOB DISCOVERY
        ================================================= */}

        <Route
          path="/swipe-jobs"
          element={<SwipeJobs />}
        />


        {/* =================================================
            SAVED JOBS
        ================================================= */}

        <Route
          path="/saved-jobs"
          element={<SavedJobs />}
        />


        {/* =================================================
            APPLICATIONS
        ================================================= */}

        {/* My Applications */}

        <Route
          path="/applications"
          element={<MyApplications />}
        />


        {/* =================================================
            APPLICATION WORKFLOW
        ================================================= */}

        {/* Right Swipe → Apply */}

        <Route
          path="/application-success"
          element={<ApplicationSuccess />}
        />

      </Routes>
    </>
  );
}


export default App;
