import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaBriefcase } from "react-icons/fa";
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

    if (name === "phone") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // ==========================================
  // REGISTER
  // ==========================================

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fullName = form.full_name.trim();
    if (!fullName) { setError("Please enter your full name."); return; }

    const email = form.email.trim().toLowerCase();
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      setError("Please enter a valid email address."); return;
    }

    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError("Mobile number must contain exactly 10 digits."); return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters."); return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError("Password must contain at least one uppercase letter."); return;
    }
    if (!/[a-z]/.test(form.password)) {
      setError("Password must contain at least one lowercase letter."); return;
    }
    if (!/[0-9]/.test(form.password)) {
      setError("Password must contain at least one number."); return;
    }
    if (!/[-!@#$%^&*(),.?":{}|<>_+=\x5b;'/\\]/.test(form.password)) {
      setError("Password must contain at least one special character."); return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/auth/register", {
        full_name: fullName,
        email,
        password: form.password,
        phone: form.phone,
      });

      setSuccess(response.data.message || "Account created successfully!");
      setForm({ full_name: "", email: "", password: "", phone: "" });
      setShowPassword(false);

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e8f5f3] via-white to-[#d4f0ec] px-4 py-8">
      {/* Card */}
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl">

        {/* ── LEFT PANEL ── */}
        <div
          className="relative hidden flex-col items-start justify-between overflow-hidden p-10 md:flex md:w-[42%]"
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
              JOIN
              <br />
              TODAY!
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Create your free account in seconds. SwipeX matches you with jobs
              that fit your skills and experience — no endless scrolling.
            </p>

          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex flex-1 flex-col justify-center bg-white px-8 py-10 md:px-12">
          {/* Mobile logo */}
          <div className="mb-5 flex items-center gap-2 md:hidden">
            <FaBriefcase className="text-[#0d9488]" size={18} />
            <span className="text-lg font-extrabold text-[#0d9488]">SwipeX</span>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-800">Create account</h1>
          <p className="mt-1 text-sm text-gray-400">
            Fill in your details to get started
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-6 flex flex-col gap-4">
            {/* NAME */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Name
              </label>
              <input
                id="reg-full-name"
                type="text"
                name="full_name"
                placeholder="Jane Doe"
                value={form.full_name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/20"
              />
            </div>

            {/* EMAIL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/20"
              />
            </div>

            {/* MOBILE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Mobile
              </label>
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                placeholder="10-digit number"
                value={form.phone}
                onChange={handleChange}
                maxLength={10}
                inputMode="numeric"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/20"
              />
            </div>

            {/* PASSWORD */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-800 outline-none transition focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0d9488] transition hover:text-[#0f766e]"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
              <small className="text-xs leading-relaxed text-gray-400">
                Min 8 chars · uppercase · lowercase · number · special character
              </small>
            </div>

            {/* SUBMIT */}
            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl py-3 text-sm font-bold tracking-wide text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: loading
                  ? "#94a3b8"
                  : "linear-gradient(90deg, #0d9488 0%, #0f766e 100%)",
              }}
            >
              {loading ? "Creating Account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-semibold text-[#0d9488] transition hover:text-[#0f766e]"
            >
              Sign in
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Register;
