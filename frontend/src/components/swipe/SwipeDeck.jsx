import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import JobCard from './JobCard';
import Button from '../ui/Button';
import { runAtsWorkflow } from '../../api/ats';
import ATSWorkflowVisualizer from '../ats/ATSWorkflowVisualizer';

const DECISION_META = {
  left: { color: 'coral', label: 'Passed' },
  right: { color: 'teal', label: 'Applied' },
  save: { color: 'gold', label: 'Saved' },
};

export default function SwipeDeck({ jobs, onDecision, emptyState }) {
  const [index, setIndex] = useState(0);
  const [flash, setFlash] = useState(null); // 'left' | 'right' | 'save' | null
  const [atsReport, setAtsReport] = useState(null);
  const [loadingAts, setLoadingAts] = useState(false);
  const controls = useAnimation();

  const visibleStack = jobs.slice(index, index + 3);
  const currentJob = jobs[index];

  async function commitDecision(decision) {
    if (index >= jobs.length) return;
    const job = jobs[index];

    setFlash(decision);
    const exitX = decision === 'left' ? -520 : decision === 'right' ? 520 : 0;
    const exitY = decision === 'save' ? -520 : 40;

    await controls.start({
      x: exitX,
      y: exitY,
      rotate: decision === 'left' ? -20 : decision === 'right' ? 20 : 0,
      opacity: 0,
      transition: { duration: 0.32, ease: [0.2, 0.9, 0.3, 1] },
    });

    onDecision?.(job, decision);
    setIndex((i) => i + 1);
    controls.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
    setTimeout(() => setFlash(null), 250);
  }

  function handleDragEnd(_, info) {
    const threshold = 120;
    if (info.offset.x > threshold) commitDecision('right');
    else if (info.offset.x < -threshold) commitDecision('left');
    else if (info.offset.y < -threshold) commitDecision('save');
    else controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 22 } });
  }

  async function handleCheckATS() {
    if (!currentJob) return;
    setLoadingAts(true);
    try {
      const data = await runAtsWorkflow(currentJob.id);
      setAtsReport(data);
    } catch {
      alert('Could not run ATS Workflow.');
    } finally {
      setLoadingAts(false);
    }
  }

  if (index >= jobs.length) {
    return (
      emptyState || (
        <div className="text-center text-textLo py-20">
          <p className="font-display text-xl text-textHi mb-2">You're all caught up</p>
          <p className="text-sm">No more jobs match your filters yet — check back soon or widen your preferences in Profile.</p>
        </div>
      )
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-sm h-[440px]">
        {flash && (
          <div
            className={`absolute inset-0 rounded-xl z-20 pointer-events-none flex items-center justify-center animate-stampIn`}
          >
            <span
              className={`font-display font-bold text-4xl uppercase tracking-wide px-6 py-2 rounded-lg border-4 -rotate-6 ${
                flash === 'left'
                  ? 'border-coral text-coral'
                  : flash === 'right'
                  ? 'border-teal text-teal'
                  : 'border-gold text-gold'
              } bg-ink/70 backdrop-blur-sm`}
            >
              {DECISION_META[flash].label}
            </span>
          </div>
        )}

        {visibleStack
          .map((job, i) => ({ job, i }))
          .reverse()
          .map(({ job, i }) => {
            const isTop = i === 0;
            return (
              <motion.div
                key={job.id}
                className="absolute inset-0"
                style={{ zIndex: 10 - i }}
                initial={false}
                animate={
                  isTop
                    ? controls
                    : { scale: 1 - i * 0.04, y: i * 10, opacity: 1 - i * 0.15, rotate: 0 }
                }
                drag={isTop}
                dragElastic={0.6}
                onDragEnd={isTop ? handleDragEnd : undefined}
                whileDrag={{ cursor: 'grabbing' }}
              >
                <JobCard job={job} />
              </motion.div>
            );
          })}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="coral" onClick={() => commitDecision('left')} aria-label="Pass on this job">
          ✕ Pass
        </Button>
        <button
          onClick={handleCheckATS}
          disabled={loadingAts}
          className="px-3.5 py-2.5 rounded-lg bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 font-mono text-xs transition-colors flex items-center gap-1.5"
          title="Run 9-Step ATS Workflow Analysis"
        >
          <span>⚡</span>
          <span>{loadingAts ? 'Analyzing…' : 'ATS Check'}</span>
        </button>
        <Button variant="ghost" onClick={() => commitDecision('save')} aria-label="Save this job for later">
          ★ Save
        </Button>
        <Button variant="teal" onClick={() => commitDecision('right')} aria-label="Apply to this job">
          ✓ Apply
        </Button>
      </div>

      <p className="text-xs text-textLo font-mono">
        {jobs.length - index} of {jobs.length} remaining — drag the card, or use the buttons above
      </p>

      {/* ATS Workflow Preview Modal */}
      {atsReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg border border-white/15 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display text-xl font-semibold text-textHi flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                ATS Workflow Match Analysis
              </h2>
              <button
                onClick={() => setAtsReport(null)}
                className="text-textLo hover:text-textHi text-sm font-mono px-2.5 py-1 rounded bg-surfaceHi"
              >
                ✕ Close
              </button>
            </div>

            <ATSWorkflowVisualizer
              report={atsReport}
              onReRun={handleCheckATS}
            />
          </div>
        </div>
      )}
    </div>
  );
}
