// 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

// Components
import Navbar from './components/layout/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register'; 
import ProfileBuilder from './pages/ProfileBuilder';
import CandidateDashboard from './pages/CandidateDashboard'; // <-- THE REAL SWIPE DECK
import TrackingHistory from './pages/TrackingHistory';
import RecruiterDashboard from './pages/RecruiterDashboard';

// A protective wrapper that forces users to log in
const ProtectedRoute = ({ children, allowedRole }) => {
    const { user } = useContext(AuthContext);
    
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRole && user.role !== allowedRole) return <Navigate to="/login" replace />;
    
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
                    <Navbar />
                    
                    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/" element={<Navigate to="/login" replace />} />

                            {/* Candidate Routes */}
                            <Route path="/profile" element={
                                <ProtectedRoute allowedRole="candidate"><ProfileBuilder /></ProtectedRoute>
                            } />
                            
                            {/* THE FIX: Pointing /swipe back to the Animated Dashboard */}
                            <Route path="/swipe" element={
                                <ProtectedRoute allowedRole="candidate"><CandidateDashboard /></ProtectedRoute>
                            } />
                            
                            <Route path="/history" element={
                                <ProtectedRoute allowedRole="candidate"><TrackingHistory /></ProtectedRoute>
                            } />

                            {/* Recruiter Routes */}
                            <Route path="/recruiter" element={
                                <ProtectedRoute allowedRole="recruiter"><RecruiterDashboard /></ProtectedRoute>
                            } />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;