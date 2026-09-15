import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Resume from "./pages/Resume";
import Recommendations from "./pages/Recommendations";
import SwipeHistory from "./pages/SwipeHistory";
import ExploreJobs from "./pages/ExploreJobs";
import Applications from "./pages/Applications";
import ProtectedRoute from "./pages/ProtectedRoute";
import Layout from "./components/Layout";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            background: "#1e293b",
            color: "#fff",
            fontSize: "13px",
            fontWeight: "500",
          },
        }}
      />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED ROUTES */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Main Navigation Pages */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/swipe-history" element={<SwipeHistory />} />
          <Route path="/explore" element={<ExploreJobs />} />

          {/* Backward Compatibility & Route Aliases */}
          <Route path="/jobs" element={<Navigate to="/explore" replace />} />
          <Route path="/dashboard" element={<Navigate to="/recommendations" replace />} />
          <Route path="/view-profile" element={<Navigate to="/profile" replace />} />
          <Route path="/create-profile" element={<Navigate to="/profile" replace />} />
          <Route path="/edit-profile" element={<Navigate to="/profile" replace />} />
          <Route path="/applications" element={<Applications />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
