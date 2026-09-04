import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase,
  Zap,
  Star,
  Heart,
  TrendingUp,
  FileCheck,
  Users,
  Building,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Flame,
  Search,
  MapPin,
  DollarSign
} from "lucide-react";

function Home() {
  const navigate = useNavigate();

  const stats = [
    { label: "Active Tech Jobs", value: "10,000+", icon: Briefcase },
    { label: "ATS Match Accuracy", value: "94.8%", icon: Zap },
    { label: "Hiring Partners", value: "500+", icon: Building },
    { label: "Average Response Time", value: "< 24 Hours", icon: TrendingUp },
  ];

  const features = [
    {
      title: "Intelligent Swipe Discovery",
      description: "Quickly swipe right on roles that align with your career goals and swipe left to pass. Our multi-signal algorithm personalizes your feed over time.",
      icon: Zap,
      gradient: "from-blue-500 to-indigo-600",
      badge: "Core Feature",
    },
    {
      title: "AI-Powered ATS Scanner",
      description: "Upload your PDF resume and instantly analyze keyword compatibility against real job postings with actionable skill recommendations.",
      icon: FileCheck,
      gradient: "from-purple-500 to-pink-600",
      badge: "Resume Insights",
    },
    {
      title: "Applicant Competition Tracking",
      description: "Identify early applicant opportunities and low-competition roles to drastically increase your interview callback rates.",
      icon: Flame,
      gradient: "from-amber-500 to-orange-600",
      badge: "Early Advantage",
    },
    {
      title: "Dynamic Career Analytics",
      description: "Track your real-time response rates, application progress, and discover high-demand skill gaps to stay competitive.",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-600",
      badge: "Live Metrics",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Create Profile & Upload Resume",
      description: "Set up your candidate profile, target job preferences, and upload your PDF resume for automatic skill extraction.",
    },
    {
      number: "02",
      title: "Swipe & Explore AI-Ranked Matches",
      description: "Browse roles scored by resume relevance, location match, freshness, and early applicant advantage.",
    },
    {
      number: "03",
      title: "Apply with 1 Click & Track Status",
      description: "Submit applications instantly and receive real-time notifications as recruiters review, shortlist, and select your profile.",
    },
  ];

  const popularRoles = [
    { title: "Full Stack Engineer", count: "140+ Open Roles", salary: "$120k - $160k" },
    { title: "Data Scientist / ML", count: "95+ Open Roles", salary: "$130k - $175k" },
    { title: "Frontend React Developer", count: "110+ Open Roles", salary: "$105k - $145k" },
    { title: "Backend Python / FastAPI", count: "85+ Open Roles", salary: "$115k - $155k" },
    { title: "DevOps & Cloud Architect", count: "70+ Open Roles", salary: "$135k - $180k" },
    { title: "Product Manager", count: "60+ Open Roles", salary: "$125k - $165k" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      
      {/* ========================================================= */}
      {/* 1. HERO SECTION                                           */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 px-4 md:px-8">
        {/* Glow background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs md:text-sm font-semibold tracking-wide"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              Next-Gen Smart Job Discovery Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15]"
            >
              Find the Right Job. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                Build the Right Career.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              SwipeX intelligently connects candidates with job opportunities that match their skills, experience, and career goals using multi-signal AI recommendations, real-time ATS match analysis, and applicant competition tracking.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <button
                onClick={() => navigate("/jobs")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-blue-600/25 hover:shadow-blue-500/40 transition-all flex items-center gap-2.5 text-base cursor-pointer"
              >
                <Search className="w-5 h-5" />
                Explore Jobs
              </button>

              <button
                onClick={() => navigate("/register")}
                className="px-8 py-4 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 text-base cursor-pointer"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs md:text-sm text-slate-400"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instant ATS Resume Scorer</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>100% Free for Candidates</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Interactive Job Mockup Card */}
          <div className="lg:col-span-5 relative flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative"
            >
              {/* Top Floating Badge */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  🔥 Low Competition • Early Applicant
                </span>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                  94% Match
                </span>
              </div>

              {/* Job Title & Company */}
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Senior Full Stack Engineer
              </h3>
              <p className="text-slate-400 text-sm font-medium mt-1">
                TechCorp Innovations Inc. • High Growth SaaS
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-300">
                <span className="flex items-center gap-1 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Remote / Hybrid
                </span>
                <span className="flex items-center gap-1 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  Full-time
                </span>
                <span className="flex items-center gap-1 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700/60 font-semibold text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  $130k - $160k
                </span>
              </div>

              {/* ATS Compatibility Meter */}
              <div className="mt-5 p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    Resume ATS Compatibility
                  </span>
                  <span className="font-bold text-emerald-400">94% Overlap</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-[94%] rounded-full" />
                </div>
              </div>

              {/* Skills Chips */}
              <div className="mt-5">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
                  Matching Skill Highlights
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["React", "Python", "FastAPI", "PostgreSQL", "AWS", "Tailwind"].map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/25"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Simulated Swipe Controls */}
              <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-700/60">
                <button
                  title="Pass"
                  className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center text-lg font-bold hover:scale-110 transition cursor-pointer"
                >
                  ✕
                </button>
                <button
                  title="Interested"
                  className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center justify-center hover:scale-110 transition cursor-pointer"
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
                <button
                  title="Apply"
                  onClick={() => navigate("/jobs")}
                  className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center hover:scale-110 transition cursor-pointer"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. STATS BANNER                                           */}
      {/* ========================================================= */}
      <section className="border-y border-slate-800 bg-slate-900/60 py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="text-center p-4">
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-slate-400 font-medium mt-1">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. KEY PLATFORM FEATURES                                  */}
      {/* ========================================================= */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
            Why Choose SwipeX
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-4">
            Everything You Need to Accelerate Your Tech Career
          </h2>
          <p className="text-slate-400 text-sm md:text-base mt-3">
            Traditional job boards are noisy and slow. SwipeX combines intelligent machine learning scoring with streamlined swipe interactions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-slate-850/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-8 shadow-xl transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2.5">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. HOW IT WORKS WORKFLOW                                  */}
      {/* ========================================================= */}
      <section className="py-20 px-4 md:px-8 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-4">
              How SwipeX Works
            </h2>
            <p className="text-slate-400 text-sm md:text-base mt-3">
              Go from uploading your resume to receiving interview invites in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 relative flex flex-col justify-between"
              >
                <div>
                  <span className="text-5xl font-black text-slate-700/70 select-none">
                    {step.number}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-4 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/40 flex items-center text-xs font-semibold text-blue-400">
                  <span>Step {idx + 1} of 3</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. POPULAR CATEGORIES & ROLES                            */}
      {/* ========================================================= */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Trending Roles Hiring Now
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Top technology positions with competitive salaries and active recruiter demand.
            </p>
          </div>
          <button
            onClick={() => navigate("/jobs")}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold border border-slate-700 transition flex items-center gap-2 cursor-pointer"
          >
            View All Jobs
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularRoles.map((role, idx) => (
            <div
              key={idx}
              onClick={() => navigate("/jobs")}
              className="bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 cursor-pointer hover:bg-slate-800/80 transition-all flex items-center justify-between group"
            >
              <div>
                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                  {role.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1">{role.count}</p>
                <p className="text-xs font-semibold text-emerald-400 mt-0.5">{role.salary}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-blue-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. CALL TO ACTION BANNER                                  */}
      {/* ========================================================= */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-14 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Ready to Accelerate Your Career?
            </h2>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed">
              Join thousands of tech candidates using SwipeX to discover higher-matching opportunities and streamline their job search.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => navigate("/register")}
                className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition cursor-pointer text-base"
              >
                Create Free Candidate Account
              </button>
              <button
                onClick={() => navigate("/companies")}
                className="px-8 py-4 bg-blue-900/40 hover:bg-blue-900/60 border border-white/20 text-white font-semibold rounded-xl transition cursor-pointer text-base"
              >
                Explore Hiring Companies
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. FOOTER                                                 */}
      {/* ========================================================= */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 px-4 md:px-8 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              SwipeX
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Swipe-Based Intelligent Job Discovery and Career Assistance Platform.
            </p>
          </div>

          {/* Col 2: Candidates */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">
              For Candidates
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigate("/jobs")} className="hover:text-white transition cursor-pointer">Discover Jobs</button></li>
              <li><button onClick={() => navigate("/recommendations")} className="hover:text-white transition cursor-pointer">AI Recommendations</button></li>
              <li><button onClick={() => navigate("/resumes")} className="hover:text-white transition cursor-pointer">ATS Resume Scanner</button></li>
              <li><button onClick={() => navigate("/applications")} className="hover:text-white transition cursor-pointer">Track Applications</button></li>
            </ul>
          </div>

          {/* Col 3: Employers & Explore */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigate("/companies")} className="hover:text-white transition cursor-pointer">Companies & Startups</button></li>
              <li><button onClick={() => navigate("/register")} className="hover:text-white transition cursor-pointer">Post a Job (Recruiter)</button></li>
              <li><button onClick={() => navigate("/analytics")} className="hover:text-white transition cursor-pointer">Market Analytics</button></li>
            </ul>
          </div>

          {/* Col 4: Platform */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-400">FastAPI + PostgreSQL + React 19</span></li>
              <li><span className="text-slate-400">Multi-Signal AI Ranking</span></li>
              <li><span className="text-slate-400">Applicant Competition Tracking</span></li>
              <li><span className="text-slate-400">© 2026 SwipeX Inc.</span></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <p>© 2026 SwipeX. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Home;