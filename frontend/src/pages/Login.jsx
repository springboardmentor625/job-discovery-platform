import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaBriefcase } from "react-icons/fa";
import api from "../api";
import { invalidateCurrentUser } from "../hooks/useCurrentUser";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const formData = new URLSearchParams();
      formData.append("username", cleanEmail);
      formData.append("password", password);

      const response = await api.post("/api/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("user_id", response.data.user_id);
      localStorage.setItem("role", response.data.role);
      invalidateCurrentUser();
      navigate("/candidate");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e8f5f3] via-white to-[#d4f0ec] px-4">
      {/* Card */}
      <div
        className="flex w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl"
        style={{ minHeight: "520px" }}
      >
        {/* ── LEFT PANEL ── */}
        <div
          className="relative hidden flex-col items-start justify-between overflow-hidden p-10 md:flex md:w-[45%]"
          style={{
            background:
              "linear-gradient(140deg, #0d9488 0%, #0f766e 55%, #134e4a 100%)",
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -bottom-16 -left-16 rounded-full opacity-20"
            style={{ width: 280, height: 280, background: "rgba(255,255,255,0.25)" }}
          />
          <div
            className="absolute -right-10 top-10 rounded-full opacity-10"
            style={{ width: 200, height: 200, background: "rgba(255,255,255,0.3)" }}
          />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <FaBriefcase className="text-white" size={16} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              SwipeX
            </span>
          </div>

          {/* Tagline */}
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold leading-tight text-white">
              WELCOME
              <br />
              BACK!
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Discover your next opportunity. Your personalised job feed is
              waiting — swipe, save, and land your dream role.
            </p>

          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex flex-1 flex-col justify-center bg-white px-8 py-10 md:px-12">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-2 md:hidden">
            <FaBriefcase className="text-sx-primary" size={18} />
            <span className="text-lg font-extrabold text-sx-primary">SwipeX</span>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-800">Sign in</h1>
          <p className="mt-1 text-sm text-gray-400">
            Enter your credentials to access your account
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-7 flex flex-col gap-5">
            {/* EMAIL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/20"
              />
            </div>

            {/* PASSWORD */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-800 outline-none transition focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-[#0d9488] transition hover:text-[#0f766e]"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl py-3 text-sm font-bold tracking-wide text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: loading
                  ? "#94a3b8"
                  : "linear-gradient(90deg, #0d9488 0%, #0f766e 100%)",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-semibold text-[#0d9488] transition hover:text-[#0f766e]"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
