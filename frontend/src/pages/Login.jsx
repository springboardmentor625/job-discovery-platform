
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // =========================================================
  // PASSWORD VISIBILITY
  // =========================================================

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // =========================================================
  // LOGIN
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    // =========================================================
    // VALIDATION
    // =========================================================

    if (!email.trim()) {
      setError("Please enter your email.");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      setIsLoading(false);
      return;
    }

    // =========================================================
    // LOGIN API
    // =========================================================

    try {
      const response = await loginUser({
        email,
        password,
      });

      // =======================================================
      // DEBUGGING
      // =======================================================

      console.log(
        "FULL LOGIN RESPONSE:",
        response
      );

      console.log(
        "ACCESS TOKEN:",
        response.access_token
      );

      console.log(
        "TOKEN TYPE:",
        response.token_type
      );

      // =======================================================
      // SAVE JWT
      // =======================================================

      localStorage.setItem(
        "access_token",
        response.access_token
      );

      localStorage.setItem(
        "token_type",
        response.token_type || "Bearer"
      );

      console.log(
        "TOKEN STORED:",
        localStorage.getItem("access_token")
      );

      // =======================================================
      // CONTINUE TO DASHBOARD
      // =======================================================

      navigate("/dashboard");

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      // =======================================================
      // BACKEND ERROR
      // =======================================================

      if (error.response) {
        setError(
          error.response.data?.detail ||
          "Invalid email or password."
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
    <div className="login-page">

      {/* =====================================================
          LOGIN CARD
      ===================================================== */}

      <div className="login-container">

        {/* BRAND */}
        <div className="login-brand">
          SwipeX
        </div>

        <div className="login-brand-line"></div>


        {/* HEADING */}

        <h1 className="login-title">
          Welcome Back
        </h1>

        <p className="login-subtitle">
          Sign in to continue your job search
        </p>


        {/* ERROR */}

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >

          {/* EMAIL */}

          <div className="login-form-group">

            <label htmlFor="email">
              Email address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              autoComplete="email"
              required
            />

          </div>


          {/* PASSWORD */}

          <div className="login-form-group">

            <div className="login-password-header">

              <label htmlFor="password">
                Password
              </label>

            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
              }}
            >

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                required
                style={{
                  width: "100%",
                  paddingRight: "45px",
                  boxSizing: "border-box",
                }}
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
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  padding: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >

                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    width="18"
                    height="18"
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
                    width="18"
                    height="18"
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


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="login-submit-button"
            disabled={isLoading}
          >

            {isLoading
              ? "Signing in..."
              : "Sign In"}

          </button>

        </form>


        {/* REGISTER */}

        <div className="login-register">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            className="login-register-button"
            onClick={() => navigate("/register")}
          >
            Create an account
          </button>

        </div>


        {/* BACK TO HOME */}

        <button
          type="button"
          className="login-back-button"
          onClick={() => navigate("/")}
        >
          ← Back to SwipeX
        </button>

      </div>

    </div>
  );
}

export default Login;
