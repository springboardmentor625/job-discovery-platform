import { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  FaRobot,
  FaMapMarkerAlt,
  FaCheck,
  FaBookmark,
  FaTimes,
  FaSync,
  FaCheckCircle,
  FaThLarge,
  FaLayerGroup,
} from "react-icons/fa";
import api from "../services/api";
import JobDetailsModal from "../components/JobDetailsModal";

/* =========================================================
   SKILL BADGES COMPONENT
========================================================= */
function SkillSection({ title, skills, badgeColor, emptyText }) {
  const [showAll, setShowAll] = useState(false);

  const displayLimit = 3;
  const hasMore = skills.length > displayLimit;

  const visibleSkills = showAll
    ? skills
    : skills.slice(0, displayLimit);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
        <span className={badgeColor.text}>
          {title} ({skills.length})
        </span>

        {hasMore && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAll(!showAll);
            }}
            className="text-[10px] lowercase font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            {showAll
              ? "show less"
              : `+${skills.length - displayLimit} more`}
          </button>
        )}
      </div>

      <div className="h-10 overflow-y-auto pr-1 flex flex-wrap gap-1 content-start custom-scrollbar">
        {visibleSkills.length > 0 ? (
          visibleSkills.map((skill, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badgeColor.badge}`}
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-slate-400 italic">
            {emptyText}
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SWIPE CARD
========================================================= */
function SwipeCard({
  item,
  isTop,
  onSwipe,
  onCardClick,
}) {
  const job = item.job || {};

  const atsScore = item.ats_score ?? 0;
  const skillPct = item.skill_match_percentage ?? 0;

  const matchedSkills = item.matched_skills || [];
  const missingSkills = item.missing_skills || [];

  const isApplied = item.is_applied || job.is_applied;
  const isSaved = item.is_saved || job.is_saved;

  const x = useMotionValue(0);

  const rotate = useTransform(
    x,
    [-200, 200],
    [-18, 18]
  );

  const opacity = useTransform(
    x,
    [-250, -150, 0, 150, 250],
    [0.2, 0.8, 1, 0.8, 0.2]
  );

  const interestedOpacity = useTransform(
    x,
    [20, 100],
    [0, 1]
  );

  const skippedOpacity = useTransform(
    x,
    [-100, -20],
    [1, 0]
  );

  /* =========================================================
     DRAG GUARD
     Prevents modal opening after swipe
  ========================================================= */
  const hasDragged = useRef(false);

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    const swipeThreshold = 100;
    const velocityThreshold = 400;

    if (
      offset > swipeThreshold ||
      velocity > velocityThreshold
    ) {
      onSwipe("interested", job.id);
    } else if (
      offset < -swipeThreshold ||
      velocity < -velocityThreshold
    ) {
      onSwipe("skipped", job.id);
    }

    /*
      Keep drag flag briefly so the click event
      generated after dragging cannot open modal
    */
    setTimeout(() => {
      hasDragged.current = false;
    }, 150);
  };

  return (
    <motion.div
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 0.95,
        scale: isTop ? 1 : 0.96,
        y: isTop ? 0 : 8,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragStart={() => {
        hasDragged.current = true;
      }}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { cursor: "grabbing" } : {}}
      onClick={() => {
        if (hasDragged.current) return;

        onCardClick(item);
      }}
      className={`
        w-full max-w-md h-[540px]
        bg-white rounded-3xl
        border border-slate-200/90
        shadow-xl
        p-6
        flex flex-col justify-between
        select-none relative overflow-hidden
        transition-shadow
        ${
          isTop
            ? "cursor-grab active:cursor-grabbing hover:shadow-2xl"
            : "pointer-events-none"
        }
      `}
    >
      {/* =====================================================
          STAMP OVERLAYS
      ===================================================== */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: interestedOpacity }}
            className="absolute top-8 right-8 z-30 pointer-events-none border-4 border-emerald-500 text-emerald-600 px-4 py-1.5 rounded-xl font-black text-xl tracking-wider rotate-12 bg-white/90 shadow-md uppercase"
          >
            Interested
          </motion.div>

          <motion.div
            style={{ opacity: skippedOpacity }}
            className="absolute top-8 left-8 z-30 pointer-events-none border-4 border-red-500 text-red-600 px-4 py-1.5 rounded-xl font-black text-xl tracking-wider -rotate-12 bg-white/90 shadow-md uppercase"
          >
            Skipped
          </motion.div>
        </>
      )}

      {/* =====================================================
          TOP CONTENT
      ===================================================== */}
      <div className="space-y-3">

        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">

          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xl shrink-0 border border-indigo-100 shadow-xs">
              {job.company
                ? job.company.charAt(0).toUpperCase()
                : "C"}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-black text-slate-900 truncate tracking-tight">
                {job.title || "Job Opportunity"}
              </h3>

              <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                {job.company || "Company"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">

            {isApplied && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <FaCheckCircle className="text-[9px]" />
                Applied
              </span>
            )}

            {isSaved && !isApplied && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <FaBookmark className="text-[8px]" />
                Saved
              </span>
            )}

          </div>
        </div>

        {/* LOCATION */}
        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap font-medium">

          <span className="inline-flex items-center gap-1 truncate max-w-[150px]">
            <FaMapMarkerAlt className="text-slate-400 shrink-0" />

            <span className="truncate">
              {job.location || "Remote"}
            </span>
          </span>

          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
            {job.work_mode || "On-site"}
          </span>

          {job.salary && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] truncate max-w-[140px]">
              💵 {job.salary}
            </span>
          )}

        </div>

        {/* =====================================================
            SCORES
        ===================================================== */}
        <div className="space-y-2 pt-1">

          <div className="grid grid-cols-2 gap-2.5">

            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-2.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                ATS Score
              </p>

              <p className="text-2xl font-black text-indigo-700">
                {atsScore}%
              </p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-2.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Skill Match
              </p>

              <p className="text-2xl font-black text-emerald-700">
                {skillPct}%
              </p>
            </div>

          </div>
        </div>

        {/* DESCRIPTION */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed h-8">
          {job.description ||
            "Click to view full job responsibilities and structured qualifications."}
        </p>

        {/* =====================================================
            SKILLS
        ===================================================== */}
        <div className="space-y-2 pt-1 border-t border-slate-100">

          <SkillSection
            title="Skills You Have"
            skills={matchedSkills}
            badgeColor={{
              text: "text-emerald-700",
              badge:
                "bg-emerald-50 text-emerald-800 border-emerald-200",
            }}
            emptyText="No direct matches detected"
          />

          <SkillSection
            title="Skills to Improve"
            skills={missingSkills}
            badgeColor={{
              text: "text-amber-700",
              badge:
                "bg-amber-50 text-amber-800 border-amber-200",
            }}
            emptyText="All required skills matched"
          />

        </div>
      </div>

      {/* FOOTER */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">

        <span>← Drag left to Skip</span>

        <span className="text-indigo-600 font-bold">
          Click for details
        </span>

        <span>Drag right for Interested →</span>

      </div>
    </motion.div>
  );
}

/* =========================================================
   GRID CARD COMPONENT
========================================================= */
function GridCard({
  item,
  onSwipe,
  onCardClick,
  actionLoading,
}) {
  const job = item.job || {};

  const atsScore = item.ats_score ?? 0;
  const skillPct = item.skill_match_percentage ?? 0;

  const matchedSkills = item.matched_skills || [];
  const missingSkills = item.missing_skills || [];

  const isApplied = item.is_applied || job.is_applied;
  const isSaved = item.is_saved || job.is_saved;

  return (
    <div
      onClick={() => onCardClick(item)}
      className="h-[540px] bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer p-6 flex flex-col justify-between group"
    >
      <div className="space-y-3">

        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">

          <div className="flex items-start gap-3 min-w-0">

            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-lg shrink-0 border border-indigo-100">
              {job.company
                ? job.company.charAt(0).toUpperCase()
                : "C"}
            </div>

            <div className="min-w-0 flex-1">

              <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">
                {job.title || "Job Opportunity"}
              </h3>

              <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                {job.company || "Company"}
              </p>

            </div>

          </div>

          {isApplied && (
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <FaCheckCircle className="text-[9px]" />
              Applied
            </span>
          )}

        </div>

        {/* LOCATION */}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">

          <span className="flex items-center gap-1 truncate max-w-[130px]">
            <FaMapMarkerAlt className="text-slate-400 shrink-0" />

            <span className="truncate">
              {job.location || "Remote"}
            </span>
          </span>

          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
            {job.work_mode || "On-site"}
          </span>

          {job.salary && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] truncate max-w-[130px]">
              💵 {job.salary}
            </span>
          )}

        </div>

        {/* METRICS */}
        <div className="grid grid-cols-2 gap-2">

          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 text-center">

            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              ATS Score
            </p>

            <p className="text-xl font-black text-indigo-700">
              {atsScore}%
            </p>

          </div>

          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 text-center">

            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Skill Match
            </p>

            <p className="text-xl font-black text-emerald-700">
              {skillPct}%
            </p>

          </div>

        </div>

        {/* DESCRIPTION */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed h-8">
          {job.description ||
            "Click to view full job responsibilities and structured qualifications."}
        </p>

        {/* SKILLS */}
        <div className="space-y-2 pt-1 border-t border-slate-100">

          <SkillSection
            title="Skills You Have"
            skills={matchedSkills}
            badgeColor={{
              text: "text-emerald-700",
              badge:
                "bg-emerald-50 text-emerald-800 border-emerald-200",
            }}
            emptyText="No direct matches detected"
          />

          <SkillSection
            title="Skills to Improve"
            skills={missingSkills}
            badgeColor={{
              text: "text-amber-700",
              badge:
                "bg-amber-50 text-amber-800 border-amber-200",
            }}
            emptyText="All required skills matched"
          />

        </div>
      </div>

      {/* =====================================================
          GRID ACTION BUTTONS
      ===================================================== */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSwipe("skipped", job.id);
          }}
          disabled={actionLoading[job.id]}
          className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition disabled:opacity-50"
        >
          <FaTimes />
          Skip
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSwipe("saved", job.id);
          }}
          disabled={actionLoading[job.id]}
          className={`flex-1 h-10 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 transition disabled:opacity-50 ${
            isSaved
              ? "bg-amber-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          }`}
        >
          <FaBookmark />
          {isSaved ? "Saved" : "Save"}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSwipe("interested", job.id);
          }}
          disabled={actionLoading[job.id]}
          className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-xs"
        >
          <FaCheck />
          Interested
        </button>

      </div>
    </div>
  );
}

/* =========================================================
   MAIN RECOMMENDATIONS COMPONENT
========================================================= */
function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);

  const [viewMode, setViewMode] = useState("deck");

  useEffect(() => {
    fetchRecommendations(false);
  }, []);

  /* =========================================================
     FETCH RECOMMENDATIONS
  ========================================================= */
  const fetchRecommendations = async (forceRefresh = false) => {
    try {
      setLoading(true);

      const url = forceRefresh
        ? "recommendations/?refresh=true"
        : "recommendations/";

      const res = await api.get(url);

      const data = Array.isArray(res.data)
        ? res.data
        : [];

      setRecommendations(data);

      if (forceRefresh) {
        toast.success(
          "Loaded new 50-job batch tailored to your swipe preferences!"
        );
      }
    } catch (error) {
      console.error(
        "Recommendations error:",
        error
      );

      setRecommendations([]);

      toast.error(
        error?.response?.data?.detail ||
          "Unable to load recommendations."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SWIPE ACTION
  ========================================================= */
  const handleSwipeAction = async (
    decision,
    jobId
  ) => {
    if (!jobId || actionLoading[jobId]) return;

    try {
      setActionLoading((prev) => ({
        ...prev,
        [jobId]: true,
      }));

      await api.post("swipes/", {
        job_id: jobId,
        decision,
      });

      if (decision === "interested") {
        toast.success("Marked as Interested!");
      } else if (decision === "saved") {
        toast.success("Job Saved to Swipe History!");
      } else {
        toast("Job Skipped", {
          icon: "👋",
        });
      }

      /*
        Remove job from recommendation pool
      */
      setRecommendations((prev) =>
        prev.filter(
          (item) => item.job?.id !== jobId
        )
      );

      /*
        Close modal if this job is open
      */
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
    } catch (error) {
      console.error(
        "Swipe action error:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          "Failed to register decision."
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [jobId]: false,
      }));
    }
  };

  /* =========================================================
     APPLY SUCCESS
  ========================================================= */
  const handleApplySuccess = (jobId) => {
    setRecommendations((prev) =>
      prev.map((item) => {
        if (item.job?.id === jobId) {
          return {
            ...item,
            is_applied: true,
            job: {
              ...item.job,
              is_applied: true,
            },
          };
        }

        return item;
      })
    );

    if (selectedJob?.id === jobId) {
      setSelectedJob((prev) => ({
        ...prev,
        is_applied: true,
      }));
    }
  };

  /*
    First job = current card
    Second job = card behind
  */
  const currentDeckItem = recommendations[0];
  const nextDeckItem = recommendations[1];

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <div>

          <div className="flex items-center gap-2">

            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FaRobot className="text-indigo-600" />
              AI Recommendations
            </h1>

            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {recommendations.length} Available
            </span>

          </div>

          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            Per-job ATS scores & semantic matching.
            Continuous learning updates your
            recommendations with every swipe.
          </p>

        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-center">

          {/* VIEW TOGGLE */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">

            <button
              type="button"
              onClick={() => setViewMode("deck")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "deck"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaLayerGroup />
              Swipe Deck
            </button>

            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaThLarge />
              Browse (50)
            </button>

          </div>

          {/* NEW BATCH */}
          <button
            type="button"
            onClick={() =>
              fetchRecommendations(true)
            }
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shrink-0 disabled:opacity-50"
          >
            <FaSync
              className={
                loading ? "animate-spin" : ""
              }
            />

            {loading
              ? "Generating..."
              : "New Batch"}
          </button>

        </div>
      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}
      {loading ? (

        <div className="flex flex-col items-center justify-center min-h-[460px] space-y-4">

          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />

          <p className="text-sm font-bold text-slate-600">
            Analyzing 123,849 jobs & calculating ATS matches...
          </p>

        </div>

      ) : recommendations.length === 0 ? (

        /* ===================================================
           EMPTY STATE
        =================================================== */
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xs text-center max-w-lg mx-auto space-y-4">

          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
            <FaRobot />
          </div>

          <h3 className="text-lg font-black text-slate-800">
            All Current Jobs Reviewed!
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed">
            You have reviewed all jobs in this
            recommendation batch. Click below to
            fetch a fresh 50-job batch that
            incorporates your latest swipe preferences.
          </p>

          <button
            type="button"
            onClick={() =>
              fetchRecommendations(true)
            }
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
          >
            <FaSync />
            Generate Next 50 Jobs
          </button>

        </div>

      ) : viewMode === "deck" ? (

        /* ===================================================
           SWIPE DECK
        =================================================== */
        <div className="flex flex-col items-center justify-center pt-2 pb-6">

          <div className="relative w-full max-w-md h-[550px] flex items-center justify-center">

            {/* NEXT CARD */}
            {nextDeckItem && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">

                <SwipeCard
                  item={nextDeckItem}
                  isTop={false}
                  onSwipe={handleSwipeAction}
                  onCardClick={() => {}}
                />

              </div>
            )}

            {/* CURRENT CARD */}
            {currentDeckItem && (
              <div className="absolute inset-0 flex items-center justify-center z-20">

                <SwipeCard
                  item={currentDeckItem}
                  isTop={true}
                  onSwipe={handleSwipeAction}
                  onCardClick={(item) =>
                    setSelectedJob({
                      ...item.job,
                      ...item,
                    })
                  }
                />

              </div>
            )}

          </div>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}
          {currentDeckItem && (
            <div className="flex items-center justify-center gap-5 mt-6 z-30">

              {/* SKIP */}
              <button
                type="button"
                onClick={() =>
                  handleSwipeAction(
                    "skipped",
                    currentDeckItem.job?.id
                  )
                }
                disabled={
                  actionLoading[
                    currentDeckItem.job?.id
                  ]
                }
                className="w-14 h-14 rounded-full bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 flex items-center justify-center text-xl shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Skip Job"
              >
                <FaTimes />
              </button>

              {/* SAVE */}
              <button
                type="button"
                onClick={() =>
                  handleSwipeAction(
                    "saved",
                    currentDeckItem.job?.id
                  )
                }
                disabled={
                  actionLoading[
                    currentDeckItem.job?.id
                  ]
                }
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer ${
                  currentDeckItem.is_saved
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-amber-500 border-amber-200 hover:bg-amber-50 hover:border-amber-400"
                }`}
                title="Save Job"
              >
                <FaBookmark />
              </button>

              {/* INTERESTED */}
              <button
                type="button"
                onClick={() =>
                  handleSwipeAction(
                    "interested",
                    currentDeckItem.job?.id
                  )
                }
                disabled={
                  actionLoading[
                    currentDeckItem.job?.id
                  ]
                }
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Interested"
              >
                <FaCheck />
              </button>

            </div>
          )}

        </div>

      ) : (

        /* ===================================================
           GRID VIEW
        =================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {recommendations.map(
            (item, index) => (

              <GridCard
                key={
                  item.job?.id || index
                }
                item={item}
                onSwipe={handleSwipeAction}
                onCardClick={(jobItem) =>
                  setSelectedJob({
                    ...jobItem.job,
                    ...jobItem,
                  })
                }
                actionLoading={actionLoading}
              />

            )
          )}

        </div>

      )}

      {/* =====================================================
          JOB DETAILS MODAL
      ===================================================== */}
      {selectedJob && (

        <JobDetailsModal
          job={selectedJob}
          onClose={() =>
            setSelectedJob(null)
          }
          onSwipe={(decision, jobId) => {
            handleSwipeAction(
              decision,
              jobId
            );

            setSelectedJob(null);
          }}
          onApplySuccess={handleApplySuccess}
        />

      )}

    </div>
  );
}

export default Recommendations;