import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";
import SocialLoginButtons from "../components/SocialLoginButtons";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "job_seeker" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser(form);
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      setError(data ? JSON.stringify(data) : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white px-14 py-14">
        <div className="font-display text-2xl font-bold">SwipeX</div>
        <div className="max-w-sm">
          <p className="font-display text-4xl leading-tight font-bold mb-6">
            Three minutes to set up. A trained model does the rest.
          </p>
          <p className="text-white/60 leading-relaxed">
            Upload a resume once — every recommendation after that is scored
            against it automatically.
          </p>
        </div>
        <p className="text-white/40 text-sm">Built for job seekers, not job boards.</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold text-ink mb-1">Create your account</h1>
          <p className="text-muted mb-8">Start finding matches in minutes.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 break-words">
                {error}
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
          <div className="mt-5">
            <SocialLoginButtons />
          </div>
          <p className="text-sm text-muted text-center mt-5">
              Already have an account?{" "}
              <Link to="/login" className="text-violet-600 font-semibold">
                Log in
              </Link>
            </p>
        </div>
      </div>
    </div>
  );
}