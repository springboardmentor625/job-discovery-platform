import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Resume() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resume, setResume] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    setMessage("");
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const fileName = selectedFile.name.toLowerCase();

    if (
      !fileName.endsWith(".pdf") &&
      !fileName.endsWith(".docx")
    ) {
      setError("Only PDF and DOCX files are allowed.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume first.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await api.post(
        "/api/candidate/resume",
        formData
      );

      setResume(response.data);

      setMessage(
        "Resume uploaded successfully."
      );

      setFile(null);

    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.detail ||
        "Resume upload failed."
      );

    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="resume-page">

      <div className="resume-container">

        <button
          className="back-button"
          onClick={() => navigate("/candidate")}
        >
          ← Back to Dashboard
        </button>

        <div className="resume-header">

          <p className="section-label">
            RESUME MANAGEMENT
          </p>

          <h1>Upload Your Resume</h1>

          <p>
            Upload your latest resume to improve
            your job recommendations.
          </p>

        </div>


        {/* Upload Card */}

        <div className="resume-upload-card">

          <div className="upload-icon">
            ↑
          </div>

          <h2>
            Upload Resume
          </h2>

          <p>
            Supported formats: PDF and DOCX
          </p>

          <label className="file-select-button">

            Choose Resume

            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              hidden
            />

          </label>


          {file && (

            <div className="selected-file">

              <div>
                <strong>
                  {file.name}
                </strong>

                <span>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <button
                onClick={() => setFile(null)}
              >
                Remove
              </button>

            </div>

          )}


          {file && (

            <button
              className="upload-button"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading
                ? "Uploading..."
                : "Upload Resume"}
            </button>

          )}


          {message && (

            <div className="success-message">
              {message}
            </div>

          )}


          {error && (

            <div className="login-error">
              {error}
            </div>

          )}

        </div>


        {/* Uploaded Resume */}

        {resume && (

          <div className="resume-result-card">

            <p className="section-label">
              UPLOAD COMPLETE
            </p>

            <h2>
              Resume Uploaded
            </h2>

            <div className="resume-info">

              <div>
                <span>File Name</span>

                <strong>
                  {resume.file_name}
                </strong>
              </div>

              <div>
                <span>File Type</span>

                <strong>
                  {resume.file_type}
                </strong>
              </div>

              <div>
                <span>Extracted Text</span>

                <strong>
                  {resume.text_length} characters
                </strong>
              </div>

            </div>

            <div className="resume-status">
              ✓ Resume processed successfully
            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default Resume;