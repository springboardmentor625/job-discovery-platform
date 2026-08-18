import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ResumeAnalysis() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState([
    "Python",
    "React",
    "JavaScript",
    "SQL",
    "Machine Learning",
  ]);

  const [experience, setExperience] = useState("Fresher");

  const [education, setEducation] = useState(
    "B.Tech Computer Science"
  );

  const handleContinue = () => {
    console.log("Extracted Skills:", skills);
    console.log("Extracted Experience:", experience);
    console.log("Extracted Education:", education);

    navigate("/ats-analysis");
  };

  return (
    <div className="page">
      <div className="form-container analysis-container">

        <div className="success-icon">
          ✓
        </div>

        <h1>Resume Analysis</h1>

        <p className="form-subtitle">
          SwipeX has extracted the following information
          from your resume.
        </p>

        {/* Skills */}

        <div className="analysis-section">

          <h2>Extracted Skills</h2>

          <div className="skills-container">

            {skills.map((skill, index) => (
              <span
                className="skill-tag"
                key={index}
              >
                {skill}
              </span>
            ))}

          </div>

        </div>

        {/* Experience */}

        <div className="analysis-section">

          <h2>Experience</h2>

          <div className="analysis-value">
            {experience}
          </div>

        </div>

        {/* Education */}

        <div className="analysis-section">

          <h2>Education</h2>

          <div className="analysis-value">
            {education}
          </div>

        </div>

        {/* Information */}

        <div className="analysis-info">

          <p>
            These details were extracted from your uploaded
            resume and will be used to personalize your job
            recommendations.
          </p>

        </div>

        {/* Continue */}

        <button
          type="button"
          className="primary-button"
          onClick={handleContinue}
        >
          Continue to ATS Analysis
        </button>

      </div>
    </div>
  );
}

export default ResumeAnalysis;