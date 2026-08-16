import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Frontend mobile validation
    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError(
        "Mobile number must contain exactly 10 digits."
      );
      return;
    }

    // Frontend email validation
    if (
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
        form.email
      )
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    // Password validation
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

    if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];']/.test(form.password)) {
      setError(
        "Password must contain at least one special character."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/api/auth/register",
        null,
        {
          params: {
            full_name: form.full_name,
            email: form.email,
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

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          SwipeX
        </div>

        <h1>Create Account</h1>

        <p className="login-subtitle">
          Create your candidate account
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>

          <div className="form-group">

            <label>Full Name</label>

            <input
              type="text"
              name="full_name"
              placeholder="Enter your full name"
              value={form.full_name}
              onChange={handleChange}
              required
            />

          </div>


          <div className="form-group">

            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              value={form.email}
              onChange={handleChange}
              required
            />

          </div>


          <div className="form-group">

            <label>Mobile Number</label>

            <input
              type="tel"
              name="phone"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={handleChange}
              maxLength="10"
              required
            />

          </div>


          <div className="form-group">

            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              required
            />

          </div>


          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>


        <p className="register-text">

          Already have an account?{" "}

          <span
            onClick={() => navigate("/login")}
          >
            Sign In
          </span>

        </p>

      </div>

    </div>
  );
}

export default Register;