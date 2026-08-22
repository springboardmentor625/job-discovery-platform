import { useState, useEffect  } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard({ user, onLogout }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeMessage, setResumeMessage] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedJobs, setSavedJobs] = useState([]);

  const jobs = [
    {
      id: 1,
      title: "Junior Full Stack Developer",
      company: "TechNova Solutions",
      location: "Hyderabad",
      type: "Full Time",
      experience: "0–2 Years",
      skills: "React • Django • Python",
      match: 92,
    },
    {
      id: 2,
      title: "Python Developer",
      company: "CloudByte Technologies",
      location: "Bangalore",
      type: "Full Time",
      experience: "0–2 Years",
      skills: "Python • Django • SQL",
      match: 87,
    },
    {
      id: 3,
      title: "Frontend Developer",
      company: "Innovate Labs",
      location: "Hyderabad",
      type: "Full Time",
      experience: "1–2 Years",
      skills: "React • JavaScript • CSS",
      match: 84,
    },
  ];

  const filteredJobs = jobs.filter((job) => {
    const search = searchTerm.toLowerCase();

    return (
      job.title.toLowerCase().includes(search) ||
      job.company.toLowerCase().includes(search) ||
      job.skills.toLowerCase().includes(search) ||
      job.location.toLowerCase().includes(search)
    );
  });

  const toggleSaveJob = (jobId) => {
    setSavedJobs((current) =>
      current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId]
    );
  };

  const firstName = user?.full_name
    ? user.full_name.split(" ")[0]
    : "User";

  const goTo = (page) => {
    setActivePage(page);
    setSearchTerm("");
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
        title={`Welcome back, ${firstName}! 👋`}
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
          <JobCard key={job.id} job={job} />
        ))}

      </section>
    </>
  );

  /* ================= JOB CARD ================= */

  const JobCard = ({ job }) => (
    <div className="job-card">

      <div className="company-logo">
        {job.company.charAt(0)}
      </div>

      <div className="job-details">

        <div className="job-title-row">

          <div>
            <h3>{job.title}</h3>

            <p className="company">
              {job.company}
            </p>
          </div>

          <span className="match-badge">
            {job.match}% Match
          </span>

        </div>

        <div className="job-info">
          <span>📍 {job.location}</span>
          <span>💼 {job.type}</span>
          <span>🎓 {job.experience}</span>
        </div>

        <p className="skills">
          {job.skills}
        </p>

      </div>

      <div className="job-actions">

        <button
          className={`save-button ${
            savedJobs.includes(job.id) ? "saved" : ""
          }`}
          onClick={() => toggleSaveJob(job.id)}
        >
          {savedJobs.includes(job.id) ? "♥ Saved" : "♡ Save"}
        </button>

        <button className="apply-button">
          View Job
        </button>

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
            placeholder="e.g. Python Developer, React, Hyderabad..."
          />

        </div>

      </section>

      <section className="jobs-section">

        <div className="section-header">
          <div>
            <h2>{filteredJobs.length} Jobs Found</h2>
            <p>Matching your search criteria.</p>
          </div>
        </div>

        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
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
              <JobCard key={job.id} job={job} />
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
        bio: data.bio || "",
        career_goal: data.career_goal || "",
        preferred_job_role: data.preferred_job_role || "",
        linkedin_url: data.linkedin_url || "",
        github_url: data.github_url || "",
        portfolio_url: data.portfolio_url || "",
      });

    } catch (error) {

      console.error("Profile loading error:", error);

      setProfileError(
        "Unable to load your profile."
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

      Object.entries(profileForm).forEach(
        ([key, value]) => {
          formData.append(key, value);
        }
      );

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

                      {experience
                        .split("\n")
                        .map((line, lineIndex) => (

                          <p
                            key={lineIndex}
                            className={
                              line.startsWith("")
                                ? "experience-bullet"
                                : "experience-line"
                            }
                          >
                            {line}
                          </p>

                        ))}

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

                      {education
                        .split("\n")
                        .map((line, lineIndex) => (

                          <p
                            key={lineIndex}
                            className="education-line"
                          >
                            {line}
                          </p>

                        ))}

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
        return <FindJobsPage />;

      case "saved":
        return <SavedJobsPage />;

      case "profile":
        return <ProfilePage />;

      case "resume":
        return <ResumePage />;

      case "ats":
        return (
          <WorkflowPage
            icon="📊"
            title="ATS Analysis"
            description="Analyze your resume against job requirements."
          />
        );

      case "recommendations":
        return (
          <WorkflowPage
            icon="✨"
            title="AI Recommendations"
            description="Discover personalized job recommendations."
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