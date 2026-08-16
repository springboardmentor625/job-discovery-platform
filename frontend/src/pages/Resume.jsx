import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Resume() {

  const navigate = useNavigate();

  const [file, setFile] = useState(null);

  const [resume, setResume] = useState(null);

  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");


  // ==========================================
  // LOAD EXISTING RESUME
  // ==========================================

  useEffect(() => {

    const loadResume = async () => {

      try {

        const response = await api.get(
          "/api/candidate/resume"
        );

        setResume(response.data);

      } catch (err) {

        if (err.response?.status === 401) {

          localStorage.removeItem(
            "access_token"
          );

          navigate("/login");

          return;
        }

        if (err.response?.status === 404) {

          // No resume uploaded yet
          setResume(null);

        } else {

          setError(
            "Unable to load your resume."
          );

        }

      } finally {

        setLoading(false);

      }
    };


    loadResume();

  }, [navigate]);


  // ==========================================
  // FILE SELECTION
  // ==========================================

  const handleFileChange = (e) => {

    const selectedFile =
      e.target.files[0];

    setMessage("");
    setError("");

    if (!selectedFile) {

      setFile(null);

      return;
    }

    const fileName =
      selectedFile.name.toLowerCase();


    if (
      !fileName.endsWith(".pdf") &&
      !fileName.endsWith(".docx")
    ) {

      setError(
        "Only PDF and DOCX files are allowed."
      );

      setFile(null);

      return;
    }


    setFile(selectedFile);

  };


  // ==========================================
  // UPLOAD RESUME
  // ==========================================

  const handleUpload = async () => {

    if (!file) {

      setError(
        "Please select a resume first."
      );

      return;
    }

    setUploading(true);

    setMessage("");

    setError("");


    try {

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );


      await api.post(
        "/api/candidate/resume",
        formData
      );


      setMessage(
        "Resume uploaded successfully."
      );

      setFile(null);


      // Load the newly uploaded resume
      const response =
        await api.get(
          "/api/candidate/resume"
        );

      setResume(
        response.data
      );


    } catch (err) {

      console.error(err);


      if (
        err.response?.status === 401
      ) {

        localStorage.removeItem(
          "access_token"
        );

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


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="dashboard-loading">

        Loading your resume...

      </div>

    );

  }


  return (

    <div className="resume-page">

      <div className="resume-container">


        {/* BACK */}

        <button
          className="back-button"
          onClick={() =>
            navigate("/candidate")
          }
        >
          ← Back to Dashboard
        </button>


        {/* HEADER */}

        <div className="resume-header">

          <p className="section-label">
            RESUME MANAGEMENT
          </p>

          <h1>
            Resume
          </h1>

          <p>
            Upload your latest resume to
            improve your job recommendations.
          </p>

        </div>


        {/* ================================= */}
        {/* CURRENT RESUME */}
        {/* ================================= */}

        {resume && (

          <div className="current-resume-card">

            <div className="current-resume-icon">
              📄
            </div>


            <div className="current-resume-info">

              <p className="section-label">
                CURRENT RESUME
              </p>

              <h2>
                {resume.file_name}
              </h2>

              <p>
                {resume.file_type?.toUpperCase()}
                {" • "}
                {resume.text_length} characters
              </p>

              {resume.uploaded_at && (

                <small>
                  Uploaded on{" "}
                  {new Date(
                    resume.uploaded_at
                  ).toLocaleString()}
                </small>

              )}

            </div>


            <div className="resume-current-status">

              <span>
                ✓
              </span>

              Uploaded

            </div>

          </div>

        )}


        {/* ================================= */}
        {/* UPLOAD CARD */}
        {/* ================================= */}

        <div className="resume-upload-card">

          <div className="upload-icon">
            ↑
          </div>

          <h2>

            {resume
              ? "Replace Resume"
              : "Upload Resume"}

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


          {/* SELECTED FILE */}

          {file && (

            <div className="selected-file">

              <div>

                <strong>
                  {file.name}
                </strong>

                <span>
                  {(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </span>

              </div>


              <button
                onClick={() =>
                  setFile(null)
                }
              >
                Remove
              </button>

            </div>

          )}


          {/* UPLOAD BUTTON */}

          {file && (

            <button
              className="upload-button"
              onClick={handleUpload}
              disabled={uploading}
            >

              {uploading
                ? "Uploading..."
                : resume
                  ? "Replace Resume"
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


        {/* ================================= */}
        {/* NO RESUME */}
        {/* ================================= */}

        {!resume && !error && (

          <div className="no-resume-card">

            <h3>
              No resume uploaded yet
            </h3>

            <p>
              Upload your resume to help
              SwipeX provide better job
              recommendations.
            </p>

          </div>

        )}

      </div>

    </div>

  );
}

export default Resume;