import { useRef, useState } from "react";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaMoneyBillWave,
  FaBullseye,
  FaCheckCircle,
  FaRegBookmark,
  FaBookmark,
  FaTimes,
  FaHeart,
} from "react-icons/fa";
import MatchScoreRing from "../MatchScoreRing";

// ==========================================
// SWIPE DECK
//
// Receives `jobs` as a PROP from Discover.jsx,
// which is the single shared useJobs() result —
// this component does not fetch its own data.
//
// The front of the deck is always `deck[0]`.
// Discover.jsx removes a job from the shared
// array as soon as it's swiped, so the next
// card appears automatically on re-render —
// there is no separate local index to keep in
// sync with a shrinking array (that mismatch
// was the bug causing repeated/skipped cards).
//
// Renders that slice as a draggable card stack
// using raw Pointer Events (not just mouse
// events) so drag works on touch devices too.
// ==========================================

const SWIPE_THRESHOLD = 180;
const SAVE_DOWN_THRESHOLD = 140;
const DECK_SIZE = 10;

function SwipeDeck({ jobs, onSwipe, onSave, savedJobs, actionLoading, onViewDetails }) {
  const deck = jobs.slice(0, DECK_SIZE);

  const [drag, setDrag] = useState({ dx: 0, dy: 0, active: false });

  const pointerId = useRef(null);
  const startPoint = useRef({ x: 0, y: 0 });

  const currentJob = deck[0] || null;
  const nextJob = deck[1] || null;

  // ==========================================
  // POINTER HANDLERS
  // ==========================================

  const handlePointerDown = (e) => {
    if (!currentJob || actionLoading) {
      return;
    }

    pointerId.current = e.pointerId;
    startPoint.current = { x: e.clientX, y: e.clientY };

    e.currentTarget.setPointerCapture(e.pointerId);

    setDrag({ dx: 0, dy: 0, active: true });
  };

  const handlePointerMove = (e) => {
    if (pointerId.current !== e.pointerId || !drag.active) {
      return;
    }

    const dx = e.clientX - startPoint.current.x;
    const dy = e.clientY - startPoint.current.y;

    setDrag({ dx, dy, active: true });
  };

  const finishDrag = (e) => {
    if (pointerId.current !== e.pointerId) {
      return;
    }

    pointerId.current = null;

    // A deliberate downward gesture saves the current job.
    // Vertical movement must be dominant so a diagonal drag does not
    // accidentally save a job.
    if (drag.dy > SAVE_DOWN_THRESHOLD && Math.abs(drag.dy) > Math.abs(drag.dx) * 1.15) {
      onSave(currentJob.job_id);
      setDrag({ dx: 0, dy: 0, active: false });
      return;
    }

    // Require a larger horizontal movement before committing a like/pass.
    if (drag.dx > SWIPE_THRESHOLD) {
      commitSwipe("right");
    } else if (drag.dx < -SWIPE_THRESHOLD) {
      commitSwipe("left");
    } else {
      // Snap back
      setDrag({ dx: 0, dy: 0, active: false });
    }
  };

  const commitSwipe = (direction) => {
    if (!currentJob || actionLoading) {
      return;
    }

    onSwipe(currentJob.job_id, direction);

    setDrag({ dx: 0, dy: 0, active: false });
  };

  // ==========================================
  // EMPTY STATE
  // ==========================================

  if (!currentJob) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-sx-border bg-sx-card px-8 py-16 text-center shadow-sm">
        <h2 className="text-lg font-bold text-sx-text">
          You're through the deck!
        </h2>
        <p className="mt-1 text-sm text-sx-text-secondary">
          Check Search &amp; Filters or AI Recommendations for more
          opportunities.
        </p>
      </div>
    );
  }

  const rotation = drag.dx / 20;
  const likeOpacity = Math.min(Math.max((drag.dx - 40) / (SWIPE_THRESHOLD - 40), 0), 1);
  const passOpacity = Math.min(Math.max((-drag.dx - 40) / (SWIPE_THRESHOLD - 40), 0), 1);
  const saveOpacity = Math.min(Math.max((drag.dy - 40) / (SAVE_DOWN_THRESHOLD - 40), 0), 1);

  const isSaved = savedJobs.has(currentJob.job_id);
  const requiredSkills =
    currentJob.required_skills ||
    (currentJob.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      <div className="relative h-[500px] w-full select-none">
        {/* NEXT CARD (STACK DEPTH) */}

        {nextJob && (
          <div className="absolute inset-0 translate-y-3 scale-[0.96] rounded-2xl border border-sx-border bg-sx-card opacity-70 shadow-sm" />
        )}

        {/* CURRENT CARD */}

        <div
          key={currentJob.job_id}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          style={{
            transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(${rotation}deg)`,
            transition: drag.active ? "none" : "transform 0.3s ease",
            touchAction: "none",
          }}
          className="absolute inset-0 flex cursor-grab flex-col overflow-y-auto rounded-2xl border border-sx-border bg-sx-card p-5 shadow-lg active:cursor-grabbing"
        >
          {/* LIKE / PASS STAMPS */}

          <div
            style={{ opacity: likeOpacity }}
            className="pointer-events-none absolute left-5 top-5 z-10 rotate-[-12deg] rounded-lg border-4 border-sx-success px-3 py-1 text-lg font-extrabold uppercase tracking-wider text-sx-success"
          >
            Like
          </div>

          <div
            style={{ opacity: passOpacity }}
            className="pointer-events-none absolute right-5 top-5 z-10 rotate-[12deg] rounded-lg border-4 border-sx-danger px-3 py-1 text-lg font-extrabold uppercase tracking-wider text-sx-danger"
          >
            Pass
          </div>

          <div
            style={{ opacity: saveOpacity }}
            className="pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-lg border-4 border-sx-primary px-3 py-1 text-lg font-extrabold uppercase tracking-wider text-sx-primary"
          >
            Save
          </div>

          {/* HEADER */}

          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sx-primary text-lg font-bold text-white">
              {currentJob.company ? currentJob.company.charAt(0) : "J"}
            </div>

            <div className="min-w-0 flex-1">
              <span className="block text-xs text-sx-text-secondary">
                {currentJob.company || "Company"}
              </span>
              <h2 className="text-base font-bold leading-snug text-sx-text">
                {currentJob.title || "Untitled Job"}
              </h2>
            </div>

            {/* Discover is a plain, unscored listing —
                match_score only exists on jobs coming from
                the AI Recommendations endpoint, so the ring
                only renders when it's actually present. */}
            {currentJob.match_score != null && (
              <MatchScoreRing score={currentJob.match_score} size={50} />
            )}
          </div>

          {/* JOB DETAILS GRID */}

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2 rounded-lg border border-sx-border bg-sx-bg-soft p-2">
              <FaMapMarkerAlt className="mt-0.5 text-sx-text-muted" />
              <div>
                <small className="block text-[10px] text-sx-text-muted">
                  Location
                </small>
                <strong className="text-xs text-sx-text">
                  {currentJob.location || "Not specified"}
                </strong>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-sx-border bg-sx-bg-soft p-2">
              <FaBriefcase className="mt-0.5 text-sx-text-muted" />
              <div>
                <small className="block text-[10px] text-sx-text-muted">
                  Employment
                </small>
                <strong className="text-xs text-sx-text">
                  {currentJob.employment_type || "Not specified"}
                </strong>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-sx-border bg-sx-bg-soft p-2">
              <FaMoneyBillWave className="mt-0.5 text-sx-text-muted" />
              <div>
                <small className="block text-[10px] text-sx-text-muted">
                  Salary
                </small>
                <strong className="text-xs text-sx-text">
                  {currentJob.salary || "Not specified"}
                </strong>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-sx-border bg-sx-bg-soft p-2">
              <FaBullseye className="mt-0.5 text-sx-text-muted" />
              <div>
                <small className="block text-[10px] text-sx-text-muted">
                  Experience
                </small>
                <strong className="text-xs text-sx-text">
                  {currentJob.experience_required || "Not specified"}
                </strong>
              </div>
            </div>
          </div>

          {/* TAGS */}

          {currentJob.tags?.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {currentJob.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-sx-bg-soft px-2.5 py-1 text-[11px] font-medium text-sx-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* DESCRIPTION */}

          <div className="mb-3">
            <span className="mb-1 block text-[10px] font-bold tracking-wide text-sx-text-muted">
              ABOUT THE ROLE
            </span>
            <p className="line-clamp-3 text-sm leading-relaxed text-sx-text-secondary">
              {currentJob.description || "No description available."}
            </p>
          </div>

          {/* SKILLS */}

          {requiredSkills.length > 0 && (
            <div className="flex flex-wrap content-start gap-1.5">
              {requiredSkills.slice(0, 10).map((skill) => {
                const isMatched = currentJob.matched_skills?.includes(skill);

                return (
                  <span
                    key={skill}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      isMatched
                        ? "bg-sx-primary-soft text-sx-primary-dark"
                        : "bg-sx-bg-soft text-sx-text-secondary"
                    }`}
                  >
                    {isMatched && <FaCheckCircle className="text-[10px]" />}
                    {skill}
                  </span>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onViewDetails(currentJob)}
            className="mt-4 w-full rounded-lg border border-sx-border bg-sx-bg-soft py-2.5 text-sm font-semibold text-sx-primary-dark transition hover:bg-sx-primary-soft"
          >
            View Job Details
          </button>
        </div>
      </div>

      {/* ACTIONS */}

      <div className="mt-5 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => commitSwipe("left")}
          disabled={actionLoading}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-sx-danger-border bg-sx-danger-bg text-xl text-sx-danger transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaTimes />
        </button>

        <button
          type="button"
          onClick={() => onSave(currentJob.job_id)}
          disabled={actionLoading}
          className={`flex h-12 w-12 items-center justify-center rounded-full border text-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
            isSaved
              ? "border-sx-primary-light bg-sx-primary-soft text-sx-primary-dark"
              : "border-sx-border bg-sx-card text-sx-text-secondary"
          }`}
        >
          {isSaved ? <FaBookmark /> : <FaRegBookmark />}
        </button>

        <button
          type="button"
          onClick={() => commitSwipe("right")}
          disabled={actionLoading}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-sx-success-border bg-sx-success-bg text-xl text-sx-success transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaHeart />
        </button>
      </div>

      <p className="mt-3 text-xs text-sx-text-muted">
        {deck.length} job{deck.length !== 1 ? "s" : ""} left in this deck
      </p>
    </div>
  );
}

export default SwipeDeck;
