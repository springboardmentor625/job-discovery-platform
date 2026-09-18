import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCloudUploadAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileAlt,
} from "react-icons/fa";
import api, { clearAuth } from "../api";

function Resume() {
  const navigate = useNavigate();

  // ==========================================
  // FILE INPUT REF
  // ==========================================

  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [resume, setResume] = useState(null);
  const [atsData, setAtsData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [atsLoading, setAtsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // OPEN FILE PICKER
  // ==========================================

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ==========================================
  // LOAD ATS ANALYSIS
  // ==========================================

  const loadATS = async () => {
    setAtsLoading(true);

    try {
      const response = await api.get("/api/candidate/resume/ats");
      setAtsData(response.data);
    } catch (err) {
      console.error("ATS analysis error:", err);

      if (err.response?.status === 404) {
        setAtsData(null);
      }
    } finally {
      setAtsLoading(false);
    }
  };


  // ==========================================
  // LOAD RESUME
  // ==========================================

  useEffect(() => {
    const loadResume = async () => {
      try {
        const response = await api.get("/api/candidate/resume");
        setResume(response.data);
        await loadATS();
      } catch (err) {
        if (err.response?.status === 401) {
          clearAuth();
          navigate("/login");
          return;
        }

        if (err.response?.status === 404) {
          setResume(null);
          setAtsData(null);
        } else {
          setError("Unable to load your resume.");
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
    const selectedFile = e.target.files[0];

    setMessage("");
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const fileName = selectedFile.name.toLowerCase();

    // ========================================
    // VALIDATE FILE TYPE
    // ========================================

    if (!fileName.endsWith(".pdf") && !fileName.endsWith(".docx")) {
      setError("Only PDF and DOCX files are allowed.");
      setFile(null);
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  // ==========================================
  // UPLOAD RESUME
  // ==========================================

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

      await api.post("/api/candidate/resume", formData);

      setMessage("Resume uploaded successfully.");
      setFile(null);

      // ======================================
      // RESET FILE INPUT
      // ======================================

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // ======================================
      // RELOAD RESUME
      // ======================================

      const resumeResponse = await api.get("/api/candidate/resume");
      setResume(resumeResponse.data);

      // ======================================
      // RELOAD ATS
      // ======================================

      await loadATS();
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        clearAuth();
        navigate("/login");
        return;
      }

      setError(err.response?.data?.detail || "Resume upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sx-text-secondary">
        Loading your resume...
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-5xl">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="mb-7 border-b border-sx-border pb-6">
          <p className="text-xs font-bold tracking-widest text-sx-primary">
            RESUME MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-bold text-sx-text">Resume</h1>

          <p className="mt-1 text-sm text-sx-text-secondary">
            Upload your latest resume to improve your job recommendations.
          </p>
        </div>

        {/* ================================= */}
        {/* UPLOAD + CURRENT RESUME ROW */}
        {/* ================================= */}

        <div
          className={`mb-7 grid grid-cols-1 items-stretch gap-6 ${
            resume ? "lg:grid-cols-2" : "max-w-3xl"
          }`}
        >
          {/* ================================= */}
          {/* RESUME UPLOAD CARD */}
          {/* ================================= */}

          <div className="flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-sx-border bg-sx-card p-8 text-center shadow-sm">
            {/* ================================= */}
            {/* HIDDEN FILE INPUT */}
            {/* ================================= */}

            <input
              ref={fileInputRef}
              id="resume-upload"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              hidden
            />

            {/* ================================= */}
            {/* UPLOAD BUTTON */}
            {/* ================================= */}

            <button
              type="button"
              onClick={openFilePicker}
              aria-label="Upload resume"
              className="group relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sx-primary to-sx-primary-dark text-3xl text-white shadow-lg shadow-sx-primary/25 ring-4 ring-sx-primary-soft transition-transform duration-200 hover:scale-105 hover:shadow-xl hover:shadow-sx-primary/30"
            >
              <FaCloudUploadAlt className="transition-transform duration-200 group-hover:-translate-y-0.5" />
            </button>

            <h2 className="mt-4 text-lg font-bold text-sx-text">
              {resume ? "Replace Resume" : "Upload Resume"}
            </h2>

            <p className="mt-1 text-sm text-sx-text-secondary">
              Click the button above to select your resume
            </p>

            <small className="mt-1 block text-xs text-sx-text-muted">
              Supported formats: PDF and DOCX
            </small>

            {/* ================================= */}
            {/* SELECTED FILE */}
            {/* ================================= */}

            {file && (
              <div className="mt-5 flex w-full max-w-md items-center justify-between gap-4 rounded-lg border border-sx-border bg-sx-bg-soft px-4 py-3 text-left">
                <div className="min-w-0">
                  <strong className="block truncate text-sm text-sx-text">
                    {file.name}
                  </strong>
                  <span className="text-xs text-sx-text-muted">
                    {(file.size / 1024 / 1024).toFixed(2)}
                    {" MB"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="flex-shrink-0 text-sm font-semibold text-sx-danger hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}

            {/* ================================= */}
            {/* SUBMIT UPLOAD */}
            {/* ================================= */}

            {file && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 rounded-lg bg-sx-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sx-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? "Uploading..."
                  : resume
                  ? "Replace Resume"
                  : "Upload Resume"}
              </button>
            )}

            {/* ================================= */}
            {/* SUCCESS MESSAGE */}
            {/* ================================= */}

            {message && (
              <div className="mt-4 rounded-lg border border-sx-success-border bg-sx-success-bg px-4 py-3 text-sm text-sx-success">
                {message}
              </div>
            )}

            {/* ================================= */}
            {/* ERROR MESSAGE */}
            {/* ================================= */}

            {error && (
              <div className="mt-4 rounded-lg border border-sx-danger-border bg-sx-danger-bg px-4 py-3 text-sm text-sx-danger">
                {error}
              </div>
            )}
          </div>

          {/* ================================= */}
          {/* CURRENT RESUME FILE */}
          {/* ================================= */}

          {resume && (
            <div className="flex min-h-[330px] flex-col rounded-2xl border border-sx-border bg-sx-card p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sx-primary-soft text-lg text-sx-primary-dark">
                  <FaFileAlt />
                </div>
                <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-sx-success-bg px-3 py-1.5 text-xs font-semibold text-sx-success">
                  <FaCheckCircle className="text-[10px]" />
                  Uploaded
                </span>
              </div>

              <div className="mt-8 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-sx-text-muted">
                  Current Resume
                </p>
                <p className="mt-2 break-words text-base font-semibold leading-snug text-sx-text">
                  {resume.file_name}
                </p>
                {resume.uploaded_at && (
                  <p className="mt-2 text-xs text-sx-text-muted">
                    Uploaded on{" "}
                    {new Date(resume.uploaded_at).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                )}
              </div>

              <div className="mt-auto pt-8">
                <p className="text-sm leading-relaxed text-sx-text-secondary">
                  Your resume is parsed automatically and used to improve job recommendations.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ================================= */}
        {/* ATS ANALYSIS: DETECTED SKILLS, */}
        {/* SECTIONS, RECOMMENDATIONS ONLY  */}
        {/* ================================= */}

        {resume && atsLoading && (
          <div className="rounded-2xl border border-sx-border bg-sx-card p-6 text-sm text-sx-text-secondary shadow-sm">
            Analyzing your resume...
          </div>
        )}

        {resume && !atsLoading && atsData && (
          <div className="flex flex-col gap-6">
            {/* DETECTED SKILLS + SECTIONS */}

            <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
              {/* DETECTED SKILLS */}

              {atsData.detected_skills?.length > 0 && (
                <div className="rounded-2xl border border-sx-border bg-sx-card p-6 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold text-sx-text">
                    Detected Skills
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {atsData.detected_skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-sx-primary-soft px-3 py-1.5 text-xs font-medium text-sx-primary-dark"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTIONS */}

              {atsData.sections && (
                <div className="rounded-2xl border border-sx-border bg-sx-card p-6 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold text-sx-text">
                    Resume Sections
                  </h2>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(atsData.sections).map(
                      ([section, available]) => (
                        <div
                          key={section}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                            available
                              ? "border-sx-success-border bg-sx-success-bg text-sx-success"
                              : "border-sx-border bg-sx-bg-soft text-sx-text-muted"
                          }`}
                        >
                          {available ? (
                            <FaCheckCircle className="text-xs" />
                          ) : (
                            <span className="h-2.5 w-2.5 rounded-full border border-current" />
                          )}
                          <span>
                            {section.charAt(0).toUpperCase() +
                              section.slice(1)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RECOMMENDATIONS */}

            <div className="rounded-2xl border border-sx-border bg-sx-card p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-sx-text">
                Resume Recommendations
              </h2>

              {atsData.recommendations?.length === 0 ? (
                <div className="flex items-start gap-3 rounded-lg border border-sx-success-border bg-sx-success-bg p-4">
                  <FaCheckCircle className="mt-0.5 text-sx-success" />
                  <div>
                    <strong className="block text-sm text-sx-text">
                      No major issues found
                    </strong>
                    <p className="mt-1 text-sm text-sx-text-secondary">
                      Your resume looks strong and is ready for job
                      discovery.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {atsData.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-lg border border-sx-border bg-sx-bg-soft px-4 py-3 text-sm text-sx-text-secondary"
                    >
                      <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-sx-warning" />
                      {recommendation}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Resume;
