
import { useLocation, useNavigate } from "react-router-dom";


// =========================================================
// FORMAT EXTRACTED RESUME TEXT
// ONLY USED FOR DISPLAY
// =========================================================

function formatResumeText(text) {
  if (!text) {
    return null;
  }

  const sectionHeadings = [
    "professional summary",
    "summary",
    "profile",
    "technical skills",
    "skills",
    "core skills",
    "professional experience",
    "work experience",
    "experience",
    "employment history",
    "education",
    "academic background",
    "educational qualification",
    "projects",
    "certifications",
    "achievements",
    "awards",
    "languages",
    "interests",
    "objective",
    "career objective",
    "professional objective"
  ];

  const lines = text.split("\n");

  return lines.map((line, index) => {

    const trimmedLine = line.trim();

    // -------------------------------------------------------
    // Preserve empty lines
    // -------------------------------------------------------

    if (!trimmedLine) {
      return (
        <div
          key={index}
          style={{
            height: "8px"
          }}
        />
      );
    }

    // -------------------------------------------------------
    // Check for resume section headings
    // -------------------------------------------------------

    const normalizedLine = trimmedLine
      .replace(/[:\-]+$/, "")
      .trim()
      .toLowerCase();

    const isSectionHeading =
      sectionHeadings.includes(normalizedLine);

    if (isSectionHeading) {
      return (
        <div
          key={index}
          style={{
            marginTop: index === 0 ? "0" : "20px",
            marginBottom: "8px",
            paddingBottom: "5px",
            borderBottom: "1px solid #e5e7eb",
            fontSize: "15px",
            fontWeight: "700",
            color: "#111827",
            lineHeight: "1.5"
          }}
        >
          {trimmedLine}
        </div>
      );
    }

    // -------------------------------------------------------
    // Detect bullet points
    // -------------------------------------------------------

    const bulletMatch = trimmedLine.match(
      /^[•●▪◦*-]\s*(.*)$/
    );

    if (bulletMatch) {
      return (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginBottom: "6px",
            paddingLeft: "4px",
            lineHeight: "1.7",
            color: "#374151"
          }}
        >
          <span
            style={{
              fontWeight: "700",
              color: "#4b5563",
              flexShrink: 0
            }}
          >
            •
          </span>

          <span>
            {bulletMatch[1]}
          </span>
        </div>
      );
    }

    // -------------------------------------------------------
    // Bold labels before colon
    //
    // Example:
    // Languages: Python, Java, JavaScript
    // Databases: PostgreSQL, MongoDB
    // -------------------------------------------------------

    const labelMatch = trimmedLine.match(
      /^([^:]{1,40}):\s*(.*)$/
    );

    if (labelMatch) {
      return (
        <div
          key={index}
          style={{
            marginBottom: "6px",
            lineHeight: "1.7",
            color: "#374151"
          }}
        >
          <strong
            style={{
              color: "#111827",
              fontWeight: "700"
            }}
          >
            {labelMatch[1]}:
          </strong>{" "}
          {labelMatch[2]}
        </div>
      );
    }

    // -------------------------------------------------------
    // Normal resume text
    // -------------------------------------------------------

    return (
      <div
        key={index}
        style={{
          marginBottom: "6px",
          lineHeight: "1.7",
          color: "#374151"
        }}
      >
        {trimmedLine}
      </div>
    );
  });
}


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

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (
    <div
      className="page"
      style={{
        width: "100%",
        minHeight: "100vh",
        boxSizing: "border-box"
      }}
    >

      <div
        className="form-container resume-analysis-container"
        style={{
          width: "100%",
          maxWidth: "none",
          minHeight: "100vh",
          boxSizing: "border-box",
          margin: "0",
          padding: "40px 50px"
        }}
      >

        {}

        <h1>
          Resume Analysis
        </h1>

        <p className="form-subtitle">
          SwipeX has automatically extracted the following
          information from your uploaded resume.
        </p>


        {}

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

          </div>

        </div>


        {}

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


        {}

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
                    style={{
                      padding: "18px",
                      marginBottom: "12px",
                      lineHeight: "1.6",
                      textAlign: "left"
                    }}
                  >

                    {item.degree && (
                      <h3
                        style={{
                          margin: "0 0 12px 0",
                          fontSize: "16px",
                          lineHeight: "1.4"
                        }}
                      >
                        {item.degree}

                        {item.field
                          ? ` in ${item.field}`
                          : ""}
                      </h3>
                    )}

                    {item.institution && (
                      <p
                        style={{
                          margin: "8px 0",
                          lineHeight: "1.6"
                        }}
                      >
                        <strong>
                          Institution:
                        </strong>{" "}
                        {item.institution}
                      </p>
                    )}

                    {item.year && (
                      <p
                        style={{
                          margin: "8px 0",
                          lineHeight: "1.6"
                        }}
                      >
                        <strong>
                          Year:
                        </strong>{" "}
                        {item.year}
                      </p>
                    )}

                    {item.details && (
                      <p
                        style={{
                          margin: "10px 0 0 0",
                          lineHeight: "1.7",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "break-word"
                        }}
                      >
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


        {}

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
            FORMATTED EXTRACTED RESUME TEXT
            ONLY DISPLAY FORMATTING CHANGED
        ================================================= */}

        {resumeText && (

          <details className="raw-resume-section">

            <summary
              style={{
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "16px",
                color: "#1f2937",
                padding: "4px 0"
              }}
            >
              View Extracted Resume Text
            </summary>

            <div
              className="raw-resume-text"
              style={{
                marginTop: "16px",
                width: "100%",
                maxHeight: "500px",
                overflowY: "auto",
                overflowX: "hidden",
                boxSizing: "border-box",

                padding: "28px 30px",

                backgroundColor: "#ffffff",

                border: "1px solid #e2e8f0",
                borderRadius: "12px",

                boxShadow:
                  "0 4px 14px rgba(15, 23, 42, 0.08)",

                fontFamily:
                  "Arial, Helvetica, sans-serif",

                fontSize: "14px",

                color: "#374151",

                overflowWrap: "break-word",
                wordBreak: "normal",

                textAlign: "left",

                scrollbarWidth: "thin"
              }}
            >
              {formatResumeText(resumeText)}
            </div>

          </details>

        )}

      </div>

    </div>
  );
}

export default ResumeAnalysis;
