import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

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
  // LOAD RESUME
  // ==========================================

  useEffect(() => {

    const loadResume = async () => {

      try {

        const response = await api.get(
          "/api/candidate/resume"
        );

        setResume(response.data);

        await loadATS();

      } catch (err) {

        if (err.response?.status === 401) {

          localStorage.removeItem(
            "access_token"
          );

          navigate("/login");

          return;

        }

        if (err.response?.status === 404) {

          setResume(null);
          setAtsData(null);

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
  // LOAD ATS ANALYSIS
  // ==========================================

  const loadATS = async () => {

    setAtsLoading(true);

    try {

      const response = await api.get(
        "/api/candidate/resume/ats"
      );

      setAtsData(
        response.data
      );

    } catch (err) {

      console.error(
        "ATS analysis error:",
        err
      );

      if (
        err.response?.status === 404
      ) {

        setAtsData(null);

      }

    } finally {

      setAtsLoading(false);

    }

  };


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


    // ========================================
    // VALIDATE FILE TYPE
    // ========================================

    if (
      !fileName.endsWith(".pdf") &&
      !fileName.endsWith(".docx")
    ) {

      setError(
        "Only PDF and DOCX files are allowed."
      );

      setFile(null);

      e.target.value = "";

      return;

    }


    setFile(
      selectedFile
    );

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


      // ======================================
      // RESET FILE INPUT
      // ======================================

      if (fileInputRef.current) {

        fileInputRef.current.value = "";

      }


      // ======================================
      // RELOAD RESUME
      // ======================================

      const resumeResponse =
        await api.get(
          "/api/candidate/resume"
        );


      setResume(
        resumeResponse.data
      );


      // ======================================
      // RELOAD ATS
      // ======================================

      await loadATS();


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


  // ==========================================
  // SCORE CLASS
  // ==========================================

  const getScoreClass = (score) => {

    if (score >= 80) {
      return "ats-score-excellent";
    }

    if (score >= 65) {
      return "ats-score-good";
    }

    if (score >= 50) {
      return "ats-score-warning";
    }

    return "ats-score-low";

  };


  return (

    <div className="resume-page">

      <div className="resume-container">


        {/* ================================= */}
        {/* BACK */}
        {/* ================================= */}

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/candidate")
          }
        >

          ← Back to Dashboard

        </button>


        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="resume-header">

          <p className="section-label">
            RESUME MANAGEMENT
          </p>

          <h1>
            Resume
          </h1>

          <p>
            Upload your latest resume to improve
            your job recommendations.
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

                {resume.text_length}
                {" characters"}

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
        {/* ATS ANALYSIS */}
        {/* ================================= */}

        {resume && (

          <div className="ats-analysis-card">

            <div className="ats-header">

              <div>

                <p className="section-label">
                  SWIPEX INTELLIGENCE
                </p>

                <h2>
                  ATS Resume Analysis
                </h2>

                <p>
                  Analyze your resume quality and
                  compatibility before discovering jobs.
                </p>

              </div>

              <div className="ats-ai-icon">
                ✦
              </div>

            </div>


            {atsLoading && (

              <div className="ats-loading">

                Analyzing your resume...

              </div>

            )}


            {!atsLoading && atsData && (

              <>

                {/* SCORE */}

                <div className="ats-score-section">

                  <div
                    className={`ats-score-circle ${getScoreClass(
                      atsData.ats_score
                    )}`}
                  >

                    <strong>
                      {atsData.ats_score}
                    </strong>

                    <span>
                      / 100
                    </span>

                  </div>


                  <div className="ats-score-info">

                    <span className="ats-score-label">
                      ATS SCORE
                    </span>

                    <h3>
                      {atsData.ats_status}
                    </h3>

                    <p>
                      Your resume has been analyzed
                      by SwipeX's resume intelligence.
                    </p>

                  </div>

                </div>


                {/* ANALYSIS METRICS */}

                {atsData.analysis && (

                  <div className="ats-metrics">

                    <div className="ats-metric">

                      <span>
                        Resume Sections
                      </span>

                      <strong>
                        {atsData.analysis.section_score}
                        / 100
                      </strong>

                      <div className="ats-progress">

                        <div
                          style={{
                            width:
                              `${atsData.analysis.section_score}%`
                          }}
                        />

                      </div>

                    </div>


                    <div className="ats-metric">

                      <span>
                        Skills
                      </span>

                      <strong>
                        {atsData.analysis.skill_score}
                        / 20
                      </strong>

                      <div className="ats-progress">

                        <div
                          style={{
                            width:
                              `${atsData.analysis.skill_score * 5}%`
                          }}
                        />

                      </div>

                    </div>


                    <div className="ats-metric">

                      <span>
                        Profile
                      </span>

                      <strong>
                        {atsData.analysis.profile_score}
                        / 10
                      </strong>

                      <div className="ats-progress">

                        <div
                          style={{
                            width:
                              `${atsData.analysis.profile_score * 10}%`
                          }}
                        />

                      </div>

                    </div>


                    <div className="ats-metric">

                      <span>
                        Resume Length
                      </span>

                      <strong>
                        {atsData.analysis.length_score}
                        / 10
                      </strong>

                      <div className="ats-progress">

                        <div
                          style={{
                            width:
                              `${atsData.analysis.length_score * 10}%`
                          }}
                        />

                      </div>

                    </div>

                  </div>

                )}


                {/* RESUME STATS */}

                <div className="ats-stats">

                  <div>

                    <strong>
                      {atsData.word_count}
                    </strong>

                    <span>
                      Words
                    </span>

                  </div>


                  <div>

                    <strong>
                      {atsData.character_count}
                    </strong>

                    <span>
                      Characters
                    </span>

                  </div>


                  <div>

                    <strong>
                      {atsData.profile_fields_completed}
                    </strong>

                    <span>
                      Profile Fields
                    </span>

                  </div>

                </div>


                {/* DETECTED SKILLS */}

                {atsData.detected_skills?.length > 0 && (

                  <div className="ats-skills-section">

                    <div className="ats-subtitle">
                      Detected Skills
                    </div>

                    <div className="ats-skills">

                      {atsData.detected_skills.map(
                        (skill) => (

                          <span
                            key={skill}
                            className="ats-skill-tag"
                          >

                            {skill}

                          </span>

                        )
                      )}

                    </div>

                  </div>

                )}


                {/* SECTIONS */}

                {atsData.sections && (

                  <div className="ats-sections">

                    <div className="ats-subtitle">
                      Resume Sections
                    </div>


                    <div className="ats-section-grid">

                      {Object.entries(
                        atsData.sections
                      ).map(
                        ([section, available]) => (

                          <div
                            key={section}
                            className={
                              available
                                ? "ats-section-item completed"
                                : "ats-section-item missing"
                            }
                          >

                            <span>

                              {available
                                ? "✓"
                                : "○"}

                            </span>

                            <span>

                              {section
                                .charAt(0)
                                .toUpperCase() +
                                section.slice(1)}

                            </span>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                )}


                {/* RECOMMENDATIONS */}

                <div className="ats-recommendations">

                  <div className="ats-subtitle">
                    Resume Recommendations
                  </div>


                  {atsData.recommendations?.length === 0 ? (

                    <div className="ats-success">

                      <span>
                        ✓
                      </span>

                      <div>

                        <strong>
                          No major issues found
                        </strong>

                        <p>
                          Your resume looks strong and
                          is ready for job discovery.
                        </p>

                      </div>

                    </div>

                  ) : (

                    atsData.recommendations.map(
                      (recommendation, index) => (

                        <div
                          key={index}
                          className="ats-recommendation"
                        >

                          <span>
                            !
                          </span>

                          {recommendation}

                        </div>

                      )
                    )

                  )}

                </div>

              </>

            )}

          </div>

        )}


        {/* ================================= */}
        {/* RESUME UPLOAD CARD */}
        {/* ================================= */}

        <div className="resume-upload-card">


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
          {/* UPLOAD ARROW */}
          {/* ================================= */}

          <button
            type="button"
            className="resume-upload-arrow"
            onClick={openFilePicker}
            aria-label="Upload resume"
          >

            <span className="upload-arrow-icon">
              ↑
            </span>

          </button>


          <h2>

            {resume
              ? "Replace Resume"
              : "Upload Resume"}

          </h2>


          <p>
            Click the upload arrow to select your resume
          </p>


          <small>
            Supported formats: PDF and DOCX
          </small>


          {/* ================================= */}
          {/* SELECTED FILE */}
          {/* ================================= */}

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
                  ).toFixed(2)}

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
              >

                Remove

              </button>

            </div>

          )}


          {/* ================================= */}
          {/* UPLOAD BUTTON */}
          {/* ================================= */}

          {file && (

            <button
              type="button"
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


          {/* ================================= */}
          {/* SUCCESS MESSAGE */}
          {/* ================================= */}

          {message && (

            <div className="success-message">

              {message}

            </div>

          )}


          {/* ================================= */}
          {/* ERROR MESSAGE */}
          {/* ================================= */}

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
              Upload your resume to help SwipeX
              provide better job recommendations.
            </p>

          </div>

        )}

      </div>

    </div>

  );

}

export default Resume;