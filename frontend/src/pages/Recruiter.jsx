import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getRecommendedJobs, createJob, deleteJob, getRecruiterCandidates, updateApplicationStatus } from '../api/jobs';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

const initialForm = {
  title: '',
  company: '',
  company_type: 'Startup',
  location: 'Remote',
  job_type: 'Full-time',
  salary_max: '',
  required_skills: '',
  description: '',
};

const statusColors = {
  Applied: 'bg-textLo/15 text-textLo',
  Viewed: 'bg-gold/15 text-gold',
  Shortlisted: 'bg-teal/15 text-teal',
  Interview: 'bg-teal/25 text-teal',
  Rejected: 'bg-coral/15 text-coral',
  Offer: 'bg-teal/25 text-teal',
};

export default function Recruiter() {
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin';

  useEffect(() => {
    if (!isRecruiter) return;
    let isMounted = true;

    function loadRecruiterData() {
      Promise.all([getRecommendedJobs(), getRecruiterCandidates()])
        .then(([jobsData, candidatesData]) => {
          if (isMounted) {
            setJobs(jobsData || []);
            setCandidates(candidatesData || []);
          }
        })
        .catch(() => {
          if (isMounted) setError('Failed to load recruiter data from backend.');
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    loadRecruiterData();
    const timer = setInterval(loadRecruiterData, 8000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isRecruiter]);

  if (!isRecruiter) return <Navigate to="/discover" replace />;

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function publishJob(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    const skills = form.required_skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
    const salaryMax = Number(form.salary_max || 0);
    const salaryMin = Math.round(salaryMax * 0.7);

    try {
      const newJob = await createJob({
        title: form.title,
        company: form.company,
        company_type: form.company_type,
        location: form.location,
        job_type: form.job_type,
        salary_min: salaryMin,
        salary_max: salaryMax,
        skills,
        description: form.description,
      });
      setJobs((current) => [newJob, ...current]);
      setForm(initialForm);
      setMessage('Job published to the discovery feed.');
      toast.success(`Published role: ${newJob.title}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to publish job.');
      toast.error('Failed to publish role.');
    }
  }

  async function removeJob(jobId) {
    try {
      await deleteJob(jobId);
      setJobs((current) => current.filter((j) => j.id !== jobId));
      toast.info('Role deactivated.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove job.');
    }
  }

  async function handleCandidateStatus(applicationId, newStatus) {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      setCandidates((current) =>
        current.map((c) => (c.id === applicationId ? { ...c, status: newStatus } : c))
      );
      toast.success(`Updated candidate status to: ${newStatus}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update candidate status.');
      toast.error('Failed to update candidate status.');
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wide text-teal">Recruiter workspace</p>
        <h1 className="font-display text-3xl font-semibold mt-1">Build your hiring pipeline</h1>
        <p className="text-textLo text-sm mt-1">Publish roles, monitor applicants, and keep hiring moving.</p>
      </div>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <form onSubmit={publishJob} className="bg-surface border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold">Post a role</h2>
          {['title', 'company', 'location', 'salary_max', 'required_skills'].map((key) => (
            <input
              key={key}
              required={key !== 'salary_max'}
              type={key === 'salary_max' ? 'number' : 'text'}
              placeholder={key === 'required_skills' ? 'required skills (comma separated)' : key.replace('_', ' ')}
              value={form[key]}
              onChange={(event) => update(key, event.target.value)}
              className="w-full bg-surfaceHi border border-white/10 rounded-md px-3.5 py-2.5 text-sm text-textHi placeholder:text-textLo/60 focus:border-gold outline-none"
            />
          ))}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.company_type}
              onChange={(event) => update('company_type', event.target.value)}
              className="filter-select"
            >
              <option>MNC</option>
              <option>Startup</option>
              <option>New</option>
            </select>
            <select
              value={form.job_type}
              onChange={(event) => update('job_type', event.target.value)}
              className="filter-select"
            >
              <option>Full-time</option>
              <option>Internship</option>
            </select>
          </div>
          <textarea
            required
            rows="4"
            placeholder="Describe the role and its impact"
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            className="w-full bg-surfaceHi border border-white/10 rounded-md px-3.5 py-2.5 text-sm text-textHi placeholder:text-textLo/60 focus:border-gold outline-none resize-none"
          />
          {message && <p className="text-teal text-sm">{message}</p>}
          {error && <p className="text-coral text-sm">{error}</p>}
          <Button type="submit" className="w-full">
            Publish role
          </Button>
        </form>

        <section className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-mono uppercase tracking-wide text-textLo">Live listings</p>
                <h2 className="font-display text-xl font-semibold mt-1">Your roles</h2>
              </div>
              <span className="text-xs font-mono text-textLo">{jobs.length} total</span>
            </div>

            {loading ? (
              <p className="text-textLo text-sm">Loading live listings…</p>
            ) : jobs.length === 0 ? (
              <p className="text-textLo text-sm">No active roles published yet.</p>
            ) : (
              jobs.slice(0, 8).map((job) => (
                <article
                  key={job.id}
                  className="bg-surface border border-white/10 rounded-xl p-5 flex items-start justify-between gap-4"
                >
                  <div>
                    <h3 className="font-display text-lg font-semibold">{job.title}</h3>
                    <p className="text-sm text-textLo">
                      {job.company} · {job.location} · {job.applicants_count || 0} applicants
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(job.required_skills || job.skills || []).slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-mono border border-white/10 rounded px-2 py-1 text-textLo"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeJob(job.id)}
                    className="text-xs font-mono text-coral hover:text-textHi"
                  >
                    Deactivate
                  </button>
                </article>
              ))
            )}
          </div>

          <div className="bg-surface border border-white/10 rounded-xl p-5">
            <p className="text-xs font-mono uppercase tracking-wide text-textLo mb-3">Recent Candidates</p>
            {candidates.length === 0 ? (
              <p className="text-sm text-textLo">No candidates have applied to your roles yet.</p>
            ) : (
              <div className="space-y-3">
                {candidates.slice(0, 5).map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between border-b border-white/5 pb-2.5 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{candidate.seeker_name}</p>
                      <p className="text-xs text-textLo">
                        {candidate.job_title} · {candidate.seeker_email}
                      </p>
                    </div>
                    <select
                      value={candidate.status}
                      onChange={(e) => handleCandidateStatus(candidate.id, e.target.value)}
                      className={`text-xs font-mono px-2 py-1 rounded border-0 outline-none ${
                        statusColors[candidate.status] || statusColors.Applied
                      }`}
                    >
                      {['Applied', 'Viewed', 'Shortlisted', 'Interview', 'Rejected', 'Offer'].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
