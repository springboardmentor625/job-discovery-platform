import { useEffect, useState } from 'react';
import { getRecommendedJobs, recordSwipe } from '../api/jobs';
import SwipeDeck from '../components/swipe/SwipeDeck';
import { useToast } from '../context/ToastContext';

export default function Discover() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ search: '', companyType: 'All', jobType: 'All', competition: 'All', remoteOnly: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    getRecommendedJobs()
      .then(setJobs)
      .catch(() => setError('Could not load recommended jobs. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDecision(job, decision) {
    if (decision === 'right') {
      toast.success(`Applied to ${job.title} at ${job.company}!`);
    } else if (decision === 'save') {
      toast.info(`Saved ${job.title} for later.`);
    } else if (decision === 'left') {
      toast.info(`Passed on ${job.title}`);
    }

    try {
      await recordSwipe(job.id, decision, job.match_score);
    } catch {
      // Non-fatal for UI
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const search = filters.search.trim().toLowerCase();
    const matchesSearch = !search || [job.title, job.company, job.location, ...(job.required_skills || [])]
      .join(' ')
      .toLowerCase()
      .includes(search);
    const matchesCompany = filters.companyType === 'All' || job.company_type === filters.companyType;
    const matchesType = filters.jobType === 'All' || job.job_type === filters.jobType;
    const matchesCompetition = filters.competition === 'All' || job.competition_level === filters.competition;
    const matchesRemote = !filters.remoteOnly || job.location === 'Remote';
    return matchesSearch && matchesCompany && matchesType && matchesCompetition && matchesRemote;
  });

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold">Discover</h1>
        <p className="text-textLo text-sm mt-1">
          Swipe right to apply, left to pass, or save it for later.
        </p>
      </div>

      <section className="bg-surface border border-white/10 rounded-xl p-4 mb-8" aria-label="Job filters">
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search roles, companies, skills"
            className="flex-1 bg-surfaceHi border border-white/10 rounded-md px-3.5 py-2.5 text-sm text-textHi placeholder:text-textLo/60 focus:border-gold outline-none"
          />
          <select value={filters.companyType} onChange={(e) => updateFilter('companyType', e.target.value)} className="filter-select">
            <option>All</option><option>MNC</option><option>Startup</option><option>New</option>
          </select>
          <select value={filters.jobType} onChange={(e) => updateFilter('jobType', e.target.value)} className="filter-select">
            <option>All</option><option>Full-time</option><option>Internship</option>
          </select>
          <select value={filters.competition} onChange={(e) => updateFilter('competition', e.target.value)} className="filter-select">
            <option>All</option><option>Low</option><option>Medium</option><option>High</option>
          </select>
          <label className="flex items-center gap-2 px-2 text-sm text-textLo whitespace-nowrap">
            <input type="checkbox" checked={filters.remoteOnly} onChange={(e) => updateFilter('remoteOnly', e.target.checked)} className="accent-teal" />
            Remote only
          </label>
        </div>
        <p className="text-xs text-textLo font-mono mt-3">{filteredJobs.length} opportunities match your profile</p>
      </section>

      {loading && <p className="text-textLo text-center py-20">Loading your recommendations…</p>}
      {error && <p className="text-coral text-center py-20">{error}</p>}
      {!loading && !error && <SwipeDeck jobs={filteredJobs} onDecision={handleDecision} />}
    </div>
  );
}
