import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import { jobsApi, type Job } from '../../api/jobs.api';

export const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const data = await jobsApi.getMyJobs();
      setJobs(data);
    } catch (err: any) {
      setError('Failed to load jobs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;
    
    setDeleting(jobId);
    try {
      await jobsApi.deleteJob(jobId);
      setJobs(prev => prev.filter(j => j.job_id !== jobId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete job.');
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
          <p className="text-slate-500 mt-1">Manage your active and past job postings.</p>
        </div>
        <Link
          to="/recruiter/post-job"
          className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <PlusCircle className="w-5 h-5" /> Post New Job
        </Link>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-6">{error}</div>}

      {jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No jobs posted yet</h2>
          <p className="text-slate-500 max-w-md mb-6">
            You haven't created any job listings. Post your first job to start receiving applications from top talent.
          </p>
          <Link
            to="/recruiter/post-job"
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" /> Post a Job
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.job_id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-xl font-bold text-slate-900 truncate">{job.job_title}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${job.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location || 'Remote'}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.job_type}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
                    {job.applicant_count || 0}
                  </p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Applicants</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
                    {job.views_count || 0}
                  </p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Views</p>
                </div>
              </div>
              <div className="flex items-start shrink-0 ml-2">
                 <button
                    onClick={() => handleDelete(job.job_id)}
                    disabled={deleting === job.job_id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                    title="Delete Job"
                  >
                    {deleting === job.job_id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
