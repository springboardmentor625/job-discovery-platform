import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Lightbulb, Loader2, Target, BarChart2 } from 'lucide-react';
import { jobsApi, type MatchExplanationResponse, type SkillGapResponse } from '../../api/jobs.api';

interface Props {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MatchExplanationModal = ({ jobId, isOpen, onClose }: Props) => {
  const [matchData, setMatchData] = useState<MatchExplanationResponse | null>(null);
  const [skillGap, setSkillGap] = useState<SkillGapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && jobId) {
      setIsLoading(true);
      Promise.all([
        jobsApi.getMatchExplanation(jobId),
        jobsApi.getSkillGap(jobId)
      ])
      .then(([match, gap]) => {
        setMatchData(match);
        setSkillGap(gap);
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load AI Insights'))
      .finally(() => setIsLoading(false));
    }
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">AI Match Insights</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-4">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Analyzing your compatibility...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-8">{error}</div>
            ) : matchData && skillGap && (
              <div className="space-y-8">
                
                {/* Overall Score */}
                <div className="flex flex-col md:flex-row gap-6 items-center bg-indigo-50/50 p-6 rounded-2xl border border-indigo-50">
                  <div className="w-24 h-24 rounded-full bg-white shadow-sm border-4 border-indigo-500 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-black text-indigo-700">{matchData.overall_match_score}%</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-500" />
                      Overall Compatibility
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{matchData.explanation}</p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-slate-400" /> Match Breakdown
                  </h3>
                  <div className="space-y-4">
                    <ProgressBar label="Skills Match" value={matchData.breakdown.skills_match} />
                    <ProgressBar label="Experience Match" value={matchData.breakdown.experience_match} />
                    <ProgressBar label="Location Match" value={matchData.breakdown.location_match} />
                    <ProgressBar label="Preferences Match" value={matchData.breakdown.preference_match} />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Skill Gap Analyzer */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-slate-400" /> Skill Gap Analyzer
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Matching */}
                    <div className="bg-green-50/50 rounded-2xl p-5 border border-green-100">
                      <h4 className="text-sm font-bold text-green-800 mb-3 uppercase tracking-wider">Your Matching Skills</h4>
                      {skillGap.matched_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {skillGap.matched_skills.map(skill => (
                            <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-green-700 text-xs font-bold rounded-lg border border-green-200 shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-green-600/70 italic">No matching skills found.</p>
                      )}
                    </div>

                    {/* Missing */}
                    <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100">
                      <h4 className="text-sm font-bold text-amber-800 mb-3 uppercase tracking-wider">Skills to Improve</h4>
                      {skillGap.missing_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {skillGap.missing_skills.map((item, idx) => (
                            <span 
                              key={idx} 
                              className={`inline-flex items-center gap-1 px-2.5 py-1 bg-white text-xs font-bold rounded-lg border shadow-sm ${
                                item.priority === 'high' ? 'text-rose-600 border-rose-200' : 'text-amber-700 border-amber-200'
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> 
                              {item.skill} 
                              {item.priority === 'high' && <span className="ml-1 opacity-60 text-[10px]">(High Priority)</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-amber-600/70 italic">You meet all required skills!</p>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 mt-4 italic">
                    💡 <strong>Recommendation:</strong> {skillGap.recommendation}
                  </p>
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function ProgressBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900">{value}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`} 
        />
      </div>
    </div>
  );
}
