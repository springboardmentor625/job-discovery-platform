

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
//
// Job descriptions from the dataset can contain HTML such as:
//
// <p>Role purpose:</p>
// <ul>
//   <li>Knowledge of Database Administration</li>
//   <li>Experience in MongoDB</li>
// </ul>
//
// React displays these tags as text when the description is
// rendered directly. This helper converts them into readable
// plain text while preserving useful line breaks.
// =========================================================

function cleanJobDescription(html) {

  if (!html) {
    return "";
  }

  try {

    // -------------------------------------------------------
    // Convert common HTML block/line-break tags into
    // newline characters before parsing.
    // -------------------------------------------------------

    const formattedHtml =
      String(html)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<\/h[1-6]>/gi, "\n\n")
        .replace(/<\/tr>/gi, "\n");


    // -------------------------------------------------------
    // Use browser HTML parser.
    //
    // This safely removes HTML tags and also decodes
    // HTML entities such as:
    //
    // &amp;  -> &
    // &nbsp; -> space
    // &lt;   -> <
    // &gt;   -> >
    // -------------------------------------------------------

    const parser =
      new DOMParser();


    const document =
      parser.parseFromString(
        formattedHtml,
        "text/html"
      );


    const text =
      document.body.textContent || "";


    // -------------------------------------------------------
    // Clean excessive whitespace and blank lines.
    // -------------------------------------------------------

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


    // -------------------------------------------------------
    // Fallback if DOMParser fails.
    // -------------------------------------------------------

    return String(html)
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  }

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


        // ---------------------------------------------------
        // CURRENT JOB FINISHED
        // SHOW NEXT JOB
        // ---------------------------------------------------

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


        // ---------------------------------------------------
        // CURRENT JOB FINISHED
        // SHOW NEXT JOB
        // ---------------------------------------------------

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
  //
  // RIGHT:
  //
  // 1. Get valid resume
  // 2. Run ATS against CURRENT JOB
  // 3. Record RIGHT swipe
  // 4. Backend handles application
  // 5. Continue existing application workflow
  //
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


  const salaryText =
    currentJob.salary_min != null ||
    currentJob.salary_max != null

      ? `₹${currentJob.salary_min ?? 0} - ₹${currentJob.salary_max ?? 0}`

      : "Salary not specified";


  const companyName =
    currentJob.company_name ||
    currentJob.company ||
    (
      currentJob.company_id != null
        ? `Company #${currentJob.company_id}`
        : "Company"
    );


  const companyInitial =
    companyName
      .charAt(0)
      .toUpperCase();


  // =========================================================
  // CLEAN CURRENT JOB DESCRIPTION
  // =========================================================
  //
  // IMPORTANT:
  // We clean the description only for DISPLAY.
  //
  // The original currentJob.description is still passed
  // unchanged to ATS/application workflows.
  //
  // =========================================================

  const cleanDescription =
    cleanJobDescription(
      currentJob.description
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

      <div className="swipe-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="swipe-header">

          <h1>
            SwipeX
          </h1>


          <p>
            Swipe left to skip or right to apply.
          </p>

        </div>


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
              COMPANY + TITLE
          ================================================= */}

          <div className="swipe-card-header">

            <div className="company-logo large-logo">

              {companyInitial}

            </div>


            <div>

              <h2>
                {currentJob.title ||
                  "Job Title Not Available"}
              </h2>


              <p className="company-name">

                {companyName}

              </p>

            </div>

          </div>


          {/* =================================================
              JOB DETAILS
          ================================================= */}

          <div className="job-details">


            <div className="job-detail">

              <span>
                📍
              </span>

              {currentJob.location ||
                "Location not specified"}

            </div>


            <div className="job-detail">

              <span>
                💼
              </span>

              {currentJob.employment_type ||
                "Not specified"}

            </div>


            <div className="job-detail">

              <span>
                🎓
              </span>

              {currentJob.experience_required != null

                ? `${currentJob.experience_required} years`

                : "Not specified"}

            </div>


            <div className="job-detail">

              <span>
                💰
              </span>

              {salaryText}

            </div>

          </div>


          {/* =================================================
              MATCH SCORE
          ================================================= */}

          <div className="job-match">

            <div className="match-header">

              <span>
                ML Job Match
              </span>


              <strong>
                {matchPercentage.toFixed(2)}%
              </strong>

            </div>


            <div className="match-bar">

              <div
                className="match-progress"

                style={{
                  width:
                    `${safeMatchPercentage}%`,
                }}
              ></div>

            </div>

          </div>


          {/* =================================================
              REQUIRED SKILLS
          ================================================= */}

          <div className="job-skills">

            <h3>
              Required Skills
            </h3>


            <div className="job-skill-list">

              {skills.length > 0

                ? skills.map(
                    (skill, index) => (

                      <span
                        className="job-skill"
                        key={`${skill}-${index}`}
                      >
                        {skill}
                      </span>

                    )
                  )

                : (

                  <span className="job-skill">
                    No specific skills listed
                  </span>

                )}

            </div>

          </div>


          {/* =================================================
              JOB DESCRIPTION
          ================================================= */}

          <div className="job-description">

            <h3>
              About this job
            </h3>


            {cleanDescription ? (

              <p
                style={{
                  whiteSpace: "pre-line",
                  lineHeight: "1.7",
                }}
              >
                {cleanDescription}
              </p>

            ) : (

              <p>
                No job description available.
              </p>

            )}

          </div>


          {/* =================================================
              SWIPE INSTRUCTION
          ================================================= */}

          <div className="swipe-card-instruction">

            <p>
              Swipe the job card left or right
            </p>

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
        >

          {isProcessing
            ? "Processing..."
            : "Save Job"}

        </button>


        {/* =================================================
            TOUCHPAD INSTRUCTION
        ================================================= */}

        <p className="swipe-instruction">

          Use your laptop touchpad to swipe
          horizontally on the job card.

          <br />

          Swipe left = Skip

          {" | "}

          Swipe right = Apply

        </p>


        {/* =================================================
            JOB COUNTER
        ================================================= */}

        <p className="job-counter">

          Job {currentIndex + 1} of{" "}
          {jobs.length}

        </p>


      </div>

    </div>

  );

}


export default SwipeJobs;
