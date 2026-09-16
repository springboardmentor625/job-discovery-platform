import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("login/", {
        email,
        password,
      });

      const { access, refresh } = response.data;

      if (!access || !refresh) {
        toast.error("Authentication failed. Please try again.");
        return;
      }

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      toast.success("Welcome back to SwipeX!");
      navigate("/recommendations");
    } catch (error) {
      console.log("Login status:", error.response?.status);
      console.log("Login response:", error.response?.data);
      const backendError =
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Invalid email or password.";

      toast.error(backendError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10 w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* LOGO & TITLE */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md">
            S
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign in to Swipe<span className="text-indigo-600">X</span>
          </h1>
          <p className="text-xs text-slate-500">
            Intelligent job discovery & ATS matchmaking platform
          </p>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* REGISTER FOOTER */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;