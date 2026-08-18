import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function SwipeJobs() {
  const navigate = useNavigate();

  const [jobs] = useState([
    {
      id: 1,
      title: "Software Developer",
      company: "ABC Technologies",
      location: "Bangalore",
      type: "Full Time",
      experience: "0-2 Years",
      skills: ["React", "JavaScript", "Python"],
      salary: "₹5 - ₹8 LPA",
    },
    {
      id: 2,
      title: "Frontend Developer",
      company: "Tech Solutions",
      location: "Pune",
      type: "Full Time",
      experience: "0-2 Years",
      skills: ["React", "HTML", "CSS", "JavaScript"],
      salary: "₹4 - ₹7 LPA",
    },
    {
      id: 3,
      title: "Python Developer",
      company: "Innovate Labs",
      location: "Hyderabad",
      type: "Full Time",
      experience: "0-1 Years",
      skills: ["Python", "Django", "SQL"],
      salary: "₹4 - ₹6 LPA",
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [dragStartX, setDragStartX] = useState(null);

  const [dragX, setDragX] = useState(0);

  const [isDragging, setIsDragging] = useState(false);

  const currentJob = jobs[currentIndex];

  /*
   * Move to next job
   */

  const moveToNextJob = () => {
    setCurrentIndex((previousIndex) => previousIndex + 1);

    setDragX(0);
  };

  /*
   * SWIPE RIGHT
   *
   * Apply
   * Save
   * Add to Favorites
   */

  const handleSwipeRight = () => {
    if (!currentJob) {
      return;
    }

    navigate("/application-success", {
      state: {
        job: currentJob,
        action: "right",
        applied: true,
        saved: true,
        favorite: true,
      },
    });
  };

  /*
   * SWIPE LEFT
   *
   * Skip
   * Improve recommendations
   */

  const handleSwipeLeft = () => {
    if (!currentJob) {
      return;
    }

    navigate("/recommended-jobs", {
      state: {
        skippedJobId: currentJob.id,
        action: "left",
        skipped: true,
        improveRecommendations: true,
      },
    });
  };

  /*
   * KEYBOARD ARROW KEYS
   *
   * Left Arrow  → Swipe Left
   * Right Arrow → Swipe Right
   */

  useEffect(() => {
    const handleKeyboard = (event) => {
      // Prevent browser scrolling with arrow keys
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
      }

      if (event.key === "ArrowLeft") {
        handleSwipeLeft();
      }

      if (event.key === "ArrowRight") {
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
  }, [currentJob]);

  /*
   * MOUSE START
   */

  const handleMouseDown = (event) => {
    setDragStartX(event.clientX);

    setIsDragging(true);
  };

  /*
   * MOUSE MOVE
   */

  const handleMouseMove = (event) => {
    if (
      !isDragging ||
      dragStartX === null
    ) {
      return;
    }

    const distance =
      event.clientX - dragStartX;

    setDragX(distance);
  };

  /*
   * MOUSE END
   */

  const handleMouseUp = () => {
    if (!isDragging) {
      return;
    }

    const swipeThreshold = 120;

    if (dragX > swipeThreshold) {
      handleSwipeRight();
    } else if (dragX < -swipeThreshold) {
      handleSwipeLeft();
    } else {
      setDragX(0);
    }

    setDragStartX(null);

    setIsDragging(false);
  };

  /*
   * TOUCH START
   */

  const handleTouchStart = (event) => {
    setDragStartX(
      event.touches[0].clientX
    );

    setIsDragging(true);
  };

  /*
   * TOUCH MOVE
   */

  const handleTouchMove = (event) => {
    if (
      !isDragging ||
      dragStartX === null
    ) {
      return;
    }

    const distance =
      event.touches[0].clientX -
      dragStartX;

    setDragX(distance);
  };

  /*
   * TOUCH END
   */

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  /*
   * NO MORE JOBS
   */

  if (!currentJob) {
    return (
      <div className="page">

        <div className="form-container">

          <h1>No More Jobs</h1>

          <p className="form-subtitle">
            You have gone through all the
            recommended jobs.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate("/recommended-jobs")
            }
          >
            View Recommended Jobs
          </button>

        </div>

      </div>
    );
  }

  const rotation = dragX / 15;

  return (
    <div className="page">

      <div className="swipe-container">

        {/* HEADER */}

        <div className="swipe-header">

          <h1>SwipeX</h1>

          <p>
            Swipe right to apply.
            Swipe left to skip.
          </p>

        </div>

        {/* SWIPE CARD */}

        <div
          className="swipe-card swipe-job-card"

          style={{
            transform:
              `translateX(${dragX}px) rotate(${rotation}deg)`,

            transition: isDragging
              ? "none"
              : "transform 0.3s ease",
          }}

          onMouseDown={handleMouseDown}

          onMouseMove={handleMouseMove}

          onMouseUp={handleMouseUp}

          onMouseLeave={() => {
            if (isDragging) {
              handleMouseUp();
            }
          }}

          onTouchStart={handleTouchStart}

          onTouchMove={handleTouchMove}

          onTouchEnd={handleTouchEnd}
        >

          {/* APPLY INDICATOR */}

          {dragX > 50 && (
            <div className="swipe-indicator apply-indicator">
              APPLY
            </div>
          )}

          {/* SKIP INDICATOR */}

          {dragX < -50 && (
            <div className="swipe-indicator skip-indicator">
              SKIP
            </div>
          )}

          {/* COMPANY */}

          <div className="swipe-card-header">

            <div className="company-logo large-logo">
              {currentJob.company.charAt(0)}
            </div>

            <div>

              <h2>
                {currentJob.title}
              </h2>

              <p className="company-name">
                {currentJob.company}
              </p>

            </div>

          </div>

          {/* JOB DETAILS */}

          <div className="job-details">

            <div className="job-detail">
              <span>📍</span>
              {currentJob.location}
            </div>

            <div className="job-detail">
              <span>💼</span>
              {currentJob.type}
            </div>

            <div className="job-detail">
              <span>🎓</span>
              {currentJob.experience}
            </div>

            <div className="job-detail">
              <span>💰</span>
              {currentJob.salary}
            </div>

          </div>

          {/* SKILLS */}

          <div className="job-skills">

            <h3>Required Skills</h3>

            <div className="job-skill-list">

              {currentJob.skills.map(
                (skill, index) => (
                  <span
                    className="job-skill"
                    key={index}
                  >
                    {skill}
                  </span>
                )
              )}

            </div>

          </div>

          {/* MATCH */}

          <div className="job-match">

            <div className="match-header">

              <span>
                Profile Match
              </span>

              <strong>
                85%
              </strong>

            </div>

            <div className="match-bar">

              <div
                className="match-progress"
                style={{
                  width: "85%",
                }}
              ></div>

            </div>

          </div>

          <div className="swipe-card-instruction">

            <p>
              Drag the card left or right
            </p>

          </div>

        </div>

        {/* SWIPE CONTROLS */}

        <div className="swipe-controls">

          <div className="swipe-control left-control">

            <div className="control-icon">
              ←
            </div>

            <strong>
              Swipe Left
            </strong>

            <span>
              Skip Job
            </span>

          </div>

          <div className="swipe-control right-control">

            <div className="control-icon">
              →
            </div>

            <strong>
              Swipe Right
            </strong>

            <span>
              Apply + Save + Favorite
            </span>

          </div>

        </div>

        {/* KEYBOARD INSTRUCTION */}

        <p className="swipe-instruction">

          Keyboard:
          <strong> ← Left Arrow = Skip </strong>
          |
          <strong> Right Arrow = Apply </strong>

        </p>

        {/* COUNTER */}

        <p className="job-counter">

          Job {currentIndex + 1} of {jobs.length}

        </p>

      </div>

    </div>
  );
}

export default SwipeJobs;