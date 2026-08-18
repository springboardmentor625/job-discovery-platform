import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ATSAnalysis() {
  const navigate = useNavigate();

  const [atsScore] = useState(82);

  const [analysis] = useState({
    skillsMatch: 88,
    experienceMatch: 80,
    educationMatch: 90,
    keywordsMatch: 75,
  });

  const handleContinue = () => {
    console.log("ATS Score:", atsScore);
    console.log("ATS Analysis:", analysis);

    navigate("/recommended-jobs");
  };

  return (
    <div className="page">
      <div className="form-container ats-container">

        <div className="success-icon">
          ✓
        </div>

        <h1>ATS Analysis</h1>

        <p className="form-subtitle">
          Your resume has been analyzed for compatibility
          with job requirements.
        </p>

        {/* ATS SCORE */}

        <div className="ats-score-section">

          <div className="ats-score-circle">
            <span className="ats-score">
              {atsScore}
            </span>

            <span className="ats-score-label">
              / 100
            </span>
          </div>

          <h2>ATS Compatibility Score</h2>

          <p>
            Your resume has a good compatibility score.
          </p>

        </div>

        {/* SKILLS MATCH */}

        <div className="ats-metric">

          <div className="metric-header">
            <span>Skills Match</span>
            <strong>{analysis.skillsMatch}%</strong>
          </div>

          <div className="metric-bar">
            <div
              className="metric-progress"
              style={{
                width: `${analysis.skillsMatch}%`,
              }}
            ></div>
          </div>

        </div>

        {/* EXPERIENCE MATCH */}

        <div className="ats-metric">

          <div className="metric-header">
            <span>Experience Match</span>
            <strong>{analysis.experienceMatch}%</strong>
          </div>

          <div className="metric-bar">
            <div
              className="metric-progress"
              style={{
                width: `${analysis.experienceMatch}%`,
              }}
            ></div>
          </div>

        </div>

        {/* EDUCATION MATCH */}

        <div className="ats-metric">

          <div className="metric-header">
            <span>Education Match</span>
            <strong>{analysis.educationMatch}%</strong>
          </div>

          <div className="metric-bar">
            <div
              className="metric-progress"
              style={{
                width: `${analysis.educationMatch}%`,
              }}
            ></div>
          </div>

        </div>

        {/* KEYWORDS MATCH */}

        <div className="ats-metric">

          <div className="metric-header">
            <span>Keywords Match</span>
            <strong>{analysis.keywordsMatch}%</strong>
          </div>

          <div className="metric-bar">
            <div
              className="metric-progress"
              style={{
                width: `${analysis.keywordsMatch}%`,
              }}
            ></div>
          </div>

        </div>

        {/* INFORMATION */}

        <div className="ats-info">

          <h3>What this score means</h3>

          <p>
            The ATS score indicates how well your resume
            matches common job requirements and keywords.
            A higher score can improve your chances of
            being considered by employers.
          </p>

        </div>

        {/* CONTINUE */}

        <button
          type="button"
          className="primary-button"
          onClick={handleContinue}
        >
          View Recommended Jobs
        </button>

      </div>
    </div>
  );
}

export default ATSAnalysis;