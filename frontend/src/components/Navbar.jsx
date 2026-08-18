import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../store/authSlice";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <Link to="/" className="text-xl font-bold text-brand-600">
        SwipeX
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {isAuthenticated ? (
          <>
            <Link to="/profile" className="hover:text-brand-600">
              Profile
            </Link>
            <Link to="/resume" className="hover:text-brand-600">
              Resume
            </Link>
            <Link to="/jobs" className="hover:text-brand-600">
              Discover
            </Link>
            <Link to="/applications" className="hover:text-brand-600">
              Applications
            </Link>
            <span className="text-gray-600">
              {user?.email} <span className="text-gray-400">({user?.role})</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-brand-600">
              Log in
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 transition"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
