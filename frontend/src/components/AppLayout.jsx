import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Menu, Bell, User } from "lucide-react";

export default function AppLayout({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Pages that use the public landing header instead of sidebar
  const isPublicPage = ["/", "/login", "/register"].includes(location.pathname);

  if (!isAuthenticated || isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              to="/dashboard"
              className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
            >
              SwipeX
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/notifications")}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md cursor-pointer"
              title="My Profile"
            >
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
