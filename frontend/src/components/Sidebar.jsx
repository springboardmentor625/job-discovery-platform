import { NavLink, useNavigate } from "react-router-dom";

import {
  FaHome,
  FaBriefcase,
  FaRobot,
  FaFileAlt,
  FaUser,
  FaClipboardList,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
      isActive
        ? "bg-indigo-600 text-white shadow-md"
        : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
    }`;

  return (
    <aside className="
      fixed
      left-0
      top-0
      z-40
      hidden
      md:flex
      w-64
      h-screen
      bg-white
      border-r
      border-gray-200
      flex-col
      p-5
    ">

      {/* LOGO */}

      <div className="mb-8">
        <h1 className="
          text-2xl
          font-extrabold
          text-indigo-600
        ">
          SwipeX
        </h1>

        <p className="
          text-xs
          text-gray-400
          mt-1
        ">
          AI Job Discovery
        </p>
      </div>

      {/* NAVIGATION */}

      <nav className="space-y-2 flex-1">

        <NavLink
          to="/dashboard"
          className={linkClass}
        >
          <FaHome />
          Dashboard
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
          to="/view-profile"
          className={linkClass}
        >
          <FaUser />
          Profile
        </NavLink>

        <NavLink
          to="/applications"
          className={linkClass}
        >
          <FaClipboardList />
          Applications
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
          text-red-500
          hover:bg-red-50
          transition
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