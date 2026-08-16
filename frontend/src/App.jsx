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

  // Resume
  const [resumeFile, setResumeFile] = useState(null);
  const [extractedSkills, setExtractedSkills] = useState([]);

  // Jobs
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

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
        localStorage.setItem(
          "access_token",
          data.access_token
        );

        setMessage(
          `Welcome, ${data.full_name}! Login successful.`
        );

        // Check whether profile already exists
        const profileResponse = await fetch(
          "http://127.0.0.1:5000/api/profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          }
        );

        const profileData = await profileResponse.json();

        if (
          profileResponse.ok &&
          profileData.profile_exists
        ) {
          // Existing candidate → resume
          setPage("resume");
        } else {
          // New candidate → profile
          setPage("profile");
        }
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

        setPage("resume");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Could not connect to the backend.");
    }
  };

  // =========================
  // Resume Upload
  // =========================

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    setMessage("");
    setExtractedSkills([]);

    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("Please login first.");
      setPage("login");
      return;
    }

    if (!resumeFile) {
      setMessage("Please select a PDF resume.");
      return;
    }

    if (resumeFile.type !== "application/pdf") {
      setMessage("Only PDF resumes are allowed.");
      return;
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      setMessage("Resume must be smaller than 5 MB.");
      return;
    }

    const formData = new FormData();

    formData.append(
      "resume",
      resumeFile
    );

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/resume",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `Resume uploaded and parsed successfully! Resume ID: ${data.resume_id}`
        );

        setExtractedSkills(
          data.extracted_skills || []
        );

        setResumeFile(null);

        e.target.reset();
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Could not connect to the backend.");
    }
  };

  // =========================
  // GET JOBS
  // =========================

  const handleViewJobs = async () => {
    setMessage("");
    setJobsLoading(true);

    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("Please login first.");
      setPage("login");
      setJobsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/jobs",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setJobs(data.jobs || []);
        setPage("jobs");
      } else {
        setMessage(
          data.message || "Could not load jobs."
        );
      }
    } catch (error) {
      setMessage(
        "Could not connect to the backend."
      );
    } finally {
      setJobsLoading(false);
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
              onChange={(e) =>
                setFullName(e.target.value)
              }
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
              onChange={(e) =>
                setRegisterEmail(e.target.value)
              }
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
              onChange={(e) =>
                setRegisterPassword(e.target.value)
              }
              required
            />
          </div>

          <br />

          <button type="submit">
            Register
          </button>
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
              onChange={(e) =>
                setEmail(e.target.value)
              }
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
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>

          <br />

          <button type="submit">
            Login
          </button>
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

  if (page === "profile") {
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
              onChange={(e) =>
                setHeadline(e.target.value)
              }
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
              onChange={(e) =>
                setSummary(e.target.value)
              }
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
              onChange={(e) =>
                setLocation(e.target.value)
              }
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
              onChange={(e) =>
                setExperienceYears(e.target.value)
              }
              required
            />
          </div>

          <br />

          <div>
            <label>Education</label>
            <br />

            <textarea
              value={education}
              onChange={(e) =>
                setEducation(e.target.value)
              }
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
              onChange={(e) =>
                setProjects(e.target.value)
              }
              placeholder="Describe your projects"
            />
          </div>

          <br />

          <div>
            <label>Certifications</label>
            <br />

            <textarea
              value={certifications}
              onChange={(e) =>
                setCertifications(e.target.value)
              }
              placeholder="Python, AWS, etc."
            />
          </div>

          <br />

          <div>
            <label>Preferred Job Type</label>
            <br />

            <select
              value={preferredJobType}
              onChange={(e) =>
                setPreferredJobType(e.target.value)
              }
              required
            >
              <option value="">
                Select
              </option>

              <option value="Full-time">
                Full-time
              </option>

              <option value="Part-time">
                Part-time
              </option>

              <option value="Internship">
                Internship
              </option>

              <option value="Contract">
                Contract
              </option>
            </select>
          </div>

          <br />

          <div>
            <label>Preferred Location</label>
            <br />

            <input
              type="text"
              value={preferredLocation}
              onChange={(e) =>
                setPreferredLocation(e.target.value)
              }
              placeholder="Bangalore"
              required
            />
          </div>

          <br />

          <button type="submit">
            Save Profile
          </button>
        </form>

        {message && <p>{message}</p>}
      </div>
    );
  }

  // =========================
  // RESUME UPLOAD PAGE
  // =========================

  if (page === "resume") {
    return (
      <div>
        <h1>SwipeX</h1>

        <h2>Upload Resume</h2>

        <p>
          Upload your resume in PDF format.
        </p>

        <form onSubmit={handleResumeUpload}>
          <div>
            <label>
              Select Resume
            </label>

            <br />

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) =>
                setResumeFile(
                  e.target.files[0]
                )
              }
              required
            />
          </div>

          <br />

          <button type="submit">
            Upload Resume
          </button>
        </form>

        {resumeFile && (
          <p>
            Selected: {resumeFile.name}
          </p>
        )}

        {message && (
          <p>{message}</p>
        )}

        {extractedSkills.length > 0 && (
          <div>
            <h3>Detected Skills</h3>

            <ul>
              {extractedSkills.map(
                (skill, index) => (
                  <li key={index}>
                    {skill}
                  </li>
                )
              )}
            </ul>

            <br />

            <button
              type="button"
              onClick={handleViewJobs}
              disabled={jobsLoading}
            >
              {jobsLoading
                ? "Loading Jobs..."
                : "View Jobs"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================
  // JOBS PAGE
  // =========================

  if (page === "jobs") {
    return (
      <div>
        <h1>SwipeX</h1>

        <h2>Available Jobs</h2>

        {message && (
          <p>{message}</p>
        )}

        {jobs.length === 0 ? (
          <div>
            <p>
              No active jobs available.
            </p>

            <button
              type="button"
              onClick={() => setPage("resume")}
            >
              Back to Resume
            </button>
          </div>
        ) : (
          <div>
            {jobs.map((job) => (
              <div
                key={job.job_id}
                style={{
                  border: "1px solid #ccc",
                  padding: "20px",
                  marginBottom: "20px",
                  borderRadius: "8px",
                }}
              >
                <h3>
                  {job.title}
                </h3>

                <h4>
                  {job.company_name}
                </h4>

                <p>
                  <strong>
                    Location:
                  </strong>{" "}
                  {job.location}
                </p>

                <p>
                  <strong>
                    Employment:
                  </strong>{" "}
                  {job.employment_type}
                </p>

                <p>
                  <strong>
                    Experience:
                  </strong>{" "}
                  {job.experience_required}
                </p>

                <p>
                  <strong>
                    Salary:
                  </strong>{" "}
                  ₹
                  {job.salary_min?.toLocaleString(
                    "en-IN"
                  )}
                  {" - "}
                  ₹
                  {job.salary_max?.toLocaleString(
                    "en-IN"
                  )}
                </p>

                <p>
                  <strong>
                    Description:
                  </strong>
                </p>

                <p>
                  {job.description}
                </p>

                <p>
                  <strong>
                    Required Skills:
                  </strong>
                </p>

                <ul>
                  {job.required_skills?.map(
                    (skill, index) => (
                      <li key={index}>
                        {skill}
                      </li>
                    )
                  )}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    setMessage(
                      `Selected job: ${job.title}`
                    );
                  }}
                >
                  View Job
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setPage("resume")}
            >
              Back to Resume
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default App;