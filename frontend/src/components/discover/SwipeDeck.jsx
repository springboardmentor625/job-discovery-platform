import { useEffect, useRef, useState } from "react";
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

// ==========================================
// SWIPE DECK
//
// Receives `jobs` as a PROP from AIRecommendations.jsx,
// which supplies the personalized recommendation result.
// This component does not fetch its own data.
//
// The current recommendation is always `jobs[0]`.
// AIRecommendations.jsx removes a job after the swipe
// animation completes, so the next card appears
// automatically on re-render —
// there is no separate local index to keep in
// sync with a shrinking array (that mismatch
// was the bug causing repeated/skipped cards).
//
// Renders that slice as a draggable card stack
// using raw Pointer Events (not just mouse
// events) so drag works on touch devices too.
// ==========================================

const SWIPE_THRESHOLD = 120;
const SAVE_DOWN_THRESHOLD = 140;
// Slow enough that the user can clearly watch the card glide away in the
// swiped direction before the next recommendation appears.
const SWIPE_EXIT_DURATION = 1000;
const NEXT_CARD_REVEAL_DELAY = 180;

function SwipeDeck({ jobs, onSwipe, onSave, savedJobs, actionLoading, onViewDetails, onSwipeCommit }) {
  const [drag, setDrag] = useState({ dx: 0, dy: 0, active: false });
  const [exiting, setExiting] = useState(false);
  const [showNextCard, setShowNextCard] = useState(false);
  const exitTimer = useRef(null);
  const nextCardTimer = useRef(null);

  // Snapshot of the job being animated off-screen. Keeps the card content
  // stable (showing the old job) while jobs[0] is already updated to the
  // next recommendation — so the next card is "ready" the moment the
  // animation ends, with 0 perceived delay.
  const exitingJobRef = useRef(null);
  // While true, prevents the previousJobId guard from resetting the exit
  // animation when jobs[0] changes (because onSwipeCommit fires immediately).
  const exitAnimationActive = useRef(false);

  const pointerId = useRef(null);
  const startPoint = useRef({ x: 0, y: 0 });

  const currentJob = jobs[0] || null;
  // During an exit animation, render the snapshotted job so the card content
  // never changes mid-flight even though jobs[0] has already moved on.
  const displayJob = exiting && !showNextCard && exitingJobRef.current
    ? exitingJobRef.current
    : currentJob;

  // When the parent removes the swiped job, jobs[0] becomes the next
  // recommendation. At that point `exiting`/`drag` are still holding the
  // PREVIOUS card's off-screen exit position — resetting that in a
  // regular effect would only happen after the browser already painted
  // the new card at the stale position, which is exactly what caused the
  // new card to visibly "slide in" from the side.
  //
  // Instead of an effect, this resets it directly in the render body
  // (React's documented "adjusting state when a prop changes" pattern —
  // https://react.dev/learn/you-might-not-need-an-effect). Comparing
  // against a ref-tracked previous id and calling setState conditionally
  // during render makes React immediately re-render with the corrected
  // state before anything is painted, so there's no flash to begin with
  // — a stronger guarantee than useLayoutEffect gives, since it doesn't
  // even need a separate pre-paint pass. The pending exit timer itself
  // is cleared separately below (in an effect) since that's cleanup with
  // no visual effect, not something that needs to land before paint —
  // reading a ref during render is otherwise flagged by the rules of
  // React, so it's kept out of this block.
  const previousJobId = useRef(currentJob?.job_id);
  if (previousJobId.current !== currentJob?.job_id) {
    previousJobId.current = currentJob?.job_id;
    // Don't interrupt the exit animation — exitAnimationActive is set in
    // commitAction right before onSwipeCommit fires (which changes jobs[0]).
    if (!exitAnimationActive.current) {
      setExiting(false);
      setDrag({ dx: 0, dy: 0, active: false });
    }
  }

  useEffect(() => {
    if (!exitAnimationActive.current) {
      clearTimeout(exitTimer.current);
    }
  }, [currentJob?.job_id]);

  useEffect(() => () => clearTimeout(exitTimer.current), []);

  useEffect(() => () => clearTimeout(nextCardTimer.current), []);

  // ==========================================
  // POINTER HANDLERS
  // ==========================================

  const handlePointerDown = (e) => {
    if (!currentJob || actionLoading || exiting) {
      return;
    }

    pointerId.current = e.pointerId;
    startPoint.current = { x: e.clientX, y: e.clientY };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture is not supported by every browser/event target.
    }

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

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // Pointer may already have been released/cancelled.
    }

    // A deliberate downward gesture saves the current job — now animates
    // off (downward) the same way a like/pass does, instead of just
    // snapping back in place with no feedback that anything happened.
    if (drag.dy > SAVE_DOWN_THRESHOLD && Math.abs(drag.dy) > Math.abs(drag.dx) * 1.15) {
      commitAction("save");
      return;
    }

    // Require a larger horizontal movement before committing a like/pass.
    if (drag.dx > SWIPE_THRESHOLD) {
      commitAction("right");
    } else if (drag.dx < -SWIPE_THRESHOLD) {
      commitAction("left");
    } else {
      // Snap back
      setDrag({ dx: 0, dy: 0, active: false });
    }
  };

  const handlePointerCancel = (e) => {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setDrag({ dx: 0, dy: 0, active: false });
  };

  // Handles all three committed actions (like/pass/save) with a shared
  // exit animation: like and pass fly out horizontally, save flies out
  // downward. Whichever direction, the card leaves the screen and the
  // parent swaps in the next recommendation once the animation finishes.
  const commitAction = (type) => {
    if (!currentJob || actionLoading || exiting) {
      return;
    }

    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 900;
    const exitDistanceX = Math.max(viewportWidth * 0.95, 1100);
    const exitDistanceY = Math.max(viewportHeight * 0.6, 700);

    let exitX = 0;
    let exitY = 0;

    if (type === "right") {
      exitX = exitDistanceX;
    } else if (type === "left") {
      exitX = -exitDistanceX;
    } else {
      // save
      exitY = exitDistanceY;
    }

    const jobId = currentJob.job_id;

    // Snapshot the current job so the card renders its OWN content during
    // the entire exit animation, even after jobs[0] has changed to the next card.
    exitingJobRef.current = currentJob;
    exitAnimationActive.current = true;

    // Start animation immediately.
    setExiting(true);
    setShowNextCard(false);
    setDrag({ dx: exitX, dy: exitY, active: false });

    // The outgoing card has cleared the deck by this point. Reveal the next
    // recommendation without waiting for the remainder of the exit timer.
    nextCardTimer.current = setTimeout(() => {
      setShowNextCard(true);
      setDrag({ dx: 0, dy: 0, active: false });
    }, NEXT_CARD_REVEAL_DELAY);

    // Fire onSwipeCommit NOW — this triggers removeJob() in the parent so
    // jobs[0] already becomes the next recommendation. The animation is
    // protected by exitingJobRef (card content stays stable) and
    // exitAnimationActive (previousJobId guard won't reset the animation).
    if (onSwipeCommit) onSwipeCommit(jobId, type === "save" ? "save" : type);

    exitTimer.current = setTimeout(async () => {
      // Animation done. Clear the snapshot and let the next card (already
      // loaded in jobs[0]) snap in with 0 perceived delay.
      exitingJobRef.current = null;
      exitAnimationActive.current = false;
      setExiting(false);
      setShowNextCard(false);
      setDrag({ dx: 0, dy: 0, active: false });

      try {
        const succeeded =
          type === "save"
            ? await onSave(jobId)
            : await onSwipe(jobId, type);

        if (succeeded === false) {
          // API failed — nothing visual to undo since removeJob already fired.
        }
      } catch {
        // Network error — swipe is already removed from deck, handled in parent.
      }
    }, SWIPE_EXIT_DURATION);
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

  // Keep the gesture natural but give it enough tilt that the direction
  // of the swipe reads clearly while dragging (subtle tilt was part of
  // why the gesture felt ambiguous/clumsy before).
  const rotation = Math.max(-12, Math.min(drag.dx / 18, 12));
  const isSaved = savedJobs.has(displayJob.job_id);

  const requiredSkills =
    displayJob.required_skills ||
    (displayJob.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  // Small circular AI Match Score badge.
  const matchScore =
    displayJob.match_score != null
      ? Math.max(0, Math.min(100, Math.round(Number(displayJob.match_score))))
      : null;
  const matchCircleRadius = 18;
  const matchCircleCircumference = 2 * Math.PI * matchCircleRadius;
  const matchCircleOffset =
    matchScore != null
      ? matchCircleCircumference * (1 - matchScore / 100)
      : matchCircleCircumference;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      <div className="relative h-[560px] w-full select-none overflow-visible">
        {/* CURRENT CARD. After a swipe is saved successfully, the parent
            removes this job and jobs[0] automatically becomes the next recommendation. */}

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={handlePointerCancel}
          style={{
            transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(${rotation}deg)`,
            opacity: exiting && !showNextCard ? 0 : 1,
            // While exiting, ease-in so the card visibly accelerates away
            // in the swiped direction (a deliberate "throw") rather than
            // snapping off-screen instantly. The incoming/next card does
            // not get its own entrance animation — it just displays.
            transition: drag.active
              ? "none"
              : exiting && !showNextCard
                ? `transform ${SWIPE_EXIT_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${SWIPE_EXIT_DURATION * 0.7}ms ${SWIPE_EXIT_DURATION * 0.3}ms ease-in`
                : "none",
            transformOrigin: "center center",
            willChange: "transform, opacity",
            touchAction: "none",
          }}
          className={`absolute inset-0 flex cursor-grab flex-col overflow-hidden rounded-2xl border border-sx-border bg-sx-card p-5 shadow-lg active:cursor-grabbing${showNextCard ? " replacement-soft-touch" : ""}`}
        >
          {/* HEADER */}

          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sx-primary text-lg font-bold text-white">
              {displayJob.company ? displayJob.company.charAt(0) : "J"}
            </div>

            <div className="min-w-0 flex-1">
              <span className="block text-xs text-sx-text-secondary">
                {displayJob.company || "Company"}
              </span>
              <h2 className="text-base font-bold leading-snug text-sx-text">
                {displayJob.title || "Untitled Job"}
              </h2>
            </div>

            {/* AI MATCH SCORE — small circular badge (present only on
                personalized recommendation jobs), instead of a full-width
                bar so it doesn't dominate the card. */}
            {matchScore != null && (
              <div
                className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center"
                title={`AI Match Score: ${matchScore}%`}
              >
                <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
                  <circle
                    cx="22"
                    cy="22"
                    r={matchCircleRadius}
                    fill="none"
                    strokeWidth="4"
                    className="stroke-sx-border"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r={matchCircleRadius}
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={matchCircleCircumference}
                    strokeDashoffset={matchCircleOffset}
                    className="stroke-sx-primary"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-sx-primary-dark">
                  {matchScore}%
                </span>
              </div>
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
                  {displayJob.location || "Not specified"}
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
                  {displayJob.employment_type || "Not specified"}
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
                  {displayJob.salary || "Not specified"}
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
                  {displayJob.experience_required || "Not specified"}
                </strong>
              </div>
            </div>
          </div>

          {/* TAGS */}

          {displayJob.tags?.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {displayJob.tags.map((tag) => (
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
              {displayJob.description || "No description available."}
            </p>
          </div>

          {/* SKILLS */}

          {requiredSkills.length > 0 && (
            <div className="flex flex-wrap content-start gap-1.5">
              {requiredSkills.slice(0, 10).map((skill) => {
                const isMatched = displayJob.matched_skills?.includes(skill);

                return (
                  <span
                    key={skill}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${isMatched
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

      <div className="mt-2 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => commitAction("left")}
          disabled={actionLoading || exiting}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-sx-danger-border bg-sx-danger-bg text-xl text-sx-danger transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaTimes />
        </button>

        <button
          type="button"
          onClick={() => commitAction("save")}
          disabled={actionLoading || exiting}
          className={`flex h-12 w-12 items-center justify-center rounded-full border text-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${isSaved
            ? "border-sx-primary-light bg-sx-primary-soft text-sx-primary-dark"
            : "border-sx-border bg-sx-card text-sx-text-secondary"
            }`}
        >
          {isSaved ? <FaBookmark /> : <FaRegBookmark />}
        </button>

        <button
          type="button"
          onClick={() => commitAction("right")}
          disabled={actionLoading || exiting}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-sx-success-border bg-sx-success-bg text-xl text-sx-success transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaHeart />
        </button>
      </div>

      <div className="mt-3 rounded-full border border-sx-border bg-sx-card px-3 py-1 text-[11px] font-medium text-sx-text-muted shadow-sm">
        {jobs.length} recommendation{jobs.length !== 1 ? "s" : ""} remaining
      </div>
    </div>
  );
}

export default SwipeDeck;
