import { NavLink, useNavigate } from "react-router-dom";

import {
  FaHome,
  FaBriefcase,
  FaFileAlt,
  FaClipboardList,
  FaCog,
  FaSignOutAlt,
  FaRobot,
} from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
      isActive
        ? "bg-white text-indigo-700 shadow-lg"
        : "text-indigo-100 hover:bg-indigo-500 hover:text-white"
    }`;

  return (
    <aside
      className="
        fixed
        left-0
        top-0
        z-40
        hidden
        md:flex
        w-64
        h-screen
        bg-indigo-600
        flex-col
        p-5
      "
    >
      {/* LOGO */}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">
          SwipeX
        </h1>

        <p className="text-sm text-indigo-200 mt-1">
          AI Job Discovery
        </p>
      </div>

      {/* NAVIGATION */}

      <nav className="space-y-2 flex-1">

        <NavLink
          to="/view-profile"
          className={linkClass}
        >
          <FaHome />
          Profile
        </NavLink>

        <NavLink
          to="/jobs"
          className={linkClass}
        >
          <FaBriefcase />
          Swipe Jobs
        </NavLink>

        <NavLink
          to="/resume"
          className={linkClass}
        >
          <FaFileAlt />
          Resume
        </NavLink>

        <NavLink
          to="/applications"
          className={linkClass}
        >
          <FaClipboardList />
          Applications
        </NavLink>

        {/* AI RECOMMENDATIONS */}

        <NavLink
          to="/recommendations"
          className={linkClass}
        >
          <FaRobot />
          AI Recommendations
        </NavLink>

        <NavLink
          to="/settings"
          className={linkClass}
        >
          <FaCog />
          Settings
        </NavLink>

      </nav>

      {/* LOGOUT */}

      <button
        onClick={logout}
        className="
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
          duration-300
          font-medium
        "
      >
        <FaSignOutAlt />
        Logout
      </button>

    </aside>
  );
}

export default Sidebar;