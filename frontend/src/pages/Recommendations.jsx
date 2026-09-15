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
  FaSearch,
  FaFilter,
  FaClock,
  FaExclamationCircle,
} from "react-icons/fa";
import api from "../services/api";
import JobDetailsModal from "../components/JobDetailsModal";

/* =========================================================
   RELATIVE TIME HELPER
========================================================= */
function relativeTime(isoString) {
  if (!isoString) return "";
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    if (isNaN(diff) || diff < 0) return "";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  } catch {
    return "";
  }
}

/* =========================================================
   SKILL BADGES COMPONENT
========================================================= */
function SkillSection({ title, skills, badgeColor, emptyText }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-bold uppercase tracking-wider">
        <span className={badgeColor.text}>
          {title} ({skills.length})
        </span>
      </div>

      <div className="max-h-24 overflow-y-auto pr-1 flex flex-wrap gap-1 content-start custom-scrollbar">
        {skills.length > 0 ? (
          skills.map((skill, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border break-words max-w-full ${badgeColor.badge}`}
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
        w-full max-w-md min-h-[520px] max-h-[580px] h-auto
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

        {/* LOCATION & SALARY */}
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

          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] truncate max-w-[160px]">
            💵 {job.salary && !["competitive", "nan", "none", "null", "not specified"].includes(String(job.salary).toLowerCase().trim()) ? job.salary : "Not specified"}
          </span>

        </div>

        {/* =====================================================
            ATS SCORE
        ===================================================== */}
        <div className="pt-1">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-2.5 text-center flex items-center justify-between px-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              ATS Score
            </p>
            <p className="text-2xl font-black text-indigo-700">
              {atsScore}%
            </p>
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

        <span className="text-indigo-600 font-bold flex items-center gap-1">
          {relativeTime(job.posted_at) ? (
            <><FaClock className="text-slate-300" />{relativeTime(job.posted_at)}</>
          ) : (
            "Click for details"
          )}
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

          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] truncate max-w-[160px]">
            💵 {job.salary && !["competitive", "nan", "none", "null", "not specified"].includes(String(job.salary).toLowerCase().trim()) ? job.salary : "Not specified"}
          </span>

          {relativeTime(job.posted_at) && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <FaClock className="shrink-0" />
              {relativeTime(job.posted_at)}
            </span>
          )}

        </div>

        {/* ATS SCORE */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 text-center flex items-center justify-between px-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            ATS Score
          </p>

          <p className="text-xl font-black text-indigo-700">
            {atsScore}%
          </p>
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
          className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center justify-center transition disabled:opacity-50 cursor-pointer"
        >
          Skip
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSwipe("saved", job.id);
          }}
          disabled={actionLoading[job.id]}
          className={`flex-1 h-10 rounded-xl font-bold text-xs inline-flex items-center justify-center transition disabled:opacity-50 cursor-pointer ${
            isSaved
              ? "bg-amber-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          }`}
        >
          {isSaved ? "Saved" : "Save"}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSwipe("interested", job.id);
          }}
          disabled={actionLoading[job.id]}
          className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center transition disabled:opacity-50 shadow-xs cursor-pointer"
        >
          Interested
        </button>

      </div>
    </div>
  );
}

/* =========================================================
   MAIN RECOMMENDATIONS COMPONENT
========================================================= */
const STORAGE_KEY = "swipex_deck_cache";

function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);

  const [viewMode, setViewMode] = useState("deck");

  // Server-side pagination state for Browse / Explore section
  const [browseJobs, setBrowseJobs] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState(false);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseTotal, setBrowseTotal] = useState(0);
  const [browseSearchInput, setBrowseSearchInput] = useState("");
  const [browseSearch, setBrowseSearch] = useState("");
  const [browseWorkMode, setBrowseWorkMode] = useState("all");
  const [browseExperience, setBrowseExperience] = useState("all");
  const BROWSE_PER_PAGE = 6;

  // Client-side pagination state for Grid view (AI recommendations grid)
  const [gridPage, setGridPage] = useState(1);
  const GRID_PER_PAGE = 6;

  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecommendations(parsed);
          setLoading(false);
          // Sync with backend without changing or replacing current first card
          api
            .get("recommendations/")
            .then((res) => {
              const data = Array.isArray(res.data) ? res.data : [];
              if (data.length > 0) {
                setRecommendations((prev) => {
                  if (!prev || prev.length === 0) return data;
                  const unswipedIds = new Set(data.map((d) => d.job?.id));
                  const remaining = prev.filter((p) =>
                    unswipedIds.has(p.job?.id)
                  );
                  const nextDeck =
                    remaining.length > 0 ? remaining : data;
                  try {
                    localStorage.setItem(
                      STORAGE_KEY,
                      JSON.stringify(nextDeck)
                    );
                  } catch (e) {}
                  return nextDeck;
                });
              }
            })
            .catch(() => {});
          return;
        }
      }
    } catch (e) {
      console.warn("Storage read error:", e);
    }
    fetchRecommendations(false);
  }, []);

  /* =========================================================
     FETCH BROWSE JOBS (SERVER-SIDE 6-ITEM PAGINATION)
  ========================================================= */
  const fetchBrowseJobs = async (
    page = 1,
    searchQuery = browseSearch,
    workMode = browseWorkMode,
    exp = browseExperience
  ) => {
    try {
      setBrowseLoading(true);
      setBrowseError(false);
      const params = { page };
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
      if (workMode && workMode !== "all") params.work_mode = workMode;
      if (exp && exp !== "all") params.experience = exp;

      const res = await api.get("jobs/", { params });
      const data = res.data;
      const results = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];
      const total =
        typeof data?.count === "number" ? data.count : results.length;

      const formatted = results.map((j) => ({
        job: j,
        ats_score: j.ats_score ?? 0,
        skill_match_percentage: j.skill_match_percentage ?? 0,
        matched_skills: j.matched_skills || [],
        missing_skills: j.missing_skills || [],
        is_applied: j.is_applied,
        is_saved: j.is_saved,
      }));

      setBrowseJobs(formatted);
      setBrowseTotal(total);
      setBrowsePage(page);
    } catch (err) {
      console.error("Browse jobs error:", err);
      toast.error("Unable to load browse jobs.");
      setBrowseError(true);
    } finally {
      setBrowseLoading(false);
    }
  };

  /* =========================================================
     FETCH RECOMMENDATIONS
  ========================================================= */
  const fetchRecommendations = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setFetchError(false);

      const url = forceRefresh
        ? "recommendations/?refresh=true"
        : "recommendations/";

      const res = await api.get(url);

      const data = Array.isArray(res.data) ? res.data : [];

      setRecommendations(data);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}

      if (forceRefresh) {
        toast.success(
          "Your recommendations have been refreshed based on your profile and swipe preferences."
        );
      }
    } catch (error) {
      console.error("Recommendations error:", error);
      setRecommendations([]);
      setFetchError(true);
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
  const handleSwipeAction = async (decision, jobId) => {
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
        Remove job from recommendation pool and update localStorage
      */
      setRecommendations((prev) => {
        const updated = prev.filter((item) => item.job?.id !== jobId);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      /*
        Update browse jobs if this job was viewed in browse mode
      */
      setBrowseJobs((prev) =>
        prev.map((item) => {
          if (item.job?.id === jobId) {
            return {
              ...item,
              is_saved: decision === "saved" ? true : item.is_saved,
              job: {
                ...item.job,
                is_saved:
                  decision === "saved" ? true : item.job?.is_saved,
              },
            };
          }
          return item;
        })
      );

      /*
        Close modal if this job is open
      */
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
    } catch (error) {
      console.error("Swipe action error:", error);
      toast.error(
        error?.response?.data?.detail || "Failed to register decision."
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

    setBrowseJobs((prev) =>
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "deck"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaLayerGroup />
              Swipe Deck ({recommendations.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                if (browseJobs.length === 0) {
                  fetchBrowseJobs(1);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaThLarge />
              Browse / Explore
            </button>

          </div>

          {/* REFRESH RECOMMENDATIONS */}
          <button
            type="button"
            onClick={() => {
              if (viewMode === "deck") {
                fetchRecommendations(true);
              } else {
                fetchBrowseJobs(browsePage);
              }
            }}
            disabled={loading || browseLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <FaSync
              className={
                (loading || browseLoading) ? "animate-spin" : ""
              }
            />

            {loading || browseLoading
              ? "Refreshing..."
              : viewMode === "deck"
              ? "Refresh Recommendations"
              : "Refresh Jobs"}
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
            Calculating ATS matches &amp; ranking jobs for you...
          </p>

        </div>

      ) : fetchError ? (

        /* ===================================================
           RECOMMENDATIONS ERROR STATE
        =================================================== */
        <div className="bg-white rounded-3xl p-12 border border-red-100 shadow-xs text-center max-w-lg mx-auto space-y-4">

          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto text-2xl shadow-xs">
            <FaExclamationCircle />
          </div>

          <h3 className="text-lg font-black text-slate-800">
            Failed to Load Recommendations
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed">
            Check your connection and try again.
          </p>

          <button
            type="button"
            onClick={() => fetchRecommendations(false)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
          >
            <FaSync />
            Retry
          </button>

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
            Refresh Recommendations
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
           GRID VIEW WITH 6-ITEM PAGINATION
        =================================================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendations
              .slice((gridPage - 1) * GRID_PER_PAGE, gridPage * GRID_PER_PAGE)
              .map((item, index) => (
                <GridCard
                  key={item.job?.id || index}
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
              ))}
          </div>

          {Math.ceil(recommendations.length / GRID_PER_PAGE) > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-700">
                  {(gridPage - 1) * GRID_PER_PAGE + 1}
                </span>
                {" – "}
                <span className="font-bold text-slate-700">
                  {Math.min(gridPage * GRID_PER_PAGE, recommendations.length)}
                </span>
                {" of "}
                <span className="font-bold text-slate-700">
                  {recommendations.length}
                </span>
                {" recommendations"}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGridPage((prev) => Math.max(prev - 1, 1))}
                  disabled={gridPage === 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  ‹ Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.ceil(recommendations.length / GRID_PER_PAGE) },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setGridPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                        gridPage === page
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setGridPage((prev) =>
                      Math.min(
                        prev + 1,
                        Math.ceil(recommendations.length / GRID_PER_PAGE)
                      )
                    )
                  }
                  disabled={
                    gridPage ===
                    Math.ceil(recommendations.length / GRID_PER_PAGE)
                  }
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next ›
                </button>
              </div>
            </div>
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