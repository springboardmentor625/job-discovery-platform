import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Login:", {
      email,
      password,
    });

    alert("Login successful!");

    navigate("/complete-profile");
  };

  return (
    <div className="page">
      <div className="form-container">

        <h1>Welcome Back</h1>

        <p className="form-subtitle">
          Login to your SwipeX candidate account
        </p>

        <form onSubmit={handleSubmit}>

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="primary-button"
          >
            Login
          </button>

        </form>

        <p className="bottom-text">
          Don't have an account?

          <button
            type="button"
            className="link-button"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </p>

      </div>
    </div>
  );
}

export default Login;