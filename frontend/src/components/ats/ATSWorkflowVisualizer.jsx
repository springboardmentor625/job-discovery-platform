import { useState, useEffect } from 'react';

export default function ATSWorkflowVisualizer({ report, isRunning = false, onReRun }) {
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [selectedStep, setSelectedStep] = useState(null);

  const steps = report?.workflow_steps || [
    { id: 'apply_for_job', title: 'Apply for Job' },
    { id: 'retrieve_resume', title: 'Retrieve Resume' },
    { id: 'retrieve_job_description', title: 'Retrieve Job Description' },
    { id: 'extract_skills_keywords', title: 'Extract Skills & Keywords' },
    { id: 'compare_resume_job', title: 'Compare Resume with Job Description' },
    { id: 'calculate_ats_score', title: 'Calculate ATS Score' },
    { id: 'identify_missing_skills', title: 'Identify Missing Skills' },
    { id: 'generate_suggestions', title: 'Generate Improvement Suggestions' },
    { id: 'store_ats_report', title: 'Store ATS Report' },
    { id: 'end', title: 'End' }
  ];

  // Animate step progression when running or when report changes
  useEffect(() => {
    if (isRunning) {
      setActiveStepIndex(0);
      const interval = setInterval(() => {
        setActiveStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            return steps.length - 1;
          }
          return prev + 1;
        });
      }, 350);
      return () => clearInterval(interval);
    } else {
      setActiveStepIndex(steps.length - 1);
    }
  }, [isRunning, report]);

  const score = report ? Math.round(report.ats_score) : 0;
  const scoreColor = score >= 80 ? 'text-teal border-teal/40 bg-teal/10' : score >= 60 ? 'text-gold border-gold/40 bg-gold/10' : 'text-coral border-coral/40 bg-coral/10';

  const getStepStatus = (index) => {
    if (isRunning) {
      if (index < activeStepIndex) return 'completed';
      if (index === activeStepIndex) return 'running';
      return 'pending';
    }
    return 'completed';
  };

  return (
    <div className="space-y-8">
      {/* Header & ATS Score Overview */}
      {report && (
        <div className="bg-surface border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center font-mono ${scoreColor}`}>
              <span className="text-2xl font-bold">{score}%</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">ATS Score</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-textLo font-mono mb-1">Target Position</div>
              <h3 className="font-display text-xl font-semibold text-textHi">{report.job_title}</h3>
              <p className="text-sm text-textLo">{report.company} • Candidate: <span className="text-textHi font-medium">{report.seeker_name}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onReRun && (
              <button
                onClick={onReRun}
                disabled={isRunning}
                className="px-4 py-2.5 rounded-xl bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRunning ? 'Running Pipeline…' : 'Re-Run ATS Workflow'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Flowchart & Inspector Grid */}
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 items-start">
        {/* Flowchart Visualizer Container */}
        <div className="bg-surface border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center relative overflow-hidden shadow-2xl">
          <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <span className="font-display font-semibold text-lg text-textHi flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
              ATS WORKFLOW PIPELINE
            </span>
            <span className="text-xs font-mono text-textLo">9-Node Automated Flow</span>
          </div>

          {/* Node 1: Apply for Job (Start Oval) */}
          <NodeOval
            title="Apply for Job"
            status={getStepStatus(0)}
            isSelected={selectedStep?.id === 'apply_for_job'}
            onClick={() => setSelectedStep(steps[0])}
          />

          {/* Dual Split Connector */}
          <div className="relative w-48 h-10 my-1">
            <svg className="w-full h-full text-white/20 overflow-visible" viewBox="0 0 200 40">
              <path d="M 100 0 L 100 15 L 40 15 L 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 100 0 L 100 15 L 160 15 L 160 40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <polygon points="36,36 40,42 44,36" fill="currentColor" />
              <polygon points="156,36 160,42 164,36" fill="currentColor" />
            </svg>
          </div>

          {/* Node 2 & 3: Retrieve Resume & Retrieve Job Description (Parallel Boxes) */}
          <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-lg mb-2">
            <NodeBox
              title="Retrieve Resume"
              status={getStepStatus(1)}
              isSelected={selectedStep?.id === 'retrieve_resume'}
              onClick={() => setSelectedStep(steps[1])}
            />
            <NodeBox
              title="Retrieve Job Description"
              status={getStepStatus(2)}
              isSelected={selectedStep?.id === 'retrieve_job_description'}
              onClick={() => setSelectedStep(steps[2])}
            />
          </div>

          {/* Convergence Connector */}
          <div className="relative w-48 h-10 my-1">
            <svg className="w-full h-full text-white/20 overflow-visible" viewBox="0 0 200 40">
              <path d="M 40 0 L 40 20 L 100 20 L 100 40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 160 0 L 160 20 L 100 20 L 100 40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <polygon points="96,36 100,42 104,36" fill="currentColor" />
            </svg>
          </div>

          {/* Sequential Nodes 4 to 8 */}
          <div className="flex flex-col items-center w-full max-w-md space-y-2">
            <NodeBox
              title="Extract Skills & Keywords"
              status={getStepStatus(3)}
              isSelected={selectedStep?.id === 'extract_skills_keywords'}
              onClick={() => setSelectedStep(steps[3])}
            />
            <ArrowDown />

            <NodeBox
              title="Compare Resume with Job Description"
              status={getStepStatus(4)}
              isSelected={selectedStep?.id === 'compare_resume_job'}
              onClick={() => setSelectedStep(steps[4])}
            />
            <ArrowDown />

            <NodeBox
              title="Calculate ATS Score"
              status={getStepStatus(5)}
              isSelected={selectedStep?.id === 'calculate_ats_score'}
              onClick={() => setSelectedStep(steps[5])}
            />
            <ArrowDown />

            <NodeBox
              title="Identify Missing Skills"
              status={getStepStatus(6)}
              isSelected={selectedStep?.id === 'identify_missing_skills'}
              onClick={() => setSelectedStep(steps[6])}
            />
            <ArrowDown />

            <NodeBox
              title="Generate Improvement Suggestions"
              status={getStepStatus(7)}
              isSelected={selectedStep?.id === 'generate_suggestions'}
              onClick={() => setSelectedStep(steps[7])}
            />
            <ArrowDown />

            <NodeBox
              title="Store ATS Report"
              status={getStepStatus(8)}
              isSelected={selectedStep?.id === 'store_ats_report'}
              onClick={() => setSelectedStep(steps[8])}
            />
            <ArrowDown />

            {/* Node 9: End (Bottom Oval) */}
            <NodeOval
              title="End"
              status={getStepStatus(9)}
              isSelected={selectedStep?.id === 'end'}
              onClick={() => setSelectedStep(steps[9])}
            />
          </div>
        </div>

        {/* Step Inspector & Report Analytics Panel */}
        <div className="space-y-6">
          {/* Step Details Drawer */}
          <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
            <h4 className="text-xs uppercase font-mono tracking-wider text-textLo mb-3">
              {selectedStep ? `Step Inspection: ${selectedStep.title}` : 'Step Inspector'}
            </h4>

            {selectedStep ? (
              <div className="space-y-4 text-sm animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-medium text-gold font-mono">{selectedStep.title}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal/15 text-teal uppercase">
                    {selectedStep.status || 'COMPLETED'}
                  </span>
                </div>
                <p className="text-textLo text-sm">{selectedStep.description}</p>

                {selectedStep.details && (
                  <div className="bg-surfaceHi rounded-xl p-4 border border-white/5 font-mono text-xs text-textHi space-y-2 overflow-x-auto">
                    <div className="text-textLo uppercase tracking-wider font-semibold text-[10px]">Execution Data Output:</div>
                    <pre className="text-gold/90 whitespace-pre-wrap">
                      {JSON.stringify(selectedStep.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-textLo/60 text-sm">
                <p>Click any node in the flowchart to inspect its execution output and step details.</p>
              </div>
            )}
          </div>

          {/* ATS Insights & Skill Breakdown */}
          {report && (
            <div className="bg-surface border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
              <h4 className="font-display font-semibold text-lg text-textHi border-b border-white/10 pb-3">
                ATS Matching Analysis
              </h4>

              {/* Matched Skills */}
              <div>
                <span className="text-xs font-mono text-teal uppercase tracking-wider block mb-2 font-medium">
                  ✓ Matched Skills ({report.matched_skills.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {report.matched_skills.length > 0 ? (
                    report.matched_skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 rounded-lg bg-teal/15 text-teal border border-teal/30 text-xs font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-textLo italic">No direct skill matches found</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div>
                <span className="text-xs font-mono text-coral uppercase tracking-wider block mb-2 font-medium">
                  ✗ Missing Required Skills ({report.missing_skills.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {report.missing_skills.length > 0 ? (
                    report.missing_skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 rounded-lg bg-coral/15 text-coral border border-coral/30 text-xs font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-teal font-medium">All required skills present!</span>
                  )}
                </div>
              </div>

              {/* Actionable Improvement Suggestions */}
              <div>
                <span className="text-xs font-mono text-gold uppercase tracking-wider block mb-2 font-medium">
                  💡 Tailored ATS Suggestions
                </span>
                <ul className="space-y-2 text-xs text-textLo">
                  {report.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-surfaceHi p-2.5 rounded-lg border border-white/5 text-textHi">
                      <span className="text-gold font-bold">{idx + 1}.</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Flowchart Node Components
function NodeOval({ title, status, isSelected, onClick }) {
  const isCompleted = status === 'completed';
  const isRunning = status === 'running';

  return (
    <button
      onClick={onClick}
      className={`w-44 py-3 px-4 rounded-full border-2 text-xs font-body font-semibold transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center text-center ${
        isSelected
          ? 'ring-4 ring-gold/40 border-gold bg-gold/20 text-gold'
          : isCompleted
          ? 'border-teal/50 bg-teal/10 text-teal hover:border-teal'
          : isRunning
          ? 'border-gold bg-gold/20 text-gold animate-pulse'
          : 'border-white/20 bg-surfaceHi text-textLo hover:border-white/40'
      }`}
    >
      <span>{title}</span>
    </button>
  );
}

function NodeBox({ title, status, isSelected, onClick }) {
  const isCompleted = status === 'completed';
  const isRunning = status === 'running';

  return (
    <button
      onClick={onClick}
      className={`w-full py-3.5 px-4 rounded-xl border-2 text-xs font-body font-semibold transition-all duration-300 transform hover:scale-102 shadow-md flex items-center justify-center text-center ${
        isSelected
          ? 'ring-4 ring-gold/40 border-gold bg-gold/20 text-gold shadow-gold/20'
          : isCompleted
          ? 'border-white/30 bg-surfaceHi text-textHi hover:border-gold/60'
          : isRunning
          ? 'border-gold bg-gold/20 text-gold animate-pulse'
          : 'border-white/10 bg-surface text-textLo opacity-60'
      }`}
    >
      <span>{title}</span>
    </button>
  );
}

function ArrowDown() {
  return (
    <div className="h-6 flex items-center justify-center text-white/20 my-0.5">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  );
}
