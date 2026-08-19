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

      {}
      <Route
        path="/"
        element={<Start />}
      />

      {}
      <Route
        path="/register"
        element={<Register />}
      />

      {}
      <Route
        path="/login"
        element={<Login />}
      />

      {}
      <Route
        path="/complete-profile"
        element={<CompleteProfile />}
      />

      {}
      <Route
        path="/upload-resume"
        element={<UploadResume />}
      />

      {}
      <Route
        path="/resume-parsing"
        element={<ResumeParsing />}
      />

      {}
      <Route
        path="/resume-analysis"
        element={<ResumeAnalysis />}
      />

      {}
      <Route
        path="/ats-analysis"
        element={<ATSAnalysis />}
      />

      {}
      <Route
        path="/recommended-jobs"
        element={<RecommendedJobs />}
      />

      {}
      <Route
        path="/swipe-jobs"
        element={<SwipeJobs />}
      />

      {}
      <Route
        path="/saved-jobs"
        element={<SavedJobs />}
      />

      {}
      <Route
        path="/application-success"
        element={<ApplicationSuccess />}
      />

    </Routes>
  );
}

export default App;
