
import { useLocation, useNavigate } from "react-router-dom";

function ResumeAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();

  // Resume data received from ResumeParsing.jsx
  const resume = location.state?.resume;

  // -------------------------------------------------------
  // HANDLE MISSING RESUME DATA
  // -------------------------------------------------------

  if (!resume) {
    return (
      <div className="page">
        <div className="form-container">

          <h1>Resume Analysis</h1>

          <p className="form-subtitle">
            Resume information was not found.
            Please upload your resume again.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/upload-resume")}
          >
            Upload Resume
          </button>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // DATA RECEIVED FROM BACKEND
  // -------------------------------------------------------

  const resumeName =
    resume.resume_name || "Resume";

  const resumeId =
    resume.resume_id || "Not available";

  const resumeText =
    resume.resume_text || "";

  const skills =
    Array.isArray(resume.extracted_skills)
      ? resume.extracted_skills
      : [];

  const education =
    Array.isArray(resume.extracted_education)
      ? resume.extracted_education
      : [];

  const experienceYears =
    resume.experience_years;

  // -------------------------------------------------------
  // FORMAT EXPERIENCE YEARS
  // -------------------------------------------------------

  const formattedExperienceYears =
    experienceYears !== null &&
    experienceYears !== undefined &&
    experienceYears !== ""
      ? `${experienceYears} years`
      : "Not specified";

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (
    <div className="page">

      <div className="form-container resume-analysis-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <h1>
          Resume Analysis
        </h1>

        <p className="form-subtitle">
          SwipeX has automatically extracted the following
          information from your uploaded resume.
        </p>


        {/* =================================================
            RESUME INFORMATION
        ================================================= */}

        <div className="analysis-section">

          <h2>
            Resume Information
          </h2>

          <div className="analysis-card">

            <p>
              <strong>Resume Name:</strong>{" "}
              {resumeName}
            </p>

            <p>
              <strong>Resume ID:</strong>{" "}
              {resumeId}
            </p>

            <p>
              <strong>Experience:</strong>{" "}
              {formattedExperienceYears}
            </p>

          </div>

        </div>


        {/* =================================================
            EXTRACTED SKILLS
        ================================================= */}

        <div className="analysis-section">

          <h2>
            Extracted Skills
          </h2>

          <p className="form-subtitle">
            Skills automatically detected from your resume.
          </p>

          {skills.length > 0 ? (

            <div className="skills-container">

              {skills.map(
                (skill, index) => (

                  <span
                    key={`${skill}-${index}`}
                    className="skill-tag"
                  >
                    {skill}
                  </span>

                )
              )}

            </div>

          ) : (

            <div className="analysis-card">

              <p className="empty-message">
                No skills were detected in this resume.
              </p>

            </div>

          )}

        </div>


        {/* =================================================
            EDUCATION
        ================================================= */}

        <div className="analysis-section">

          <h2>
            Education
          </h2>

          {education.length > 0 ? (

            <div className="education-list">

              {education.map(
                (item, index) => (

                  <div
                    className="analysis-card education-card"
                    key={index}
                  >

                    {item.degree && (
                      <h3>
                        {item.degree}

                        {item.field
                          ? ` in ${item.field}`
                          : ""}
                      </h3>
                    )}

                    {item.institution && (
                      <p>
                        <strong>
                          Institution:
                        </strong>{" "}
                        {item.institution}
                      </p>
                    )}

                    {item.year && (
                      <p>
                        <strong>
                          Year:
                        </strong>{" "}
                        {item.year}
                      </p>
                    )}

                    {item.details && (
                      <p>
                        {item.details}
                      </p>
                    )}

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="analysis-card">

              <p className="empty-message">
                No education information was detected.
              </p>

            </div>

          )}

        </div>


        {/* =================================================
            ACTION BUTTONS
        ================================================= */}

        <div className="analysis-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate("/upload-resume")
            }
          >
            Upload Another Resume
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate(
                "/recommended-jobs",
                {
                  state: {
                    resume,
                  },
                }
              )
            }
          >
            Continue to AI Recommended Jobs
          </button>

        </div>


        {/* =================================================
            DEVELOPMENT / DEBUG SECTION
        ================================================= */}

        {resumeText && (

          <details className="raw-resume-section">

            <summary>
              View Extracted Resume Text
            </summary>

            <div
              className="raw-resume-text"
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
                wordBreak: "normal",
                lineHeight: "1.6",
                fontSize: "14px",
                maxHeight: "500px",
                overflowY: "auto",
                padding: "16px",
                marginTop: "12px",
                boxSizing: "border-box",
                width: "100%"
              }}
            >
              {resumeText}
            </div>

          </details>

        )}

      </div>

    </div>
  );
}

export default ResumeAnalysis;
