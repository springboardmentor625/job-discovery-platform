import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase,
  Zap,
  Star,
  Heart,
  Sparkles,
  MapPin,
  DollarSign
} from "lucide-react";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex items-center justify-center relative overflow-hidden selection:bg-blue-500 selection:text-white px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-blue-600/15 via-purple-600/15 to-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        {/* Left Column: Typography & Brand Narrative */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/25 rounded-full text-blue-400 text-xs font-semibold tracking-wide backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Next-Gen Smart Job Discovery Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-white tracking-tight leading-[1.18]"
          >
            Find the Right Job. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Build the Right Career.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300/90 text-sm sm:text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
          >
            SwipeX intelligently connects candidates with job opportunities that match their skills, experience, and career goals using multi-signal AI recommendations, real-time ATS match analysis, and applicant competition tracking.
          </motion.p>
        </div>

        {/* Right Column: Interactive Job Mockup Card */}
        <div className="lg:col-span-5 relative flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative hover:border-slate-700/80 transition-all"
          >
            {/* Top Bar: Match Score Badge */}
            <div className="flex items-center justify-end mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/25">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                94% Match
              </span>
            </div>

            {/* Job Title & Company */}
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Senior Full Stack Engineer
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
              TechCorp Innovations Inc. • High Growth SaaS
            </p>

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Remote / Hybrid
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Full-time
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 font-semibold text-emerald-400">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                $130k - $160k
              </span>
            </div>

            {/* Resume Match Score Bar */}
            <div className="mt-5 p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  Resume Match Score
                </span>
                <span className="font-bold text-emerald-400">94% Overlap</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-[94%] rounded-full transition-all duration-500" />
              </div>
            </div>

            {/* Required Tech Skills */}
            <div className="mt-5">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
                Required Tech Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["React", "Python", "FastAPI", "PostgreSQL", "AWS", "Tailwind"].map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Swipe Action Controls Preview */}
            <div className="flex items-center justify-center gap-5 mt-6 pt-5 border-t border-slate-800">
              <button
                title="Pass"
                className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center text-lg font-bold shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                ✕
              </button>
              <button
                title="Save / Interested"
                className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-white flex items-center justify-center shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
              <button
                title="Apply"
                onClick={() => navigate("/login")}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 cursor-pointer"
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

export default Home;