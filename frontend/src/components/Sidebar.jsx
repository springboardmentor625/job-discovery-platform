import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  Sparkles,
  FileText,
  Building2,
  Bell,
  History,
  User,
  LogOut,
  ChevronRight,
  Menu,
  X,
  PlusCircle,
  Users
} from "lucide-react";

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "candidate") {
      api.get("/notifications/unread-count")
        .then((res) => setUnreadCount(res.data?.unread_count || 0))
        .catch(() => {});
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, location.pathname, user?.role]);

  // Role-based Navigation Configuration
  const isRecruiter = user?.role === "recruiter";

  const recruiterNavItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/recruiter/jobs", label: "Manage Jobs", icon: Briefcase },
    { path: "/recruiter/post-job", label: "Post Job", icon: PlusCircle, badge: "New" },
    { path: "/recruiter/applications", label: "Candidates", icon: Users },
    { path: "/companies", label: "Companies", icon: Building2 },
  ];

  const candidateNavItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/jobs", label: "Discover Jobs", icon: Briefcase },
    { path: "/recommendations", label: "Recommended", icon: Sparkles, badge: "AI" },
    { path: "/resumes", label: "Resumes & ATS Score", icon: FileText },
    { path: "/companies", label: "Companies", icon: Building2 },
    { path: "/notifications", label: "Notifications", icon: Bell, count: unreadCount },
    { path: "/swipe-history", label: "Swipe History", icon: History },
  ];

  const navItems = isRecruiter ? recruiterNavItems : candidateNavItems;

  const handleLogout = () => {
    logout();
    navigate("/login");
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleNavClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-900/95 border-r border-slate-800/80 text-slate-100 p-4 select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between px-3 py-3 mb-6 border-b border-slate-800/60">
          <Link
            to="/dashboard"
            onClick={handleNavClick}
            className="flex items-center gap-2.5 font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 hover:opacity-90 transition-opacity"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md text-white font-black text-sm ${
              isRecruiter
                ? "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20"
                : "bg-gradient-to-tr from-blue-600 to-purple-600 shadow-blue-500/20"
            }`}>
              S
            </div>
            <span className="tracking-tight">SwipeX</span>
          </Link>

          {/* Mobile close button */}
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Role Pill */}
        <div className="px-3 mb-4">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
            isRecruiter
              ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
              : "bg-blue-500/15 text-blue-300 border-blue-500/30"
          }`}>
            {isRecruiter ? "🏢 Recruiter Portal" : "🎯 Candidate Portal"}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? isRecruiter
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 font-semibold"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active
                        ? "text-white"
                        : isRecruiter
                        ? "text-slate-400 group-hover:text-purple-400"
                        : "text-slate-400 group-hover:text-blue-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.count > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-500 text-white shadow-sm animate-pulse">
                      {item.count > 99 ? "99+" : item.count}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile & User Section at Bottom */}
      <div className="pt-4 mt-6 border-t border-slate-800/80 space-y-3">
        {/* User Card */}
        <Link
          to="/profile"
          onClick={handleNavClick}
          className={`flex items-center gap-3 p-2.5 rounded-xl transition cursor-pointer ${
            isActive("/profile")
              ? "bg-slate-800 text-white border border-slate-700"
              : "hover:bg-slate-800/60 text-slate-300 hover:text-white"
          }`}
          title="View profile"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 ${
            isRecruiter
              ? "bg-gradient-to-tr from-purple-500 to-indigo-600"
              : "bg-gradient-to-tr from-blue-500 to-indigo-600"
          }`}>
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (isRecruiter ? "R" : "U")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {user?.full_name || (isRecruiter ? "Recruiter" : "Candidate")}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.email || "user@swipex.io"}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/15 border border-rose-500/20 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay & Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Sliding Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 md:hidden shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
