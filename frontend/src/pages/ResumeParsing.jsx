import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ResumeParsing() {
  const navigate = useNavigate();

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(
    "Uploading resume..."
  );

  useEffect(() => {
    const steps = [
      {
        progress: 20,
        text: "Uploading resume...",
      },
      {
        progress: 40,
        text: "Reading resume content...",
      },
      {
        progress: 60,
        text: "Analyzing your skills...",
      },
      {
        progress: 80,
        text: "Extracting experience...",
      },
      {
        progress: 100,
        text: "Resume analysis completed!",
      },
    ];

    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < steps.length) {
        setProgress(steps[currentIndex].progress);
        setCurrentStep(steps[currentIndex].text);

        currentIndex++;
      } else {
        clearInterval(interval);

        setTimeout(() => {
          navigate("/resume-analysis");
        }, 1000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="page">
      <div className="form-container parsing-container">

        <div className="parsing-icon">
          📄
        </div>

        <h1>Analyzing Your Resume</h1>

        <p className="form-subtitle">
          SwipeX is analyzing your resume to understand
          your skills and experience.
        </p>

        <div className="parsing-status">

          <p className="parsing-step">
            {currentStep}
          </p>

          <div className="progress-bar-container">

            <div
              className="progress-bar"
              style={{
                width: `${progress}%`,
              }}
            ></div>

          </div>

          <p className="progress-text">
            {progress}%
          </p>

        </div>

        <div className="parsing-details">

          <div
            className={
              progress >= 20
                ? "parsing-item completed"
                : "parsing-item"
            }
          >
            <span>
              {progress >= 20 ? "✓" : "○"}
            </span>
            Resume uploaded
          </div>

          <div
            className={
              progress >= 40
                ? "parsing-item completed"
                : "parsing-item"
            }
          >
            <span>
              {progress >= 40 ? "✓" : "○"}
            </span>
            Reading resume
          </div>

          <div
            className={
              progress >= 60
                ? "parsing-item completed"
                : "parsing-item"
            }
          >
            <span>
              {progress >= 60 ? "✓" : "○"}
            </span>
            Extracting skills
          </div>

          <div
            className={
              progress >= 80
                ? "parsing-item completed"
                : "parsing-item"
            }
          >
            <span>
              {progress >= 80 ? "✓" : "○"}
            </span>
            Extracting experience
          </div>

          <div
            className={
              progress >= 100
                ? "parsing-item completed"
                : "parsing-item"
            }
          >
            <span>
              {progress >= 100 ? "✓" : "○"}
            </span>
            Analysis completed
          </div>

        </div>

        <p className="parsing-note">
          Please wait while we analyze your resume.
        </p>

      </div>
    </div>
  );
}

export default ResumeParsing;