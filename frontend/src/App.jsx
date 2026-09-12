import { useState, useEffect, useRef } from "react";
import "./App.css";

const API = "http://127.0.0.1:5000";

const VALID_PAGES = [
  "login",
  "register",
  "profile",
  "resume",
  "jobs",
  "recommendations",
  "swipe-history",
  "ats",
];

function App() {
  // ============================================================
  // PAGE / BROWSER HISTORY
  // ============================================================

  const getInitialPage = () => {
    const hash = window.location.hash.replace("#", "");
    const hasToken = Boolean(localStorage.getItem("access_token"));

    if (
      hasToken &&
      VALID_PAGES.includes(hash) &&
      hash !== "login" &&
      hash !== "register"
    ) {
      return hash;
    }

    return "login";
  };

  const [page, setPage] = useState(getInitialPage);

  const navigationFromBrowser = useRef(false);
  const replaceNextNavigation = useRef(false);

  // ============================================================
  // GENERAL
  // ============================================================

  const [message, setMessage] = useState("");

  // Authentication
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
  // Jobs
const [jobs, setJobs] = useState([]);
const [jobsLoading, setJobsLoading] = useState(false);
const [jobsPage, setJobsPage] = useState(1);
const [jobsPagination, setJobsPagination] = useState(null);

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
  // SWIPE GESTURE STATE
  // ============================================================

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeAnimating, setSwipeAnimating] = useState(false);

  const dragStartX = useRef(0);
  const dragPointerId = useRef(null);

  const token = () => localStorage.getItem("access_token");

  // ============================================================
  // NAVIGATION
  // ============================================================

  const go = (nextPage) => {
    setMessage("");

    if (!VALID_PAGES.includes(nextPage)) {
      return;
    }

    if (nextPage === page) {
      return;
    }

    window.history.pushState(
      { page: nextPage },
      "",
      `#${nextPage}`
    );

    setPage(nextPage);
  };

  // ============================================================
  // BROWSER BACK / FORWARD
  // ============================================================

  useEffect(() => {
    window.history.replaceState(
      { page },
      "",
      `#${page}`
    );

    const handlePopState = (event) => {
      const previousPage = event.state?.page;

      if (
        previousPage &&
        VALID_PAGES.includes(previousPage)
      ) {
        navigationFromBrowser.current = true;

        setMessage("");
        setPage(previousPage);

        return;
      }

      if (!token()) {
        setPage("login");
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  // ============================================================
  // KEEP DIRECT setPage() CALLS IN SYNC WITH BROWSER HISTORY
  // ============================================================

  useEffect(() => {
    if (navigationFromBrowser.current) {
      navigationFromBrowser.current = false;
      return;
    }

    if (replaceNextNavigation.current) {
      replaceNextNavigation.current = false;

      window.history.replaceState(
        { page },
        "",
        `#${page}`
      );

      return;
    }

    if (window.history.state?.page === page) {
      return;
    }

    window.history.pushState(
      { page },
      "",
      `#${page}`
    );
  }, [page]);

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await response.json();

console.log("JOBS API STATUS:", response.status);
console.log("JOBS API COUNT:", data.jobs?.length);
console.log("FIRST 10 JOBS:", data.jobs?.slice(0, 10));
      if (response.ok) {
        setMessage(
          "Registration successful! Please login."
        );

        setFullName("");
        setRegisterEmail("");
        setRegisterPassword("");

        go("login");
      } else {
        setMessage(
          data.message || "Registration failed."
        );
      }
    } catch {
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
      const response = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

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
          `${API}/api/profile`,
          {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          }
        );

        const profileData =
          await profileResponse.json();

        if (
          profileResponse.ok &&
          profileData.profile_exists
        ) {
          replaceNextNavigation.current = true;

          window.history.replaceState(
            { page: "resume" },
            "",
            "#resume"
          );

          setPage("resume");
        } else {
          replaceNextNavigation.current = true;

          window.history.replaceState(
            { page: "profile" },
            "",
            "#profile"
          );

          setPage("profile");
        }
      } else {
        setMessage(
          data.message ||
            "Invalid email or password."
        );
      }
    } catch {
      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  // ============================================================
  // PROFILE
  // ============================================================

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const authToken = token();

    if (!authToken) {
      setMessage("Please login first.");

      replaceNextNavigation.current = true;

      window.history.replaceState(
        { page: "login" },
        "",
        "#login"
      );

      setPage("login");

      return;
    }

    try {
      const response = await fetch(
        `${API}/api/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
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
        setMessage(
          data.message ||
            "Could not save profile."
        );
      }
    } catch {
      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  // ============================================================
  // RESUME
  // ============================================================

  const handleResumeUpload = async (e) => {
    e.preventDefault();

    setMessage("");
    setExtractedSkills([]);

    const authToken = token();

    if (!authToken) {
      setMessage("Please login first.");

      replaceNextNavigation.current = true;

      window.history.replaceState(
        { page: "login" },
        "",
        "#login"
      );

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

    if (resumeFile.size > 5 * 1024 * 1024) {
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
        `${API}/api/resume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
  "Resume uploaded and parsed successfully!"
);

        setExtractedSkills(
          data.extracted_skills || []
        );

        setResumeFile(null);

        e.target.reset();
      } else {
        setMessage(
          data.message ||
            "Resume upload failed."
        );
      }
    } catch {
      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  // ============================================================
  // JOBS
  // ============================================================

  const handleViewJobs = async (pageNumber = 1) => {
  setMessage("");
  setJobsLoading(true);

  const authToken = token();

  if (!authToken) {
    setMessage("Please login first.");

    replaceNextNavigation.current = true;

    window.history.replaceState(
      { page: "login" },
      "",
      "#login"
    );

    setPage("login");

    setJobsLoading(false);

    return;
  }

  try {
    const response = await fetch(
      `${API}/api/jobs?page=${pageNumber}&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    console.log("JOBS API STATUS:", response.status);
    console.log("JOBS API COUNT:", data.jobs?.length);
    console.log("JOBS PAGINATION:", data.pagination);
    console.log(
      "FIRST 10 JOBS:",
      data.jobs?.slice(0, 10)
    );

    if (response.ok) {
      setJobs((prevJobs) => [
  ...prevJobs,
  ...(data.jobs || [])
]);
      setJobsPage(pageNumber);
      setJobsPagination(data.pagination || null);
      setPage("jobs");
    } else {
      setMessage(
        data.message ||
          "Could not load jobs."
      );
    }
  } catch {
    setMessage(
      "Could not connect to the backend."
    );
  } finally {
    setJobsLoading(false);
  }
};

  // ============================================================
  // RECOMMENDATIONS
  // ============================================================

  const handleViewRecommendations =
    async () => {
      setMessage("");
      setRecommendationsLoading(true);

      const authToken = token();

      if (!authToken) {
        setMessage("Please login first.");

        replaceNextNavigation.current = true;

        window.history.replaceState(
          { page: "login" },
          "",
          "#login"
        );

        setPage("login");

        setRecommendationsLoading(false);

        return;
      }

      try {
        const response = await fetch(
          `${API}/api/recommendations`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const data = await response.json();

        console.log(
  "RECOMMENDATION COUNT:",
  data.recommendations?.length
);

console.log(
  "RECOMMENDATIONS:",
  data.recommendations
);

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
      } catch {
        setMessage(
          "Could not connect to the backend."
        );
      } finally {
        setRecommendationsLoading(
          false
        );
      }
    };

  // ============================================================
  // SWIPE API
  // ============================================================

  const handleSwipe = async (
    jobId,
    action
  ) => {
    setMessage("");

    const authToken = token();

    if (!authToken) {
      setMessage("Please login first.");

      replaceNextNavigation.current = true;

      window.history.replaceState(
        { page: "login" },
        "",
        "#login"
      );

      setPage("login");

      return;
    }

    setSwipeLoading(true);

    try {
      const response = await fetch(
        `${API}/api/swipe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            job_id: jobId,
            swipe_action: action,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const actionText =
          action === "LEFT"
            ? "passed"
            : action === "RIGHT"
            ? "liked"
            : "saved";

        setMessage(
          `Job ${actionText} successfully.`
        );

        setRecommendations(
          (previous) =>
            previous.filter(
              (job) =>
                job.job_id !== jobId
            )
        );
      } else {
        setMessage(
          data.message ||
            "Could not record swipe."
        );
      }
    } catch {
      setMessage(
        "Could not connect to the backend."
      );
    } finally {
      setSwipeLoading(false);
    }
  };

  // ============================================================
  // SWIPE GESTURE
  // ============================================================

  const handlePointerDown = (e) => {
    /*
     * Buttons inside the card should continue
     * behaving like normal buttons.
     */
    if (e.target.closest("button")) {
      return;
    }

    if (
      swipeAnimating ||
      swipeLoading ||
      recommendations.length === 0
    ) {
      return;
    }

    dragPointerId.current = e.pointerId;
    dragStartX.current = e.clientX;

    setIsDragging(true);

    e.currentTarget.setPointerCapture(
      e.pointerId
    );
  };

  const handlePointerMove = (e) => {
    if (!isDragging) {
      return;
    }

    if (
      dragPointerId.current !==
      e.pointerId
    ) {
      return;
    }

    const distance =
      e.clientX - dragStartX.current;

    const limitedDistance = Math.max(
      -450,
      Math.min(450, distance)
    );

    setDragX(limitedDistance);
  };

  const handlePointerUp = async (e) => {
    if (!isDragging) {
      return;
    }

    if (
      dragPointerId.current !==
      e.pointerId
    ) {
      return;
    }

    setIsDragging(false);
    dragPointerId.current = null;

    const threshold = 120;

    /*
     * Small movement:
     * return the card to the center.
     */
    if (Math.abs(dragX) < threshold) {
      setDragX(0);
      return;
    }

    const currentJob =
      recommendations[0];

    if (!currentJob) {
      setDragX(0);
      return;
    }

    const action =
      dragX < 0
        ? "LEFT"
        : "RIGHT";

    setSwipeAnimating(true);

    /*
     * Fly the card away.
     */
    setDragX(
      dragX < 0
        ? -window.innerWidth
        : window.innerWidth
    );

    /*
     * Wait for the animation,
     * then record the swipe.
     */
    setTimeout(async () => {
      await handleSwipe(
        currentJob.job_id,
        action
      );

      setDragX(0);
      setSwipeAnimating(false);
    }, 280);
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    dragPointerId.current = null;
    setDragX(0);
  };

  // ============================================================
  // SWIPE HISTORY
  // ============================================================

  const handleViewSwipeHistory =
    async () => {
      setMessage("");

      const authToken = token();

      if (!authToken) {
        setMessage("Please login first.");

        replaceNextNavigation.current =
          true;

        window.history.replaceState(
          { page: "login" },
          "",
          "#login"
        );

        setPage("login");

        return;
      }

      try {
        const response = await fetch(
          `${API}/api/swipe-history`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const data =
          await response.json();

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
      } catch {
        setMessage(
          "Could not connect to the backend."
        );
      }
    };

  // ============================================================
  // ATS
  // ============================================================

  const handleAnalyzeATS = async (
    job
  ) => {
    setMessage("");
    setAtsResult(null);
    setSelectedJob(job);
    setAtsLoading(true);

    const authToken = token();

    if (!authToken) {
      setMessage("Please login first.");

      replaceNextNavigation.current =
        true;

      window.history.replaceState(
        { page: "login" },
        "",
        "#login"
      );

      setPage("login");

      setAtsLoading(false);

      return;
    }

    try {
      const response = await fetch(
        `${API}/api/ats/analyze/${job.job_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setAtsResult(data);
        setPage("ats");
      } else {
        setMessage(
          data.message ||
            "ATS analysis failed."
        );
      }
    } catch {
      setMessage(
        "Could not connect to the backend."
      );
    } finally {
      setAtsLoading(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "access_token"
    );

    setEmail("");
    setPassword("");

    setMessage(
      "Logged out successfully."
    );

    window.history.replaceState(
      { page: "login" },
      "",
      "#login"
    );

    setPage("login");
  };

  // ============================================================
  // NAVBAR
  // ============================================================

  const Navbar = () => {
    const loggedIn =
      Boolean(token());

    if (
      !loggedIn ||
      page === "login" ||
      page === "register"
    ) {
      return null;
    }

    return (
      <header className="sx-navbar">

        <button
          className="sx-logo"
          onClick={() =>
            handleViewRecommendations()
          }
        >
          <span className="sx-logo-mark">
            ✦
          </span>

          SwipeX
        </button>

        <nav className="sx-nav">

          <button
            onClick={() =>
              go("resume")
            }
          >
            Dashboard
          </button>

          <button
            onClick={
              handleViewRecommendations
            }
            disabled={
              recommendationsLoading
            }
          >
            Recommended
          </button>

          <button
            onClick={() => handleViewJobs(1)}
          >
            Jobs
          </button>

          <button
            onClick={
              handleViewSwipeHistory
            }
          >
            My Swipes
          </button>

        </nav>

        <button
          className="sx-logout"
          onClick={handleLogout}
        >
          Logout
        </button>

      </header>
    );
  };

  // ============================================================
  // LOGIN
  // ============================================================

  if (page === "login") {
    return (
      <div className="sx-auth-page">

        <div className="sx-auth-glow sx-glow-one" />
        <div className="sx-auth-glow sx-glow-two" />

        <div className="sx-auth-brand">
          <span>✦</span> SwipeX
        </div>

        <div className="sx-auth-card">

          <div className="sx-eyebrow">
            JOB DISCOVERY PLATFORM
          </div>

          <h1>
            Find your next
            <span>
              {" "}opportunity.
            </span>
          </h1>

          <p className="sx-auth-subtitle">
            Discover jobs matched to your
            skills, profile and preferences.
          </p>

          <form
            onSubmit={handleLogin}
            className="sx-form"
          >

            <label>Email</label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />

            <button
              className="sx-primary-btn"
              type="submit"
            >
              Login
              <span>→</span>
            </button>

          </form>

          {message && (
            <div className="sx-message">
              {message}
            </div>
          )}

          <p className="sx-switch-text">
            Don't have an account?{" "}

            <button
              onClick={() =>
                go("register")
              }
            >
              Create one
            </button>

          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // REGISTER
  // ============================================================

  if (page === "register") {
    return (
      <div className="sx-auth-page">

        <div className="sx-auth-glow sx-glow-one" />
        <div className="sx-auth-glow sx-glow-two" />

        <div className="sx-auth-brand">
          <span>✦</span> SwipeX
        </div>

        <div className="sx-auth-card">

          <div className="sx-eyebrow">
            GET STARTED
          </div>

          <h1>
            Build your
            <span>
              {" "}job profile.
            </span>
          </h1>

          <p className="sx-auth-subtitle">
            Create an account and start
            discovering opportunities.
          </p>

          <form
            onSubmit={handleRegister}
            className="sx-form"
          >

            <label>Full Name</label>

            <input
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) =>
                setFullName(
                  e.target.value
                )
              }
              required
            />

            <label>Email</label>

            <input
              type="email"
              placeholder="you@example.com"
              value={registerEmail}
              onChange={(e) =>
                setRegisterEmail(
                  e.target.value
                )
              }
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Create a password"
              value={registerPassword}
              onChange={(e) =>
                setRegisterPassword(
                  e.target.value
                )
              }
              required
            />

            <button
              className="sx-primary-btn"
              type="submit"
            >
              Create Account
              <span>→</span>
            </button>

          </form>

          {message && (
            <div className="sx-message">
              {message}
            </div>
          )}

          <p className="sx-switch-text">
            Already have an account?{" "}

            <button
              onClick={() =>
                go("login")
              }
            >
              Login
            </button>

          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // MAIN APPLICATION
  // ============================================================

  return (
    <div className="sx-app">

      <Navbar />

      <main className="sx-main">

        {/* ======================================================
            PROFILE
        ====================================================== */}

        {page === "profile" && (
          <section className="sx-section sx-form-page">

            <div className="sx-section-heading">

              <div>

                <div className="sx-eyebrow">
                  STEP 01
                </div>

                <h1>
                  Build your profile
                </h1>

                <p>
                  Tell us about yourself so we
                  can find better opportunities.
                </p>

              </div>

            </div>

            <form
              onSubmit={
                handleProfileSubmit
              }
              className="sx-profile-form"
            >

              <div className="sx-form-grid">

                <div>

                  <label>
                    Headline
                  </label>

                  <input
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

                <div>

                  <label>
                    Location
                  </label>

                  <input
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

                <div className="sx-full">

                  <label>
                    Summary
                  </label>

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

                <div>

                  <label>
                    Experience (Years)
                  </label>

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

                <div>

                  <label>
                    Education
                  </label>

                  <input
                    value={education}
                    onChange={(e) =>
                      setEducation(
                        e.target.value
                      )
                    }
                    placeholder="B.Tech in AIML"
                    required
                  />

                </div>

                <div className="sx-full">

                  <label>
                    Projects
                  </label>

                  <textarea
                    value={projects}
                    onChange={(e) =>
                      setProjects(
                        e.target.value
                      )
                    }
                    placeholder="Your projects"
                  />

                </div>

                <div className="sx-full">

                  <label>
                    Certifications
                  </label>

                  <textarea
                    value={certifications}
                    onChange={(e) =>
                      setCertifications(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div>

                  <label>
                    Preferred Job Type
                  </label>

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

                <div>

                  <label>
                    Preferred Location
                  </label>

                  <input
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

              </div>

              <button
                className="sx-primary-btn"
                type="submit"
              >
                Save Profile
                <span>→</span>
              </button>

            </form>

            {message && (
              <div className="sx-message">
                {message}
              </div>
            )}

          </section>
        )}

        {/* ======================================================
            RESUME
        ====================================================== */}

        {page === "resume" && (
          <section className="sx-section">

            <div className="sx-dashboard-hero">

              <div>

                <div className="sx-eyebrow">
                  YOUR CAREER DASHBOARD
                </div>

                <h1>
                  Ready to find your
                  <span>
                    {" "}next opportunity?
                  </span>
                </h1>

                <p>
                  Upload your resume and let
                  SwipeX match you with relevant
                  jobs.
                </p>

              </div>

              <div className="sx-stat-card">

                <span>
                  PROFILE STATUS
                </span>

                <strong>
                  ACTIVE
                </strong>

                <small>
                  Ready for job discovery
                </small>

              </div>

            </div>

            <div className="sx-dashboard-grid">

              <div className="sx-panel sx-upload-panel">

                <div className="sx-panel-icon">
                  ↑
                </div>

                <div className="sx-eyebrow">
                  RESUME ANALYSIS
                </div>

                <h2>
                  Upload your resume
                </h2>

                <p>
                  PDF only · Maximum 5 MB
                </p>

                <form
                  onSubmit={
                    handleResumeUpload
                  }
                  className="sx-upload-form"
                >

                  <label className="sx-file-drop">

                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) =>
                        setResumeFile(
                          e.target.files[0]
                        )
                      }
                    />

                    <span className="sx-file-icon">
                      PDF
                    </span>

                    <strong>
                      {resumeFile
                        ? resumeFile.name
                        : "Choose your resume"}
                    </strong>

                    <small>
                      Click to browse your files
                    </small>

                  </label>

                  <button
                    className="sx-primary-btn"
                    type="submit"
                  >
                    Analyze Resume
                    <span>→</span>
                  </button>

                </form>

              </div>

              <div className="sx-panel">

                <div className="sx-panel-icon">
                  ✦
                </div>

                <div className="sx-eyebrow">
                  DETECTED SKILLS
                </div>

                <h2>
                  Your skill profile
                </h2>

                {extractedSkills.length >
                0 ? (
                  <div className="sx-skills">

                    {extractedSkills.map(
                      (skill, index) => (
                        <span key={index}>
                          {skill}
                        </span>
                      )
                    )}

                  </div>
                ) : (
                  <div className="sx-empty-state">

                    <span>+</span>

                    <p>
                      Upload a resume to see
                      your detected skills.
                    </p>

                  </div>
                )}

              </div>

            </div>

            {message && (
              <div className="sx-message">
                {message}
              </div>
            )}

            {extractedSkills.length >
              0 && (
              <div className="sx-action-row">

                <button
                  className="sx-secondary-btn"
                 onClick={() => handleViewJobs(1)}
                  disabled={
                    jobsLoading
                  }
                >
                  {jobsLoading
                    ? "Loading..."
                    : "Browse All Jobs →"}
                </button>

                <button
                  className="sx-primary-btn"
                  onClick={
                    handleViewRecommendations
                  }
                  disabled={
                    recommendationsLoading
                  }
                >
                  {recommendationsLoading
                    ? "Finding Matches..."
                    : "See My Matches →"}
                </button>

              </div>
            )}

          </section>
        )}

        {/* ======================================================
            JOBS
        ====================================================== */}

        {page === "jobs" && (
          <section className="sx-section">

            <div className="sx-section-heading">

              <div>

                <div className="sx-eyebrow">
                  JOB DISCOVERY
                </div>

                <h1>
                  Explore opportunities
                </h1>

                <p>
                  Analyze any job against your
                  resume before applying.
                </p>

              </div>

              <button
                className="sx-secondary-btn"
                onClick={
                  handleViewRecommendations
                }
              >
                Recommended Jobs →
              </button>

            </div>

            {message && (
              <div className="sx-message">
                {message}
              </div>
            )}

            <div className="sx-job-grid">

              {jobs.length === 0 ? (
                <div className="sx-empty-state sx-wide">

                  <span>○</span>

                  <p>
                    No active jobs available.
                  </p>

                </div>
              ) : (
                jobs.map((job) => (
                  <JobCard
                    key={job.job_id}
                    job={job}
                    onATS={
                      handleAnalyzeATS
                    }
                    loading={
                      atsLoading &&
                      selectedJob?.job_id ===
                        job.job_id
                    }
                  />
                ))
              )}

                        </div>

                      

            {jobsPagination &&
              jobsPage < jobsPagination.total_pages && (
                <div className="sx-pagination">
                  <button
                    className="sx-secondary-btn"
                    onClick={() =>
                      handleViewJobs(jobsPage + 1)
                    }
                    disabled={jobsLoading}
                  >
                    {jobsLoading
                      ? "Loading..."
                      : "Load More Jobs"}
                  </button>
                </div>
              )}

          </section>
        )}
        

        {/* ======================================================
            RECOMMENDATIONS
        ====================================================== */}

        {page === "recommendations" && (
          <section className="sx-section sx-discovery-section">

            <div className="sx-section-heading center">

              <div>

                <div className="sx-eyebrow">
                  PERSONALIZED FOR YOU
                </div>

                <h1>
                  Jobs worth a swipe
                </h1>

                <p>
                  Based on your skills,
                  preferences and profile.
                </p>

              </div>

            </div>

            {message && (
              <div className="sx-message">
                {message}
              </div>
            )}

            {recommendations.length ===
            0 ? (
              <div className="sx-empty-state sx-wide">

                <span>✓</span>

                <h3>
                  You're all caught up.
                </h3>

                <p>
                  No more recommended jobs
                  right now.
                </p>

                <button
                  className="sx-secondary-btn"
                  onClick={
                    handleViewSwipeHistory
                  }
                >
                  View Swipe History →
                </button>

              </div>
            ) : (
              <div className="sx-swipe-layout">

                <div
                  className={`sx-swipe-card ${
                    isDragging
                      ? "is-dragging"
                      : ""
                  }`}
                  onPointerDown={
                    handlePointerDown
                  }
                  onPointerMove={
                    handlePointerMove
                  }
                  onPointerUp={
                    handlePointerUp
                  }
                  onPointerCancel={
                    handlePointerCancel
                  }
                  style={{
                    transform: `translateX(${dragX}px) rotate(${
                      dragX * 0.04
                    }deg)`,
                    transition:
                      isDragging
                        ? "none"
                        : "transform 0.28s ease",
                  }}
                >

                  {/* SWIPE INDICATORS */}

                  {dragX < -30 && (
                    <div className="sx-swipe-indicator sx-pass-indicator">
                      PASS
                    </div>
                  )}

                  {dragX > 30 && (
                    <div className="sx-swipe-indicator sx-like-indicator">
                      LIKE
                    </div>
                  )}

                  <div className="sx-card-top">

                    <div className="sx-company-mark">
                      {recommendations[0]
                        .company_name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="sx-match">
{Number(
  recommendations[0]
    .recommendation_score
).toFixed(1)}
%

                      <small>
                        MATCH
                      </small>

                    </div>

                  </div>

                  <div className="sx-job-content">

                    <div className="sx-eyebrow">
                      {
                        recommendations[0]
                          .company_name
                      }
                    </div>

                    <h2>
                      {
                        recommendations[0]
                          .title
                      }
                    </h2>

                    <div className="sx-job-meta">

                      <span>
                        ⌖{" "}
                        {
                          recommendations[0]
                            .location
                        }
                      </span>

                      <span>
                        ◈{" "}
                        {
                          recommendations[0]
                            .employment_type
                        }
                      </span>

                    </div>

                    <div className="sx-salary">

                      ₹
                      {recommendations[0]
                        .salary_min?.toLocaleString(
                          "en-IN"
                        )}

                      {" – "}

                      ₹
                      {recommendations[0]
                        .salary_max?.toLocaleString(
                          "en-IN"
                        )}

                    </div>

                    <div className="sx-card-divider" />

                    <p className="sx-job-description">
                      {
                        recommendations[0]
                          .description
                      }
                    </p>

                    <div className="sx-skills">

                      {recommendations[0]
                        .required_skills
                        ?.map(
                          (skill, index) => (
                            <span
                              key={index}
                            >
                              {skill}
                            </span>
                          )
                        )}

                    </div>

                    <div className="sx-reason">

                      <span>✦</span>

                      <p>

                        <strong>
                          Why this matches
                        </strong>

                        <br />

                        {
                          recommendations[0]
                            .recommendation_reason
                        }

                      </p>

                    </div>

                  </div>

                  {/* ACTION BUTTONS */}

                  <div className="sx-swipe-actions">

                    <button
                      className="sx-swipe-btn pass"
                      onClick={() =>
                        handleSwipe(
                          recommendations[0]
                            .job_id,
                          "LEFT"
                        )
                      }
                      disabled={
                        swipeLoading
                      }
                    >
                      <span>✕</span>
                      Pass
                    </button>

                    <button
                      className="sx-swipe-btn save"
                      onClick={() =>
                        handleSwipe(
                          recommendations[0]
                            .job_id,
                          "SAVE"
                        )
                      }
                      disabled={
                        swipeLoading
                      }
                    >
                      <span>☆</span>
                      Save
                    </button>

                    <button
                      className="sx-swipe-btn like"
                      onClick={() =>
                        handleSwipe(
                          recommendations[0]
                            .job_id,
                          "RIGHT"
                        )
                      }
                      disabled={
                        swipeLoading
                      }
                    >
                      <span>♥</span>
                      Like
                    </button>

                  </div>

                  <button
                    className="sx-ats-link"
                    onClick={() =>
                      handleAnalyzeATS(
                        recommendations[0]
                      )
                    }
                  >
                    Analyze ATS for this job →
                  </button>

                </div>

                {/* NEXT JOBS */}

                <div className="sx-next-jobs">

                  <div className="sx-eyebrow">
                    NEXT OPPORTUNITIES
                  </div>

                  {recommendations
                    .slice(1)
                    .map((job) => (
                      <div
                        className="sx-mini-job"
                        key={
                          job.job_id
                        }
                      >

                        <div className="sx-company-mark small">
                          {job.company_name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>

                          <strong>
                            {job.title}
                          </strong>

                          <span>
                            {
                              job.company_name
                            }
                          </span>

                        </div>

                        <b>
  {Number(
    job.recommendation_score
  ).toFixed(1)}
  %
</b>

                      </div>
                    ))}

                </div>

              </div>
            )}

          </section>
        )}

        {/* ======================================================
            SWIPE HISTORY
        ====================================================== */}

        {page === "swipe-history" && (
          <section className="sx-section">

            <div className="sx-section-heading">

              <div>

                <div className="sx-eyebrow">
                  YOUR ACTIVITY
                </div>

                <h1>
                  Swipe history
                </h1>

                <p>
                  Your previous interactions with
                  job opportunities.
                </p>

              </div>

            </div>

            {message && (
              <div className="sx-message">
                {message}
              </div>
            )}

            {swipeHistory.length ===
            0 ? (
              <div className="sx-empty-state sx-wide">

                <span>☆</span>

                <p>
                  No swipe history yet.
                </p>

              </div>
            ) : (
              <div className="sx-history-list">

                {swipeHistory.map(
                  (item) => (
                    <div
                      className="sx-history-card"
                      key={
                        item.swipe_id
                      }
                    >

                      <div className="sx-company-mark small">
                        {item.company_name
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="sx-history-info">

                        <strong>
                          {item.title}
                        </strong>

                        <span>
                          {
                            item.company_name
                          }
                        </span>

                      </div>

                      <div
                        className={`sx-history-action ${item.swipe_action.toLowerCase()}`}
                      >
                        {
                          item.swipe_action
                        }
                      </div>

                      {item.swiped_at && (
                        <small>
                          {new Date(
                            item.swiped_at
                          ).toLocaleString()}
                        </small>
                      )}

                    </div>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* ======================================================
            ATS
        ====================================================== */}

        {page === "ats" &&
          atsResult && (
            <section className="sx-section">

              <div className="sx-section-heading">

                <div>

                  <div className="sx-eyebrow">
                    RESUME ANALYSIS
                  </div>

                  <h1>
                    ATS compatibility
                  </h1>

                  <p>
                    How well your resume matches
                    this job.
                  </p>

                </div>

                <button
                  className="sx-secondary-btn"
                  onClick={() =>
                    setPage(
                      recommendations.some(
                        (job) =>
                          job.job_id ===
                          selectedJob?.job_id
                      )
                        ? "recommendations"
                        : "jobs"
                    )
                  }
                >
                  ← Back
                </button>

              </div>

              <div className="sx-ats-grid">

                <div className="sx-ats-score-card">

                  <div className="sx-eyebrow">
                    ATS SCORE
                  </div>

                  <div className="sx-score-circle">

                    <strong>
                      {
                        atsResult.ats_score
                      }
                      %
                    </strong>

                    <span>
                      MATCH
                    </span>

                  </div>

                  <h3>
                    {selectedJob?.title}
                  </h3>

                  <p>
                    {
                      selectedJob
                        ?.company_name
                    }
                  </p>

                </div>

                <div className="sx-panel">

                  <div className="sx-ats-row">

                    <div>

                      <span>
                        Match Percentage
                      </span>

                      <strong>
                        {
                          atsResult.match_percentage
                        }
                        %
                      </strong>

                    </div>

                    <div className="sx-progress">

                      <div
                        style={{
                          width: `${Math.min(
                            Number(
                              atsResult.match_percentage
                            ) || 0,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  <div className="sx-skill-columns">

                    <div>

                      <h3>
                        Matched Skills
                      </h3>

                      {atsResult
                        .matched_skills
                        ?.length >
                      0 ? (
                        <div className="sx-skills success">

                          {atsResult.matched_skills.map(
                            (
                              skill,
                              index
                            ) => (
                              <span
                                key={
                                  index
                                }
                              >
                                ✓ {skill}
                              </span>
                            )
                          )}

                        </div>
                      ) : (
                        <p>
                          No matched
                          skills.
                        </p>
                      )}

                    </div>

                    <div>

                      <h3>
                        Missing Skills
                      </h3>

                      {atsResult
                        .missing_skills
                        ?.length >
                      0 ? (
                        <div className="sx-skills missing">

                          {atsResult.missing_skills.map(
                            (
                              skill,
                              index
                            ) => (
                              <span
                                key={
                                  index
                                }
                              >
                                × {skill}
                              </span>
                            )
                          )}

                        </div>
                      ) : (
                        <p>
                          No missing skills
                          🎉
                        </p>
                      )}

                    </div>

                  </div>

                  <div className="sx-suggestion">

                    <span>✦</span>

                    <div>

                      <h3>
                        Suggestions
                      </h3>

                      <p>
                        {
                          atsResult.suggestions
                        }
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </section>
          )}

      </main>
    </div>
  );
}

// ============================================================
// JOB CARD COMPONENT
// ============================================================

function JobCard({
  job,
  onATS,
  loading,
}) {
  return (
    <article className="sx-job-card">

      <div className="sx-job-card-top">

        <div className="sx-company-mark">
          {job.company_name
            ?.charAt(0)
            .toUpperCase()}
        </div>

        <button className="sx-more-btn">
          •••
        </button>

      </div>

      <div className="sx-eyebrow">
        {job.company_name}
      </div>

      <h2>
        {job.title}
      </h2>

      <div className="sx-job-meta">

        <span>
          ⌖ {job.location}
        </span>

        <span>
          ◈ {job.employment_type}
        </span>

      </div>

      <div className="sx-salary">

        ₹
        {job.salary_min?.toLocaleString(
          "en-IN"
        )}

        {" – "}

        ₹
        {job.salary_max?.toLocaleString(
          "en-IN"
        )}

      </div>

      <p className="sx-job-description">
        {job.description}
      </p>

      <div className="sx-skills">

        {job.required_skills?.map(
          (skill, index) => (
            <span key={index}>
              {skill}
            </span>
          )
        )}

      </div>

      <button
        className="sx-primary-btn sx-full-btn"
        onClick={() =>
          onATS(job)
        }
        disabled={loading}
      >
        {loading
          ? "Analyzing..."
          : "Analyze ATS →"}
      </button>

    </article>
  );
}

export default App;