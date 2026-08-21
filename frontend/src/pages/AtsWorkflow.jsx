import { useEffect, useState } from 'react';
import { getRecommendedJobs } from '../api/jobs';
import { runAtsWorkflow } from '../api/ats';
import ATSWorkflowVisualizer from '../components/ats/ATSWorkflowVisualizer';
import { useToast } from '../context/ToastContext';

export default function AtsWorkflow() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    getRecommendedJobs()
      .then((data) => {
        setJobs(data);
        if (data.length > 0) {
          setSelectedJob(data[0]);
          triggerWorkflow(data[0].id);
        }
      })
      .catch(() => {
        setError('Could not fetch jobs. Is the backend running?');
        toast.error('Could not fetch jobs. Is the backend running?');
      })
      .finally(() => setLoading(false));
  }, []);

  async function triggerWorkflow(jobId) {
    setIsRunning(true);
    setError('');
    try {
      const data = await runAtsWorkflow(jobId);
      setReport(data);
      toast.success(`ATS pipeline complete — Score: ${Math.round(data.ats_score)}%`);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to run ATS Workflow.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsRunning(false);
    }
  }

  function handleJobChange(e) {
    const jobId = Number(e.target.value);
    const found = jobs.find((j) => j.id === jobId);
    if (found) {
      setSelectedJob(found);
      triggerWorkflow(found.id);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-textHi mb-1">ATS Workflow Engine</h1>
        <p className="text-textLo text-sm">
          Simulate and analyze your resume against job specifications using the 9-step ATS evaluation pipeline.
        </p>
      </div>

      {/* Role Selection Toolbar */}
      {!loading && jobs.length > 0 && (
        <div className="bg-surface border border-white/10 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-mono uppercase tracking-wide text-textLo whitespace-nowrap">Select Target Role:</span>
            <select
              value={selectedJob?.id || ''}
              onChange={handleJobChange}
              className="bg-surfaceHi border border-white/10 rounded-lg px-3.5 py-2 text-sm text-textHi focus:border-gold outline-none flex-1 md:w-80"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.company}
                </option>
              ))}
            </select>
          </div>

          {selectedJob && (
            <div className="flex items-center gap-2 text-xs font-mono text-textLo">
              <span>Skills required:</span>
              <span className="text-gold">{selectedJob.required_skills?.join(', ') || 'General'}</span>
            </div>
          )}
        </div>
      )}

      {loading && <p className="text-textLo text-center py-20">Loading roles and running ATS pipeline…</p>}
      {error && <p className="text-coral text-center py-20">{error}</p>}

      {!loading && selectedJob && (
        <ATSWorkflowVisualizer
          report={report}
          isRunning={isRunning}
          onReRun={() => triggerWorkflow(selectedJob.id)}
        />
      )}
    </div>
  );
}
