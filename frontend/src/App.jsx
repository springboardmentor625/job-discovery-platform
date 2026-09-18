import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import CandidateDashboard from "./pages/CandidateDashboard";
import Resume from "./pages/Resume";
import Discover from "./pages/Discover";
import SavedJobs from "./pages/SavedJobs";
import AIRecommendations from "./pages/AIRecommendations";
import Settings from "./pages/Settings";
import ProfileSettings from "./components/settings/ProfileSettings";
import SwipeHistory from "./components/settings/SwipeHistory";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* ==========================================
            CANDIDATE AREA — persistent sidebar layout,
            gated behind ProtectedRoute so an unauthenticated
            visit redirects to /login immediately instead of
            rendering the shell and waiting on a 401.
        =========================================== */}

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/candidate" element={<CandidateDashboard />} />
          <Route path="/candidate/jobs" element={<Discover />} />
          <Route path="/candidate/saved-jobs" element={<SavedJobs />} />
          <Route path="/candidate/settings" element={<Settings />} />
          <Route path="/candidate/settings/profile" element={<ProfileSettings />} />
          <Route path="/candidate/settings/history" element={<SwipeHistory />} />
          <Route path="/candidate/resume" element={<Resume />} />
          <Route
            path="/candidate/ai-recommendations"
            element={<AIRecommendations />}
          />
        </Route>

        {/* Catch-all — previously missing, so any unmatched URL
            rendered a blank page instead of a real 404. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
