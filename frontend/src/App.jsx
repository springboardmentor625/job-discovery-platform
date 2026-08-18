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

  // ATS
  const [selectedJob, setSelectedJob] = useState(null);
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);

  // Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] =
    useState(false);

  // Swipe History
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [swipeLoading, setSwipeLoading] = useState(false);

  // ============================================================
  // REGISTRATION
  // ============================================================

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
        setMessage(
          "Registration successful! Please login."
        );

        setFullName("");
        setRegisterEmail("");
        setRegisterPassword("");

        setPage("login");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  // ============================================================
  // LOGIN
  // ============================================================

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

        const profileResponse = await fetch(
          "http://127.0.0.1:5000/api/profile",
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${data.access_token}`,
            },
          }
        );

        const profileData =
          await profileResponse.json();

        if (
          profileResponse.ok &&
          profileData.profile_exists
        ) {
          setPage("resume");
        } else {
          setPage("profile");
        }
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  // ============================================================
  // CREATE PROFILE
  // ============================================================

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const token =
      localStorage.getItem("access_token");

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
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            headline,
            summary,
            location,
            experience_years:
              experienceYears
                ? Number(experienceYears)
                : 0,
            education,
            projects,
            certifications,
            preferred_job_type:
              preferredJobType,
            preferred_location:
              preferredLocation,
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
      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  // ============================================================
  // RESUME UPLOAD
  // ============================================================

  const handleResumeUpload = async (e) => {
    e.preventDefault();

    setMessage("");
    setExtractedSkills([]);

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setMessage("Please login first.");
      setPage("login");
      return;
    }

    if (!resumeFile) {
      setMessage(
        "Please select a PDF resume."
      );
      return;
    }

    if (
      resumeFile.type !==
      "application/pdf"
    ) {
      setMessage(
        "Only PDF resumes are allowed."
      );
      return;
    }

    if (
      resumeFile.size >
      5 * 1024 * 1024
    ) {
      setMessage(
        "Resume must be smaller than 5 MB."
      );
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
            Authorization:
              `Bearer ${token}`,
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
      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  // ============================================================
  // GET JOBS
  // ============================================================

  const handleViewJobs = async () => {
    setMessage("");
    setJobsLoading(true);

    const token =
      localStorage.getItem("access_token");

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
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setJobs(data.jobs || []);
        setPage("jobs");
      } else {
        setMessage(
          data.message ||
            "Could not load jobs."
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

  // ============================================================
  // GET JOB RECOMMENDATIONS
  // ============================================================

  const handleViewRecommendations = async () => {
    setMessage("");
    setRecommendationsLoading(true);

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setMessage("Please login first.");
      setPage("login");
      setRecommendationsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/recommendations",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRecommendations(
          data.recommendations || []
        );

        setPage("recommendations");
      } else {
        setMessage(
          data.message ||
            "Could not load recommendations."
        );
      }
    } catch (error) {
      setMessage(
        "Could not connect to the backend."
      );
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // ============================================================
  // SWIPE JOB
  // ============================================================

  const handleSwipe = async (jobId, action) => {
    setMessage("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("Please login first.");
      setPage("login");
      return;
    }

    setSwipeLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/swipe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            job_id: jobId,
            swipe_action: action,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `Job ${action === "LEFT"
            ? "passed"
            : action === "RIGHT"
            ? "liked"
            : "saved"
          } successfully.`
        );

        // Remove the swiped job from the recommendation list
        setRecommendations((previous) =>
          previous.filter(
            (job) => job.job_id !== jobId
          )
        );
      } else {
        setMessage(
          data.message || "Could not record swipe."
        );
      }
    } catch (error) {
      setMessage(
        "Could not connect to the backend."
      );
    } finally {
      setSwipeLoading(false);
    }
  };

  // ============================================================
  // GET SWIPE HISTORY
  // ============================================================

  const handleViewSwipeHistory = async () => {
    setMessage("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("Please login first.");
      setPage("login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/swipe-history",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSwipeHistory(
          data.swipe_history || []
        );
        setPage("swipe-history");
      } else {
        setMessage(
          data.message ||
            "Could not load swipe history."
        );
      }
    } catch (error) {
      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  // ============================================================
  // ATS ANALYSIS
  // ============================================================

  const handleAnalyzeATS = async (job) => {
    setMessage("");
    setAtsResult(null);
    setSelectedJob(job);
    setAtsLoading(true);

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setMessage("Please login first.");
      setPage("login");
      setAtsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/ats/analyze/${job.job_id}`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAtsResult(data);
        setPage("ats");
      } else {
        setMessage(
          data.message ||
            "ATS analysis failed."
        );
      }
    } catch (error) {
      setMessage(
        "Could not connect to the backend."
      );
    } finally {
      setAtsLoading(false);
    }
  };

  // ============================================================
  // REGISTER PAGE
  // ============================================================

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
                setRegisterEmail(
                  e.target.value
                )
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
                setRegisterPassword(
                  e.target.value
                )
              }
              required
            />
          </div>

          <br />

          <button type="submit">
            Register
          </button>
        </form>

        {message && (
          <p>{message}</p>
        )}

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

  // ============================================================
  // LOGIN PAGE
  // ============================================================

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
                setPassword(
                  e.target.value
                )
              }
              required
            />
          </div>

          <br />

          <button type="submit">
            Login
          </button>
        </form>

        {message && (
          <p>{message}</p>
        )}

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

  // ============================================================
  // PROFILE PAGE
  // ============================================================

  if (page === "profile") {
    return (
      <div>
        <h1>SwipeX</h1>

        <h2>
          Complete Candidate Profile
        </h2>

        <form
          onSubmit={
            handleProfileSubmit
          }
        >
          <div>
            <label>Headline</label>
            <br />

            <input
              type="text"
              value={headline}
              onChange={(e) =>
                setHeadline(
                  e.target.value
                )
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
                setSummary(
                  e.target.value
                )
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
                setLocation(
                  e.target.value
                )
              }
              placeholder="Bangalore"
              required
            />
          </div>

          <br />

          <div>
            <label>
              Experience (Years)
            </label>
            <br />

            <input
              type="number"
              min="0"
              value={experienceYears}
              onChange={(e) =>
                setExperienceYears(
                  e.target.value
                )
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
                setEducation(
                  e.target.value
                )
              }
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
                setProjects(
                  e.target.value
                )
              }
            />
          </div>

          <br />

          <div>
            <label>
              Certifications
            </label>
            <br />

            <textarea
              value={certifications}
              onChange={(e) =>
                setCertifications(
                  e.target.value
                )
              }
            />
          </div>

          <br />

          <div>
            <label>
              Preferred Job Type
            </label>
            <br />

            <select
              value={
                preferredJobType
              }
              onChange={(e) =>
                setPreferredJobType(
                  e.target.value
                )
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
            <label>
              Preferred Location
            </label>
            <br />

            <input
              type="text"
              value={
                preferredLocation
              }
              onChange={(e) =>
                setPreferredLocation(
                  e.target.value
                )
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

        {message && (
          <p>{message}</p>
        )}
      </div>
    );
  }

  // ============================================================
  // RESUME PAGE
  // ============================================================

  if (page === "resume") {
    return (
      <div>
        <h1>SwipeX</h1>

        <h2>Upload Resume</h2>

        <p>
          Upload your resume in PDF
          format.
        </p>

        <form
          onSubmit={
            handleResumeUpload
          }
        >
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
            Selected:{" "}
            {resumeFile.name}
          </p>
        )}

        {message && (
          <p>{message}</p>
        )}

        {extractedSkills.length >
          0 && (
          <div>
            <h3>
              Detected Skills
            </h3>

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
              onClick={
                handleViewJobs
              }
              disabled={
                jobsLoading
              }
            >
              {jobsLoading
                ? "Loading Jobs..."
                : "View Jobs"}
            </button>

            <br />
            <br />

            <button
              type="button"
              onClick={
                handleViewRecommendations
              }
              disabled={
                recommendationsLoading
              }
            >
              {recommendationsLoading
                ? "Finding Jobs..."
                : "Recommended Jobs"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // JOBS PAGE
  // ============================================================

  if (page === "jobs") {
    return (
      <div>
        <h1>SwipeX</h1>

        <h2>
          Available Jobs
        </h2>

        {message && (
          <p>{message}</p>
        )}

        {jobs.length === 0 ? (
          <div>
            <p>
              No active jobs
              available.
            </p>

            <button
              type="button"
              onClick={() =>
                setPage("resume")
              }
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
                  border:
                    "1px solid #ccc",
                  padding: "20px",
                  marginBottom:
                    "20px",
                  borderRadius:
                    "8px",
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
                  {
                    job.employment_type
                  }
                </p>

                <p>
                  <strong>
                    Experience:
                  </strong>{" "}
                  {
                    job.experience_required
                  }
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
                    (
                      skill,
                      index
                    ) => (
                      <li
                        key={
                          index
                        }
                      >
                        {skill}
                      </li>
                    )
                  )}
                </ul>

                <button
                  type="button"
                  onClick={() =>
                    handleAnalyzeATS(
                      job
                    )
                  }
                  disabled={
                    atsLoading
                  }
                >
                  {atsLoading &&
                  selectedJob?.job_id ===
                    job.job_id
                    ? "Analyzing..."
                    : "Analyze ATS"}
                </button>
              </div>
            ))}

            <br />

            <button
              type="button"
              onClick={
                handleViewRecommendations
              }
              disabled={
                recommendationsLoading
              }
            >
              {recommendationsLoading
                ? "Finding Jobs..."
                : "View Recommended Jobs"}
            </button>

            <br />
            <br />

            <button
              type="button"
              onClick={() =>
                setPage("resume")
              }
            >
              Back to Resume
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // RECOMMENDATIONS PAGE
  // ============================================================

  if (page === "recommendations") {
    return (
      <div>
        <h1>SwipeX</h1>

        <h2>
          Recommended Jobs
        </h2>

        <p>
          Jobs recommended based on your
          skills and preferences.
        </p>

        {message && (
          <p>{message}</p>
        )}

        {recommendations.length === 0 ? (
          <div>
            <p>
              No recommendations available.
            </p>

            <button
              type="button"
              onClick={
                handleViewSwipeHistory
              }
            >
              Swipe History
            </button>

            <br />
            <br />

            <button
              type="button"
              onClick={() =>
                setPage("resume")
              }
            >
              Back to Resume
            </button>
          </div>
        ) : (
          <div>
            {recommendations.map(
              (job) => (
                <div
                  key={
                    job.recommendation_id
                  }
                  style={{
                    border:
                      "1px solid #ccc",
                    padding: "20px",
                    marginBottom:
                      "20px",
                    borderRadius:
                      "8px",
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
                      Recommendation Score:
                    </strong>{" "}
                    {
                      job.recommendation_score
                    }%
                  </p>

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
                    {
                      job.employment_type
                    }
                  </p>

                  <p>
                    <strong>
                      Experience:
                    </strong>{" "}
                    {
                      job.experience_required
                    }
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
                      Required Skills:
                    </strong>
                  </p>

                  <ul>
                    {job.required_skills?.map(
                      (
                        skill,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                        >
                          {skill}
                        </li>
                      )
                    )}
                  </ul>

                  <p>
                    <strong>
                      Why recommended:
                    </strong>{" "}
                    {
                      job.recommendation_reason
                    }
                  </p>

                  <br />

                  <button
                    type="button"
                    onClick={() =>
                      handleAnalyzeATS(
                        job
                      )
                    }
                  >
                    Analyze ATS
                  </button>

                  <br />
                  <br />

                  <button
                    type="button"
                    onClick={() =>
                      handleSwipe(
                        job.job_id,
                        "LEFT"
                      )
                    }
                    disabled={swipeLoading}
                  >
                     Pass
                  </button>

                  {" "}

                  <button
                    type="button"
                    onClick={() =>
                      handleSwipe(
                        job.job_id,
                        "SAVE"
                      )
                    }
                    disabled={swipeLoading}
                  >
                     Save
                  </button>

                  {" "}

                  <button
                    type="button"
                    onClick={() =>
                      handleSwipe(
                        job.job_id,
                        "RIGHT"
                      )
                    }
                    disabled={swipeLoading}
                  >
                    Like
                  </button>
                </div>
              )
            )}

            <button
              type="button"
              onClick={() =>
                setPage("jobs")
              }
            >
              View All Jobs
            </button>

            <br />
            <br />

            <button
              type="button"
              onClick={() =>
                setPage("resume")
              }
            >
              Back to Resume
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // SWIPE HISTORY PAGE
  // ============================================================

  if (page === "swipe-history") {
    return (
      <div>
        <h1>SwipeX</h1>

        <h2>Swipe History</h2>

        {message && (
          <p>{message}</p>
        )}

        {swipeHistory.length === 0 ? (
          <p>No swipe history yet.</p>
        ) : (
          <div>
            {swipeHistory.map((item) => (
              <div
                key={item.swipe_id}
                style={{
                  border: "1px solid #ccc",
                  padding: "15px",
                  marginBottom: "15px",
                  borderRadius: "8px",
                }}
              >
                <h3>{item.title}</h3>

                <h4>
                  {item.company_name}
                </h4>

                <p>
                  <strong>Action:</strong>{" "}
                  {item.swipe_action}
                </p>

                {item.swiped_at && (
                  <p>
                    <strong>Time:</strong>{" "}
                    {new Date(
                      item.swiped_at
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            setPage("recommendations")
          }
        >
          Back to Recommendations
        </button>

        <br />
        <br />

        <button
          type="button"
          onClick={() =>
            setPage("resume")
          }
        >
          Back to Resume
        </button>
      </div>
    );
  }

  // ============================================================
  // ATS RESULT PAGE
  // ============================================================

  if (page === "ats") {
    return (
      <div>
        <h1>SwipeX</h1>

        <h2>
          ATS Analysis
        </h2>

        {selectedJob && (
          <div>
            <h3>
              {selectedJob.title}
            </h3>

            <h4>
              {selectedJob.company_name}
            </h4>
          </div>
        )}

        {atsResult && (
          <div>
            <hr />

            <h3>
              ATS Score
            </h3>

            <h1>
              {atsResult.ats_score}%
            </h1>

            <h3>
              Match Percentage
            </h3>

            <h2>
              {
                atsResult.match_percentage
              }%
            </h2>

            <hr />

            <h3>
              Matched Skills
            </h3>

            {atsResult
              .matched_skills
              ?.length > 0 ? (
              <ul>
                {atsResult.matched_skills.map(
                  (
                    skill,
                    index
                  ) => (
                    <li
                      key={
                        index
                      }
                    >
                      {skill}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>
                No matched skills.
              </p>
            )}

            <h3>
              Missing Skills
            </h3>

            {atsResult
              .missing_skills
              ?.length > 0 ? (
              <ul>
                {atsResult.missing_skills.map(
                  (
                    skill,
                    index
                  ) => (
                    <li
                      key={
                        index
                      }
                    >
                      {skill}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>
                No missing skills 🎉
              </p>
            )}

            <h3>
              Suggestions
            </h3>

            <p>
              {
                atsResult.suggestions
              }
            </p>

            <br />

            <button
              type="button"
              onClick={() =>
                setPage("jobs")
              }
            >
              Back to Jobs
            </button>

            <br />
            <br />

            <button
              type="button"
              onClick={() =>
                setPage(
                  "recommendations"
                )
              }
            >
              Back to Recommendations
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default App;