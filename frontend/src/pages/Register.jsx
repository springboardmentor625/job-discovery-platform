import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  };

  const validateForm = () => {
    const {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
    } = formData;

    // Full name
    if (fullName.trim().length < 2) {
      return "Full name must contain at least 2 characters.";
    }

    // Email
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return "Please enter a valid email address.";
    }

    // Phone
    if (!/^\d+$/.test(phone)) {
      return "Phone number must contain only numbers.";
    }

    if (phone.length !== 10) {
      return "Phone number must contain exactly 10 digits.";
    }

    // Password
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

    if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]/`~';+=]/.test(password)) {
      return "Password must contain at least one special character.";
    }

    // Confirm password
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    /*
     * Account creation successful.
     *
     * We directly move to Complete Profile.
     * Login page is NOT shown here.
     */

    navigate("/complete-profile");
  };

  return (
    <div className="page">

      <div className="form-container">

        <h1>Create Account</h1>

        <p className="form-subtitle">
          Create your SwipeX candidate account
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* FULL NAME */}

          <div className="form-group">

            <label htmlFor="fullName">
              Full Name
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />

          </div>

          {/* EMAIL */}

          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />

          </div>

          {/* PHONE */}

          <div className="form-group">

            <label htmlFor="phone">
              Phone Number
            </label>

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
              placeholder="Enter 10-digit phone number"
              required
            />

          </div>

          {/* PASSWORD */}

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="password-wrapper">

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
                placeholder="Enter password"
                required
              />

              <button
                type="button"
                className="password-eye"
                onClick={() =>
                  setShowPassword(
                    (previousValue) =>
                      !previousValue
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>

            </div>

            <p className="field-hint">
              8–20 characters, including uppercase,
              lowercase, number and special character.
            </p>

          </div>

          {/* CONFIRM PASSWORD */}

          <div className="form-group">

            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <div className="password-wrapper">

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
                placeholder="Re-enter password"
                required
              />

              <button
                type="button"
                className="password-eye"
                onClick={() =>
                  setShowConfirmPassword(
                    (previousValue) =>
                      !previousValue
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showConfirmPassword
                  ? "🙈"
                  : "👁️"}
              </button>

            </div>

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            className="primary-button"
          >
            Create Account
          </button>

        </form>

      </div>

    </div>
  );
}

export default Register;