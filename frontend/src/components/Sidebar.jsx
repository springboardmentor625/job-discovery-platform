import { useState } from "react";
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setShowLogoutModal(false);
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
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 w-64 h-screen bg-indigo-600
          flex flex-col p-5 shadow-xl transition-transform duration-300
          ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
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
            aria-label="Close menu"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 flex-1">
          <NavLink to="/profile" onClick={closeMobile} className={linkClass}>
            <FaUser className="text-base" />
            <span>Profile</span>
          </NavLink>

          <NavLink to="/resume" onClick={closeMobile} className={linkClass}>
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

          <NavLink to="/explore" onClick={closeMobile} className={linkClass}>
            <FaCompass className="text-base" />
            <span>Explore Jobs</span>
          </NavLink>
        </nav>

        {/* Logout */}
        <div className="pt-4 border-t border-indigo-500/40">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-indigo-100 hover:bg-red-500 hover:text-white
              transition-all duration-200 font-medium text-sm
            "
          >
            <FaSignOutAlt className="text-base" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
                <FaSignOutAlt size={19} />
              </div>

              <h2 className="text-xl font-bold text-slate-800">
                Confirm Logout
              </h2>
            </div>

            <p className="text-sm leading-6 text-slate-600 mb-6">
              Are you sure you want to log out of SwipeX?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="
                  rounded-xl border border-slate-300 px-5 py-2.5
                  text-sm font-semibold text-slate-700
                  hover:bg-slate-100 transition
                "
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="
                  rounded-xl bg-red-600 px-5 py-2.5
                  text-sm font-semibold text-white
                  hover:bg-red-700 transition
                "
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;