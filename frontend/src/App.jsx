import { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import VerifyEmail from "./VerifyEmail";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
import "./App.css";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/register/`,
        {
          full_name: fullName,
          phone: phone,
          email: email,
          password: password,
        }
      );

      setRegisteredEmail(email);
      setShowVerifyEmail(true);

      setFullName("");
      setPhone("");
      setEmail("");
      setPassword("");

      if (response.data?.message) {
        setMessage(response.data.message);
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

  /* =========================
     DASHBOARD
  ========================= */

  if (showDashboard) {
    return (
      <Dashboard
        user={loggedInUser}
        onLogout={() => {
          setLoggedInUser(null);
          setShowDashboard(false);
        }}
      />
    );
  }

  /* =========================
     LOGIN
  ========================= */

  if (showLogin) {
    return (
      <Login
        onBackToRegister={() => setShowLogin(false)}
        onLoginSuccess={(user) => {
          setLoggedInUser(user);
          setShowLogin(false);
          setShowDashboard(true);
        }}
      />
    );
  }

  /* =========================
     EMAIL VERIFICATION
  ========================= */

  if (showVerifyEmail) {
    return (
      <VerifyEmail
        email={registeredEmail}
        onVerified={() => {
          setShowVerifyEmail(false);
          setShowLogin(true);
        }}
      />
    );
  }

  /* =========================
     REGISTER PAGE
  ========================= */

  return (
    <div className="register-page">

      {/* Decorative background elements */}
      <div className="background-circle circle-one"></div>
      <div className="background-circle circle-two"></div>
      <div className="background-circle circle-three"></div>

      <div className="register-container">

        {/* =========================
            LEFT BRANDING SECTION
        ========================= */}

        <div className="register-brand">

          <div className="brand-content">

            <div className="brand-logo">
              SWIPEX
            </div>

            <div className="brand-line"></div>

            <h1>
              Discover your
              <span> next opportunity.</span>
            </h1>

            <p className="brand-description">
              Find the right jobs, discover new opportunities,
              and take the next step toward your career goals.
            </p>

            <div className="brand-features">

              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Discover Opportunities</strong>
                  <p>Explore opportunities that match your goals.</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Build Your Career</strong>
                  <p>Create your profile and showcase your skills.</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Find Your Match</strong>
                  <p>Connect with opportunities that fit you.</p>
                </div>
              </div>

            </div>

          </div>

          <div className="brand-footer">
            © 2026 SWIPEX. All rights reserved.
          </div>

        </div>

        {/* =========================
            RIGHT REGISTER SECTION
        ========================= */}

        <div className="register-card">

          <div className="form-header">

            <div className="mobile-logo">
              SWIPEX
            </div>

            <h2>Create your account</h2>

            <p>
              Get started with SWIPEX today
            </p>

          </div>

          {/* SUCCESS MESSAGE */}

          {message && (
            <div className="success-message">
              <span className="message-icon">✓</span>
              <span>{message}</span>
            </div>
          )}

          {/* ERROR MESSAGE */}

          {error && (
            <div className="error-message">
              <span className="message-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* REGISTER FORM */}

          <form onSubmit={handleRegister}>

            {/* FULL NAME */}

            <div className="form-group">

              <label htmlFor="fullName">
                Full Name
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  👤
                </span>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  required
                />

              </div>

            </div>

            {/* MOBILE NUMBER */}

            <div className="form-group">

              <label htmlFor="phone">
                Mobile Number
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  📱
                </span>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="Enter your mobile number"
                  required
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="email"
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

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Create a password"
                  required
                />

              </div>

            </div>

            {/* REGISTER BUTTON */}

            <button
              className="register-button"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>

          </form>

          {/* LOGIN LINK */}

          <div className="switch-page">

            <span>
              Already have an account?
            </span>

            <button
              className="link-button"
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>

          </div>

          <div className="terms-text">
            By creating an account, you agree to our
            <span> Terms of Service </span>
            and
            <span> Privacy Policy.</span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default App;