import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  Briefcase,
  FileText,
  Building,
  Star,
  BarChart3,
  Sparkles,
  Bell,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  UserCheck
} from "lucide-react";

function Dashboard() {
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
    fetchProfileCompletion();
  }, []);

  const fetchProfileCompletion = async () => {
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

  const navCards = [
    {
      title: "Discover Jobs",
      description: "Swipe through personalized job matches tailored to your skills.",
      icon: Briefcase,
      path: "/jobs",
      gradient: "from-blue-600 to-indigo-600",
      badge: "Smart Match",
    },
    {
      title: "AI Recommendations",
      description: "Explore algorithmically scored roles with clear match reasons.",
      icon: Sparkles,
      path: "/recommendations",
      gradient: "from-purple-600 to-pink-600",
      badge: "AI Powered",
    },
    {
      title: "My Applications",
      description: "Track the real-time status of all your submitted job applications.",
      icon: CheckCircle2,
      path: "/applications",
      gradient: "from-emerald-600 to-teal-600",
    },
    {
      title: "My Resume & ATS",
      description: "Manage PDF resumes and run real-time keyword match analysis.",
      icon: FileText,
      path: "/resumes",
      gradient: "from-amber-600 to-orange-600",
    },
    {
      title: "Analytics Dashboard",
      description: "Visualize application response rates, ATS scores, and skill gaps.",
      icon: BarChart3,
      path: "/analytics",
      gradient: "from-cyan-600 to-blue-600",
    },
    {
      title: "Interested Roles",
      description: "View jobs you swiped right on and marked as interested.",
      icon: Star,
      path: "/interested-jobs",
      gradient: "from-yellow-600 to-amber-600",
    },
    {
      title: "Notifications",
      description: "Stay updated on application status changes and recruiter responses.",
      icon: Bell,
      path: "/notifications",
      gradient: "from-rose-600 to-red-600",
    },
    {
      title: "Companies & Startups",
      description: "Explore top companies and fast-growing tech startups actively hiring.",
      icon: Building,
      path: "/companies",
      gradient: "from-indigo-600 to-violet-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 px-4 py-8 md:px-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Candidate Dashboard
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ""} 👋
            </h1>
            <p className="mt-2 text-slate-400 text-sm md:text-base">
              Here is your career command center. Discover opportunities, track applications, and optimize your profile.
            </p>
          </div>

          <button
            onClick={() => navigate("/jobs")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            Start Swiping Jobs
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Dynamic Profile Completion Widget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Profile & Resume Completion</h3>
                <p className="text-xs text-slate-400">
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
                className="px-4 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/60 mb-4">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>

          {/* Missing Checklist Items */}
          {completion.missing_fields && completion.missing_fields.length > 0 ? (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Recommended Actions to Reach 100%:
              </p>
              <div className="flex flex-wrap gap-2">
                {completion.missing_fields.map((field, idx) => (
                  <span
                    key={idx}
                    onClick={() => navigate(field.includes("resume") ? "/resumes" : "/profile")}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition"
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

        {/* Feature Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {navCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(card.path)}
                className="bg-slate-800/80 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-5 cursor-pointer shadow-lg hover:shadow-2xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    {card.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-400">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;