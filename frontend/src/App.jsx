import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Discover from './pages/Discover';
import SavedJobs from './pages/SavedJobs';
import Applications from './pages/Applications';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Recruiter from './pages/Recruiter';
import Admin from './pages/Admin';
import Notifications from './pages/Notifications';
import AtsWorkflow from './pages/AtsWorkflow';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/discover" element={<Discover />} />
        <Route path="/ats-workflow" element={<AtsWorkflow />} />
        <Route path="/saved" element={<SavedJobs />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/recruiter" element={<Recruiter />} />
        <Route path="/admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
