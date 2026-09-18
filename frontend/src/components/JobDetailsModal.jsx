import { useEffect, useRef, useState } from "react";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaMoneyBillWave,
  FaBullseye,
  FaTimes,
  FaFileAlt,
  FaExclamationTriangle,
  FaLightbulb,
  FaBolt,
} from "react-icons/fa";
import api from "../api";

function JobDetailsModal({ job, onClose }) {
  const [ats, setAts] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsNoResume, setAtsNoResume] = useState(false);
  const [atsRequested, setAtsRequested] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [descriptionHasOverflow, setDescriptionHasOverflow] = useState(false);
  const descriptionRef = useRef(null);

  // ==========================================
  // FIX 1: LOCK BACKGROUND SCROLL WHILE OPEN
  // Prevents the page behind the modal from
  // scrolling. Restores whatever overflow value
  // was there before, so this doesn't clobber
  // any other component managing body scroll.
  // ==========================================
  useEffect(() => {
    if (!job) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [job]);

  useEffect(() => {
    const element = descriptionRef.current;
    if (!element || !job?.description) return undefined;

    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const collapsedHeight = lineHeight * 3;
      setDescriptionHasOverflow(element.scrollHeight > collapsedHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [job?.description]);

  // ==========================================
  // FIX 2: ATS SCORE IS OPT-IN, NOT AUTOMATIC
  // Only fetches when the candidate explicitly
  // clicks "View ATS Score" — checking a job's
  // fit against your resume is the user's choice,
  // not something to surface unasked.
  // ==========================================
  const loadAts = async () => {
    if (!job?.job_id) return;

    setAtsRequested(true);
    setAtsLoading(true);
    setAtsNoResume(false);

    try {
      const response = await api.get(`/api/ats/${job.job_id}`);
      setAts(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setAtsNoResume(true);
      } else {
        console.error("ATS score load error:", err);
      }
    } finally {
      setAtsLoading(false);
    }
  };

  if (!job) return null;

  const skills = (job.skills || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Job details"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-sx-border bg-sx-card p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close job details"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-sx-border bg-sx-bg-soft text-sx-text-secondary transition hover:bg-sx-primary-soft hover:text-sx-primary"
        >
          <FaTimes />
        </button>

        <div className="mb-6 flex items-start gap-4 pr-10">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-sx-primary text-2xl font-bold text-white">
            {job.company ? job.company.charAt(0).toUpperCase() : "J"}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-sx-text-secondary">
              {job.company || "Company not specified"}
            </p>
            <h1 className="text-2xl font-bold text-sx-text">
              {job.title || "Untitled Position"}
            </h1>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [FaMapMarkerAlt, "Location", job.location],
            [FaBriefcase, "Employment", job.employment_type],
            [FaMoneyBillWave, "Salary", job.salary],
            [FaBullseye, "Experience", job.experience_required],
          ].map(([Icon, label, value]) => (
            <div
              key={label}
              className="flex items-start gap-2 rounded-lg border border-sx-border bg-sx-bg-soft p-3"
            >
              <Icon className="mt-0.5 flex-shrink-0 text-sx-text-muted" />
              <div className="min-w-0">
                <small className="block text-[10px] text-sx-text-muted">
                  {label}
                </small>
                <strong className="break-words text-xs text-sx-text">
                  {value || "Not specified"}
                </strong>
              </div>
            </div>
          ))}
        </div>

        {skills.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-sx-text">
              Required Skills
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-sx-bg-soft px-2.5 py-1 text-xs font-medium text-sx-text-secondary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-sx-text">
            About the Role
          </h2>
          <p
            ref={descriptionRef}
            className="whitespace-pre-line text-sm leading-relaxed text-sx-text-secondary"
            style={{
              maxHeight: expandedJobId === job?.job_id ? undefined : "4.5em",
              overflow: expandedJobId === job?.job_id ? "visible" : "hidden",
            }}
          >
            {job.description || "No description available."}
          </p>
          {job.description && descriptionHasOverflow && (
            <button
              type="button"
              onClick={() => setExpandedJobId((currentId) => (
                currentId === job?.job_id ? null : job?.job_id
              ))}
              className="mt-2 text-sm font-semibold text-sx-primary-dark hover:underline"
            >
              {expandedJobId === job?.job_id ? "Show less" : "More"}
            </button>
          )}
        </section>

        {!atsRequested && (
          <button
            type="button"
            onClick={loadAts}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-sx-primary bg-sx-primary-soft px-4 py-3 text-sm font-semibold text-sx-primary-dark transition hover:bg-sx-primary hover:text-white"
          >
            <FaBolt />
            View ATS Score for This Job
          </button>
        )}

        {atsRequested && atsLoading && (
          <div className="rounded-xl border border-sx-border bg-sx-bg-soft p-4 text-sm text-sx-text-secondary">
            Checking your ATS match for this job...
          </div>
        )}

        {atsRequested && !atsLoading && atsNoResume && (
          <div className="flex items-start gap-3 rounded-xl border border-sx-border bg-sx-bg-soft p-4">
            <FaFileAlt className="mt-0.5 flex-shrink-0 text-sx-primary" />
            <div>
              <p className="text-sm font-semibold text-sx-text">
                Upload a resume to see your ATS score
              </p>
              <p className="mt-1 text-sm text-sx-text-secondary">
                SwipeX compares your skills, experience, and education against
                this job automatically.
              </p>
            </div>
          </div>
        )}

        {atsRequested && !atsLoading && ats && (
          <section className="rounded-xl border border-sx-border bg-sx-bg-soft p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-sx-text">
                Your ATS Match
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${
                  ats.ats_score >= 80
                    ? "bg-sx-success-bg text-sx-success"
                    : ats.ats_score >= 60
                    ? "bg-sx-primary-soft text-sx-primary-dark"
                    : "bg-sx-danger-bg text-sx-danger"
                }`}
              >
                {Math.round(ats.ats_score)}%
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["Skills Match", ats.breakdown?.skills],
                ["Experience Fit", ats.breakdown?.experience],
                ["Semantic Match", ats.breakdown?.semantic],
                ["Education Match", ats.breakdown?.education],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-sx-text-secondary">{label}</span>
                    <span className="font-semibold text-sx-text">
                      {Math.round(value || 0)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sx-border">
                    <div
                      className="h-full rounded-full bg-sx-primary"
                      style={{
                        width: `${Math.max(0, Math.min(100, value || 0))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {ats.missing_skills?.length > 0 && (
              <div className="mt-4">
                <span className="mb-2 block text-xs font-semibold text-sx-text-secondary">
                  Missing Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ats.missing_skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1 rounded-full bg-sx-danger-bg px-2.5 py-1 text-xs font-medium text-sx-danger"
                    >
                      <FaExclamationTriangle className="text-[10px]" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ats.improvement_suggestion && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-sx-border bg-sx-card p-3 text-sm text-sx-text-secondary">
                <FaLightbulb className="mt-0.5 flex-shrink-0 text-sx-warning" />
                {ats.improvement_suggestion}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default JobDetailsModal;
