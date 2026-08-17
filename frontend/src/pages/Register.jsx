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

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);


  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    // Only allow digits for mobile number
    if (name === "phone") {

      if (!/^\d*$/.test(value)) {
        return;
      }

      if (value.length > 10) {
        return;
      }
    }

    setForm({
      ...form,
      [name]: value,
    });

    setError("");
  };


  // ==========================================
  // REGISTER
  // ==========================================

  const handleRegister = async (e) => {

    e.preventDefault();

    setError("");
    setSuccess("");


    // ========================================
    // FULL NAME
    // ========================================

    const fullName = form.full_name.trim();

    if (!fullName) {

      setError(
        "Please enter your full name."
      );

      return;
    }


    // ========================================
    // EMAIL
    // ========================================

    const email =
      form.email.trim().toLowerCase();

    const emailPattern =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;


    if (!emailPattern.test(email)) {

      setError(
        "Please enter a valid email address."
      );

      return;
    }


    // ========================================
    // MOBILE NUMBER
    // ========================================

    if (!/^[0-9]{10}$/.test(form.phone)) {

      setError(
        "Mobile number must contain exactly 10 digits."
      );

      return;
    }


    // ========================================
    // PASSWORD
    // ========================================

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


    if (
      !/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];']/.test(
        form.password
      )
    ) {

      setError(
        "Password must contain at least one special character."
      );

      return;
    }


    // ========================================
    // START REGISTRATION
    // ========================================

    setLoading(true);


    try {

      const response = await api.post(
        "/api/auth/register",
        null,
        {
          params: {
            full_name: fullName,
            email: email,
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


      setShowPassword(false);


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
          Create Account
        </h1>


        <p className="login-subtitle">
          Create your candidate account
        </p>


        {/* ERROR */}

        {error && (

          <div className="login-error">

            {error}

          </div>

        )}


        {/* SUCCESS */}

        {success && (

          <div className="success-message">

            {success}

          </div>

        )}


        <form onSubmit={handleRegister}>


          {/* ==================================
              FULL NAME
          =================================== */}

          <div className="form-group">

            <label>
              Full Name
            </label>

            <input
              type="text"
              name="full_name"
              placeholder="Enter your full name"
              value={form.full_name}
              onChange={handleChange}
              required
            />

          </div>


          {/* ==================================
              EMAIL
          =================================== */}

          <div className="form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              value={form.email}
              onChange={handleChange}
              required
            />

          </div>


          {/* ==================================
              MOBILE
          =================================== */}

          <div className="form-group">

            <label>
              Mobile Number
            </label>

            <input
              type="tel"
              name="phone"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={handleChange}
              maxLength={10}
              inputMode="numeric"
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
                name="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
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


            <small className="password-hint">

              Password must contain 8+ characters,
              uppercase, lowercase, number and
              special character.

            </small>

          </div>


          {/* ==================================
              REGISTER BUTTON
          =================================== */}

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
            onClick={() =>
              navigate("/login")
            }
          >
            Sign In
          </span>

        </p>


      </div>

    </div>

  );
}

export default Register;