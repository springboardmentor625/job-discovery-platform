import { useNavigate, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaSearch,
  FaBookmark,
  FaFileAlt,
  FaMagic,
  FaSignOutAlt,
  FaBolt,
  FaCog,
} from "react-icons/fa";

// ==========================================
// NAV ITEMS
// ==========================================

const NAV_ITEMS = [
  { label: "Dashboard", path: "/candidate", icon: FaTachometerAlt },
  { label: "Discover", path: "/candidate/jobs", icon: FaSearch },
  { label: "Saved Jobs", path: "/candidate/saved-jobs", icon: FaBookmark },
  { label: "Resume", path: "/candidate/resume", icon: FaFileAlt },
  {
    label: "AI Recommendations",
    path: "/candidate/ai-recommendations",
    icon: FaMagic,
  },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/candidate") {
      return location.pathname === "/candidate";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[250px] flex-shrink-0 flex-col justify-between overflow-y-auto bg-slate-900 px-4 py-6">
      <div>
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sx-primary-light to-sx-primary shadow-md shadow-sx-primary/30">
              <FaBolt className="text-sm text-white" />
            </div>
            <div className="bg-gradient-to-r from-white to-sx-primary-light bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
              SwipeX
            </div>
          </div>
          <p className="mt-1.5 text-[11px] font-medium leading-snug text-slate-400">
            Swipe-Based Intelligent Job Discovery Platform
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
            const active = isActive(path);

            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition ${
                  active
                    ? "bg-sx-primary/20 text-sx-primary-light"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="text-base" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => navigate("/candidate/settings")}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition ${
            location.pathname.startsWith("/candidate/settings")
              ? "bg-sx-primary/20 text-sx-primary-light"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <FaCog className="text-base" />
          Settings
        </button>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <FaSignOutAlt className="text-base" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
