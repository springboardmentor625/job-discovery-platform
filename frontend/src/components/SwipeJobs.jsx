import { useState, useEffect, useRef } from 'react';
import { getJobRecommendations, swipeJob } from '../api/candidateApi';

export default function SwipeJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animatingDirection, setAnimatingDirection] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobRecommendations();
      setJobs(data || []);
    } catch (err) {
      setError('Failed to load job recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (jobId, action) => {
    setAnimatingDirection(action);
    
    // Optimistic UI update: Wait for animation to finish, then remove the card
    setTimeout(() => {
      setJobs(prev => prev.filter(j => j.job_id !== jobId));
      setAnimatingDirection(null);
      setDragOffset({ x: 0, y: 0 });
    }, 300);

    try {
      const response = await swipeJob(jobId, action);
      
      if (action === 'RIGHT' && response.apply_url) {
        window.open(response.apply_url, '_blank');
      }
      
    } catch (err) {
      console.error('Swipe action failed:', err);
    }
  };

  // Drag logic for swiping
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);

  const getEventCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleDragStart = (e) => {
    const coords = getEventCoordinates(e);
    setDragStart(coords);
    setIsDragging(true);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const coords = getEventCoordinates(e);
    setDragOffset({
      x: coords.x - dragStart.x,
      y: coords.y - dragStart.y
    });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Use predominant axis to determine swipe direction
    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);

    if (absX > absY && absX > 100) {
      handleSwipe(jobs[0].job_id, dragOffset.x > 0 ? 'RIGHT' : 'LEFT');
    } else if (absY > absX && dragOffset.y < -100) {
      handleSwipe(jobs[0].job_id, 'SAVE');
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Finding the perfect jobs for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
        <p>{error}</p>
        <button onClick={loadJobs} className="primary-btn" style={{ marginTop: '16px' }}>Try Again</button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2 style={{ marginBottom: '16px' }}>You're all caught up!</h2>
        <p style={{ color: 'var(--muted)' }}>We couldn't find any more matching jobs at this time.</p>
        <button onClick={loadJobs} className="primary-btn" style={{ marginTop: '24px' }}>Refresh</button>
      </div>
    );
  }

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not Disclosed';
    const formatLakhs = (num) => {
      if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
      if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
      return `₹${num}`;
    };
    if (min && max) return `${formatLakhs(min)} - ${formatLakhs(max)}`;
    if (min) return `${formatLakhs(min)}+`;
    return `Up to ${formatLakhs(max)}`;
  };

  const renderJobContent = (job) => {
    const compInitials = job.company?.company_name ? job.company.company_name.substring(0, 2).toUpperCase() : 'CO';
    
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: animatingDirection ? 0.8 : 1, pointerEvents: 'none' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingRight: '56px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {compInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '6px', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</h3>
            <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.company?.company_name}</p>
          </div>
        </div>
        
        {/* Key Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px', flexShrink: 0 }}>
          {job.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
              <span style={{ fontSize: '1.2rem' }}>📍</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{job.location}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
            <span style={{ fontSize: '1.2rem' }}>💰</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{formatSalary(job.salary_min, job.salary_max)}</span>
          </div>
          {job.experience_required !== null && job.experience_required !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
              <span style={{ fontSize: '1.2rem' }}>📈</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{job.experience_required}+ Yrs Exp</span>
            </div>
          )}
          {job.employment_type && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
              <span style={{ fontSize: '1.2rem' }}>💼</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{job.employment_type}</span>
            </div>
          )}
          {job.company?.industry && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
              <span style={{ fontSize: '1.2rem' }}>🏢</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{job.company.industry}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--border)', marginBottom: '20px', flexShrink: 0 }} />

        {/* Description */}
        <div style={{ marginBottom: '24px', overflowY: 'auto', maxHeight: '200px', paddingRight: '8px' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About the Role</h4>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>{job.description}</p>
        </div>
        
        {/* Required Skills */}
        <div style={{ marginTop: '8px', flexShrink: 0 }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Skills</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(job.required_skills?.skills || []).map((req, i) => (
              <span key={i} style={{ padding: '6px 14px', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--border)', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text)' }}>
                {req.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const currentJob = jobs[0];
  
  // Calculate transform for the card
  let transform = `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`;
  if (animatingDirection === 'LEFT') transform = 'translate(-200vw, 0) rotate(-20deg)';
  if (animatingDirection === 'RIGHT') transform = 'translate(200vw, 0) rotate(20deg)';
  if (animatingDirection === 'SAVE') transform = 'translate(0, -200vh)';

  return (
    <div style={{ maxWidth: '720px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2>Discover Jobs</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '8px' }}>
          Swipe right to apply • Left to pass
        </p>
      </div>

      <div style={{ position: 'relative', height: '580px', width: '100%' }}>
        <div 
          ref={cardRef}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--surface)',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: '1px solid var(--border)',
            padding: '24px',
            cursor: isDragging ? 'grabbing' : 'grab',
            transform,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none',
            zIndex: 10
          }}
        >
          {animatingDirection === 'RIGHT' && <div style={{ position: 'absolute', top: 20, right: 20, border: '4px solid #10b981', color: '#10b981', padding: '8px 16px', borderRadius: '8px', fontSize: '2rem', fontWeight: 'bold', transform: 'rotate(15deg)', zIndex: 20 }}>APPLY</div>}
          {animatingDirection === 'LEFT' && <div style={{ position: 'absolute', top: 20, left: 20, border: '4px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '8px', fontSize: '2rem', fontWeight: 'bold', transform: 'rotate(-15deg)', zIndex: 20 }}>PASS</div>}
          {animatingDirection === 'SAVE' && <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', border: '4px solid #f59e0b', color: '#f59e0b', padding: '8px 16px', borderRadius: '8px', fontSize: '2rem', fontWeight: 'bold', zIndex: 20 }}>SAVE</div>}

          <button 
            onClick={(e) => { e.stopPropagation(); handleSwipe(currentJob.job_id, 'SAVE'); }}
            style={{ 
              position: 'absolute', top: '24px', right: '24px', zIndex: 30,
              width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--surface-soft)', 
              border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', color: 'var(--primary)'
            }}
            title="Save Job"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          {renderJobContent(currentJob)}
        </div>

        {/* Shadow card behind to show there's a stack */}
        {jobs.length > 1 && (
          <div style={{
            position: 'absolute',
            width: '95%',
            height: '100%',
            backgroundColor: 'var(--surface)',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            bottom: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
            opacity: 0.8,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {renderJobContent(jobs[1])}
          </div>
        )}
      </div>

      {/* Gesture Hints / Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '64px', marginTop: '40px' }}>
        <button 
          onClick={() => handleSwipe(currentJob.job_id, 'LEFT')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--surface-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ef4444', color: '#ef4444', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)', transition: 'transform 0.2s' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Pass</span>
        </button>
        
        <button 
          onClick={() => handleSwipe(currentJob.job_id, 'RIGHT')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--surface-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #10b981', color: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)', transition: 'transform 0.2s' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Apply</span>
        </button>
      </div>
    </div>
  );
}
