
import { useState, useRef } from "react";

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

  const analysisRef = useRef(null);


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
      // SAVE UPLOADED RESUME
      // -----------------------------------------------------

      setUploadedResume(
        response.data
      );


      // -----------------------------------------------------
      // AUTOMATICALLY SCROLL TO RESUME ANALYSIS
      // -----------------------------------------------------

      setTimeout(() => {

        if (analysisRef.current) {

          analysisRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        }

      }, 100);


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

  const handleUploadAnotherResume = async () => {

    setError("");


    const resumeId =
      uploadedResume?.resume_id ||
      localStorage.getItem("resume_id");


    // -------------------------------------------------------
    // DELETE PREVIOUSLY UPLOADED RESUME
    // -------------------------------------------------------

    if (resumeId) {

      try {

        await api.delete(
          `/api/resumes/${resumeId}`
        );

      } catch (error) {

        console.error(
          "Resume delete error:",
          error
        );

      }

    }


    // -------------------------------------------------------
    // CLEAR PREVIOUS RESUME
    // -------------------------------------------------------

    setUploadedResume(null);

    setSelectedFile(null);


    localStorage.removeItem(
      "resume_id"
    );


    // -------------------------------------------------------
    // CLEAR FILE INPUT
    // -------------------------------------------------------

    const fileInput =
      document.getElementById("resume");


    if (fileInput) {
      fileInput.value = "";
    }


    // -------------------------------------------------------
    // SCROLL BACK TO UPLOAD SECTION
    // -------------------------------------------------------

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
  // BACK TO DASHBOARD
  // =========================================================

  const handleBackToDashboard = () => {

    navigate("/dashboard");

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
            UPLOAD RESUME SECTION
        =================================================== */}

        <div
          style={{
            width: "100%",
            boxSizing: "border-box"
          }}
        >

          {/* ===================================================
              HEADER
          =================================================== */}

          <div className="resume-header">

            <div>

              <h1>
                Upload Resume
              </h1>

              <p>
                Add your resume so SwipeX can
                find suitable
                job opportunities.
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
                  Choose Resume
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

            <div
              className="resume-requirements"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "18px",
                marginTop: "24px",
                marginBottom: "24px"
              }}
            >

              {/* -------------------------------------------------
                  SUPPORTED FORMATS
              ------------------------------------------------- */}

              <div
                className="requirement-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "18px 20px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  backgroundColor: "#f8fafc",
                  boxSizing: "border-box"
                }}
              >

                <span
                  style={{
                    width: "38px",
                    height: "38px",
                    minWidth: "38px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#dcfce7",
                    color: "#15803d",
                    fontWeight: "700",
                    fontSize: "18px"
                  }}
                >
                  ✓
                </span>

                <div>

                  <strong
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      color: "#111827",
                      fontSize: "14px"
                    }}
                  >
                    Supported formats
                  </strong>

                  <p
                    style={{
                      margin: 0,
                      color: "#1b52a0",
                      fontSize: "13px"
                    }}
                  >
                    PDF, DOC, DOCX
                  </p>

                </div>

              </div>


              {/* -------------------------------------------------
                  MAXIMUM SIZE
              ------------------------------------------------- */}

              <div
                className="requirement-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "18px 20px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  backgroundColor: "#f8fafc",
                  boxSizing: "border-box"
                }}
              >

                <span
                  style={{
                    width: "38px",
                    height: "38px",
                    minWidth: "38px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#dcfce7",
                    color: "#15803d",
                    fontWeight: "700",
                    fontSize: "18px"
                  }}
                >
                  ✓
                </span>

                <div>

                  <strong
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      color: "#111827",
                      fontSize: "14px"
                    }}
                  >
                    Maximum File Size
                  </strong>

                  <p
                    style={{
                      margin: 0,
                      color: "#1b52a0",
                      fontSize: "13px"
                    }}
                  >
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
                  Remove Resume
                </button>

              </div>

            )}


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
                : "Analyze Resume"}

            </button>

          </form>


          {/* ===================================================
              FOOTER
          =================================================== */}

          <p className="resume-security-note">
            Your resume is securely processed by SwipeX.
          </p>

        </div>


        {/* =====================================================
            RESUME ANALYSIS SECTION
            APPEARS BELOW UPLOAD RESUME SECTION
        ===================================================== */}

        {uploadedResume && (

          <div
            ref={analysisRef}
            className="form-container resume-analysis-container"
            style={{
              width: "100%",
              maxWidth: "none",
              minHeight: "100vh",
              boxSizing: "border-box",
              margin: "60px 0 0 0",
              padding: "40px 50px",
              borderTop: "1px solid #e5e7eb"
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
                EXTRACTED SKILLS
            ================================================= */}

            <div className="analysis-section">

              <h2>
                Extracted Skills
              </h2>


             


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
                FORMATTED EXTRACTED RESUME TEXT
                BELOW EDUCATION
            ================================================= */}

            {uploadedResume.resume_text && (

              <details
                className="raw-resume-section"
                style={{
                  marginTop: "30px"
                }}
              >

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


            {/* =================================================
                ACTION BUTTONS
                HORIZONTAL
            ================================================= */}

            <div
              className="analysis-actions"
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "14px",
                width: "100%",
                marginTop: "30px"
              }}
            >

              {/* -------------------------------------------------
                  BACK TO DASHBOARD
              ------------------------------------------------- */}

              <button
                type="button"
                className="secondary-button"
                onClick={handleBackToDashboard}
                style={{
                  flex: 1
                }}
              >
                Back to Dashboard
              </button>


              {/* -------------------------------------------------
                  UPLOAD ANOTHER RESUME
              ------------------------------------------------- */}

              <button
                type="button"
                className="secondary-button"
                onClick={handleUploadAnotherResume}
                style={{
                  flex: 1
                }}
              >
                Upload Another Resume
              </button>


              {/* -------------------------------------------------
                  CONTINUE TO AI RECOMMENDED JOBS
              ------------------------------------------------- */}

              <button
                type="button"
                className="primary-button"
                onClick={handleContinueToRecommendations}
                style={{
                  flex: 1
                }}
              >
                Get AI Recommended Jobs
              </button>

            </div>

          </div>

        )}

      </div>

    </div>

  );
}


export default UploadResume;
