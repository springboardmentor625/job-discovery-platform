import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RecommendedJobs() {
  const navigate = useNavigate();

  // Temporary frontend job data
  const [jobs] = useState([
    {
      id: 1,
      title: "Software Developer",
      company: "ABC Technologies",
      location: "Bangalore",
      type: "Full Time",
      experience: "0-2 Years",
      skills: ["React", "JavaScript", "Python"],
      salary: "₹5 - ₹8 LPA",
    },
    {
      id: 2,
      title: "Frontend Developer",
      company: "Tech Solutions",
      location: "Pune",
      type: "Full Time",
      experience: "0-2 Years",
      skills: ["React", "HTML", "CSS", "JavaScript"],
      salary: "₹4 - ₹7 LPA",
    },
    {
      id: 3,
      title: "Python Developer",
      company: "Innovate Labs",
      location: "Hyderabad",
      type: "Full Time",
      experience: "0-1 Years",
      skills: ["Python", "Django", "SQL"],
      salary: "₹4 - ₹6 LPA",
    },
  ]);

  const [currentJob, setCurrentJob] = useState(0);

  const job = jobs[currentJob];

  const handleStartSwiping = () => {
    navigate("/swipe-jobs");
  };

  if (!job) {
    return (
      <div className="page">
        <div className="form-container">
          <h1>No More Jobs</h1>

          <p className="form-subtitle">
            We currently don't have any more recommended
            jobs for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="jobs-container">

        {/* Header */}

        <div className="jobs-header">

          <div>
            <h1>Recommended Jobs</h1>

            <p>
              Jobs matched with your profile and resume
            </p>
          </div>

          <div className="job-count">
            {jobs.length} Jobs
          </div>

        </div>

        {/* Job Card */}

        <div className="job-card">

          <div className="job-card-header">

            <div className="company-logo">
              {job.company.charAt(0)}
            </div>

            <div>
              <h2>{job.title}</h2>

              <p className="company-name">
                {job.company}
              </p>
            </div>

          </div>

          <div className="job-details">

            <div className="job-detail">
              <span>📍</span>
              {job.location}
            </div>

            <div className="job-detail">
              <span>💼</span>
              {job.type}
            </div>

            <div className="job-detail">
              <span>🎓</span>
              {job.experience}
            </div>

            <div className="job-detail">
              <span>💰</span>
              {job.salary}
            </div>

          </div>

          {/* Skills */}

          <div className="job-skills">

            <h3>Required Skills</h3>

            <div className="job-skill-list">

              {job.skills.map((skill, index) => (
                <span
                  className="job-skill"
                  key={index}
                >
                  {skill}
                </span>
              ))}

            </div>

          </div>

          {/* Match Score */}

          <div className="job-match">

            <div className="match-header">
              <span>Profile Match</span>
              <strong>85%</strong>
            </div>

            <div className="match-bar">
              <div
                className="match-progress"
                style={{ width: "85%" }}
              ></div>
            </div>

          </div>

          {/* Job Description */}

          <div className="job-description">

            <h3>About this job</h3>

            <p>
              This role is suitable for candidates with
              relevant technical skills and experience.
              Your resume shows a good match with the
              requirements of this position.
            </p>

          </div>

          {/* Start Swiping */}

          <button
            type="button"
            className="primary-button"
            onClick={handleStartSwiping}
          >
            Start Swiping Jobs
          </button>

        </div>

        {/* Job navigation */}

        <div className="job-navigation">

          <span>
            Showing job {currentJob + 1} of {jobs.length}
          </span>

        </div>

      </div>
    </div>
  );
}

export default RecommendedJobs;