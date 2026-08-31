import { useState, useEffect } from 'react';
import { getApplications, getJobATSReport } from '../api/candidateApi';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAtsId, setExpandedAtsId] = useState(null);
  const [atsData, setAtsData] = useState({});
  const [atsLoading, setAtsLoading] = useState(false);

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

  const toggleAtsReport = async (jobId) => {
    if (expandedAtsId === jobId) {
      setExpandedAtsId(null);
      return;
    }
    setExpandedAtsId(jobId);
    if (!atsData[jobId]) {
      try {
        setAtsLoading(true);
        const data = await getJobATSReport(jobId);
        setAtsData(prev => ({ ...prev, [jobId]: data }));
      } catch (err) {
        setAtsData(prev => ({ ...prev, [jobId]: { error: 'No ATS Report found' } }));
      } finally {
        setAtsLoading(false);
      }
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
          <div key={app.application_id} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              backgroundColor: 'var(--surface)', 
              borderRadius: expandedAtsId === app.job_id ? '16px 16px 0 0' : '16px', 
              padding: '24px', 
              border: '1px solid var(--border)',
              borderBottom: expandedAtsId === app.job_id ? 'none' : '1px solid var(--border)',
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
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <a 
                  href={app.job.apply_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="secondary-btn"
                  style={{ textDecoration: 'none', padding: '8px 16px', textAlign: 'center' }}
                >
                  View Posting
                </a>
                <button 
                  className="secondary-btn" 
                  onClick={() => toggleAtsReport(app.job_id)}
                  style={{ padding: '8px 16px', background: 'var(--surface-hover)', cursor: 'pointer' }}
                >
                  {expandedAtsId === app.job_id ? 'Hide ATS Report' : 'View ATS Report'}
                </button>
              </div>
            )}
          </div>
          {expandedAtsId === app.job_id && (
            <div style={{ 
              padding: '16px 24px', 
              backgroundColor: 'var(--surface-hover)', 
              borderRadius: '0 0 16px 16px', 
              border: '1px solid var(--border)', 
              borderTop: '1px dashed var(--border)' 
            }}>
              {atsLoading && !atsData[app.job_id] ? (
                <p style={{ margin: 0 }}>Loading ATS Report...</p>
              ) : atsData[app.job_id]?.error ? (
                <p style={{ color: 'var(--muted)', margin: 0 }}>{atsData[app.job_id].error}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '48px', height: '48px', 
                      borderRadius: '50%', 
                      border: `4px solid ${atsData[app.job_id].ats_score >= 80 ? 'var(--success)' : atsData[app.job_id].ats_score >= 50 ? 'var(--warning)' : 'var(--danger)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {Math.round(atsData[app.job_id].ats_score)}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0' }}>Match Score</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Based on required skills & experience</p>
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: 'var(--surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Suggestions:</strong> {atsData[app.job_id].suggestions}</p>
                  </div>
                  
                  {atsData[app.job_id].missing_skills?.skills?.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Missing Skills:</span>
                      {atsData[app.job_id].missing_skills.skills.map(skill => (
                        <span key={skill} style={{ 
                          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                          color: '#ef4444', 
                          padding: '2px 8px', 
                          borderRadius: '100px', 
                          fontSize: '0.75rem',
                          border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        ))}
      </div>
    </div>
  );
}
