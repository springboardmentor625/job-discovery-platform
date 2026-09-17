import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  User, FileText, Layers, Search, Briefcase, Bell, BarChart3, LogOut,
} from "lucide-react";
import { logout } from "../store/authSlice";
import ConfirmDialog from "./ConfirmDialog";

const LINKS = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/jobs", label: "Discover", icon: Layers },
  { to: "/browse", label: "Browse", icon: Search },
  { to: "/applications", label: "Applications", icon: Briefcase },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const initials = (user?.username || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <aside className="w-60 shrink-0 bg-ink text-white flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6">
        <Link to="/dashboard" className="font-display text-xl font-bold tracking-tight">
          SwipeX
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-violet-600 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm truncate">{user?.username || "Account"}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Log out of SwipeX?"
        description="You'll need to log in again to keep discovering matches."
        confirmLabel="Log out"
        cancelLabel="Stay logged in"
        onConfirm={handleLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </aside>
  );
}