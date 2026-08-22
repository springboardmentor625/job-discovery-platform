import { useState } from "react";
import axios from "axios";

function Login({ onBackToRegister, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/login/",
        {
          email: email,
          password: password,
        }
      );

      setMessage(response.data.message);

      console.log("Login successful:", response.data);
  
      localStorage.setItem("swipex_token", response.data.token);

      if (onLoginSuccess) {
        onLoginSuccess(response.data.user);
      }
    } catch (error) {
      if (error.response?.data) {
        const errors = error.response.data;

        const errorMessages = Object.values(errors)
          .flat()
          .join(" ");

        setError(errorMessages);
      } else {
        setError("Unable to connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* Decorative background */}
      <div className="background-circle circle-one"></div>
      <div className="background-circle circle-two"></div>
      <div className="background-circle circle-three"></div>

      <div className="register-container">

        {/* =========================
            LEFT BRANDING
        ========================= */}

        <div className="register-brand">

          <div className="brand-content">

            <div className="brand-logo">
              SWIPEX
            </div>

            <div className="brand-line"></div>

            <h1>
              Welcome
              <span>back.</span>
            </h1>

            <p className="brand-description">
              Continue your journey with SWIPEX and
              discover opportunities that match your
              career goals.
            </p>

            <div className="brand-features">

              <div className="feature-item">
                <div className="feature-icon">✓</div>

                <div>
                  <strong>Discover Opportunities</strong>
                  <p>
                    Explore opportunities that match
                    your goals.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">✓</div>

                <div>
                  <strong>Build Your Career</strong>
                  <p>
                    Keep growing and move closer to
                    your career goals.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">✓</div>

                <div>
                  <strong>Find Your Match</strong>
                  <p>
                    Connect with opportunities that
                    fit you.
                  </p>
                </div>
              </div>

            </div>

          </div>

          <div className="brand-footer">
            © 2026 SWIPEX. All rights reserved.
          </div>

        </div>

        {/* =========================
            LOGIN FORM
        ========================= */}

        <div className="register-card">

          <div className="form-header">

            <div className="mobile-logo">
              SWIPEX
            </div>

            <h2>
              Welcome Back
            </h2>

            <p>
              Login to continue to your account
            </p>

          </div>

          {/* SUCCESS MESSAGE */}

          {message && (
            <div className="success-message">
              <span className="message-icon">✓</span>

              <span>
                {message}
              </span>
            </div>
          )}

          {/* ERROR MESSAGE */}

          {error && (
            <div className="error-message">
              <span className="message-icon">!</span>

              <span>
                {error}
              </span>
            </div>
          )}

          {/* LOGIN FORM */}

          <form onSubmit={handleLogin}>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="login-email">
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email address"
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="login-password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  required
                />

              </div>

            </div>

            {/* LOGIN BUTTON */}

            <button
              className="register-button"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>

          </form>

          {/* CREATE ACCOUNT */}

          <div className="switch-page">

            <span>
              Don't have an account?
            </span>

            <button
              className="link-button"
              onClick={onBackToRegister}
            >
              Create Account
            </button>

          </div>

          <div className="terms-text">
            By continuing, you agree to our
            <span> Terms of Service </span>
            and
            <span> Privacy Policy.</span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;