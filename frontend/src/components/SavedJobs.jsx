import { useState, useEffect } from 'react';
import { getSavedJobs, unsaveJob } from '../api/candidateApi';
export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  useEffect(() => {
    fetchSavedJobs();
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const fetchSavedJobs = async () => {
    try {
      const data = await getSavedJobs();
      setSavedJobs(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };
  const handleApply = (job) => {
    const applyUrl = job.apply_url || job.company?.career_page;
    if (applyUrl) {
      setToast({ message: `🚀 Opening ${job.company?.company_name}'s career page...`, type: 'success' });
      window.open(applyUrl, '_blank');
    } else {
      setToast({ message: '⚠️ No career page URL available for this company.', type: 'error' });
    }
  };
  const handleRemove = async (jobId) => {
    setRemovingId(jobId);
    try {
      await unsaveJob(jobId);
      setTimeout(() => {
        setSavedJobs(prev => prev.filter(s => s.job.job_id !== jobId));
        setRemovingId(null);
        setToast({ message: '🗑️ Job removed from saved list.', type: 'info' });
      }, 300);
    } catch (err) {
      console.error(err);
      setRemovingId(null);
      setToast({ message: 'Failed to remove job. Please try again.', type: 'error' });
    }
  };
  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not disclosed';
    const fmtMin = min ? `₹${(min / 100000).toFixed(1)}L` : '';
    const fmtMax = max ? `₹${(max / 100000).toFixed(1)}L` : '';
    return `${fmtMin} – ${fmtMax}`;
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  if (loading) {
    return (
      <div className="saved-loading">
        <div className="swipe-loading-spinner"></div>
        <h3>Loading saved jobs...</h3>
      </div>
    );
  }
  return (
    <div className="saved-container">
      {}
      {toast && (
        <div className={`swipe-toast swipe-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
      <div className="saved-header">
        <div>
          <h2>Saved Jobs</h2>
          <p className="saved-subtitle">
            Jobs you've bookmarked for later. Apply when you're ready!
          </p>
        </div>
        {savedJobs.length > 0 && (
          <span className="saved-count-badge">{savedJobs.length} saved</span>
        )}
      </div>
      {savedJobs.length === 0 ? (
        <div className="saved-empty-state">
          <div className="empty-icon">⭐</div>
          <h3>No saved jobs yet</h3>
          <p>When you save a job from the Swipe tab, it'll appear here so you can apply later.</p>
          <div className="empty-hint">
            <span>💡</span>
            <span>Tip: Swipe up or tap the ⭐ button to save a job</span>
          </div>
        </div>
      ) : (
        <div className="saved-grid">
          {savedJobs.map((saved) => {
            const job = saved.job;
            const isRemoving = removingId === job.job_id;
            return (
              <div
                key={saved.swipe_id}
                className={`saved-card ${isRemoving ? 'saved-card-removing' : ''}`}
              >
                <div className="saved-card-top">
                  <div className="saved-card-company-logo">
                    {job.company?.company_name?.charAt(0) || 'C'}
                  </div>
                  <div className="saved-card-header">
                    <h4 className="saved-job-title">{job.title}</h4>
                    <p className="saved-company-name">{job.company?.company_name}</p>
                  </div>
                </div>
                <div className="saved-card-details">
                  <div className="saved-detail">
                    <span className="saved-detail-icon">📍</span>
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  <div className="saved-detail">
                    <span className="saved-detail-icon">💰</span>
                    <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                  </div>
                  <div className="saved-detail">
                    <span className="saved-detail-icon">💼</span>
                    <span>{job.employment_type || 'Full-time'}</span>
                  </div>
                  <div className="saved-detail">
                    <span className="saved-detail-icon">⏳</span>
                    <span>{job.experience_required != null ? `${job.experience_required} yrs exp` : 'Any'}</span>
                  </div>
                </div>
                {job.required_skills?.skills && (
                  <div className="saved-card-skills">
                    {job.required_skills.skills.slice(0, 5).map(s => (
                      <span key={s} className="saved-skill-tag">{s}</span>
                    ))}
                    {job.required_skills.skills.length > 5 && (
                      <span className="saved-skill-tag saved-skill-more">+{job.required_skills.skills.length - 5}</span>
                    )}
                  </div>
                )}
                {saved.saved_at && (
                  <p className="saved-date">Saved on {formatDate(saved.saved_at)}</p>
                )}
                <div className="saved-card-actions">
                  <button
                    className="saved-apply-btn"
                    onClick={() => handleApply(job)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Apply Now
                  </button>
                  <button
                    className="saved-remove-btn"
                    onClick={() => handleRemove(job.job_id)}
                    disabled={isRemoving}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}