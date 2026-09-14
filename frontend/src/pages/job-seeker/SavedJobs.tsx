import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, MapPin, DollarSign, Trash2, Briefcase, Loader2, RefreshCw, Send } from 'lucide-react';
import { jobsApi, type SavedJobRecord } from '../../api/jobs.api';
import { applicationsApi } from '../../api/applications.api';

export const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState<SavedJobRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  const fetchSavedJobs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await jobsApi.getSavedJobs();
      setSavedJobs(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load saved jobs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSavedJobs(); }, []);

  const handleRemove = async (jobId: string) => {
    setRemoving(jobId);
    try {
      await jobsApi.removeSavedJob(jobId);
      setSavedJobs(prev => prev.filter(sj => sj.job_id !== jobId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Could not remove saved job. Please try again.');
    } finally {
      setRemoving(null);
    }
  };

  const handleApply = async (jobId: string) => {
    setApplying(jobId);
    try {
      await applicationsApi.applyToJob(jobId);
      alert('Application submitted successfully!');
      // Optionally remove from saved jobs after applying, or just let them stay.
      // Let's remove them from saved jobs as they are now applied.
      await jobsApi.removeSavedJob(jobId);
      setSavedJobs(prev => prev.filter(sj => sj.job_id !== jobId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to apply. You might have already applied.');
    } finally {
      setApplying(null);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm">Loading saved jobs…</p>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={fetchSavedJobs} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // ─── Empty ────────────────────────────────────────────────────────────────
  if (savedJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No saved jobs yet</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          Tap the bookmark icon while swiping to save interesting jobs for later.
        </p>
        <Link to="/discover" className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors">
          Start Discovering
        </Link>
      </div>
    );
  }

  // ─── List ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Saved Jobs</h1>
        <p className="text-slate-500 text-sm mt-1">{savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved</p>
      </div>

      <div className="grid gap-4">
        {savedJobs.map(({ job, job_id, saved_at }) => (
          <div
            key={job_id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Company Logo */}
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                {job?.company_logo
                  ? <img src={job.company_logo} alt={job.company_name || ''} className="w-full h-full object-cover rounded-xl" />
                  : <Building className="w-6 h-6 text-slate-400" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-base truncate">{job?.job_title || 'Unknown Position'}</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{job?.company_name || 'Company'}</p>

                <div className="flex flex-wrap gap-3 mt-2.5">
                  {job?.location && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />{job.location}
                    </span>
                  )}
                  {job?.job_type && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Briefcase className="w-3.5 h-3.5" />{job.job_type}
                    </span>
                  )}
                  {(job?.salary_min || job?.salary_max) && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <DollarSign className="w-3.5 h-3.5" />
                      {job.salary_min && job.salary_max
                        ? `$${Math.round(job.salary_min / 1000)}k – $${Math.round(job.salary_max / 1000)}k`
                        : `$${Math.round(((job.salary_min || job.salary_max || 0)) / 1000)}k+`}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  Saved {new Date(saved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApply(job_id)}
                    disabled={applying === job_id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {applying === job_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Apply Now
                  </button>
                  <button
                    onClick={() => handleRemove(job_id)}
                    disabled={removing === job_id}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Remove saved job"
                    title="Remove from saved"
                  >
                    {removing === job_id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* Required Skills */}
            {job?.required_skills && job.required_skills.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                {job.required_skills.slice(0, 6).map(skill => (
                  <span key={skill} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                    {skill}
                  </span>
                ))}
                {job.required_skills.length > 6 && (
                  <span className="px-2.5 py-1 text-slate-400 text-xs">+{job.required_skills.length - 6} more</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
