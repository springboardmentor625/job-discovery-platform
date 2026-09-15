
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {
    const {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
    } = formData;

    if (fullName.trim().length < 2) {
      return "Full name must contain at least 2 characters.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return "Please enter a valid email address.";
    }

    if (!/^\d+$/.test(phone)) {
      return "Phone number must contain only numbers.";
    }

    if (phone.length !== 10) {
      return "Phone number must contain exactly 10 digits.";
    }

    if (password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (password.length > 20) {
      return "Password cannot contain more than 20 characters.";
    }

    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must contain at least one special character.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  // =========================================================
  // REGISTER
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await registerUser({
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: "CANDIDATE",
        phone: formData.phone,
      });

      console.log("Registration successful:", response);

      // =====================================================
      // CONTINUE TO LOGIN
      // =====================================================

      navigate("/login");

    } catch (error) {
      console.error("Registration error:", error);

      if (error.response) {
        setError(
          error.response.data?.detail ||
          "Registration failed. Please try again."
        );

      } else if (error.request) {
        setError(
          "Cannot connect to the backend. Please make sure FastAPI is running."
        );

      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }

    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="register-page">

      {/* =====================================================
          TOP BRANDING
      ===================================================== */}

      <header className="register-header">

        <button
          type="button"
          className="register-brand"
          onClick={() => navigate("/")}
        >
          <span className="register-brand-mark">
            SX
          </span>

          <span className="register-brand-name">
            SwipeX
          </span>
        </button>

        <div className="register-header-login">
          <span>Already have an account?</span>

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>

      </header>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="register-main">

        <div className="register-card">

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <section className="register-intro">

            <div className="register-intro-content">

              <span className="register-eyebrow">
                START YOUR JOURNEY
              </span>

              <h1>
                Find opportunities
                <span> made for you.</span>
              </h1>

              <p>
                Create your SwipeX candidate account and
                discover jobs that match your skills,
                experience and career goals.
              </p>

              <div className="register-benefits">

                <div className="register-benefit">
                  <div className="benefit-icon">
                    ✓
                  </div>

                  <div>
                    <strong>Personalized opportunities</strong>
                    <span>
                      Discover jobs based on your profile.
                    </span>
                  </div>
                </div>

                <div className="register-benefit">
                  <div className="benefit-icon">
                    ✓
                  </div>

                  <div>
                    <strong>AI-powered matching</strong>
                    <span>
                      Get AI job recommendations.
                    </span>
                  </div>
                </div>

                <div className="register-benefit">
                  <div className="benefit-icon">
                    ✓
                  </div>

                  <div>
                    <strong>ATS Scoring</strong>
                    <span>
                      Check job-resume compatibility.
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              RIGHT SIDE - FORM
          ================================================= */}

          <section className="register-form-section">

            <div className="register-form-header">

              <span className="register-mobile-brand">
                SwipeX
              </span>

              <h2>Create your account</h2>

              <p>
                Enter your details to get started with SwipeX.
              </p>

            </div>

            {error && (
              <div
                className="register-error"
                role="alert"
              >
                <span className="register-error-icon">
                  !
                </span>

                <span>{error}</span>
              </div>
            )}

            <form
              className="register-form"
              onSubmit={handleSubmit}
            >

              {/* =================================================
                  FULL NAME
              ================================================= */}

              <div className="register-field">

                <label htmlFor="fullName">
                  Full Name
                </label>

                <div className="register-input-wrapper">

                  <span className="register-input-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        d="M20 21a8 8 0 0 0-16 0"
                      />
                      <circle
                        cx="12"
                        cy="7"
                        r="4"
                      />
                    </svg>
                  </span>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />

                </div>

              </div>

              {/* =================================================
                  EMAIL
              ================================================= */}

              <div className="register-field">

                <label htmlFor="email">
                  Email Address
                </label>

                <div className="register-input-wrapper">

                  <span className="register-input-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                      />

                      <path
                        d="m3 7 9 6 9-6"
                      />
                    </svg>
                  </span>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />

                </div>

              </div>

              {/* =================================================
                  PHONE
              ================================================= */}

              <div className="register-field">

                <label htmlFor="phone">
                  Phone Number
                </label>

                <div className="register-input-wrapper">

                  <span className="register-input-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect
                        x="6"
                        y="2"
                        width="12"
                        height="20"
                        rx="2"
                      />

                      <path d="M10 18h4" />
                    </svg>
                  </span>

                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    inputMode="numeric"
                    maxLength="10"
                    value={formData.phone}
                    onChange={(event) => {
                      const value =
                        event.target.value.replace(/\D/g, "");

                      setFormData((previousData) => ({
                        ...previousData,
                        phone: value,
                      }));

                      setError("");
                    }}
                    autoComplete="tel"
                    required
                  />

                </div>

                <span className="register-field-hint">
                  Enter exactly 10 digits.
                </span>

              </div>

              {/* =================================================
                  PASSWORD
              ================================================= */}

              <div className="register-field">

                <label htmlFor="password">
                  Password
                </label>

                <div className="register-input-wrapper">

                  <span className="register-input-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="11"
                        rx="2"
                      />

                      <path
                        d="M8 10V7a4 4 0 0 1 8 0v3"
                      />
                    </svg>
                  </span>

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M3 3l18 18" />
                        <path
                          d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
                        />
                        <path
                          d="M9.9 5.2A10.5 10.5 0 0 1 12 5c5 0 8.5 5 8.5 7s-3.5 7-8.5 7a9.5 9.5 0 0 1-5.3-1.6"
                        />
                        <path
                          d="M6.5 15.3C4.8 14 3.5 12.2 3.5 12c0-1 1.1-2.8 3-4.4"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path
                          d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                        />
                      </svg>
                    )}
                  </button>

                </div>

                <span className="register-field-hint">
                  8–20 characters with uppercase, lowercase,
                  number and special character.
                </span>

              </div>

              {/* =================================================
                  CONFIRM PASSWORD
              ================================================= */}

              <div className="register-field">

                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <div className="register-input-wrapper">

                  <span className="register-input-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="11"
                        rx="2"
                      />

                      <path
                        d="M8 10V7a4 4 0 0 1 8 0v3"
                      />

                      <path d="m9 15 2 2 4-4" />
                    </svg>
                  </span>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previous) => !previous
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M3 3l18 18" />
                        <path
                          d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
                        />
                        <path
                          d="M9.9 5.2A10.5 10.5 0 0 1 12 5c5 0 8.5 5 8.5 7s-3.5 7-8.5 7a9.5 9.5 0 0 1-5.3-1.6"
                        />
                        <path
                          d="M6.5 15.3C4.8 14 3.5 12.2 3.5 12c0-1 1.1-2.8 3-4.4"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path
                          d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                        />
                      </svg>
                    )}
                  </button>

                </div>

              </div>

              {/* =================================================
                  CREATE ACCOUNT
              ================================================= */}

              <button
                type="submit"
                className="register-submit"
                disabled={isLoading}
              >

                {isLoading ? (
                  <>
                    <span className="register-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span className="register-submit-arrow">
                      →
                    </span>
                  </>
                )}

              </button>

            </form>

            {/* =================================================
                BOTTOM LOGIN
            ================================================= */}

            <p className="register-bottom-text">

              Already have a SwipeX account?

              <button
                type="button"
                onClick={() => navigate("/login")}
              >
                Login
              </button>

            </p>

            <p className="register-security-note">
              
            </p>

          </section>

        </div>

      </main>

    </div>
  );
}

export default Register;
