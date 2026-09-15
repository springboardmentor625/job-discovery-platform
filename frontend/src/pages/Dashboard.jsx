import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import RecruiterDashboard from "./recruiter/RecruiterDashboard";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck
} from "lucide-react";

function CandidateDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completion, setCompletion] = useState({
    percentage: 0,
    completed_fields: [],
    missing_fields: [],
    has_resume: false,
    has_profile: false,
  });
  const [loadingCompletion, setLoadingCompletion] = useState(true);

  useEffect(() => {
    fetchCompletion();
  }, []);

  const fetchCompletion = async () => {
    try {
      setLoadingCompletion(true);
      const res = await api.get("/candidate-profile/completion");
      setCompletion(res.data);
    } catch (err) {
      console.error("Failed to fetch profile completion:", err);
    } finally {
      setLoadingCompletion(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Candidate Dashboard
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
            </h1>
            <p className="mt-2 text-slate-400 text-sm md:text-base max-w-2xl">
              Here is your career command center. Discover opportunities, track recommendations, and optimize your profile.
            </p>
          </div>

          <button
            onClick={() => navigate("/jobs")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Start Swiping Jobs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Dynamic Profile Completion Widget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Profile Completion</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  A complete profile unlocks higher quality AI job matches and better recruiter response rates.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-blue-400">
                {completion.percentage}%
              </span>
              <button
                onClick={() => navigate("/profile")}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-800 mb-4">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>

          {/* Missing Checklist Items */}
          {completion.missing_fields && completion.missing_fields.length > 0 ? (
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Recommended Actions to Reach 100%:
              </p>
              <div className="flex flex-wrap gap-2">
                {completion.missing_fields.map((field, idx) => (
                  <span
                    key={idx}
                    onClick={() => navigate(field.includes("resume") ? "/resumes" : "/profile")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {field} →
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium pt-2">
              <CheckCircle2 className="w-4 h-4" />
              Awesome job! Your profile is 100% complete.
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "recruiter") {
    return <RecruiterDashboard />;
  }

  return <CandidateDashboard />;
}

export default Dashboard;
