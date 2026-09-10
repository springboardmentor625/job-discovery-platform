import { NavLink, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaFileAlt,
  FaRobot,
  FaHistory,
  FaCompass,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";

function Sidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };

  const closeMobile = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
      isActive
        ? "bg-white text-indigo-700 shadow-sm font-semibold"
        : "text-indigo-100 hover:bg-indigo-700/60 hover:text-white"
    }`;

  return (
    <>
      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          w-64
          h-screen
          bg-indigo-600
          flex
          flex-col
          p-5
          shadow-xl
          transition-transform
          duration-300
          ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* LOGO */}
        <div className="flex items-center justify-between mb-8 px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm">
                S
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Swipe<span className="text-indigo-200">X</span>
              </h1>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              AI Job Discovery Platform
            </p>
          </div>

          <button
            onClick={closeMobile}
            className="md:hidden text-indigo-200 hover:text-white p-2 rounded-lg"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* NAVIGATION: Profile, Resume, Recommendations, Swipe History, Explore Jobs, Logout */}
        <nav className="space-y-1.5 flex-1">
          <NavLink
            to="/profile"
            onClick={closeMobile}
            className={linkClass}
          >
            <FaUser className="text-base" />
            <span>Profile</span>
          </NavLink>

          <NavLink
            to="/resume"
            onClick={closeMobile}
            className={linkClass}
          >
            <FaFileAlt className="text-base" />
            <span>Resume</span>
          </NavLink>

          <NavLink
            to="/recommendations"
            onClick={closeMobile}
            className={linkClass}
          >
            <FaRobot className="text-base" />
            <span>Recommendations</span>
          </NavLink>

          <NavLink
            to="/swipe-history"
            onClick={closeMobile}
            className={linkClass}
          >
            <FaHistory className="text-base" />
            <span>Swipe History</span>
          </NavLink>

          <NavLink
            to="/explore"
            onClick={closeMobile}
            className={linkClass}
          >
            <FaCompass className="text-base" />
            <span>Explore Jobs</span>
          </NavLink>
        </nav>

        {/* LOGOUT */}
        <div className="pt-4 border-t border-indigo-500/40">
          <button
            onClick={handleLogout}
            className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-xl
              text-indigo-100
              hover:bg-red-500
              hover:text-white
              transition-all
              duration-200
              font-medium
              text-sm
            "
          >
            <FaSignOutAlt className="text-base" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;