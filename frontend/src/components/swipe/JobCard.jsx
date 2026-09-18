import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Briefcase, MapPin, X, Check, Sparkles } from 'lucide-react';

const SWIPE_OFFSET = 140;
const SWIPE_VELOCITY = 650;
const FLY_DISTANCE = 1100;

function jobLocation(job) {
    if (job.location) return job.location;
    const match = job.description && job.description.match(/Location:\s*(.+)$/m);
    return match ? match[1] : 'Remote';
}

export default function JobCard({ job, onSwipe, isTop = false, stackIndex = 0 }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-280, 280], [-12, 12]);
    const likeOpacity = useTransform(x, [60, 180], [0, 1]);
    const nopeOpacity = useTransform(x, [-180, -60], [1, 0]);
    const locked = useRef(false);
    const [isFlying, setIsFlying] = useState(false);

    const flyOut = (direction) => {
        if (locked.current || !isTop) return;
        locked.current = true;
        setIsFlying(true);
        const target = direction === 'right' ? FLY_DISTANCE : -FLY_DISTANCE;
        requestAnimationFrame(() => {
            animate(x, target, { type: 'tween', duration: 0.28, ease: 'easeOut' }).then(() => {
                onSwipe(direction, job.id);
            });
        });
    };

    const handleDragEnd = (_event, info) => {
        if (!isTop || locked.current) return;
        const wentRight = info.offset.x > SWIPE_OFFSET || info.velocity.x > SWIPE_VELOCITY;
        const wentLeft = info.offset.x < -SWIPE_OFFSET || info.velocity.x < -SWIPE_VELOCITY;
        if (wentRight) flyOut('right');
        else if (wentLeft) flyOut('left');
    };

    return (
        <motion.div
            className={`absolute inset-0 w-full h-full bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
            style={{
                x: isTop ? x : 0,
                rotate: isTop ? rotate : 0,
                zIndex: 30 - stackIndex,
                y: stackIndex * 14,
            }}
            drag={isTop && !isFlying ? 'x' : false}
            dragConstraints={isFlying ? false : { left: 0, right: 0 }}
            dragElastic={0.85}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.985 }}
            animate={{ scale: 1 - stackIndex * 0.02 }}
            exit={{ opacity: 0 }}
            whileDrag={isTop ? { cursor: 'grabbing' } : undefined}
        >
            {isTop && (
                <>
                    <motion.div
                        style={{ opacity: likeOpacity }}
                        className="pointer-events-none absolute top-12 left-10 z-10 rounded-2xl border-[6px] border-green-500 px-6 py-2 text-4xl font-extrabold tracking-widest text-green-500 rotate-[-11deg]"
                    >
                        APPLY
                    </motion.div>
                    <motion.div
                        style={{ opacity: nopeOpacity }}
                        className="pointer-events-none absolute top-12 right-10 z-10 rounded-2xl border-[6px] border-red-500 px-6 py-2 text-4xl font-extrabold tracking-widest text-red-500 rotate-[11deg]"
                    >
                        PASS
                    </motion.div>
                </>
            )}

            {/* THE FIX: Removed overflow-y-auto, added flex-col to force text to stay inside the box */}
            <div className="p-6 md:p-8 flex-1 flex flex-col min-h-0 pointer-events-none">
                
                {/* Header (Shrunk text-5xl to text-3xl) */}
                <div className="mb-4 shrink-0">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2">
                        {job.title}
                    </h2>
                    <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 shrink-0" /> {job.company_name}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3 shrink-0">
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs font-medium bg-gray-50 dark:bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {jobLocation(job)}
                    </div>
                    {job.match_score !== null && job.match_score !== undefined && (
                        <div className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                            job.match_score >= 75
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/60'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/60'
                        }`}>
                            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                            {Number(job.match_score).toFixed(2)}% AI Match
                        </div>
                    )}
                </div>

                {/* Body Section: Scrollable Description with custom scrollbar */}
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                    <div className="flex-1 min-h-0 overflow-y-auto pr-2 pointer-events-auto custom-scrollbar">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.1em] mb-2 sticky top-0 bg-white dark:bg-gray-800 py-0.5 z-10">About the Role</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {job.description}
                        </p>
                    </div>

                    {/* Mentions strictly the single top thing to candidate's resume on the jobslide */}
                    <div className="shrink-0 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.1em] mb-2 flex items-center">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500 mr-1.5" /> Top Match to Your Resume
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-yellow-300" />
                                {job.top_resume_match || (job.required_skills && job.required_skills[0]) || 'Aligned with Profile'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Buttons: Kept the large sizes Cursor added, ensuring they stay fixed at the bottom */}
            <div className="px-10 py-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-center items-center gap-12 shrink-0">
                <button
                    type="button"
                    onClick={() => flyOut('left')}
                    disabled={!isTop}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white dark:bg-gray-800 border-[3px] border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-105 transition-all flex items-center justify-center shadow-md disabled:opacity-50"
                >
                    <X className="w-8 h-8 md:w-10 md:h-10 stroke-[3]" />
                </button>

                <button
                    type="button"
                    onClick={() => flyOut('right')}
                    disabled={!isTop}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-105 hover:shadow-xl transition-all flex items-center justify-center shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                >
                    <Check className="w-10 h-10 md:w-12 md:h-12 stroke-[3]" />
                </button>
            </div>
        </motion.div>
    );
}