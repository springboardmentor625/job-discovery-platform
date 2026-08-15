import { useState } from "react";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName,
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      setMessage(data.message);

      if (response.ok) {
        setFullName("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      setMessage("Could not connect to the backend.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(`Welcome, ${data.full_name}! Login successful.`);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Could not connect to the backend.");
    }
  };

  return (
    <div>
      <h1>SwipeX</h1>

      {!isLogin ? (
        <>
          <h2>Create Candidate Account</h2>

          <form onSubmit={handleRegister}>
            <div>
              <label>Full Name</label>
              <br />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <br />

            <div>
              <label>Email</label>
              <br />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <br />

            <div>
              <label>Password</label>
              <br />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <br />

            <button type="submit">Register</button>
          </form>

          <p>
            Already have an account?{" "}
            <button type="button" onClick={() => {
              setIsLogin(true);
              setMessage("");
            }}>
              Login
            </button>
          </p>
        </>
      ) : (
        <>
          <h2>Candidate Login</h2>

          <form onSubmit={handleLogin}>
            <div>
              <label>Email</label>
              <br />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <br />

            <div>
              <label>Password</label>
              <br />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <br />

            <button type="submit">Login</button>
          </form>

          <p>
            Don't have an account?{" "}
            <button type="button" onClick={() => {
              setIsLogin(false);
              setMessage("");
            }}>
              Register
            </button>
          </p>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default App;