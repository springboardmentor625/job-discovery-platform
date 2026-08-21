import { useEffect, useState } from 'react';
import { getSavedJobs } from '../api/jobs';
import JobCard from '../components/swipe/JobCard';

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-1">Saved jobs</h1>
      <p className="text-textLo text-sm mb-8">Filed for later — nothing here disappears.</p>

      {loading && <p className="text-textLo text-center py-20">Loading…</p>}

      {!loading && jobs.length === 0 && (
        <p className="text-textLo text-center py-20">
          Nothing saved yet — save a job from Discover to see it here.
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} compact />
        ))}
      </div>
    </div>
  );
}
