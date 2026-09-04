import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Only allow digits for mobile number
    if (name === "phone") {
      if (!/^\d*$/.test(value)) {
        return;
      }

      if (value.length > 10) {
        return;
      }
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================
  // REGISTER
  // ==========================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ========================================
    // FULL NAME VALIDATION
    // ========================================

    const fullName = form.full_name.trim();

    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }

    // ========================================
    // EMAIL VALIDATION
    // ========================================

    const email = form.email.trim().toLowerCase();

    const emailPattern =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // ========================================
    // MOBILE NUMBER VALIDATION
    // ========================================

    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError(
        "Mobile number must contain exactly 10 digits."
      );
      return;
    }

    // ========================================
    // PASSWORD VALIDATION
    // ========================================

    if (form.password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (!/[A-Z]/.test(form.password)) {
      setError(
        "Password must contain at least one uppercase letter."
      );
      return;
    }

    if (!/[a-z]/.test(form.password)) {
      setError(
        "Password must contain at least one lowercase letter."
      );
      return;
    }

    if (!/[0-9]/.test(form.password)) {
      setError(
        "Password must contain at least one number."
      );
      return;
    }

    // Special character validation
    if (
      !/[-!@#$%^&*(),.?":{}|<>_+=\[\];'/\\]/.test(
        form.password
      )
    ) {
      setError(
        "Password must contain at least one special character."
      );
      return;
    }

    // ========================================
    // START REGISTRATION
    // ========================================

    setLoading(true);

    try {
      const response = await api.post(
        "/api/auth/register",
        null,
        {
          params: {
            full_name: fullName,
            email: email,
            password: form.password,
            phone: form.phone,
          },
        }
      );

      setSuccess(
        response.data.message ||
        "Candidate registered successfully."
      );

      setForm({
        full_name: "",
        email: "",
        password: "",
        phone: "",
      });

      setShowPassword(false);

      // Redirect after successful registration
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Registration failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-sx-bg px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-sx-border bg-sx-card p-8 shadow-sm">
        {/* LOGO */}

        <div className="text-xl font-bold text-sx-primary">SwipeX</div>

        <h1 className="mt-4 text-2xl font-bold text-sx-text">
          Create Account
        </h1>

        <p className="mt-1 text-sm text-sx-text-secondary">
          Create your candidate account
        </p>

        {/* ERROR */}

        {error && (
          <div className="mt-4 rounded-lg border border-sx-danger-border bg-sx-danger-bg px-4 py-3 text-sm text-sx-danger">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mt-4 rounded-lg border border-sx-success-border bg-sx-success-bg px-4 py-3 text-sm text-sx-success">
            {success}
          </div>
        )}

        {/* FORM */}

        <form onSubmit={handleRegister} className="mt-6 flex flex-col gap-4">
          {/* FULL NAME */}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-sx-text-secondary">
              Full Name
            </label>

            <input
              type="text"
              name="full_name"
              placeholder="Enter your full name"
              value={form.full_name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-sx-border px-3.5 py-2.5 text-sm text-sx-text outline-none transition focus:border-sx-primary focus:ring-2 focus:ring-sx-primary/20"
            />
          </div>

          {/* EMAIL */}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-sx-text-secondary">
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-sx-border px-3.5 py-2.5 text-sm text-sx-text outline-none transition focus:border-sx-primary focus:ring-2 focus:ring-sx-primary/20"
            />
          </div>

          {/* MOBILE */}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-sx-text-secondary">
              Mobile Number
            </label>

            <input
              type="tel"
              name="phone"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={handleChange}
              maxLength={10}
              inputMode="numeric"
              required
              className="w-full rounded-lg border border-sx-border px-3.5 py-2.5 text-sm text-sx-text outline-none transition focus:border-sx-primary focus:ring-2 focus:ring-sx-primary/20"
            />
          </div>

          {/* PASSWORD */}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-sx-text-secondary">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-sx-border px-3.5 py-2.5 pr-10 text-sm text-sx-text outline-none transition focus:border-sx-primary focus:ring-2 focus:ring-sx-primary/20"
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sx-text-muted transition hover:text-sx-text-secondary"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <small className="text-xs leading-relaxed text-sx-text-muted">
              Password must contain at least 8 characters, including
              uppercase, lowercase, number and special character.
            </small>
          </div>

          {/* REGISTER BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-sx-primary py-2.5 text-sm font-semibold text-white transition hover:bg-sx-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-sx-text-secondary">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="cursor-pointer font-semibold text-sx-primary hover:text-sx-primary-dark"
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
