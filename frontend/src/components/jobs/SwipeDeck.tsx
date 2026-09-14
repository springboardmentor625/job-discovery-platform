import { useState, useEffect } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import {
  Briefcase, MapPin, DollarSign, Clock, Building,
  Check, X, Bookmark, Loader2, RefreshCw, Zap
} from 'lucide-react';
import { jobsApi, type JobRecommendation } from '../../api/jobs.api';
import { MatchExplanationModal } from './MatchExplanationModal';

// ─── Toast notification (non-intrusive) ──────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-slate-700',
  };
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${colors[type]} transition-all`}>
      {message}
    </div>
  );
}

// ─── Main SwipeDeck ───────────────────────────────────────────────────────────
export const SwipeDeck = () => {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [explainingJobId, setExplainingJobId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchJobs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await jobsApi.getRecommendations();
      setRecommendations(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load job recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const removeTop = () => setRecommendations(prev => prev.slice(1));

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) performSwipe('right');
    else if (info.offset.x < -100) performSwipe('left');
  };

  const performSwipe = async (direction: 'left' | 'right') => {
    if (recommendations.length === 0) return;
    const { job } = recommendations[0];
    setSwipeDirection(direction);

    try {
      if (direction === 'right') {
        await jobsApi.swipeRight(job.job_id);
        // Also save the job so it appears in the Saved Jobs tab
        try {
          await jobsApi.saveJob(job.job_id);
        } catch (e) {
          // Ignore if already saved
        }
        showToast('Interested! 👍', 'success');
      } else {
        await jobsApi.swipeLeft(job.job_id);
        showToast('Skipped', 'info');
      }
    } catch {
      showToast('Could not record swipe — please try again.', 'error');
    }

    setTimeout(() => {
      removeTop();
      setSwipeDirection(null);
    }, 300);
  };

  const handleSave = async () => {
    if (recommendations.length === 0) return;
    const { job } = recommendations[0];
    try {
      await jobsApi.saveJob(job.job_id);
      showToast('Job saved! 🔖', 'success');
      performSwipe('right'); // advance the deck
    } catch {
      showToast('Could not save job — please try again.', 'error');
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Finding your best matches…</p>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-slate-600 text-sm">{error}</p>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  // ─── Empty deck ───────────────────────────────────────────────────────────
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4 gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <Briefcase className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">You're all caught up!</h2>
        <p className="text-slate-500 max-w-sm text-sm">
          No more new jobs right now. Check back later or update your profile to unlock more matches.
        </p>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
    );
  }

  // ─── Deck ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-6 relative">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Counter */}
      <p className="text-sm text-slate-400 font-medium mb-4">
        {recommendations.length} job{recommendations.length !== 1 ? 's' : ''} remaining
      </p>

      {/* Card Stack */}
      <div className="relative w-full max-w-md h-[560px]">
        {recommendations
          .slice(0, 3) // Only render top 3 for performance
          .map((rec, index) => (
            <JobCard
              key={rec.job.job_id}
              rec={rec}
              isTop={index === 0}
              stackIndex={index}
              swipeDirection={swipeDirection}
              onDragEnd={handleDragEnd}
              onExplain={() => setExplainingJobId(rec.job.job_id)}
            />
          ))}
      </div>

      <MatchExplanationModal 
        jobId={explainingJobId || ''} 
        isOpen={!!explainingJobId} 
        onClose={() => setExplainingJobId(null)} 
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-5 mt-8">
        <ActionButton
          onClick={() => performSwipe('left')}
          label="Skip"
          icon={<X className="w-7 h-7" />}
          color="text-rose-500 hover:bg-rose-50 border-rose-100"
          size="lg"
        />
        <ActionButton
          onClick={handleSave}
          label="Save"
          icon={<Bookmark className="w-5 h-5" />}
          color="text-amber-600 hover:bg-amber-50 border-amber-100"
          size="sm"
        />
        <ActionButton
          onClick={() => performSwipe('right')}
          label="Interested"
          icon={<Check className="w-7 h-7" />}
          color="text-green-500 hover:bg-green-50 border-green-100"
          size="lg"
        />
      </div>

      {/* Keyboard hint */}
      <p className="mt-4 text-xs text-slate-300">Drag cards left or right to swipe</p>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionButton({
  onClick, label, icon, color, size,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  color: string;
  size: 'sm' | 'lg';
}) {
  const dim = size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`${dim} rounded-full bg-white border shadow-md flex items-center justify-center transition-colors ${color}`}
        aria-label={label}
      >
        {icon}
      </button>
      <span className="text-xs text-slate-400 font-medium">{label}</span>
    </div>
  );
}

function JobCard({
  rec, isTop, stackIndex, swipeDirection, onDragEnd, onExplain,
}: {
  rec: JobRecommendation;
  isTop: boolean;
  stackIndex: number;
  swipeDirection: 'left' | 'right' | null;
  onDragEnd: (e: any, info: PanInfo) => void;
  onExplain: () => void;
}) {
  const { job, match_percentage, matched_skills, missing_skills, recommendation_score, reasons } = rec;

  const scoreColor =
    match_percentage >= 80 ? 'bg-green-100 text-green-700' :
    match_percentage >= 60 ? 'bg-amber-100 text-amber-700' :
    'bg-slate-100 text-slate-600';

  return (
    <motion.div
      className={`absolute inset-0 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        zIndex: 10 - stackIndex,
        top: stackIndex * 8,
        scale: 1 - stackIndex * 0.04,
        transformOrigin: 'bottom center',
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={isTop ? onDragEnd : undefined}
      animate={
        isTop && swipeDirection
          ? { x: swipeDirection === 'right' ? 600 : -600, opacity: 0, rotate: swipeDirection === 'right' ? 20 : -20 }
          : { x: 0, opacity: 1, rotate: 0 }
      }
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileDrag={{ scale: 1.03 }}
    >
      {/* Swipe feedback overlays */}
      {isTop && (
        <>
          <motion.div
            className="absolute inset-0 bg-green-400/20 flex items-center justify-center z-20 rounded-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: swipeDirection === 'right' ? 1 : 0 }}
          >
            <div className="border-4 border-green-500 text-green-600 font-black text-4xl px-4 py-2 rounded-2xl rotate-[-15deg]">
              LIKE
            </div>
          </motion.div>
          <motion.div
            className="absolute inset-0 bg-red-400/20 flex items-center justify-center z-20 rounded-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: swipeDirection === 'left' ? 1 : 0 }}
          >
            <div className="border-4 border-red-500 text-red-600 font-black text-4xl px-4 py-2 rounded-2xl rotate-[15deg]">
              SKIP
            </div>
          </motion.div>
        </>
      )}

      {/* Card Header */}
      <div className="p-5 border-b border-slate-100 flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
          {job.company_logo
            ? <img src={job.company_logo} alt={job.company_name || ''} className="w-full h-full object-cover rounded-xl" />
            : <Building className="w-7 h-7 text-slate-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">{job.job_title}</h2>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreColor}`}>
                {match_percentage}% match
              </span>
              {recommendation_score > 80 && (
                <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5">
                  <Zap className="w-3 h-3 fill-indigo-600" /> Highly Recommended
                </span>
              )}
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-0.5 flex items-center gap-1">
            <Building className="w-3.5 h-3.5" />
            {job.company_name || 'Company'}
          </p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 overflow-y-auto" style={{ maxHeight: '380px' }}>
        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {job.location && (
            <Chip icon={<MapPin className="w-3.5 h-3.5" />} text={job.location} />
          )}
          {job.job_type && (
            <Chip icon={<Briefcase className="w-3.5 h-3.5" />} text={job.job_type} />
          )}
          {(job.salary_min || job.salary_max) && (
            <Chip
              icon={<DollarSign className="w-3.5 h-3.5" />}
              text={job.salary_min && job.salary_max
                ? `$${Math.round(job.salary_min / 1000)}k – $${Math.round(job.salary_max / 1000)}k`
                : `$${Math.round((job.salary_min || job.salary_max || 0) / 1000)}k+`}
            />
          )}
          {job.experience_required !== undefined && job.experience_required !== null && (
            <Chip icon={<Clock className="w-3.5 h-3.5" />} text={`${job.experience_required}+ yrs`} />
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-4">
          {job.job_description}
        </p>

        {/* Skills */}
        {matched_skills.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">✅ Your matching skills</p>
            <div className="flex flex-wrap gap-1.5">
              {matched_skills.slice(0, 5).map(s => (
                <span key={s} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Why this match Button */}
        {isTop && (
          <div className="mt-6 border-t border-slate-100 pt-4 pb-2 text-center">
            <button 
              onClick={onExplain}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <Zap className="w-4 h-4 fill-indigo-500" />
              Why this match?
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Chip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg border border-slate-200">
      {icon}{text}
    </span>
  );
}
