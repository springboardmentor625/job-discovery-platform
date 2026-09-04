import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    // Remove accidental spaces
    const cleanEmail = email.trim().toLowerCase();

    try {
      const formData = new URLSearchParams();

      formData.append("username", cleanEmail);
      formData.append("password", password);

      const response = await api.post(
        "/api/auth/login",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // ========================================
      // STORE AUTHENTICATION
      // ========================================

      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("user_id", response.data.user_id);
      localStorage.setItem("role", response.data.role);

      // ========================================
      // GO TO DASHBOARD
      // ========================================

      navigate("/candidate");
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-sx-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-sx-border bg-sx-card p-8 shadow-sm">
        <div className="text-xl font-bold text-sx-primary">SwipeX</div>

        <h1 className="mt-4 text-2xl font-bold text-sx-text">
          Welcome Back
        </h1>

        <p className="mt-1 text-sm text-sx-text-secondary">
          Sign in to continue your job discovery journey
        </p>

        {/* ERROR */}

        {error && (
          <div className="mt-4 rounded-lg border border-sx-danger-border bg-sx-danger-bg px-4 py-3 text-sm text-sx-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
          {/* ==================================
              EMAIL
          =================================== */}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-sx-text-secondary">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
              className="w-full rounded-lg border border-sx-border px-3.5 py-2.5 text-sm text-sx-text outline-none transition focus:border-sx-primary focus:ring-2 focus:ring-sx-primary/20"
            />
          </div>

          {/* ==================================
              PASSWORD
          =================================== */}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-sx-text-secondary">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                className="w-full rounded-lg border border-sx-border px-3.5 py-2.5 pr-10 text-sm text-sx-text outline-none transition focus:border-sx-primary focus:ring-2 focus:ring-sx-primary/20"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sx-text-muted transition hover:text-sx-text-secondary"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* ==================================
              LOGIN BUTTON
          =================================== */}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-sx-primary py-2.5 text-sm font-semibold text-white transition hover:bg-sx-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* ==================================
            REGISTER
        =================================== */}

        <p className="mt-6 text-center text-sm text-sx-text-secondary">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="cursor-pointer font-semibold text-sx-primary hover:text-sx-primary-dark"
          >
            Create account
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
