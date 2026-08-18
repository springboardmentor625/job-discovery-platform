import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { fetchRecommendedJobs, submitSwipe } from "../services/api";

export default function JobSwipe() {
  const [jobs, setJobs] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastAction, setLastAction] = useState(null);

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

  const handleSwipe = async (direction) => {
    if (!currentJob) return;
    setLastAction(direction);
    try {
      await submitSwipe(currentJob.id, direction);
    } catch {
      // non-fatal — still advance the deck locally
    }
    setTimeout(() => {
      setIndex((i) => i + 1);
      setLastAction(null);
    }, 150);
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">Loading jobs...</div>;
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-600">{error}</p>
        <Link
          to="/resume"
          className="px-4 py-2 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
        >
          Upload a resume
        </Link>
      </div>
    );
  }

  if (!currentJob) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-600">You're all caught up — no more recommended jobs right now.</p>
        <div className="flex gap-3">
          <button
            onClick={loadJobs}
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition"
          >
            Refresh
          </button>
          <Link
            to="/applications"
            className="px-4 py-2 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
          >
            View your applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 gap-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentJob.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: lastAction === "left" ? -80 : lastAction === "right" ? 80 : 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-200 p-6"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{currentJob.title}</h2>
              <p className="text-gray-500 text-sm">{currentJob.company}</p>
            </div>
            <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full">
              {currentJob.match_score}% match
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-4">{currentJob.description}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {currentJob.skills_required.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
            <span>{currentJob.location || "Location N/A"}</span>
            <span className="capitalize">{currentJob.job_type.replace("_", " ")}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-4">
        <button
          onClick={() => handleSwipe("left")}
          className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition text-gray-500 text-xl"
          title="Skip"
        >
          ✕
        </button>
        <button
          onClick={() => handleSwipe("save")}
          className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition text-yellow-500 text-xl"
          title="Save"
        >
          ★
        </button>
        <button
          onClick={() => handleSwipe("right")}
          className="w-14 h-14 rounded-full bg-brand-600 text-white shadow-sm hover:bg-brand-700 transition text-xl"
          title="Apply"
        >
          ✓
        </button>
      </div>
      <p className="text-xs text-gray-400">
        {jobs.length - index - 1} more job{jobs.length - index - 1 !== 1 ? "s" : ""} in your deck
      </p>
    </div>
  );
}