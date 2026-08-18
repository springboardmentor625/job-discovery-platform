import { Routes, Route } from "react-router-dom";

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

function App() {
  return (
    <Routes>

      {/* Start */}
      <Route
        path="/"
        element={<Start />}
      />

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

      {/* Complete Profile */}
      <Route
        path="/complete-profile"
        element={<CompleteProfile />}
      />

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

      {/* Extracted Skills & Experience */}
      <Route
        path="/resume-analysis"
        element={<ResumeAnalysis />}
      />

      {/* ATS Analysis */}
      <Route
        path="/ats-analysis"
        element={<ATSAnalysis />}
      />

      {/* Recommended Jobs */}
      <Route
        path="/recommended-jobs"
        element={<RecommendedJobs />}
      />

      {/* Swipe Jobs */}
      <Route
        path="/swipe-jobs"
        element={<SwipeJobs />}
      />

      {/* Saved Jobs */}
      <Route
        path="/saved-jobs"
        element={<SavedJobs />}
      />

      {/* Right Swipe → Apply + Save + Favorite */}
      <Route
        path="/application-success"
        element={<ApplicationSuccess />}
      />

    </Routes>
  );
}

export default App;