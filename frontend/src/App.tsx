import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import { LandingPage } from './pages/public/LandingPage';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { JobSeekerLayout } from './components/layout/JobSeekerLayout';
import { SwipeDeck } from './components/jobs/SwipeDeck';
import { Dashboard as JobSeekerDashboard } from './pages/job-seeker/Dashboard';
import { SavedJobs } from './pages/job-seeker/SavedJobs';
import { ProfilePage } from './pages/job-seeker/Profile';
import { Applications } from './pages/job-seeker/Applications';
import { Resumes } from './pages/job-seeker/Resumes';

import { RecruiterLayout } from './components/layout/RecruiterLayout';
import { RecruiterDashboard } from './pages/recruiter/Dashboard';
import { Company } from './pages/recruiter/Company';
import { Jobs } from './pages/recruiter/Jobs';
import { PostJob } from './pages/recruiter/PostJob';
import { Applicants } from './pages/recruiter/Applicants';

// ─── Loading Spinner ──────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      <p className="text-slate-500 font-medium text-sm">Loading SwipeX…</p>
    </div>
  </div>
);

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the correct dashboard for their role
    return <Navigate to={user.role === 'Recruiter' ? '/recruiter/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

// ─── Routes ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Job Seeker */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['JobSeeker']}>
            <JobSeekerLayout>
              <JobSeekerDashboard />
            </JobSeekerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/discover"
        element={
          <ProtectedRoute allowedRoles={['JobSeeker']}>
            <JobSeekerLayout>
              <SwipeDeck />
            </JobSeekerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved"
        element={
          <ProtectedRoute allowedRoles={['JobSeeker']}>
            <JobSeekerLayout>
              <SavedJobs />
            </JobSeekerLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['JobSeeker']}>
            <JobSeekerLayout>
              <ProfilePage />
            </JobSeekerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <ProtectedRoute allowedRoles={['JobSeeker']}>
            <JobSeekerLayout>
              <Applications />
            </JobSeekerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes"
        element={
          <ProtectedRoute allowedRoles={['JobSeeker']}>
            <JobSeekerLayout>
              <Resumes />
            </JobSeekerLayout>
          </ProtectedRoute>
        }
      />

      {/* Recruiter */}
      <Route
        path="/recruiter/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Recruiter']}>
            <RecruiterLayout>
              <RecruiterDashboard />
            </RecruiterLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/company"
        element={
          <ProtectedRoute allowedRoles={['Recruiter']}>
            <RecruiterLayout>
              <Company />
            </RecruiterLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/jobs"
        element={
          <ProtectedRoute allowedRoles={['Recruiter']}>
            <RecruiterLayout>
              <Jobs />
            </RecruiterLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/post-job"
        element={
          <ProtectedRoute allowedRoles={['Recruiter']}>
            <RecruiterLayout>
              <PostJob />
            </RecruiterLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/applicants"
        element={
          <ProtectedRoute allowedRoles={['Recruiter']}>
            <RecruiterLayout>
              <Applicants />
            </RecruiterLayout>
          </ProtectedRoute>
        }
      />
      {/* End Recruiter */}

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
