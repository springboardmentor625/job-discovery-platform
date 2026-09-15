import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Briefcase,
  Bell,
  Zap,
  FileText,
  Users,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (isAuthenticated) {
      api.get("/notifications/unread-count")
        .then((res) => setUnreadCount(res.data?.unread_count || 0))
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const isRecruiter = user?.role === "recruiter";

  const recruiterNavLinks = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/recruiter/jobs", label: "Manage Jobs", icon: Briefcase },
    { path: "/recruiter/post-job", label: "Post Job", icon: Zap },
    { path: "/recruiter/applications", label: "Candidates", icon: Users },
    { path: "/companies", label: "Companies", icon: Users },
  ];

  const candidateNavLinks = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/jobs", label: "Discover Jobs", icon: Briefcase },
    { path: "/recommendations", label: "Recommended", icon: Zap },
    { path: "/swipe-history", label: "Swipe History", icon: Zap },
    { path: "/resumes", label: "Resumes & ATS Score", icon: FileText },
    { path: "/companies", label: "Companies", icon: Users },
    { path: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
  ];

  const navLinks = isAuthenticated
    ? (isRecruiter ? recruiterNavLinks : candidateNavLinks)
    : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="bg-slate-900/90 border-b border-slate-800/90 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Swipe<span className="text-blue-400">X</span>
            </span>
          </Link>

          {/* Desktop Navigation (Authenticated Only) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                      isActive(link.path)
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Section: Actions / Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/notifications")}
                  className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </motion.button>

                {/* User Dropdown Menu */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-sm font-medium transition cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="hidden sm:inline">
                      {user?.full_name?.split(" ")[0] || "User"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden py-1 z-50 backdrop-blur-xl"
                      >
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                        >
                          <User className="w-4 h-4 text-blue-400" />
                          My Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition border-t border-slate-800/80 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Hamburger Toggle (Authenticated) */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              /* Public / Unauthenticated Navigation */
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 md:px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs md:text-sm font-bold shadow-md shadow-blue-600/25 hover:shadow-blue-500/35 transition cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer (Authenticated Only) */}
        {isAuthenticated && (
          <AnimatePresence>
            {mobileOpen && (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden pb-4 border-t border-slate-800 pt-3"
              >
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        className={`px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition ${
                          isActive(link.path)
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold text-left flex items-center gap-2.5 mt-2 border-t border-slate-800 pt-3 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        )}
      </div>
    </header>
  );
}
