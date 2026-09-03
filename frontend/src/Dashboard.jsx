import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard({ user, onLogout }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeMessage, setResumeMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [savedJobs, setSavedJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");

  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");

  const [swipeMessage, setSwipeMessage] = useState("");
  const [swipeJob, setSwipeJob] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);
  const [atsJob, setAtsJob] = useState(null);
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState("");

  const [activePage, setActivePage] = useState("dashboard");

    useEffect(() => {
      if (activePage === "recommendations") {
        fetchRecommendations();
      }
    }, [activePage]);


  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      setJobsError("");

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/jobs/"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch jobs");
        }

        const data = await response.json();

        const formattedJobs = data.map((job) => ({
          id: job.job_id,

          title: job.title,

          company: job.company_name || "Company not specified",

          location:
            [job.city, job.state]
              .filter(Boolean)
              .join(", ") || "Location not specified",

          type: job.contract_type || "Not specified",

          experience: job.experience_level || "Not specified",

          skills: (job.required_skills || []).join(" • "),

          description: job.description || "No job description available.",

          sector: job.sector || "",

          workType: job.work_type || "",

          publishedAt: job.published_at || "",

          match: null,
        }));
        setJobs(formattedJobs);

      } catch (error) {
        console.error("Error fetching jobs:", error);
        setJobsError("Unable to load jobs.");
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const token = localStorage.getItem("swipex_token");

        const response = await fetch(
          "http://127.0.0.1:8000/api/jobs/saved/",
          {
            method: "GET",
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch saved jobs");
        }

        const data = await response.json();

        console.log("🔥 SAVED JOBS FROM BACKEND:", data);

        const savedJobIds = data.map((job) => job.job_id);

        setSavedJobs(savedJobIds);
      } catch (error) {
        console.error("❌ ERROR FETCHING SAVED JOBS:", error);
      }
    };

    fetchSavedJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const search = searchTerm.toLowerCase();

    return (
      job.title.toLowerCase().includes(search) ||
      job.company.toLowerCase().includes(search) ||
      job.skills.toLowerCase().includes(search) ||
      job.location.toLowerCase().includes(search)
    );
  });


  const handleViewJob = (job) => {
    console.log("🔥 HANDLE VIEW JOB CALLED:", job);
    console.log("🔥 SELECTED JOB ID:", job.id);

    setSelectedJob(job);
    setAtsResult(null);
    setAtsError("");
  };

  const goTo = (page) => {
    if (page === "jobs") {
      setAtsResult(null);
      setAtsError("");
      setAtsLoading(false);
      setSelectedJob(null);
    }

    setActivePage(page);
    setSearchTerm("");
  };

  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem("swipex_token");

      const response = await fetch(
        "http://127.0.0.1:8000/api/jobs/saved/",
        {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch saved jobs.");
      }

      console.log("🔥 SAVED JOBS FROM BACKEND:", data);

      const savedJobIds = data.map((job) => job.job_id);

      setSavedJobs(savedJobIds);
    } catch (error) {
      console.error("❌ FETCH SAVED JOBS ERROR:", error);
    }
  };

  const fetchRecommendations = async () => {
    setRecommendationsLoading(true);
    setRecommendationsError("");

    try {
      const token = localStorage.getItem("swipex_token");

      const response = await fetch(
        "http://127.0.0.1:8000/api/recommendations/",
        {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load recommendations."
        );
      }

      console.log("🔥 RECOMMENDATIONS FROM BACKEND:", data);

      const formattedRecommendations = (
        data.recommendations || []
      ).map((job) => ({
        id: job.job_id,
        title: job.title,
        company: job.company_name || "Company not specified",

        location: job.city || "Location not specified",

        type: job.contract_type || "Not specified",

        experience: "Not specified",

        skills: "",

        description: "Recommended based on your profile.",

        match: job.final_score,

        skillsScore: job.skills_score,
        roleScore: job.role_score,
        locationScore: job.location_score,
        jobTypeScore: job.job_type_score,
      }));

      setRecommendations(formattedRecommendations);

    } catch (error) {
      console.error("❌ RECOMMENDATIONS ERROR:", error);

      setRecommendationsError(
        error.message || "Unable to load recommendations."
      );

    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleSwipe = async (job, direction) => {
    const token = localStorage.getItem("swipex_token");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/jobs/swipe/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            job_id: job.id,
            swipe_direction: direction,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Swipe failed");
      }

      console.log("SWIPE SUCCESS:", data);
      setSwipeJob(job.id);
      // Show UI feedback
      if (direction === "right") {
        setSwipeMessage("❤️ Interested! Your response has been recorded.");
      } else if (direction === "left") {
        setSwipeMessage("❌ Not Interested. Your response has been recorded.");
      } else if (direction === "down") {
        setSwipeMessage("💾 Job saved successfully.");
      }

      // Down = Save job
      if (direction === "down") {
        setSavedJobs((current) =>
          current.includes(job.id)
            ? current
            : [...current, job.id]
        );
      }

      // Keep the selected job visible for the moment
      setSwipeDirection(direction);

    } catch (error) {
      console.error("SWIPE ERROR:", error);

      setSwipeMessage(
        `⚠️ ${error.message || "Unable to record your response."}`
      );
    }
  };

  /* ================= PAGE HEADER ================= */

  const PageHeader = ({ title, description }) => (
    <div className="page-heading">
      <div>
        <p className="header-label">SWIPEX</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="user-info">
        <div className="notification">🔔</div>

        <div className="user-avatar">
          {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <div className="user-details">
          <strong>{user?.full_name || "User"}</strong>
          <span>{user?.email || ""}</span>
        </div>
      </div>
    </div>
  );

  /* ================= DASHBOARD PAGE ================= */

  const DashboardPage = () => (
    <>
      <PageHeader
        title={`Welcome back, ${user?.full_name || "User"}! 👋`}
        description="Discover opportunities that match your skills and career goals."
      />

      {/* Profile completion */}
      <section className="profile-card">
        <div className="profile-card-content">

          <div className="profile-icon">👤</div>

          <div className="profile-text">
            <h2>Complete your profile</h2>

            <p>
              A complete profile helps us find better job opportunities
              for you.
            </p>

            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>

            <span className="progress-text">
              70% Profile Completed
            </span>
          </div>

          <button
            className="secondary-button"
            onClick={() => goTo("profile")}
          >
            Complete Profile
          </button>

        </div>
      </section>

      {/* Statistics */}
      <section className="stats-container">

        <div className="stat-card">
          <div className="stat-icon blue">💼</div>
          <div>
            <span>Available Jobs</span>
            <h3>{jobs.length}</h3>
            <small>Opportunities available</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">📄</div>
          <div>
            <span>Applications</span>
            <h3>0</h3>
            <small>Applications submitted</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">❤️</div>
          <div>
            <span>Saved Jobs</span>
            <h3>{savedJobs.length}</h3>
            <small>Jobs saved for later</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">📊</div>
          <div>
            <span>ATS Score</span>
            <h3>--</h3>
            <small>Upload resume to analyze</small>
          </div>
        </div>

      </section>

      {/* Quick Actions */}
      <section className="quick-section">

        <div className="section-title">
          <h2>Quick Actions</h2>
          <p>Get started with your career profile.</p>
        </div>

        <div className="quick-actions">

          <button
            className="quick-card"
            onClick={() => goTo("resume")}
          >
            <div className="quick-icon">📄</div>

            <div>
              <h3>Upload Resume</h3>
              <p>Add your resume to build your profile.</p>
            </div>

            <span>→</span>
          </button>

          <button
            className="quick-card"
            onClick={() => goTo("ats")}
          >
            <div className="quick-icon">📊</div>

            <div>
              <h3>Check ATS Score</h3>
              <p>Analyze your resume against job requirements.</p>
            </div>

            <span>→</span>
          </button>

          <button
            className="quick-card"
            onClick={() => goTo("recommendations")}
          >
            <div className="quick-icon">✨</div>

            <div>
              <h3>Get Recommendations</h3>
              <p>Find jobs based on your profile.</p>
            </div>

            <span>→</span>
          </button>

        </div>

      </section>

      {/* Search */}
      <section className="search-section">

        <div className="section-title">
          <h2>Find Your Next Opportunity</h2>
          <p>Search jobs by title, company, skills or location.</p>
        </div>

        <div className="search-bar">

          <span className="search-icon">🔎</span>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search jobs, skills or companies..."
          />

          <button onClick={() => goTo("jobs")}>
            Search
          </button>

        </div>

      </section>

      {/* Recommended Jobs */}
      <section className="jobs-section">

        <div className="section-header">
          <div>
            <h2>Recommended Jobs</h2>
            <p>Opportunities selected for your profile.</p>
          </div>

          <button
            className="view-all-button"
            onClick={() => goTo("jobs")}
          >
            View All →
          </button>
        </div>

        {jobs.slice(0, 2).map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onViewJob={handleViewJob}
          />
        ))}

      </section>
    </>
  );

  /* ================= JOB CARD ================= */

  const JobCard = ({ job, onViewJob }) => (
    <div
      className="job-card swipe-job-card"
      onClick={() => {
        console.log("🔥 JOB CARD CLICKED:", job);
        console.log("🔥 onViewJob VALUE:", onViewJob);
        
        if (typeof onViewJob === "function") {
          console.log("🔥 onViewJob IS FUNCTION — CALLING NOW");
          onViewJob(job);
        } else {
          console.error("❌ onViewJob IS NOT A FUNCTION:", onViewJob);
        }
      }}
    >

      <div className="company-logo">
        {job.company.charAt(0).toUpperCase()}
      </div>

      <div className="job-details">

        <div className="job-title-row">
          <div>
            <h3>{job.title}</h3>

            <p className="company">
              {job.company}
            </p>
          </div>
        </div>

        <div className="job-info">
          <span>📍 {job.location}</span>
          <span>💼 {job.type}</span>
          <span>🎓 {job.experience}</span>
        </div>

        <p className="skills">
          {job.skills || "Skills not specified"}
        </p>

        <p className="job-card-description">
          {job.description
            ? job.description.substring(0, 120) + "..."
            : "No job description available."}
        </p>

      </div>

      <div className="job-card-click">
        Click to Swipe →
      </div>

    </div>
  );

  /* ================= FIND JOBS ================= */

  const FindJobsPage = () => (
    <>
      <PageHeader
        title="Find Jobs"
        description="Explore job opportunities that match your skills."
      />

      <section className="search-section large-search">
        <div className="section-title">
          <h2>Search Jobs</h2>
          <p>Search by job title, company, skills or location.</p>
        </div>

        <div className="search-bar">
          <span className="search-icon">🔎</span>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search jobs, skills or companies..."
          />

          <button onClick={() => goTo("jobs")}>
            Search
          </button>
        </div>
      </section>

      <section className="jobs-section swipe-jobs-section">

        <div className="section-header">
          <div>
            <h2>{filteredJobs.length} Jobs Found</h2>
            <p>Choose a job to start swiping.</p>
          </div>
        </div>

        {jobsLoading && (
          <div className="no-results">
            <h3>Loading jobs...</h3>
          </div>
        )}

        {jobsError && (
          <div className="no-results">
            <h3>{jobsError}</h3>
          </div>
        )}

        {!jobsLoading && !jobsError && filteredJobs.length > 0 && (
          <div className="jobs-grid">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onViewJob={handleViewJob}
              />
            ))}
          </div>
        )}

        {!jobsLoading && !jobsError && filteredJobs.length === 0 && (
          <div className="no-results">
            <div>🔎</div>
            <h3>No jobs found</h3>
            <p>
              Try searching for another job title, skill or location.
            </p>
          </div>
        )}

      </section>
    </>
  );

  /* ================= JOB DESCRIPTION FORMATTER ================= */

  const formatJobDescription = (description) => {
    if (!description) {
      return (
        <p className="job-description-empty">
          No job description available.
        </p>
      );
    }

    const lines = description
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return (
      <div className="job-description-text">

        {lines.map((line, index) => {

          /* BULLET POINT */

          if (
            line.startsWith("*") ||
            line.startsWith("•") ||
            line.startsWith("-")
          ) {
            return (
              <div
                key={index}
                className="job-description-bullet"
              >
                <span>•</span>
                <p>
                  {line.replace(/^[*•-]\s*/, "")}
                </p>
              </div>
            );
          }

          /* NUMBERED POINT */

          if (/^\d+\./.test(line)) {
            return (
              <div
                key={index}
                className="job-description-number"
              >
                <p>{line}</p>
              </div>
            );
          }

          /* SECTION HEADINGS */

          if (
            line.endsWith(":") ||
            line.startsWith("Primary Skills") ||
            line.startsWith("Secondary Skills") ||
            line.startsWith("Key Responsibilities") ||
            line.startsWith("Responsibilities") ||
            line.startsWith("Requirements") ||
            line.startsWith("Qualifications") ||
            line.startsWith("Education") ||
            line.startsWith("Experience")
          ) {
            return (
              <h4
                key={index}
                className="job-description-heading"
              >
                {line}
              </h4>
            );
          }

          /* NORMAL TEXT */

          return (
            <p
              key={index}
              className="job-description-paragraph"
            >
              {line}
            </p>
          );
        })}

      </div>
    );
  };

  /* ================= JOB DETAILS PAGE ================= */

  const JobDetailsPage = () => {
    console.log("🔥 JOB DETAILS PAGE RENDERED");
    console.log("🔥 SELECTED JOB:", selectedJob);
    console.log("🔥 ACTIVE PAGE:", activePage);
    if (!selectedJob) {
      return (
        <div className="workflow-placeholder">
          <div className="workflow-icon">💼</div>

          <h2>No Job Selected</h2>

          <p>
            Please select a job from Find Jobs first.
          </p>

          <button
            className="apply-button"
            onClick={() => goTo("jobs")}
          >
            Find Jobs
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="swipe-view-container">

          <div className="swipe-card">
            {/* COMPANY */}
            <div className="swipe-company">
              <div className="company-logo large-company-logo">
                {selectedJob.company.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2>{selectedJob.title}</h2>
                <p className="company">
                  {selectedJob.company}
                </p>
              </div>
            </div>

            {/* JOB INFORMATION */}
            <div className="job-info job-details-info">

              <span>
                📍 {selectedJob.location}
              </span>

              <span>
                💼 {selectedJob.type}
              </span>

              <span>
                🎓 {selectedJob.experience}
              </span>

            </div>

            {/* SKILLS */}
            <div className="job-details-section">
              <h3>Required Skills</h3>

              <p>
                {selectedJob.skills ||
                  "No specific skills listed."}
              </p>
            </div>

            {/* DESCRIPTION */}
            <div className="job-details-section">
              <h3>Job Description</h3>

              {formatJobDescription(
                selectedJob.description
              )}
            </div>

            {/* ATS */}
            <div className="job-details-ats">

              <h3>Check Your Resume Match</h3>

              <p>
                See how well your resume matches this job
                before applying.
              </p>

              <button
                className="apply-button"
                onClick={async () => {

                  setAtsJob(selectedJob);
                  setAtsResult(null);
                  setAtsError("");
                  setAtsLoading(true);

                  try {
                    const token =
                      localStorage.getItem("swipex_token");

                    const response = await fetch(
                      `http://127.0.0.1:8000/api/ats/jobs/${selectedJob.id}/`,
                      {
                        method: "GET",
                        headers: {
                          Authorization: `Token ${token}`,
                        },
                      }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                      throw new Error(
                        data.error ||
                        "Failed to analyze resume."
                      );
                    }

                    setAtsResult(data);
                    setActivePage("ats");
                  } catch (error) {

                    console.error(
                      "ATS ERROR:",
                      error
                    );

                    setAtsError(
                      error.message ||
                      "Unable to analyze resume."
                    );

                  } finally {
                    setAtsLoading(false);
                  }

                }}
              >
                {atsLoading
                  ? "Analyzing..."
                  : "Analyze Resume Match"}
              </button>

            </div>
            
            {swipeJob === selectedJob.id && swipeMessage && (
              <div className="swipe-feedback">
                {swipeMessage}
              </div>
            )}
            
            {/* SWIPE CONTROLS */}
            <div className="swipe-controls">

              <button
                className="swipe-button swipe-left"
                onClick={() =>
                  handleSwipe(selectedJob, "left")
                }
              >
                ❌
                <span>Not Interested</span>
              </button>

              <button
                className="swipe-button swipe-down"
                onClick={() =>
                  handleSwipe(selectedJob, "down")
                }
              >
                💾
                <span>Save Job</span>
              </button>

              <button
                className="swipe-button swipe-right"
                onClick={() =>
                  handleSwipe(selectedJob, "right")
                }
              >
                ❤️
                <span>Interested</span>
              </button>

            </div>

          </div>

        </div>
      </>
    );
  };

  /* ================= SAVED JOBS ================= */

  const SavedJobsPage = () => {

    const saved = jobs.filter((job) =>
      savedJobs.includes(job.id)
    );

    return (
      <>
        <PageHeader
          title="Saved Jobs"
          description="Jobs you saved for future consideration."
        />

        <section className="jobs-section">

          <div className="section-header">
            <div>
              <h2>Your Saved Jobs</h2>
              <p>
                {saved.length} job{saved.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>

          {saved.length > 0 ? (
           saved.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onViewJob={handleViewJob}
            />
          ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">❤️</div>

              <h2>No Saved Jobs Yet</h2>

              <p>
                Save interesting jobs and they will appear here.
              </p>

              <button
                className="apply-button empty-button"
                onClick={() => goTo("jobs")}
              >
                Find Jobs
              </button>
            </div>
          )}

        </section>
      </>
    );
  };

/* ================= PROFILE ================= */

const ProfilePage = () => {

  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [profileForm, setProfileForm] = useState({
    headline: "",
    location: "",
    preferred_locations: "",
    job_type: "",
    bio: "",
    career_goal: "",
    preferred_job_role: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
  });

  const [profilePhoto, setProfilePhoto] = useState(null);

  /* LOAD PROFILE */

  const loadProfile = async () => {

    try {

      const token = localStorage.getItem("swipex_token");

      const response = await axios.get(
        "http://127.0.0.1:8000/api/profile/",
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      const data = response.data;

      setProfile(data);

      setProfileForm({
        headline: data.headline || "",
        location: data.location || "",
        preferred_locations: Array.isArray(data.preferred_locations)
          ? data.preferred_locations.join(", ")
          : "",
        job_type: data.job_type || "",
        bio: data.bio || "",
        career_goal: data.career_goal || "",
        preferred_job_role: data.preferred_job_role || "",
        linkedin_url: data.linkedin_url || "",
        github_url: data.github_url || "",
        portfolio_url: data.portfolio_url || "",
      });

    } catch (error) {
      console.error("Profile update error:", error);
      console.error("Backend response:", error.response?.data);

      setProfileError(
        error.response?.data
          ? JSON.stringify(error.response.data)
          : "Unable to connect to the server."
      );
    } finally {

      setProfileLoading(false);

    }
  };

  /* LOAD PROFILE WHEN PAGE OPENS */

  useEffect(() => {

    loadProfile();

  }, []);

  /* HANDLE TEXT INPUT */

  const handleProfileChange = (event) => {

    const { name, value } = event.target;

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));

  };

  /* HANDLE PHOTO */

  const handleProfilePhotoChange = (event) => {

    const file = event.target.files[0];

    if (file) {
      setProfilePhoto(file);
    }

  };

  /* SAVE PROFILE */

  const handleProfileSave = async () => {

    setProfileSaving(true);
    setProfileMessage("");
    setProfileError("");

    try {

      const token = localStorage.getItem("swipex_token");

      const formData = new FormData();

      Object.entries(profileForm).forEach(([key, value]) => {
        if (key === "preferred_locations") {
          const locations = value
            .split(",")
            .map((location) => location.trim())
            .filter((location) => location);

          formData.append(key, JSON.stringify(locations));
        } else {
          formData.append(key, value);
        }
      });

      if (profilePhoto) {
        formData.append(
          "profile_photo",
          profilePhoto
        );
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/api/profile/",
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      setProfile(response.data.profile);

      setProfilePhoto(null);

      setEditingProfile(false);

      setProfileMessage(
        "Profile updated successfully."
      );

    } catch (error) {

      console.error(
        "Profile update error:",
        error
      );

      setProfileError(
        error.response?.data
          ? "Unable to update profile."
          : "Unable to connect to the server."
      );

    } finally {

      setProfileSaving(false);

    }
  };

  if (profileLoading) {

    return (
      <>
        <PageHeader
          title="My Profile"
          description="Manage your personal information and career profile."
        />

        <div className="workflow-placeholder">
          <div className="workflow-icon">
            👤
          </div>

          <h2>Loading Profile...</h2>

          <p>
            Please wait while we load your profile.
          </p>
        </div>
      </>
    );

  }

  return (
    <>
      <PageHeader
        title="My Profile"
        description="Manage your personal information and career profile."
      />

      {profileMessage && (
        <div className="success-message">
          ✓ {profileMessage}
        </div>
      )}

      {profileError && (
        <div className="error-message">
          ! {profileError}
        </div>
      )}

      <section className="profile-page-card">

        {/* PROFILE PHOTO */}

        <div className="profile-photo-section">

          {profile?.profile_photo ? (
            <img
              src={profile.profile_photo}
              alt="Profile"
              className="profile-photo"
            />
          ) : (
            <div className="large-avatar">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}

          {editingProfile && (
            <label className="photo-upload-button">

              Change Photo

              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoChange}
                hidden
              />

            </label>
          )}

        </div>

        {/* NAME */}

        <h2>
          {user?.full_name || "User"}
        </h2>

        <p className="profile-email">
          {user?.email || "No email available"}
        </p>

        {!editingProfile ? (

          /* ================= VIEW PROFILE ================= */

          <>

            <div className="profile-details">

              <div className="profile-field">

                <label>Headline</label>

                <strong>
                  {profile?.headline || "Add your professional headline"}
                </strong>

              </div>

              <div className="profile-field">

                <label>Location</label>

                <strong>
                  {profile?.location || "Add your location"}
                </strong>

              </div>

              <div className="profile-field">
                <label>Preferred Job Locations</label>
                <strong>
                  {Array.isArray(profile?.preferred_locations) &&
                  profile.preferred_locations.length > 0
                    ? profile.preferred_locations.join(", ")
                    : "Add your preferred job locations"}
                </strong>
              </div>

              <div className="profile-field">
                <label>Job Type</label>
                <strong>
                  {profile?.job_type
                    ? profile.job_type === "full_time"
                      ? "Full-time"
                      : profile.job_type === "part_time"
                      ? "Part-time"
                      : "Internship"
                    : "Add your preferred job type"}
                </strong>
              </div>

              <div className="profile-field profile-bio">

                <label>Bio</label>

                <p>
                  {profile?.bio || "Add a short professional bio."}
                </p>

              </div>

              <div className="profile-field profile-bio">

                <label>Career Goal</label>

                <p>
                  {profile?.career_goal || "Add your career goal."}
                </p>

              </div>

              <div className="profile-field">

                <label>Preferred Job Role</label>

                <strong>
                  {profile?.preferred_job_role || "Add your preferred role"}
                </strong>

              </div>

            </div>

            {/* SOCIAL LINKS */}

            <div className="profile-links">

              {profile?.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  🔗 LinkedIn
                </a>
              )}

              {profile?.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  💻 GitHub
                </a>
              )}

              {profile?.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  🌐 Portfolio
                </a>
              )}

            </div>

            <button
              className="secondary-button"
              onClick={() => {
                setEditingProfile(true);
                setProfileMessage("");
                setProfileError("");
              }}
            >
              Edit Profile
            </button>

          </>

        ) : (

          /* ================= EDIT PROFILE ================= */

          <div className="profile-edit-form">

            <div className="profile-form-field">

              <label>Headline</label>

              <input
                type="text"
                name="headline"
                value={profileForm.headline}
                onChange={handleProfileChange}
                placeholder="e.g. Full Stack / Data Science"
              />

            </div>

            <div className="profile-form-field">

              <label>Location</label>

              <input
                type="text"
                name="location"
                value={profileForm.location}
                onChange={handleProfileChange}
                placeholder="e.g. Andhra Pradesh, India"
              />

            </div>

            <div className="profile-form-field">

              <label>Preferred Job Locations</label>

              <input
                type="text"
                name="preferred_locations"
                value={profileForm.preferred_locations}
                onChange={handleProfileChange}
                placeholder="e.g. Hyderabad, Bangalore, Chennai"
              />

            </div>

            <div className="profile-form-field">

              <label>Job Type</label>

              <select
                name="job_type"
                value={profileForm.job_type}
                onChange={handleProfileChange}
              >
                <option value="">Select Job Type</option>
                <option value="internship">Internship</option>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
              </select>

            </div>

            <div className="profile-form-field">

              <label>Bio</label>

              <textarea
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                placeholder="Tell employers about yourself..."
                rows="4"
              />

            </div>

            <div className="profile-form-field">

              <label>Career Goal</label>

              <textarea
                name="career_goal"
                value={profileForm.career_goal}
                onChange={handleProfileChange}
                placeholder="What are your career goals?"
                rows="3"
              />

            </div>

            <div className="profile-form-field">

              <label>Preferred Job Role</label>

              <input
                type="text"
                name="preferred_job_role"
                value={profileForm.preferred_job_role}
                onChange={handleProfileChange}
                placeholder="e.g. Full Stack Developer"
              />

            </div>

            <div className="profile-form-field">

              <label>LinkedIn URL</label>

              <input
                type="url"
                name="linkedin_url"
                value={profileForm.linkedin_url}
                onChange={handleProfileChange}
                placeholder="https://linkedin.com/in/..."
              />

            </div>

            <div className="profile-form-field">

              <label>GitHub URL</label>

              <input
                type="url"
                name="github_url"
                value={profileForm.github_url}
                onChange={handleProfileChange}
                placeholder="https://github.com/..."
              />

            </div>

            <div className="profile-form-field">

              <label>Portfolio URL</label>

              <input
                type="url"
                name="portfolio_url"
                value={profileForm.portfolio_url}
                onChange={handleProfileChange}
                placeholder="https://yourportfolio.com"
              />

            </div>

            <div className="profile-form-actions">

              <button
                className="secondary-button"
                onClick={() => setEditingProfile(false)}
                disabled={profileSaving}
              >
                Cancel
              </button>

              <button
                className="apply-button"
                onClick={handleProfileSave}
                disabled={profileSaving}
              >
                {profileSaving
                  ? "Saving..."
                  : "Save Profile"}
              </button>

            </div>

          </div>

        )}

      </section>
    </>
  );
};
/* ================= RESUME PAGE ================= */

const ResumePage = () => {

    useEffect(() => {
      const loadResume = async () => {
        try {
          const response = await axios.get(
            "http://127.0.0.1:8000/api/resume/upload/",
            {
              headers: {
                Authorization: `Token ${localStorage.getItem("swipex_token")}`,
              },
            }
          );

          setResumeData(response.data.resume);
        } catch (error) {
          console.log("No saved resume found.");
        }
      };

      loadResume();
    }, []);

  const handleResumeUpload = async (event) => {

    const file = event.target.files[0];

    if (!file) return;

    setResumeFile(file);
    setResumeError("");
    setResumeMessage("");
    setUploading(true);

    const formData = new FormData();

    formData.append("resume_file", file);

    try {

      const token = localStorage.getItem("swipex_token");

      const response = await axios.post(
        "http://127.0.0.1:8000/api/resume/upload/",
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResumeData(response.data.resume);
      setResumeMessage(response.data.message);

    } catch (error) {

      console.error("Resume upload error:", error);

      if (error.response?.data) {

        setResumeError(
          error.response.data.error ||
          "Resume upload failed."
        );

      } else {

        setResumeError(
          "Unable to connect to the server."
        );

      }

    } finally {

      setUploading(false);

    }

  };

  const handleResumeDelete = async () => {
    try {
      const token = localStorage.getItem("swipex_token");

      const response = await axios.delete(
        "http://127.0.0.1:8000/api/resume/delete/",
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      setResumeFile(null);
      setResumeData(null);
      setResumeMessage(response.data.message);
      setResumeError("");

    } catch (error) {
      console.error("Resume delete error:", error);

      if (error.response?.data) {
        setResumeError(
          error.response.data.error ||
          "Unable to remove resume."
        );
      } else {
        setResumeError("Unable to connect to the server.");
      }
    }
  };

  return (
    <>
      <PageHeader
        title="My Resume"
        description="Upload your resume and let SWIPEX build your career profile."
      />

      {/* ================= UPLOAD RESUME ================= */}

      <section className="resume-upload-card">

        <div className="resume-upload-icon">
          📄
        </div>

        <h2>Upload Your Resume</h2>

        <p>
          Upload your PDF or DOCX resume. SWIPEX will automatically
          extract your skills, experience and education.
        </p>

        <label className="apply-button upload-button">

          {uploading ? "Uploading..." : "Choose Resume"}

          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleResumeUpload}
            hidden
          />

        </label>

        {resumeFile && (
          <p className="selected-file">
            Selected: {resumeFile.name}
          </p>
        )}

        {resumeMessage && (
          <div className="success-message">
            ✓ {resumeMessage}
          </div>
        )}

        {resumeError && (
          <div className="error-message">
            ! {resumeError}
          </div>
        )}

      </section>

      {/* ================= EXTRACTED DATA ================= */}

      {resumeData && (
        <section className="resume-data-card">

          <div className="section-header">

            <div>
              <h2>Extracted Resume Information</h2>

              <p>
                Information automatically extracted from your resume.
              </p>
            </div>

          </div>


          {/* ================= SKILLS ================= */}

          <div className="resume-section">

            <h3>🛠 Skills</h3>

            {resumeData.skills?.length > 0 ? (

              <div className="skills-container">

                {resumeData.skills.map((skill, index) => (

                  <span
                    className="skill-tag"
                    key={index}
                  >
                    {skill}
                  </span>

                ))}

              </div>

            ) : (

              <p className="resume-empty">
                No skills detected.
              </p>

            )}

          </div>


          {/* ================= EXPERIENCE ================= */}

          <div className="resume-section">

            <h3>💼 Experience</h3>

            {resumeData.experience?.length > 0 ? (

              <div className="experience-list">

                {resumeData.experience.map((experience, index) => (

                  <div
                    className="resume-experience"
                    key={index}
                  >

                    <div className="experience-content">

                      <p className="experience-line">
                        <strong>{experience.role}</strong>
                      </p>

                      <p className="experience-line">
                        {experience.company}
                      </p>

                      <p className="experience-line">
                        {experience.duration}
                      </p>

                      <p className="experience-line">
                        {experience.description}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              <p className="resume-empty">
                No experience detected.
              </p>

            )}

          </div>


          {/* ================= EDUCATION ================= */}

          <div className="resume-section">

            <h3>🎓 Education</h3>

            {resumeData.education?.length > 0 ? (

              <div className="education-list">

                {resumeData.education.map((education, index) => (

                  <div
                    className="resume-education"
                    key={index}
                  >

                    <div className="education-content">

                      <p className="education-line">
                        <strong>{education.degree}</strong>
                      </p>

                      <p className="education-line">
                        {education.institution}
                      </p>

                      <p className="education-line">
                        {education.year}
                      </p>

                    </div>
                  </div>

                ))}

              </div>

            ) : (

              <p className="resume-empty">
                No education detected.
              </p>

            )}

          </div>

          <div className="resume-actions">

            <button
              className="remove-resume-button"
              onClick={handleResumeDelete}
            >
              🗑 Remove Resume
            </button>

          </div>

        </section>
      )}

    </>
  );
};

/* ================= ATS ANALYSIS PAGE ================= */

  const ATSAnalysisPage = () => {

    if (!atsJob) {
      return (
        <>
          <PageHeader
            title="ATS Analysis"
            description="Analyze your resume against a selected job."
          />

          <div className="workflow-placeholder">

            <div className="workflow-icon">
              📊
            </div>

            <h2>No Job Selected</h2>

            <p>
              Please select a job first and then analyze your resume.
            </p>

            <button
              className="apply-button"
              onClick={() => goTo("jobs")}
            >
              Find Jobs
            </button>

          </div>
        </>
      );
    }

    const handleAnalyze = async () => {
      setAtsLoading(true);
      setAtsResult(null);
      setAtsError("");

      try {
        const token = localStorage.getItem("swipex_token");

        console.log("ANALYZING JOB:", selectedJob);
        console.log("TOKEN EXISTS:", !!token);

        const response = await fetch(
          `http://127.0.0.1:8000/api/ats/jobs/${atsJob.id}/`,
          {
            method: "GET",
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("ATS RESPONSE STATUS:", response.status);

        const data = await response.json();

        console.log("ATS RESPONSE DATA:", data);

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to calculate ATS match."
          );
        }

        setAtsResult(data);

      } catch (error) {
        console.error("ATS error:", error);
        setAtsError(error.message);
      } finally {
        setAtsLoading(false);
      }
    };

    return (
      <>
        <PageHeader
          title="ATS Analysis"
          description="See how well your resume matches this job."
        />

        {/* SELECTED JOB */}

        <section className="ats-job-card">

          <div className="ats-job-header">

            <div className="company-logo large-company-logo">
              {atsJob.company.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2>{atsJob.title}</h2>

              <p className="company">
                {atsJob.company}
              </p>

              <div className="job-info">
                <span>📍 {atsJob.location}</span>
                <span>💼 {atsJob.type}</span>
                <span>🎓 {atsJob.experience}</span>
              </div>
            </div>

          </div>

        </section>

        {/* LOADING */}

        {atsLoading && (

          <section className="ats-start-card">

            <div className="ats-start-icon">
              ⏳
            </div>

            <h2>Analyzing Your Resume...</h2>

            <p>
              SWIPEX is comparing your resume with the selected job.
            </p>

          </section>

        )}


        {/* ERROR */}

        {atsError && (

          <div className="error-message">
            ! {atsError}
          </div>

        )}


        {/* ATS RESULT */}

        {atsResult && !atsLoading && (

          <section className="ats-result-section">

            <div className="section-title">

              <h2>Resume Match Report</h2>

              <p>
                Your resume analysis for{" "}
                <strong>{atsJob.title}</strong>
              </p>

            </div>


            {/* SCORE */}

            <div className="ats-score-card">

              <div className="ats-score-circle">

                <span>
                  {atsResult.skill_match_percentage ?? 0}%
                </span>

                <small>
                  Skill Match
                </small>

              </div>

              <div className="ats-score-info">

                <h2>
                  Resume Match
                </h2>

                <p>
                  Your resume currently matches{" "}
                  <strong>
                    {atsResult.skill_match_percentage ?? 0}%
                  </strong>{" "}
                  of the required skills for this job.
                </p>

              </div>

            </div>


            {/* MATCHED SKILLS */}

            <div className="ats-result-card">

              <h3>
                ✅ Matched Skills
              </h3>

              {atsResult.matched_skills?.length > 0 ? (

                <div className="ats-skills-container">

                  {atsResult.matched_skills.map(
                    (skill, index) => (

                      <span
                        className="ats-skill matched"
                        key={index}
                      >
                        {skill}
                      </span>

                    )
                  )}

                </div>

              ) : (

                <p className="ats-empty">
                  No matching skills found.
                </p>

              )}

            </div>


            {/* MISSING SKILLS */}

            <div className="ats-result-card">

              <h3>
                ❌ Missing Skills
              </h3>

              {atsResult.missing_skills?.length > 0 ? (

                <div className="ats-skills-container">

                  {atsResult.missing_skills.map(
                    (skill, index) => (

                      <span
                        className="ats-skill missing"
                        key={index}
                      >
                        {skill}
                      </span>

                    )
                  )}

                </div>

              ) : (

                <p className="ats-empty">
                  No missing skills. Great match!
                </p>

              )}

            </div>


            {/* SUMMARY */}

            <div className="ats-result-card">

              <h3>
                📋 Analysis Summary
              </h3>

              <div className="ats-summary">

                <div>
                  <span>Job</span>
                  <strong>
                    {atsResult.job_title}
                  </strong>
                </div>

                <div>
                  <span>Matched Skills</span>
                  <strong>
                    {atsResult.matched_skills?.length || 0}
                  </strong>
                </div>

                <div>
                  <span>Missing Skills</span>
                  <strong>
                    {atsResult.missing_skills?.length || 0}
                  </strong>
                </div>

                <div>
                  <span>Skill Match</span>
                  <strong>
                    {atsResult.skill_match_percentage ?? 0}%
                  </strong>
                </div>

              </div>

            </div>


            {/* ACTIONS */}

            <div className="ats-actions">

              <button
                className="secondary-button"
                onClick={() => {
                  setAtsResult(null);
                  setAtsError("");
                  setAtsLoading(false);
                  setAtsJob(null);
                  setActivePage("job-details");
                }}
              >
                ← Back to Job Details
              </button>

              <button
                className="apply-button"
                onClick={() => {
                  setSelectedJob(null);
                  setAtsJob(null);
                  setAtsResult(null);
                  setAtsError("");
                  setAtsLoading(false);
                  setActivePage("jobs");
                }}
              >
                Find Another Job
              </button>

            </div>

          </section>

        )}

      </>
    );
  };

  /* ================= AI RECOMMENDATIONS ================= */

  const RecommendationsPage = ({
    recommendations,
    recommendationsLoading,
    recommendationsError,
    fetchRecommendations,
    handleSwipe,
    goTo,
    swipeMessage,
  }) => {

    return (
      <>
        <PageHeader
          title="AI Recommendations"
          description="Discover personalized jobs based on your resume and career preferences."
        />

        <section className="jobs-section recommendations-section">
          <div className="section-header">
            <div>
              <h2>Jobs Recommended For You</h2>
              <p>
                SWIPEX ranked these opportunities using your profile and resume.
              </p>
            </div>
          </div>

          {recommendationsLoading && (
            <div className="no-results">
              <h3>🤖 Finding the best jobs for you...</h3>
              <p>
                SWIPEX is analyzing your resume and career preferences.
              </p>
            </div>
          )}

          {recommendationsError && (
            <div className="no-results">
              <h3>Unable to load recommendations</h3>
              <p>{recommendationsError}</p>
            </div>
          )}

          {!recommendationsLoading &&
            !recommendationsError &&
            recommendations.length > 0 && (
              <div className="jobs-grid">
                {recommendations.map((job) => (
                  <div
                    className="job-card swipe-job-card"
                    key={job.id}
                  >
                    <div className="company-logo">
                      {job.company.charAt(0).toUpperCase()}
                    </div>

                    <div className="job-details">
                      <div className="job-title-row">
                        <div>
                          <h3>{job.title}</h3>
                          <p className="company">
                            {job.company}
                          </p>
                        </div>

                        <div className="recommendation-score">
                          {job.match}%
                          <span>Match</span>
                        </div>
                      </div>

                      <div className="job-info">
                        <span>📍 {job.location}</span>
                        <span>💼 {job.type}</span>
                      </div>

                      <div className="recommendation-breakdown">
                        <span>🛠 Skills: {job.skillsScore}%</span>
                        <span>🎯 Role: {job.roleScore}%</span>
                        <span>📍 Location: {job.locationScore}%</span>
                        <span>💼 Job Type: {job.jobTypeScore}%</span>
                      </div>
                    </div>

                    <div className="recommendation-actions">
                      <button
                        className="swipe-button swipe-left"
                        onClick={() => handleSwipe(job, "left")}
                      >
                        ❌
                        <span>Not Interested</span>
                      </button>

                      <button
                        className="swipe-button swipe-down"
                        onClick={() => handleSwipe(job, "down")}
                      >
                        💾
                        <span>Save</span>
                      </button>

                      <button
                        className="swipe-button swipe-right"
                        onClick={() => handleSwipe(job, "right")}
                      >
                        ❤️
                        <span>Interested</span>
                      </button>
                    </div>

                    {swipeJob === job.id && swipeMessage && (
                      <div className="swipe-feedback">
                        {swipeMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          {!recommendationsLoading &&
            !recommendationsError &&
            recommendations.length === 0 && (
              <div className="no-results">
                <div>🤖</div>
                <h3>No recommendations available</h3>
                <p>
                  Upload your resume and complete your profile
                  to get personalized job recommendations.
                </p>

                <button
                  className="apply-button"
                  onClick={() => goTo("profile")}
                >
                  Complete Profile
                </button>
              </div>
            )}
        </section>
      </>
    );
  };
  /* ================= PLACEHOLDER WORKFLOWS ================= */

  const WorkflowPage = ({ icon, title, description }) => (
    <>
      <PageHeader
        title={title}
        description={description}
      />

      <div className="workflow-placeholder">

        <div className="workflow-icon">
          {icon}
        </div>

        <h2>Coming Soon</h2>

        <p>
          This section will be implemented as part of the
          candidate workflow.
        </p>

        <button
          className="apply-button"
          onClick={() => goTo("dashboard")}
        >
          Back to Dashboard
        </button>

      </div>
    </>
  );

  /* ================= PAGE SELECTOR ================= */

  const renderPage = () => {

    switch (activePage) {

      case "jobs":
        return (
          <>
            <FindJobsPage />

            {selectedJob && (
              <div className="job-details-modal-overlay">
                <div className="job-details-modal">
                  <button
                    className="job-details-close"
                    onClick={() => setSelectedJob(null)}
                  >
                    ✕
                  </button>

                  <JobDetailsPage />
                </div>
              </div>
            )}
          </>
        );

      case "job-details":
        return <JobDetailsPage />;

      case "saved":
        return <SavedJobsPage />;

      case "profile":
        return <ProfilePage />;

      case "resume":
        return <ResumePage />;

      case "ats":
        return <ATSAnalysisPage />;

      case "recommendations":
      return (
        <RecommendationsPage
          recommendations={recommendations}
          recommendationsLoading={recommendationsLoading}
          recommendationsError={recommendationsError}
          handleSwipe={handleSwipe}
          goTo={goTo}
          swipeMessage={swipeMessage}
        />
      );

      case "applications":
        return (
          <WorkflowPage
            icon="💼"
            title="My Applications"
            description="Track the jobs you have applied for."
          />
        );

      default:
        return <DashboardPage />;
    }
  };

  /* ================= MAIN ================= */

  return (
    <div className="dashboard">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-logo">
          <span>SWIPEX</span>
          <small>JOB DISCOVERY PLATFORM</small>
        </div>

        <nav className="sidebar-menu">

          <button
            className={`menu-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => goTo("dashboard")}
          >
            <span>🏠</span>
            Dashboard
          </button>

          <button
            className={`menu-item ${
              activePage === "jobs" ? "active" : ""
            }`}
            onClick={() => goTo("jobs")}
          >
            <span>🔎</span>
            Find Jobs
          </button>

          <button
            className={`menu-item ${
              activePage === "resume" ? "active" : ""
            }`}
            onClick={() => goTo("resume")}
          >
            <span>📄</span>
            My Resume
          </button>

          <button
            className={`menu-item ${
              activePage === "ats" ? "active" : ""
            }`}
            onClick={() => goTo("ats")}
          >
            <span>📊</span>
            ATS Analysis
          </button>

          <button
            className={`menu-item ${
              activePage === "recommendations" ? "active" : ""
            }`}
            onClick={() => goTo("recommendations")}
          >
            <span>✨</span>
            AI Recommendations
          </button>

          <button
            className={`menu-item ${
              activePage === "applications" ? "active" : ""
            }`}
            onClick={() => goTo("applications")}
          >
            <span>💼</span>
            My Applications
          </button>

          <button
            className={`menu-item ${
              activePage === "saved" ? "active" : ""
            }`}
            onClick={() => goTo("saved")}
          >
            <span>❤️</span>
            Saved Jobs
          </button>

          <button
            className={`menu-item ${
              activePage === "profile" ? "active" : ""
            }`}
            onClick={() => goTo("profile")}
          >
            <span>👤</span>
            Profile
          </button>

        </nav>

        <button
          className="logout-button"
          onClick={onLogout}
        >
          <span>🚪</span>
          Logout
        </button>

      </aside>

      {/* CONTENT */}

      <main className="dashboard-content">
        {renderPage()}
      </main>

    </div>
  );
}

export default Dashboard;