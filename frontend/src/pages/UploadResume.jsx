
import { useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../api/api";


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
      /^[•●▪◦*\-]\s*(.*)$/
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


function UploadResume() {

  const navigate = useNavigate();


  // =========================================================
  // UPLOAD STATE
  // =========================================================

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [error, setError] =
    useState("");

  const [isUploading, setIsUploading] =
    useState(false);


  // =========================================================
  // RESUME ANALYSIS STATE
  // =========================================================

  const [uploadedResume, setUploadedResume] =
    useState(null);

  const [showAnalysis, setShowAnalysis] =
    useState(false);


  // =========================================================
  // CONSTANTS
  // =========================================================

  const MAX_FILE_SIZE =
    5 * 1024 * 1024; // 5 MB


  const allowedFileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];


  // =========================================================
  // FILE CHANGE
  // =========================================================

  const handleFileChange = (event) => {

    const file =
      event.target.files[0];


    setError("");
    setSelectedFile(null);


    if (!file) {
      return;
    }


    // -------------------------------------------------------
    // CHECK FILE TYPE
    // -------------------------------------------------------

    if (!allowedFileTypes.includes(file.type)) {

      setError(
        "Invalid file type. Please upload a PDF, DOC, or DOCX file."
      );


      event.target.value = "";

      return;
    }


    // -------------------------------------------------------
    // CHECK FILE SIZE
    // -------------------------------------------------------

    if (file.size > MAX_FILE_SIZE) {

      setError(
        "File size must not exceed 5 MB."
      );


      event.target.value = "";

      return;
    }


    // -------------------------------------------------------
    // FILE IS VALID
    // -------------------------------------------------------

    setSelectedFile(file);
  };


  // =========================================================
  // REMOVE SELECTED FILE
  // =========================================================

  const handleRemoveFile = () => {

    setSelectedFile(null);

    setError("");


    const fileInput =
      document.getElementById("resume");


    if (fileInput) {
      fileInput.value = "";
    }
  };


  // =========================================================
  // UPLOAD RESUME
  // =========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();


    // -------------------------------------------------------
    // CHECK FILE
    // -------------------------------------------------------

    if (!selectedFile) {

      setError(
        "Please select a resume before continuing."
      );

      return;
    }


    setIsUploading(true);
    setError("");


    // -------------------------------------------------------
    // CREATE FORM DATA
    // -------------------------------------------------------

    const formData =
      new FormData();


    formData.append(
      "file",
      selectedFile
    );


    // -------------------------------------------------------
    // SEND TO BACKEND
    // -------------------------------------------------------

    try {

      const response =
        await api.post(
          "/api/resumes/upload",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


      console.log(
        "Resume uploaded successfully:",
        response.data
      );


      // -----------------------------------------------------
      // SAVE RESUME ID
      // -----------------------------------------------------

      if (response.data.resume_id) {

        localStorage.setItem(
          "resume_id",
          response.data.resume_id
        );
      }


      // -----------------------------------------------------
      // SHOW RESUME ANALYSIS ON SAME PAGE
      // -----------------------------------------------------

      setUploadedResume(
        response.data
      );

      setShowAnalysis(true);


    } catch (error) {

      console.error(
        "Resume upload error:",
        error
      );


      // -------------------------------------------------------
      // DISPLAY BACKEND ERROR
      // -------------------------------------------------------

      setError(
        error.response?.data?.detail ||
        "Resume upload failed. Please try again."
      );


    } finally {

      setIsUploading(false);
    }
  };


  // =========================================================
  // UPLOAD ANOTHER RESUME
  // =========================================================

  const handleUploadAnotherResume = () => {

    setShowAnalysis(false);

    setUploadedResume(null);

    setSelectedFile(null);

    setError("");


    const fileInput =
      document.getElementById("resume");


    if (fileInput) {
      fileInput.value = "";
    }


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };


  // =========================================================
  // CONTINUE TO AI RECOMMENDED JOBS
  // =========================================================

  const handleContinueToRecommendations = () => {

    navigate(
      "/recommended-jobs",
      {
        state: {
          resume: uploadedResume,
        },
      }
    );
  };


  // =========================================================
  // UI
  // =========================================================

  return (

    <div
      className="page resume-page"
      style={{
        width: "100vw",
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "stretch",
      }}
    >

      <div
        className="resume-card"
        style={{
          width: "100%",
          minHeight: "100vh",
          maxWidth: "none",
          margin: 0,
          borderRadius: 0,
          boxSizing: "border-box",
        }}
      >

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="resume-header">

          <div>

            <h1>
              Upload Your Resume
            </h1>

            <p>
              Add your latest resume so SwipeX can
              understand your skills and find better
              job opportunities for you.
            </p>

          </div>

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div className="resume-error">

            <span>!</span>

            <p>
              {error}
            </p>

          </div>

        )}


        {/* ===================================================
            UPLOAD AREA
        =================================================== */}

        {!showAnalysis && (

          <>

            <form onSubmit={handleSubmit}>

              <label
                htmlFor="resume"
                className={`resume-upload-area ${
                  selectedFile ? "has-file" : ""
                }`}
              >

                <div className="upload-cloud-icon">
                  ↑
                </div>


                <h2>

                  {selectedFile
                    ? "Resume selected"
                    : "Upload your resume"}

                </h2>


                <p>

                  {selectedFile
                    ? "Your file is ready to upload."
                    : "Click here to browse and select your resume"}

                </p>


                {!selectedFile && (

                  <span className="browse-button">
                    Choose File
                  </span>

                )}


                <input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />

              </label>


              {/* =================================================
                  FILE REQUIREMENTS
              ================================================= */}

              <div className="resume-requirements">

                <div className="requirement-item">

                  <span>✓</span>

                  <div>

                    <strong>
                      Supported formats
                    </strong>

                    <p>
                      PDF, DOC, DOCX
                    </p>

                  </div>

                </div>


                <div className="requirement-item">

                  <span>✓</span>

                  <div>

                    <strong>
                      Maximum size
                    </strong>

                    <p>
                      5 MB
                    </p>

                  </div>

                </div>

              </div>


              {/* =================================================
                  SELECTED FILE
              ================================================= */}

              {selectedFile && (

                <div className="selected-resume-card">

                  <div className="selected-resume-icon">
                    📄
                  </div>


                  <div className="selected-resume-details">

                    <strong>
                      {selectedFile.name}
                    </strong>

                    <p>
                      {(
                        selectedFile.size /
                        (1024 * 1024)
                      ).toFixed(2)}{" "}
                      MB
                    </p>

                  </div>


                  <button
                    type="button"
                    className="remove-resume-button"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                  >
                    Remove
                  </button>

                </div>

              )}


              {/* =================================================
                  INFORMATION
              ================================================= */}

              <div className="resume-analysis-info">

                <div>

                  <strong>
                    What happens next?
                  </strong>

                  <p>
                    SwipeX will analyze your resume,
                    extract relevant information and
                    use it to personalize your job
                    recommendations.
                  </p>

                </div>

              </div>


              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                className="resume-submit-button"
                disabled={isUploading}
              >

                {isUploading
                  ? "Uploading Resume..."
                  : "Upload Resume & Continue"}

              </button>

            </form>


            {/* ===================================================
                FOOTER
            =================================================== */}

            <p className="resume-security-note">
              Your resume is securely processed by SwipeX.
            </p>

          </>

        )}


        {/* =====================================================
            RESUME ANALYSIS
            SAME UI AS PREVIOUS ResumeAnalysis.jsx
        ===================================================== */}

        {showAnalysis && uploadedResume && (

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
                  <strong>
                    Resume Name:
                  </strong>{" "}
                  {uploadedResume.resume_name || "Resume"}
                </p>


                <p>
                  <strong>
                    Resume ID:
                  </strong>{" "}
                  {uploadedResume.resume_id || "Not available"}
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


              {Array.isArray(
                uploadedResume.extracted_skills
              ) &&
              uploadedResume.extracted_skills.length > 0 ? (

                <div className="skills-container">

                  {uploadedResume.extracted_skills.map(
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


              {Array.isArray(
                uploadedResume.extracted_education
              ) &&
              uploadedResume.extracted_education.length > 0 ? (

                <div className="education-list">

                  {uploadedResume.extracted_education.map(
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


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="analysis-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={handleUploadAnotherResume}
              >
                Upload Another Resume
              </button>


              <button
                type="button"
                className="primary-button"
                onClick={handleContinueToRecommendations}
              >
                Continue to AI Recommended Jobs
              </button>

            </div>


            {/* =================================================
                FORMATTED EXTRACTED RESUME TEXT
                ONLY DISPLAY FORMATTING CHANGED
            ================================================= */}

            {uploadedResume.resume_text && (

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

                  {formatResumeText(
                    uploadedResume.resume_text
                  )}

                </div>

              </details>

            )}

          </div>

        )}

      </div>

    </div>

  );
}


export default UploadResume;
