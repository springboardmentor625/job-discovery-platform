import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Heart, Bookmark, Check, MapPin, Briefcase, Sparkles, FileText, Sparkle } from "lucide-react";
import { fetchRecommendedJobs, submitSwipe, fetchAtsScore, fetchJobDescription } from "../services/api";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { SkeletonCard } from "../components/Skeleton";

export default function JobSwipe() {
  const [jobs, setJobs] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);

  const [showDescriptionPanel, setShowDescriptionPanel] = useState(false);
  const [descLoading, setDescLoading] = useState(false);
  const [descText, setDescText] = useState("");
  const [descIsCleaned, setDescIsCleaned] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-18, 18]);
  const likeOpacity = useTransform(x, [30, 150], [0, 1]);
  const skipOpacity = useTransform(x, [-150, -30], [1, 0]);
  const saveOpacity = useTransform(y, [-150, -30], [1, 0]);

  const loadJobs = () => {
    setLoading(true);
    setError("");
    fetchRecommendedJobs()
      .then(({ data }) => {
        setJobs(data);
        setIndex(0);
      })
      .catch((err) => {
        setError(
          err.response?.data?.[0] ||
            err.response?.data?.detail ||
            "Couldn't load recommended jobs."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadJobs, []);

  const currentJob = jobs[index];
  const nextJob = jobs[index + 1];

  useEffect(() => {
    setAtsResult(null);
    setShowDescriptionPanel(false);
    setDescText("");
    setDescIsCleaned(false);
    x.set(0);
    y.set(0);
  }, [index]);

  const finishSwipe = async (direction) => {
    if (!currentJob) return;
    try {
      await submitSwipe(currentJob.id, direction);
    } catch {
      // non-fatal — still advance the deck locally
    }
    setIndex((i) => i + 1);
  };

  const fling = (direction) => {
    if (direction === "right") animate(x, 600, { duration: 0.3, ease: "easeOut" });
    else if (direction === "left") animate(x, -600, { duration: 0.3, ease: "easeOut" });
    else if (direction === "save") animate(y, -600, { duration: 0.3, ease: "easeOut" });
    setTimeout(() => finishSwipe(direction), 220);
  };

  const handleDragEnd = (_, info) => {
    const { offset } = info;
    if (offset.y < -100 && Math.abs(offset.x) < 80) {
      fling("save");
    } else if (offset.x > 100) {
      fling("right");
    } else if (offset.x < -100) {
      fling("left");
    }
    // otherwise dragSnapToOrigin automatically snaps the card back to center
  };

  const handleGetAtsScore = async () => {
    if (!currentJob) return;
    setAtsLoading(true);
    setAtsResult(null);
    try {
      const { data } = await fetchAtsScore(currentJob.id);
      setAtsResult(data);
    } catch {
      setAtsResult({ error: "Couldn't reach the AI scoring service. Try again." });
    } finally {
      setAtsLoading(false);
    }
  };

  const handleViewDescription = async () => {
    if (!currentJob) return;
    setShowDescriptionPanel(true);
    setDescLoading(true);
    try {
      const { data } = await fetchJobDescription(currentJob.id);
      setDescText(data.description);
      setDescIsCleaned(data.cleaned);
    } catch {
      // Fall back to the raw description we already have locally rather
      // than leaving the panel empty on a network error.
      setDescText(currentJob.description);
      setDescIsCleaned(false);
    } finally {
      setDescLoading(false);
    }
  };

  // Split into paragraphs on blank lines. Only apply the extra sentence-
  // boundary split for RAW (un-cleaned) text — an AI-cleaned description
  // already has real paragraph breaks from Groq, and re-splitting it by
  // sentence would break up paragraphs Groq deliberately kept together.
  const descriptionParagraphs = descText
    ? descText
        .split(/\n\s*\n/)
        .flatMap((block) => (descIsCleaned ? [block] : block.split(/(?<=[.?!])\s+(?=[A-Z])/)))
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const descriptionIsTruncated = !descIsCleaned && descriptionParagraphs.length > 0 &&
    descriptionParagraphs[descriptionParagraphs.length - 1].trim().endsWith("...");

  if (loading) {
    return (
      <div className="px-8 sm:px-12 py-12 max-w-xl mx-auto">
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Upload a resume to see matches"
        description={typeof error === "string" ? error : "Recommendations are based on your resume text."}
        action={
          <Link
            to="/resume"
            className="px-5 py-2.5 rounded-full bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors"
          >
            Upload a resume
          </Link>
        }
      />
    );
  }

  if (!currentJob) {
    return (
      <EmptyState
        icon={Check}
        title="You're all caught up"
        description="No more recommended jobs right now — check back later or view what you've saved."
        action={
          <div className="flex gap-3">
            <button
              onClick={loadJobs}
              className="px-5 py-2.5 rounded-full border border-line text-ink hover:border-violet-500 transition-colors"
            >
              Refresh
            </button>
            <Link
              to="/applications"
              className="px-5 py-2.5 rounded-full bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors"
            >
              View applications
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-12 gap-8">
      <p className="text-sm text-muted -mb-4">Drag the card — left to skip, right if interested, up to save</p>

      <div className="relative w-full max-w-xl">
        {nextJob && (
          <div className="absolute inset-x-0 top-3 bottom-0 scale-[0.97] bg-white rounded-3xl border border-line" />
        )}

        <motion.div
          key={currentJob.id}
          drag
          dragSnapToOrigin
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          style={{ x, y, rotate }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-3xl border border-line shadow-md p-8 flex flex-col cursor-grab active:cursor-grabbing touch-none"
        >
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-6 right-6 px-3.5 py-1.5 rounded-lg border-2 border-violet-600 text-violet-600 font-display font-bold text-base rotate-12 pointer-events-none z-10"
          >
            LIKE
          </motion.div>
          <motion.div
            style={{ opacity: skipOpacity }}
            className="absolute top-6 left-6 px-3.5 py-1.5 rounded-lg border-2 border-ink/50 text-ink/50 font-display font-bold text-base -rotate-12 pointer-events-none z-10"
          >
            SKIP
          </motion.div>
          <motion.div
            style={{ opacity: saveOpacity }}
            className="absolute top-6 inset-x-0 flex justify-center pointer-events-none z-10"
          >
            <span className="px-3.5 py-1.5 rounded-lg border-2 border-amber-600 text-amber-600 font-display font-bold text-base">
              SAVE
            </span>
          </motion.div>

          <div className="flex items-start gap-4 mb-5">
            <Avatar name={currentJob.company} size={56} />
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-ink text-xl leading-snug" title={currentJob.title}>
                {currentJob.title}
              </h2>
              <p className="text-base text-muted truncate" title={currentJob.company}>
                {currentJob.company}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center shrink-0"
              title="AI-matched job"
            >
              <Sparkles size={18} className="text-violet-600" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {currentJob.skills_required.slice(0, 8).map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 bg-violet-50 text-violet-700 text-sm rounded-full capitalize"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-5 text-sm text-muted border-t border-line pt-4 mb-4">
            <span className="flex items-center gap-1.5"><MapPin size={16} /> {currentJob.location || "Not specified"}</span>
            <span className="flex items-center gap-1.5 capitalize"><Briefcase size={16} /> {currentJob.job_type.replace("_", " ")}</span>
          </div>

          <button
            type="button"
            onClick={handleViewDescription}
            className="w-full py-2.5 rounded-lg border border-line text-ink text-sm font-medium hover:border-violet-400 transition-colors mb-3 flex items-center justify-center gap-2"
          >
            <FileText size={16} /> View job description
          </button>

          <button
            onClick={handleGetAtsScore}
            disabled={atsLoading}
            className="w-full py-3 rounded-full bg-ink text-white text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {atsLoading ? "Asking AI..." : "Get ATS score"}
          </button>

          {atsResult && (
            <div className="mt-4 border-t border-line pt-4">
              {atsResult.error ? (
                <p className="text-sm text-red-700">{atsResult.error}</p>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-sm font-semibold text-ink">
                    Match score: {atsResult.match_score}%
                  </p>
                  {atsResult.matching_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {atsResult.matching_skills.map((s) => (
                        <span key={s} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {atsResult.suggestion && (
                    <p className="text-xs text-muted italic leading-relaxed">{atsResult.suggestion}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <div className="flex gap-6">
        <button
          onClick={() => fling("left")}
          className="w-16 h-16 rounded-full bg-white border border-line shadow-sm hover:border-ink transition-colors flex items-center justify-center text-ink/50"
          title="Skip"
        >
          <X size={24} />
        </button>
        <button
          onClick={() => fling("save")}
          className="w-16 h-16 rounded-full bg-white border border-line shadow-sm hover:border-amber-500 transition-colors flex items-center justify-center text-amber-600"
          title="Save"
        >
          <Bookmark size={22} />
        </button>
        <button
          onClick={() => fling("right")}
          className="w-16 h-16 rounded-full bg-violet-600 text-white shadow-sm hover:bg-violet-700 transition-colors flex items-center justify-center"
          title="Interested"
        >
          <Heart size={22} fill="currentColor" />
        </button>
      </div>
      <p className="text-xs text-muted">
        {jobs.length - index - 1} more job{jobs.length - index - 1 !== 1 ? "s" : ""} in your deck
      </p>

      <Modal
        open={showDescriptionPanel}
        onClose={() => setShowDescriptionPanel(false)}
        title={`${currentJob.title} at ${currentJob.company}`}
      >
        {descLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-4/6" />
            <p className="text-xs text-muted pt-2">Reading the full posting...</p>
          </div>
        ) : (
          <>
            {descIsCleaned && (
              <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium mb-4">
                <Sparkle size={13} /> Cleaned up by AI for readability
              </div>
            )}
            <div className="space-y-3.5">
              {descriptionParagraphs.map((para, i) => (
                <p key={i} className="text-sm text-ink/75 leading-7">
                  {para}
                </p>
              ))}
              {descriptionIsTruncated && (
                <p className="text-xs text-muted italic pt-1">
                  This posting appears to be cut off in the original source — the rest of the description isn't available.
                </p>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}