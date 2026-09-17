import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";
import { setCredentials } from "../store/authSlice";
import SocialLoginButtons from "../components/SocialLoginButtons";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await loginUser(form);
      dispatch(setCredentials({ user: data.user, access: data.access, refresh: data.refresh }));
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password.");
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
            Find work that actually matches your skills.
          </p>
          <p className="text-white/60 leading-relaxed">
            A trained model scores every posting against your resume — no more
            scrolling through jobs that don't fit.
          </p>
        </div>
        <p className="text-white/40 text-sm">Built for job seekers, not job boards.</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold text-ink mb-1">Welcome back</h1>
          <p className="text-muted mb-8">Log in to keep discovering matches.</p>

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Email or username</label>
              <input
                type="text"
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
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
          <div className="mt-5">
            <SocialLoginButtons />
          </div>
          <p className="text-sm text-muted text-center mt-5">
              Don't have an account?{" "}
              <Link to="/register" className="text-violet-600 font-semibold">
                Sign up
              </Link>
          </p>
        </div>
      </div>
    </div>
  );
}