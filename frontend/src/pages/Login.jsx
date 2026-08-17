import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (e) => {

    e.preventDefault();

    setError("");
    setLoading(true);


    // Remove accidental spaces

    const cleanEmail =
      email.trim().toLowerCase();


    try {

      const formData =
        new URLSearchParams();

      formData.append(
        "username",
        cleanEmail
      );

      formData.append(
        "password",
        password
      );


      const response = await api.post(
        "/api/auth/login",
        formData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );


      // ========================================
      // STORE AUTHENTICATION
      // ========================================

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      localStorage.setItem(
        "user_id",
        response.data.user_id
      );

      localStorage.setItem(
        "role",
        response.data.role
      );


      // ========================================
      // GO TO DASHBOARD
      // ========================================

      navigate("/candidate");


    } catch (error) {

      setError(
        error.response?.data?.detail ||
        "Login failed. Please check your email and password."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="login-page">

      <div className="login-card">


        <div className="login-logo">
          SwipeX
        </div>


        <h1>
          Welcome Back
        </h1>


        <p className="login-subtitle">
          Sign in to continue your job discovery
          journey
        </p>


        {/* ERROR */}

        {error && (

          <div className="login-error">

            {error}

          </div>

        )}


        <form onSubmit={handleLogin}>


          {/* ==================================
              EMAIL
          =================================== */}

          <div className="form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {

                setEmail(
                  e.target.value
                );

                setError("");

              }}
              required
            />

          </div>


          {/* ==================================
              PASSWORD
          =================================== */}

          <div className="form-group">

            <label>
              Password
            </label>


            <div className="password-input-wrapper">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {

                  setPassword(
                    e.target.value
                  );

                  setError("");

                }}
                required
              />


              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                {showPassword
                  ? "🙈"
                  : "👁️"}

              </button>

            </div>

          </div>


          {/* ==================================
              LOGIN BUTTON
          =================================== */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading
              ? "Signing in..."
              : "Sign In"}

          </button>


        </form>


        {/* ==================================
            REGISTER
        =================================== */}

        <p className="register-text">

          Don't have an account?{" "}

          <span
            onClick={() =>
              navigate("/register")
            }
          >
            Create account
          </span>

        </p>


      </div>

    </div>

  );

}

export default Login;