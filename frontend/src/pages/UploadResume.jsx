import { useState } from "react";
import { useNavigate } from "react-router-dom";

function UploadResume() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const allowedFileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    setError("");
    setSelectedFile(null);

    if (!file) {
      return;
    }

    // Check file type
    if (!allowedFileTypes.includes(file.type)) {
      setError(
        "Invalid file type. Please upload a PDF, DOC, or DOCX file."
      );

      e.target.value = "";
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must not exceed 5 MB.");

      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError("");

    const fileInput = document.getElementById("resume");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select a resume before continuing.");
      return;
    }

    console.log("Resume selected:", selectedFile);

    /*
      Later, the selected file will be sent
      to the backend for actual upload and
      AI resume parsing.

      For now, move to the frontend
      AI Resume Parsing screen.
    */

    navigate("/resume-parsing");
  };

  return (
    <div className="page">
      <div className="form-container resume-container">

        <h1>Upload Your Resume</h1>

        <p className="form-subtitle">
          Upload your latest resume to continue with SwipeX.
        </p>

        <div className="resume-info">

          <p>
            Your resume will be analyzed by SwipeX to extract
            your skills and experience.
          </p>

          <p>
            Accepted formats: <strong>PDF, DOC, DOCX</strong>
          </p>

          <p>
            Maximum file size: <strong>5 MB</strong>
          </p>

        </div>

        <form onSubmit={handleSubmit}>

          <label htmlFor="resume">
            Select Resume
          </label>

          <input
            id="resume"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
          />

          {selectedFile && (
            <div className="selected-file">

              <div>
                <strong>Selected Resume</strong>

                <p>{selectedFile.name}</p>

                <small>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </small>
              </div>

              <button
                type="button"
                className="remove-button"
                onClick={handleRemoveFile}
              >
                Remove
              </button>

            </div>
          )}

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
          >
            Upload Resume
          </button>

        </form>

      </div>
    </div>
  );
}

export default UploadResume;