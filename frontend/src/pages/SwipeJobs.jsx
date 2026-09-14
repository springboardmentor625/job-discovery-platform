
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  swipeJob,
} from "../api/swipes";

import {
  analyzeATS,
} from "../api/ats";

import api from "../api/api";


// =========================================================
// HELPER: CONVERT HTML JOB DESCRIPTION TO READABLE TEXT
// =========================================================

function cleanJobDescription(html) {

  if (!html) {
    return "";
  }

  try {

    const formattedHtml =
      String(html)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<\/h[1-6]>/gi, "\n\n")
        .replace(/<\/tr>/gi, "\n");


    const parser =
      new DOMParser();


    const document =
      parser.parseFromString(
        formattedHtml,
        "text/html"
      );


    const text =
      document.body.textContent || "";


    return text
      .replace(/\r/g, "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();


  } catch (error) {

    console.error(
      "Job description cleaning error:",
      error
    );


    return String(html)
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  }

}


// =========================================================
// HELPER: FORMAT JOB DESCRIPTION
// =========================================================

function formatDescriptionText(text) {

  if (!text) {
    return [];
  }


  return text
    .split(/\n+/)
    .map(
      (line) =>
        line
          .replace(/^[•●▪◦\-]\s*/, "")
          .trim()
    )
    .filter(
      (line) =>
        line.length > 0
    );

}


function SwipeJobs() {

  const navigate = useNavigate();

  const location = useLocation();


  // =========================================================
  // JOBS RECEIVED FROM RECOMMENDATIONS
  // =========================================================

  const passedJobs =
    Array.isArray(location.state?.jobs)
      ? location.state.jobs
      : [];


  const [jobs] =
    useState(passedJobs);


  // =========================================================
  // CURRENT JOB INDEX
  // =========================================================

  const [currentIndex, setCurrentIndex] =
    useState(0);


  // =========================================================
  // SWIPE / DRAG STATE
  // =========================================================

  const [dragX, setDragX] =
    useState(0);

  const [dragStartX, setDragStartX] =
    useState(null);

  const [isDragging, setIsDragging] =
    useState(false);


  // =========================================================
  // PROCESSING STATE
  // =========================================================

  const [isProcessing, setIsProcessing] =
    useState(false);


  // =========================================================
  // ERROR
  // =========================================================

  const [error, setError] =
    useState("");


  // =========================================================
  // TOUCHPAD SWIPE STATE
  // =========================================================

  const touchpadDistance =
    useRef(0);


  const touchpadLocked =
    useRef(false);


  // =========================================================
  // CURRENT JOB
  // =========================================================

  const currentJob =
    jobs[currentIndex];


  // =========================================================
  // MOVE TO NEXT JOB
  // =========================================================

  const moveToNextJob = () => {

    setDragX(0);

    setDragStartX(null);

    setIsDragging(false);

    touchpadDistance.current = 0;

    touchpadLocked.current = false;


    setCurrentIndex(
      (previousIndex) =>
        previousIndex + 1
    );

  };


  // =========================================================
  // GET VALID RESUME
  // =========================================================

  const getValidResume =
    async () => {

      console.log(
        "Fetching resumes before ATS..."
      );


      const response =
        await api.get(
          "/api/resumes/me"
        );


      console.log(
        "Resume response for swipe:",
        response.data
      );


      const resumes =
        Array.isArray(
          response.data?.resumes
        )
          ? response.data.resumes
          : [];


      if (
        resumes.length === 0
      ) {

        throw new Error(
          "No resume found. Please upload a resume before applying."
        );

      }


      // -----------------------------------------------------
      // FIRST PRIORITY:
      // DEFAULT RESUME WITH EXTRACTED SKILLS
      // -----------------------------------------------------

      let validResume =
        resumes.find(
          (resume) =>
            resume.is_default &&
            Array.isArray(
              resume.extracted_skills
            ) &&
            resume.extracted_skills.length > 0
        );


      // -----------------------------------------------------
      // SECOND PRIORITY:
      // ANY RESUME WITH EXTRACTED SKILLS
      // -----------------------------------------------------

      if (!validResume) {

        validResume =
          resumes.find(
            (resume) =>
              Array.isArray(
                resume.extracted_skills
              ) &&
              resume.extracted_skills.length > 0
          );

      }


      if (!validResume) {

        throw new Error(
          "No extracted skills were found in your resume. Please upload your resume again."
        );

      }


      console.log(
        "Valid resume selected for ATS:",
        validResume
      );


      localStorage.setItem(
        "resume_id",
        String(
          validResume.resume_id
        )
      );


      return validResume;

    };


  // =========================================================
  // LEFT SWIPE
  // =========================================================

  const handleSwipeLeft =
    async () => {

      if (
        !currentJob ||
        isProcessing
      ) {

        return;

      }


      setIsProcessing(true);

      setError("");


      try {

        console.log(
          "LEFT SWIPE:",
          currentJob
        );


        const response =
          await swipeJob(
            currentJob.job_id,
            "LEFT"
          );


        console.log(
          "LEFT swipe response:",
          response
        );


        moveToNextJob();

      } catch (error) {

        console.error(
          "LEFT swipe failed:",
          error
        );


        setError(
          error.response?.data?.detail ||
          "Failed to skip this job."
        );

      } finally {

        setIsProcessing(false);

      }

    };


  // =========================================================
  // SAVE JOB
  // =========================================================

  const handleSave =
    async () => {

      if (
        !currentJob ||
        isProcessing
      ) {

        return;

      }


      setIsProcessing(true);

      setError("");


      try {

        console.log(
          "SAVE JOB:",
          currentJob
        );


        const response =
          await swipeJob(
            currentJob.job_id,
            "SAVE"
          );


        console.log(
          "SAVE response:",
          response
        );


        moveToNextJob();

      } catch (error) {

        console.error(
          "SAVE failed:",
          error
        );


        setError(
          error.response?.data?.detail ||
          "Failed to save this job."
        );

      } finally {

        setIsProcessing(false);

      }

    };


  // =========================================================
  // RIGHT SWIPE
  // =========================================================

  const handleSwipeRight =
    async () => {

      if (
        !currentJob ||
        isProcessing
      ) {

        return;

      }


      setIsProcessing(true);

      setError("");


      try {

        // ---------------------------------------------------
        // GET RESUME
        // ---------------------------------------------------

        const resume =
          await getValidResume();


        const resumeId =
          Number(
            resume.resume_id
          );


        const jobId =
          Number(
            currentJob.job_id
          );


        console.log(
          "ATS Resume ID:",
          resumeId
        );


        console.log(
          "ATS Job ID:",
          jobId
        );


        console.log(
          "ATS Resume Skills:",
          resume.extracted_skills
        );


        // ---------------------------------------------------
        // RUN ATS FOR CURRENT JOB
        // ---------------------------------------------------

        const atsResponse =
          await analyzeATS(
            resumeId,
            jobId
          );


        console.log(
          "ATS analysis response:",
          atsResponse
        );


        // ---------------------------------------------------
        // RECORD RIGHT SWIPE
        // ---------------------------------------------------

        const swipeResponse =
          await swipeJob(
            jobId,
            "RIGHT"
          );


        console.log(
          "RIGHT swipe response:",
          swipeResponse
        );


        // ---------------------------------------------------
        // GET ALL FOLLOWING JOBS
        // ---------------------------------------------------

        const remainingJobs =
          jobs.slice(
            currentIndex + 1
          );


        // ---------------------------------------------------
        // EXISTING APPLICATION WORKFLOW
        // ---------------------------------------------------

        navigate(
          "/application-success",
          {
            state: {

              job: currentJob,

              applied: true,

              saved: false,

              favorite: false,

              response:
                swipeResponse,

              atsReport:
                atsResponse,

              atsScore:
                atsResponse?.ats_score ??
                atsResponse?.match_score ??
                atsResponse?.score ??
                null,

              matchPercentage:
                atsResponse?.match_percentage ??
                null,

              matchedSkills:
                atsResponse?.matched_skills ||
                [],

              missingSkills:
                atsResponse?.missing_skills ||
                [],

              missingKeywords:
                atsResponse?.missing_keywords ||
                [],

              suggestions:
                atsResponse?.suggestions ||
                atsResponse?.improvement_suggestions ||
                [],

              remainingJobs:
                remainingJobs,

            },
          }
        );


      } catch (error) {

        console.error(
          "RIGHT swipe / ATS failed:",
          error
        );


        console.error(
          "ATS error response:",
          error.response?.data
        );


        setError(
          error.response?.data?.detail ||
          error.message ||
          "Failed to analyze your resume or apply for this job."
        );

      } finally {

        setIsProcessing(false);

      }

    };


  // =========================================================
  // TOUCHPAD SWIPE
  // =========================================================

  const handleTouchpadWheel =
    (event) => {

      if (
        isProcessing ||
        !currentJob
      ) {

        return;

      }


      const deltaX =
        event.deltaX;


      const deltaY =
        event.deltaY;


      // -----------------------------------------------------
      // Ignore normal vertical scrolling
      // -----------------------------------------------------

      if (
        Math.abs(deltaX) <=
        Math.abs(deltaY)
      ) {

        return;

      }


      // -----------------------------------------------------
      // Prevent browser horizontal scrolling
      // -----------------------------------------------------

      event.preventDefault();


      if (
        touchpadLocked.current
      ) {

        return;

      }


      touchpadDistance.current +=
        deltaX;


      const swipeThreshold =
        80;


      // -----------------------------------------------------
      // RIGHT TOUCHPAD SWIPE
      // -----------------------------------------------------

      if (
        touchpadDistance.current >
        swipeThreshold
      ) {

        touchpadLocked.current =
          true;


        touchpadDistance.current =
          0;


        handleSwipeRight();


        return;

      }


      // -----------------------------------------------------
      // LEFT TOUCHPAD SWIPE
      // -----------------------------------------------------

      if (
        touchpadDistance.current <
        -swipeThreshold
      ) {

        touchpadLocked.current =
          true;


        touchpadDistance.current =
          0;


        handleSwipeLeft();


        return;

      }

    };


  // =========================================================
  // RESET TOUCHPAD LOCK
  // =========================================================

  useEffect(() => {

    const unlockTouchpad =
      () => {

        touchpadDistance.current =
          0;

        touchpadLocked.current =
          false;

      };


    window.addEventListener(
      "wheel",
      unlockTouchpad,
      {
        passive: true,
      }
    );


    return () => {

      window.removeEventListener(
        "wheel",
        unlockTouchpad
      );

    };

  }, []);


  // =========================================================
  // KEYBOARD
  // =========================================================

  useEffect(() => {

    const handleKeyboard =
      (event) => {

        if (
          event.key === "ArrowLeft"
        ) {

          event.preventDefault();

          handleSwipeLeft();

        }


        if (
          event.key === "ArrowRight"
        ) {

          event.preventDefault();

          handleSwipeRight();

        }

      };


    window.addEventListener(
      "keydown",
      handleKeyboard
    );


    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyboard
      );

    };

  }, [
    currentJob,
    isProcessing,
  ]);


  // =========================================================
  // MOUSE DOWN
  // =========================================================

  const handleMouseDown =
    (event) => {

      if (isProcessing) {
        return;
      }


      setDragStartX(
        event.clientX
      );


      setIsDragging(true);

    };


  // =========================================================
  // MOUSE MOVE
  // =========================================================

  const handleMouseMove =
    (event) => {

      if (
        !isDragging ||
        dragStartX === null
      ) {

        return;

      }


      const distance =
        event.clientX -
        dragStartX;


      setDragX(
        distance
      );

    };


  // =========================================================
  // COMPLETE MOUSE / TOUCH SWIPE
  // =========================================================

  const completeDrag =
    () => {

      if (
        !isDragging ||
        isProcessing
      ) {

        return;

      }


      const swipeThreshold =
        120;


      if (
        dragX >
        swipeThreshold
      ) {

        handleSwipeRight();

      }

      else if (
        dragX <
        -swipeThreshold
      ) {

        handleSwipeLeft();

      }

      else {

        setDragX(0);

      }


      setDragStartX(null);

      setIsDragging(false);

    };


  // =========================================================
  // TOUCH START
  // =========================================================

  const handleTouchStart =
    (event) => {

      if (isProcessing) {
        return;
      }


      setDragStartX(
        event.touches[0].clientX
      );


      setIsDragging(true);

    };


  // =========================================================
  // TOUCH MOVE
  // =========================================================

  const handleTouchMove =
    (event) => {

      if (
        !isDragging ||
        dragStartX === null
      ) {

        return;

      }


      const distance =
        event.touches[0].clientX -
        dragStartX;


      setDragX(
        distance
      );

    };


  // =========================================================
  // TOUCH END
  // =========================================================

  const handleTouchEnd =
    () => {

      completeDrag();

    };


  // =========================================================
  // NO JOBS
  // =========================================================

  if (
    jobs.length === 0
  ) {

    return (

      <div className="page">

        <div className="form-container">

          <h1>
            No Jobs Available
          </h1>


          <p className="form-subtitle">
            No recommended jobs were
            passed to the swipe screen.
          </p>


          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate(
                "/recommended-jobs"
              )
            }
          >
            View Recommended Jobs
          </button>

        </div>

      </div>

    );

  }


  // =========================================================
  // ALL JOBS COMPLETED
  // =========================================================

  if (!currentJob) {

    return (

      <div className="page">

        <div className="form-container">

          <h1>
            No More Jobs
          </h1>


          <p className="form-subtitle">
            You have gone through all{" "}
            {jobs.length} recommended jobs.
          </p>


          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate(
                "/recommended-jobs"
              )
            }
          >
            View Recommendations
          </button>

        </div>

      </div>

    );

  }


  // =========================================================
  // CURRENT JOB DATA
  // =========================================================

  const skills =
    Array.isArray(
      currentJob.required_skills
    )
      ? currentJob.required_skills
      : [];


  const matchPercentage =
    Number(
      currentJob.ml_match_percentage ??
      currentJob.match_percentage ??
      currentJob.recommendation_score ??
      0
    );


  // =========================================================
  // SALARY
  // =========================================================

  const minimumSalary =
    Number(
      currentJob.salary_min
    );


  const maximumSalary =
    Number(
      currentJob.salary_max
    );


  const hasValidSalary =
    Number.isFinite(minimumSalary) &&
    Number.isFinite(maximumSalary) &&
    (
      minimumSalary > 0 ||
      maximumSalary > 0
    );


  const salaryText =
    hasValidSalary
      ? `₹${minimumSalary} - ₹${maximumSalary}`
      : "Salary not disclosed";


  // =========================================================
  // COMPANY
  // =========================================================

  const companyName =
    currentJob.company_name ||
    currentJob.company ||
    (
      currentJob.company_id != null
        ? `Company #${currentJob.company_id}`
        : "Company"
    );


  // =========================================================
  // JOB RANK
  // =========================================================

  const jobRank =
    currentIndex + 1;


  // =========================================================
  // CLEAN CURRENT JOB DESCRIPTION
  // =========================================================

  const cleanDescription =
    cleanJobDescription(
      currentJob.description
    );


  const descriptionLines =
    formatDescriptionText(
      cleanDescription
    );


  const rotation =
    dragX / 15;


  const safeMatchPercentage =
    Math.min(
      Math.max(
        matchPercentage,
        0
      ),
      100
    );


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="page">

      <div
        className="swipe-container"
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          padding: "24px 20px 30px",
        }}
      >


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <p className="error-message">
            {error}
          </p>

        )}


        {/* =================================================
            ONE SINGLE JOB CARD
        ================================================= */}

        <div
          className="swipe-card swipe-job-card"

          style={{
            transform:
              `translateX(${dragX}px) rotate(${rotation}deg)`,

            transition:
              isDragging
                ? "none"
                : "transform 0.3s ease",

            pointerEvents:
              isProcessing
                ? "none"
                : "auto",

            touchAction:
              "pan-y",

            userSelect:
              "none",

            background:
              "#ffffff",

            border:
              "1px solid #e2e8f0",

            borderRadius:
              "18px",

            boxShadow:
              "0 10px 30px rgba(15, 23, 42, 0.10)",

            padding:
              "24px",

            overflow:
              "hidden",

          }}

          onWheel={
            handleTouchpadWheel
          }

          onMouseDown={
            handleMouseDown
          }

          onMouseMove={
            handleMouseMove
          }

          onMouseUp={
            completeDrag
          }

          onMouseLeave={() => {

            if (isDragging) {

              completeDrag();

            }

          }}

          onTouchStart={
            handleTouchStart
          }

          onTouchMove={
            handleTouchMove
          }

          onTouchEnd={
            handleTouchEnd
          }
        >


          {/* =================================================
              SWIPE INDICATORS
          ================================================= */}

          {dragX > 50 && (

            <div className="swipe-indicator apply-indicator">
              APPLY
            </div>

          )}


          {dragX < -50 && (

            <div className="swipe-indicator skip-indicator">
              SKIP
            </div>

          )}


          {/* =================================================
              RANK + TITLE + COMPANY
          ================================================= */}

          <div
            className="swipe-card-header"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "15px",
              paddingBottom: "20px",
              marginBottom: "20px",
            }}
          >

            {/* JOB RANK */}

            <div
              style={{
                minWidth: "46px",
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "700",
                border: "1px solid #dbeafe",
              }}
            >
              {jobRank}
            </div>


            {/* JOB TITLE + COMPANY */}

            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >

              <h2
                style={{
                  margin: "0 0 6px",
                  fontSize: "21px",
                  lineHeight: "1.3",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                {currentJob.title ||
                  "Job Title Not Available"}
              </h2>


              <p
                className="company-name"
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#64748b",
                }}
              >
                {companyName}
              </p>

            </div>

          </div>


          {/* =================================================
              JOB DETAILS
          ================================================= */}

          <div
            className="job-details"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "20px",
            }}
          >


            <div
              className="job-detail"
              style={{
                padding: "10px 12px",
                background: "#f8fafc",
                borderRadius: "9px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
                color: "#334155",
                lineHeight: "1.4",
              }}
            >
              {currentJob.location ||
                "Location not specified"}
            </div>


            <div
              className="job-detail"
              style={{
                padding: "10px 12px",
                background: "#f8fafc",
                borderRadius: "9px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
                color: "#334155",
                lineHeight: "1.4",
              }}
            >
              {currentJob.employment_type ||
                "Not specified"}
            </div>


            <div
              className="job-detail"
              style={{
                padding: "10px 12px",
                background: "#f8fafc",
                borderRadius: "9px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
                color: "#334155",
                lineHeight: "1.4",
              }}
            >
              {currentJob.experience_required != null

                ? `${currentJob.experience_required} years`

                : "Not specified"}
            </div>


            <div
              className="job-detail"
              style={{
                padding: "10px 12px",
                background: "#f8fafc",
                borderRadius: "9px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
                color: "#334155",
                lineHeight: "1.4",
              }}
            >
              {salaryText}
            </div>

          </div>


          {/* =================================================
              MATCH SCORE
          ================================================= */}

          <div
            className="job-match"
            style={{
              marginBottom: "20px",
              padding: "14px 0",
            }}
          >

            <div
              className="match-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#334155",
              }}
            >

              <span>
                ML Job Match
              </span>


              <strong
                style={{
                  color: "#16a34a",
                  fontSize: "14px",
                }}
              >
                {matchPercentage.toFixed(2)}%
              </strong>

            </div>


            <div
              className="match-bar"
              style={{
                height: "7px",
                background: "#e5e7eb",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >

              <div
                className="match-progress"

                style={{
                  width:
                    `${safeMatchPercentage}%`,

                  height:
                    "100%",

                  borderRadius:
                    "999px",
                }}
              ></div>

            </div>

          </div>


          {/* =================================================
              REQUIRED SKILLS
          ================================================= */}

          <div
            className="job-skills"
            style={{
              marginBottom: "20px",
            }}
          >

            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "15px",
                fontWeight: "700",
                color: "#1e293b",
              }}
            >
              Required Skills
            </h3>


            <div
              className="job-skill-list"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "7px",
              }}
            >

              {skills.length > 0

                ? skills.map(
                    (skill, index) => (

                      <span
                        className="job-skill"
                        key={`${skill}-${index}`}

                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          color: "#334155",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {skill}
                      </span>

                    )
                  )

                : (

                  <span
                    className="job-skill"
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    No specific skills listed
                  </span>

                )}

            </div>

          </div>


          {/* =================================================
              JOB DESCRIPTION
          ================================================= */}

          <div
            className="job-description"

            style={{
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "0",
              borderBottom: "1px solid #e5e7eb",
            }}
          >

            <h3
              style={{
                margin: "0 0 12px",
                fontSize: "15px",
                fontWeight: "700",
                color: "#1e293b",
              }}
            >
              About this job
            </h3>


            {descriptionLines.length > 0 ? (

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "9px",
                }}
              >

                {descriptionLines.map(
                  (line, index) => {

                    const looksLikeHeading =
                      line.length <= 55 &&
                      !/[.!?]$/.test(line) &&
                      !/^\d/.test(line);


                    return (

                      <p
                        key={index}

                        style={{
                          margin: 0,
                          fontSize: "13px",
                          lineHeight: "1.65",
                          color: looksLikeHeading
                            ? "#334155"
                            : "#475569",
                          fontWeight: looksLikeHeading
                            ? "600"
                            : "400",
                        }}
                      >
                        {line}
                      </p>

                    );

                  }
                )}

              </div>

            ) : (

              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: "#64748b",
                }}
              >
                No job description available.
              </p>

            )}

          </div>


        </div>


        {/* =================================================
            SAVE BUTTON
        ================================================= */}

        <button
          type="button"
          className="primary-button"

          onClick={
            handleSave
          }

          disabled={
            isProcessing
          }

          style={{
            width: "100%",
            marginTop: "16px",
          }}
        >

          {isProcessing
            ? "Processing..."
            : "Save Job"}

        </button>


        {/* =================================================
            JOB COUNTER
        ================================================= */}

        <p
          className="job-counter"
          style={{
            marginTop: "12px",
            textAlign: "center",
            fontSize: "12px",
            color: "#64748b",
          }}
        >

          Job {currentIndex + 1} of{" "}
          {jobs.length}

        </p>


      </div>

    </div>

  );

}


export default SwipeJobs;
