import { Link } from 'react-router-dom';
import { Briefcase, Zap, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">SwipeX</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 font-medium text-slate-600">
            <a href="#" className="hover:text-primary-600 transition-colors">For Job Seekers</a>
            <a href="#" className="hover:text-primary-600 transition-colors">For Recruiters</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-600 font-medium hover:text-slate-900 transition-colors">Log in</Link>
            <Link to="/login" className="bg-primary-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm">Get Started</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-4 text-center max-w-4xl mx-auto overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-medium text-sm mb-6 border border-primary-100"
          >
            <Zap className="w-4 h-4" /> AI-Powered Job Discovery
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight"
          >
            Find your dream job with a single <span className="text-primary-600">swipe.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto"
          >
            Upload your resume, let our AI analyze your skills, and start swiping on personalized job matches tailored just for you.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2">
              Start Swiping Now <ChevronRight className="w-5 h-5" />
            </Link>
            <Link to="/register" className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors shadow-sm">
              I'm a Recruiter
            </Link>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI Resume Parsing</h3>
                <p className="text-slate-600">We extract your skills and experience automatically. Get instant ATS compatibility scores and improvement suggestions.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Matching</h3>
                <p className="text-slate-600">Our recommendation engine learns your preferences and only shows jobs where you have a high probability of success.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">One-Click Apply</h3>
                <p className="text-slate-600">Swipe right to express interest. Manage all your applications and track interview statuses in one clean dashboard.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
