import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
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
      console.log("LOGIN REQUEST:", {
        email: email,
        password: "********",
      });

      const response = await api.post("login/", {
        email: email,
        password: password,
      });

      console.log("LOGIN SUCCESS:", response.data);

      const { access, refresh } = response.data;

      if (!access || !refresh) {
        console.error(
          "LOGIN RESPONSE DOES NOT CONTAIN TOKENS:",
          response.data
        );

        toast.error("Invalid login response from server.");
        return;
      }

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      toast.success("Login successful!");

      navigate("/profile", { replace: true });
    } catch (error) {
      console.error("================================");
      console.error("LOGIN ERROR:", error);
      console.error("LOGIN STATUS:", error.response?.status);
      console.error("LOGIN RESPONSE:", error.response?.data);
      console.error("LOGIN HEADERS:", error.response?.headers);
      console.error("================================");

      const status = error.response?.status;
      const data = error.response?.data;

      if (!error.response) {
        toast.error(
          "Cannot connect to backend. Make sure Django is running."
        );
        return;
      }

      if (status === 400) {
        if (data?.detail) {
          toast.error(data.detail);
        } else if (data?.non_field_errors) {
          toast.error(
            Array.isArray(data.non_field_errors)
              ? data.non_field_errors.join(", ")
              : data.non_field_errors
          );
        } else if (data?.email) {
          toast.error(
            Array.isArray(data.email)
              ? data.email.join(", ")
              : data.email
          );
        } else if (data?.password) {
          toast.error(
            Array.isArray(data.password)
              ? data.password.join(", ")
              : data.password
          );
        } else {
          toast.error(
            "Login rejected by backend. Check browser console."
          );
        }

        return;
      }

      if (status === 401) {
        toast.error("Invalid email or password.");
        return;
      }

      if (status >= 500) {
        toast.error("Server error. Check Django terminal.");
        return;
      }

      toast.error("Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-indigo-600">
            SwipeX
          </h1>

          <h2 className="mt-3 text-xl font-semibold text-gray-800">
            Welcome Back
          </h2>

          <p className="mt-2 text-gray-500">
            Sign in to continue exploring personalized job opportunities.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full rounded-lg border border-gray-300 p-3 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full rounded-lg border border-gray-300 p-3 pr-12 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Register */}
        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Create an account
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;