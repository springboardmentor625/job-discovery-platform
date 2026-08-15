import { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("login");
  const [message, setMessage] = useState("");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registration
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // Candidate Profile
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [location, setLocation] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [education, setEducation] = useState("");
  const [projects, setProjects] = useState("");
  const [certifications, setCertifications] = useState("");
  const [preferredJobType, setPreferredJobType] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");

  // =========================
  // Registration
  // =========================

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

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
            email: registerEmail,
            password: registerPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Registration successful! Please login.");

        setFullName("");
        setRegisterEmail("");
        setRegisterPassword("");

        setPage("login");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Could not connect to the backend.");
    }
  };

  // =========================
  // Login
  // =========================

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Store JWT
        localStorage.setItem("access_token", data.access_token);

        setMessage(`Welcome, ${data.full_name}! Login successful.`);

        // Go to profile
        setPage("profile");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Could not connect to the backend.");
    }
  };

  // =========================
  // Candidate Profile
  // =========================

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("Please login first.");
      setPage("login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            headline,
            summary,
            location,
            experience_years: experienceYears
              ? Number(experienceYears)
              : 0,
            education,
            projects,
            certifications,
            preferred_job_type: preferredJobType,
            preferred_location: preferredLocation,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Could not connect to the backend.");
    }
  };

  // =========================
  // REGISTER PAGE
  // =========================

  if (page === "register") {
    return (
      <div>
        <h1>SwipeX</h1>

        <h2>Candidate Registration</h2>

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
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
            />
          </div>

          <br />

          <div>
            <label>Password</label>
            <br />
            <input
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
            />
          </div>

          <br />

          <button type="submit">Register</button>
        </form>

        {message && <p>{message}</p>}

        <p>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => {
              setMessage("");
              setPage("login");
            }}
          >
            Login
          </button>
        </p>
      </div>
    );
  }

  // =========================
  // LOGIN PAGE
  // =========================

  if (page === "login") {
    return (
      <div>
        <h1>SwipeX</h1>

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

        {message && <p>{message}</p>}

        <p>
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => {
              setMessage("");
              setPage("register");
            }}
          >
            Register
          </button>
        </p>
      </div>
    );
  }

  // =========================
  // COMPLETE PROFILE PAGE
  // =========================

  return (
    <div>
      <h1>SwipeX</h1>

      <h2>Complete Candidate Profile</h2>

      <form onSubmit={handleProfileSubmit}>
        <div>
          <label>Headline</label>
          <br />
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="AIML Student"
            required
          />
        </div>

        <br />

        <div>
          <label>Summary</label>
          <br />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Tell us about yourself"
            required
          />
        </div>

        <br />

        <div>
          <label>Location</label>
          <br />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bangalore"
            required
          />
        </div>

        <br />

        <div>
          <label>Experience (Years)</label>
          <br />
          <input
            type="number"
            min="0"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Education</label>
          <br />
          <textarea
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="BE in Artificial Intelligence and Machine Learning"
            required
          />
        </div>

        <br />

        <div>
          <label>Projects</label>
          <br />
          <textarea
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
            placeholder="Describe your projects"
          />
        </div>

        <br />

        <div>
          <label>Certifications</label>
          <br />
          <textarea
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            placeholder="Python, AWS, etc."
          />
        </div>

        <br />

        <div>
          <label>Preferred Job Type</label>
          <br />
          <select
            value={preferredJobType}
            onChange={(e) => setPreferredJobType(e.target.value)}
            required
          >
            <option value="">Select</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
        </div>

        <br />

        <div>
          <label>Preferred Location</label>
          <br />
          <input
            type="text"
            value={preferredLocation}
            onChange={(e) => setPreferredLocation(e.target.value)}
            placeholder="Bangalore"
            required
          />
        </div>

        <br />

        <button type="submit">Save Profile</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default App;