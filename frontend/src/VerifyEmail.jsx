import { useState } from "react";
import axios from "axios";
import "./App.css";

function VerifyEmail({ email, onVerified }) {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/verify-email/",
        {
          email: email,
          otp: otp,
        }
      );

      setMessage(response.data.message);

      setTimeout(() => {
        onVerified();
      }, 1500);

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
      <div className="register-card">

        <div className="logo">
          SWIPEX
        </div>

        <div className="title">
          Verify Your Email
        </div>

        <p>
          We sent a 6-digit OTP to
        </p>

        <strong>
          {email}
        </strong>

        {message && (
          <div className="success-message">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleVerify}>

          <div className="form-group">
            <label>Enter OTP</label>

            <input
              type="text"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              required
            />
          </div>

          <button
            className="register-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default VerifyEmail;