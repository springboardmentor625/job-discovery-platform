import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import ApplyJob from "./pages/ApplyJob";
import Resumes from "./pages/Resumes";
import Applications from "./pages/Applications";
import Companies from "./pages/Companies";
import InterestedJobs from "./pages/InterestedJobs";
import Notifications from "./pages/Notifications";
import Recommendations from "./pages/Recommendations";
import SwipeHistory from "./pages/SwipeHistory";
import JobDetails from "./pages/JobDetails";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";

// Recruiter Pages
import ManageJobs from "./pages/recruiter/ManageJobs";
import PostJob from "./pages/recruiter/PostJob";
import RecruiterApplications from "./pages/recruiter/RecruiterApplications";

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/companies" element={<Companies />} />

            {/* Shared Authenticated Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:jobId"
              element={
                <ProtectedRoute>
                  <JobDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Candidate-Only Routes */}
            <Route
              path="/jobs"
              element={
                <ProtectedRoute allowedRoles={["candidate"]}>
                  <Jobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/apply/:jobId"
              element={
                <ProtectedRoute allowedRoles={["candidate"]}>
                  <ApplyJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resumes"
              element={
                <ProtectedRoute allowedRoles={["candidate"]}>
                  <Resumes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute allowedRoles={["candidate"]}>
                  <Applications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interested-jobs"
              element={
                <ProtectedRoute allowedRoles={["candidate"]}>
                  <InterestedJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute allowedRoles={["candidate"]}>
                  <Recommendations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/swipe-history"
              element={
                <ProtectedRoute allowedRoles={["candidate"]}>
                  <SwipeHistory />
                </ProtectedRoute>
              }
            />

            {/* Recruiter-Only Routes */}
            <Route
              path="/recruiter/jobs"
              element={
                <ProtectedRoute allowedRoles={["recruiter"]}>
                  <ManageJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/post-job"
              element={
                <ProtectedRoute allowedRoles={["recruiter"]}>
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/applications"
              element={
                <ProtectedRoute allowedRoles={["recruiter"]}>
                  <RecruiterApplications />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;