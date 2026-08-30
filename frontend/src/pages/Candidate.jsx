import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchCurrentUser } from '../api/authApi';
import { getJobTypes } from '../api/candidateApi';
import SwipeJobs from '../components/SwipeJobs';
import SavedJobs from '../components/SavedJobs';
import ResumeATS from '../components/ResumeATS';
import CandidateProfileTab from '../components/CandidateProfileTab';
import Applications from '../components/Applications';

export default function Candidate() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [jobTypes, setJobTypes] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const data = await fetchCurrentUser(token);
        setCandidate(data);
        
        try {
          const types = await getJobTypes();
          setJobTypes(types);
        } catch (e) {
          console.error('Failed to load job types', e);
        }

        // Check if required profile fields are missing
        const incomplete = !data.profile || 
          !data.profile.headline || 
          !data.profile.city || 
          !data.profile.state ||
          data.profile.experience_years == null ||
          !data.profile.branch ||
          !data.profile.stream ||
          !data.profile.preferred_job_type || 
          !data.profile.preferred_city ||
          !data.profile.preferred_state;

        const resumeUploaded = !!data.has_resume;
        setHasResume(resumeUploaded);

        if (incomplete) {
          setIsProfileIncomplete(true);
          setActiveTab('profile');
        } else if (!resumeUploaded) {
          setActiveTab('resume');
        } else {
          setActiveTab('swipe'); // Default tab when fully onboarded
        }
      } catch {
        logout();
        navigate('/login');
      }
    }

    loadData();
  }, [token, logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!candidate) {
    return <div className="page-shell"><div className="card"><p>Loading candidate profile...</p></div></div>;
  }

  const { user } = candidate;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const profilePicUrl = user.profile_picture ? `${API_BASE_URL}${user.profile_picture}` : null;

  return (
    <div className="dashboard-layout">
      {/* Navigation Bar */}
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
          <div className="brand-mark" style={{ width: '32px', height: '32px', fontSize: '1rem', borderRadius: '8px' }}>S</div>
          <span>SwipeX</span>
        </div>
        
        <div className="nav-links" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')} 
          >
            Profile
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')} 
            disabled={isProfileIncomplete}
            style={{ opacity: isProfileIncomplete ? 0.5 : 1, cursor: isProfileIncomplete ? 'not-allowed' : 'pointer' }}
          >
            Resume & ATS
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'swipe' ? 'active' : ''}`}
            onClick={() => setActiveTab('swipe')} 
            disabled={isProfileIncomplete || !hasResume}
            style={{ opacity: (isProfileIncomplete || !hasResume) ? 0.5 : 1, cursor: (isProfileIncomplete || !hasResume) ? 'not-allowed' : 'pointer' }}
          >
            Swipe Jobs
          </button>

          <button 
            className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')} 
            disabled={isProfileIncomplete || !hasResume}
            style={{ opacity: (isProfileIncomplete || !hasResume) ? 0.5 : 1, cursor: (isProfileIncomplete || !hasResume) ? 'not-allowed' : 'pointer' }}
          >
            Applications
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')} 
            disabled={isProfileIncomplete || !hasResume}
            style={{ opacity: (isProfileIncomplete || !hasResume) ? 0.5 : 1, cursor: (isProfileIncomplete || !hasResume) ? 'not-allowed' : 'pointer' }}
          >
            Saved Jobs
          </button>
        </div>

        <div className="user-menu-container">
          <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {profilePicUrl ? (
              <img 
                src={profilePicUrl} 
                alt="Profile" 
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} 
              />
            ) : (
              <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                <p style={{ margin: '0', fontWeight: '700', color: 'var(--text)' }}>{user.full_name}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--muted)', wordBreak: 'break-all' }}>{user.email}</p>
              </div>
              <button className="dropdown-item danger" onClick={handleLogout} style={{ justifyContent: 'flex-start', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="candidate-body">
          {activeTab === 'swipe' && <SwipeJobs />}
          {activeTab === 'saved' && <SavedJobs />}
          {activeTab === 'applications' && <Applications />}
          {activeTab === 'resume' && <ResumeATS onResumeUploaded={() => setHasResume(true)} />}
          
          {activeTab === 'profile' && (
            <CandidateProfileTab 
              candidate={candidate}
              setCandidate={setCandidate}
              token={token}
              isProfileIncomplete={isProfileIncomplete}
              setIsProfileIncomplete={setIsProfileIncomplete}
              setActiveTab={setActiveTab}
              hasResume={hasResume}
              jobTypes={jobTypes}
            />
          )}
        </div>
      </div>
    </div>
  );
}
