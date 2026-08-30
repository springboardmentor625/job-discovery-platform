import { useState, useEffect } from 'react';
import { getApplications } from '../api/candidateApi';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getApplications();
      setApplications(data || []);
    } catch (err) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Loading your applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
        <p>{error}</p>
        <button onClick={loadApplications} className="primary-btn" style={{ marginTop: '16px' }}>Try Again</button>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2 style={{ marginBottom: '16px' }}>No Applications Yet</h2>
        <p style={{ color: 'var(--muted)' }}>Swipe right on jobs you like to apply!</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px' }}>My Applications ({applications.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {applications.map((app) => (
          <div key={app.application_id} style={{ 
            backgroundColor: 'var(--surface)', 
            borderRadius: '16px', 
            padding: '24px', 
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{app.job.title}</h3>
                <span style={{ 
                  backgroundColor: 'var(--primary)', 
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: '100px', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold' 
                }}>
                  {app.status}
                </span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: 'var(--text)' }}>
                {app.job.company?.company_name} {app.job.location ? `• ${app.job.location}` : ''}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                Applied on {formatDate(app.applied_at)}
              </p>
            </div>
            {app.job.apply_url && (
              <a 
                href={app.job.apply_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="secondary-btn"
                style={{ textDecoration: 'none', padding: '8px 16px' }}
              >
                View Posting
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
