import { useState, useEffect } from 'react';
import { updateCandidateProfile, uploadProfilePicture, removeProfilePicture } from '../api/authApi';
import { ALL_INDIAN_STATES_AND_CITIES, IT_HUBS_STATES_AND_CITIES, EDUCATION_DATA } from '../utils/constants';

export default function CandidateProfileTab({ 
  candidate, setCandidate, token, isProfileIncomplete, 
  setIsProfileIncomplete, setActiveTab, hasResume,
  jobTypes
}) {
  const [isEditing, setIsEditing] = useState(isProfileIncomplete);
  const [uploading, setUploading] = useState(false);
  const { user, profile } = candidate;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const profilePicUrl = user.profile_picture ? `${API_BASE_URL}${user.profile_picture}` : null;

  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    headline: profile?.headline || '',
    summary: profile?.summary || '',
    city: profile?.city || '',
    state: profile?.state || '',
    experience_years: profile?.experience_years ?? 0,
    branch: profile?.branch || '',
    stream: profile?.stream || '',
    projects: profile?.projects || '',
    certifications: profile?.certifications || '',
    preferred_job_type: profile?.preferred_job_type || '',
    preferred_city: profile?.preferred_city || '',
    preferred_state: profile?.preferred_state || '',
  });

  useEffect(() => {
    if (isProfileIncomplete) {
      setIsEditing(true);
    }
  }, [isProfileIncomplete]);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadProfilePicture(token, file);
      setCandidate(prev => ({
        ...prev,
        user: { ...prev.user, profile_picture: response.profile_picture }
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    try {
      await removeProfilePicture(token);
      setCandidate(prev => ({
        ...prev,
        user: { ...prev.user, profile_picture: null }
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to remove profile picture');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editForm };
      
      if (payload.experience_years === '') {
        payload.experience_years = null;
      } else if (payload.experience_years !== null) {
        payload.experience_years = parseInt(payload.experience_years, 10);
      }

      const updatedCandidate = await updateCandidateProfile(payload);
      setCandidate(updatedCandidate);
      setIsEditing(false);
      setIsProfileIncomplete(false);
      
      if (!hasResume) {
        setActiveTab('resume');
      } else {
        setActiveTab('swipe');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update profile: ' + err.message);
    }
  };

  return (
    <div>
      {isProfileIncomplete && (
        <div className="error-message" style={{ marginBottom: '24px', backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', padding: '16px', borderRadius: '8px' }}>
          <strong>Action Required:</strong> Please complete all required profile fields to continue.
        </div>
      )}
      
      {!hasResume && !isProfileIncomplete && (
        <div className="error-message" style={{ marginBottom: '24px', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '16px', borderRadius: '8px' }}>
          <strong>Next Step:</strong> Upload your resume in the Resume & ATS tab to unlock job recommendations.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
        {profilePicUrl ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img 
              src={profilePicUrl} 
              alt="Profile" 
              style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', display: 'block' }} 
            />
            <button 
              type="button" 
              onClick={handleRemovePicture}
              style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'red', padding: 0 }}
              title="Remove Picture"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        ) : (
          <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'var(--surface-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
            <svg viewBox="0 0 24 24" fill="var(--muted)" style={{ width: '40px', height: '40px' }}>
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="profile-upload" className="secondary-btn" style={{ display: 'inline-block', padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
            {uploading ? 'Uploading...' : 'Upload Picture'}
          </label>
          <input 
            id="profile-upload" 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
            disabled={uploading}
          />
        </div>
      </div>

      <h2>Welcome, {user.full_name}</h2>

      {isEditing ? (
        <form onSubmit={handleSaveProfile} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Contact Info Card */}
          <div style={{ backgroundColor: 'var(--surface-soft)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              Contact Info
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div className="field-group">
                <label>Email (Read-only)</label>
                <input value={user.email} disabled style={{ backgroundColor: 'var(--border)', color: 'var(--muted)' }} />
              </div>
              <div className="field-group">
                <label>Phone (Read-only)</label>
                <input value={user.phone || ''} disabled style={{ backgroundColor: 'var(--border)', color: 'var(--muted)' }} />
              </div>
              <div className="field-group">
                <label htmlFor="full_name">Full Name<span style={{ color: 'red' }}> *</span></label>
                <input id="full_name" name="full_name" value={editForm.full_name} onChange={handleEditChange} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', gridColumn: '1 / -1' }}>
                <div className="field-group">
                  <label htmlFor="state">State<span style={{ color: 'red' }}> *</span></label>
                  <select id="state" name="state" value={editForm.state} onChange={(e) => setEditForm({...editForm, state: e.target.value, city: ''})} required style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <option value="">Select State</option>
                    {Object.keys(ALL_INDIAN_STATES_AND_CITIES).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label htmlFor="city">City<span style={{ color: 'red' }}> *</span></label>
                  <select id="city" name="city" value={editForm.city} onChange={handleEditChange} required disabled={!editForm.state} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: !editForm.state ? 'var(--surface-50)' : 'transparent' }}>
                    <option value="">Select City</option>
                    {(ALL_INDIAN_STATES_AND_CITIES[editForm.state] || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Info Card */}
          <div style={{ backgroundColor: 'var(--surface-soft)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              Professional Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="field-group">
                <label htmlFor="headline">Professional Headline<span style={{ color: 'red' }}> *</span></label>
                <input id="headline" name="headline" value={editForm.headline} onChange={handleEditChange} placeholder="e.g. Senior Software Engineer" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div className="field-group">
                  <label htmlFor="experience_years">Years of Experience<span style={{ color: 'red' }}> *</span></label>
                  <input id="experience_years" type="number" min="0" name="experience_years" value={editForm.experience_years} onChange={handleEditChange} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="field-group">
                    <label htmlFor="branch">Degree/Branch<span style={{ color: 'red' }}> *</span></label>
                    <select id="branch" name="branch" value={editForm.branch} onChange={(e) => setEditForm({...editForm, branch: e.target.value, stream: ''})} required style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <option value="">Select Degree</option>
                      {Object.keys(EDUCATION_DATA).map(br => (
                        <option key={br} value={br}>{br}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="stream">Stream<span style={{ color: 'red' }}> *</span></label>
                    <select id="stream" name="stream" value={editForm.stream} onChange={handleEditChange} required disabled={!editForm.branch} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: !editForm.branch ? 'var(--surface-50)' : 'transparent' }}>
                      <option value="">Select Stream</option>
                      {(EDUCATION_DATA[editForm.branch] || []).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="summary" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Professional Summary</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 'normal' }}>{editForm.summary?.length || 0}/200</span>
                </label>
                <textarea id="summary" name="summary" value={editForm.summary} onChange={handleEditChange} maxLength={200} rows="4" placeholder="Briefly describe your professional background..." />
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div style={{ backgroundColor: 'var(--surface-soft)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
              Preferences
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div className="field-group">
                <label htmlFor="preferred_job_type">Preferred Job Type<span style={{ color: 'red' }}> *</span></label>
                <select id="preferred_job_type" name="preferred_job_type" value={editForm.preferred_job_type} onChange={handleEditChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <option value="">Select a job type</option>
                  {jobTypes.map((type, i) => (
                    <option key={i} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', gridColumn: '1 / -1' }}>
                <div className="field-group">
                  <label htmlFor="preferred_state">Preferred State (IT Hub)<span style={{ color: 'red' }}> *</span></label>
                  <select id="preferred_state" name="preferred_state" value={editForm.preferred_state} onChange={(e) => setEditForm({...editForm, preferred_state: e.target.value, preferred_city: ''})} required style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <option value="">Select IT State</option>
                    {Object.keys(IT_HUBS_STATES_AND_CITIES).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label htmlFor="preferred_city">Preferred City (IT Hub)<span style={{ color: 'red' }}> *</span></label>
                  <select id="preferred_city" name="preferred_city" value={editForm.preferred_city} onChange={handleEditChange} required disabled={!editForm.preferred_state} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: !editForm.preferred_state ? 'var(--surface-50)' : 'transparent' }}>
                    <option value="">Select IT City</option>
                    {(IT_HUBS_STATES_AND_CITIES[editForm.preferred_state] || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Card */}
          <div style={{ backgroundColor: 'var(--surface-soft)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Additional Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="field-group">
                <label htmlFor="projects">Projects</label>
                <textarea id="projects" name="projects" value={editForm.projects} onChange={handleEditChange} rows="3" placeholder="Describe key projects..." />
              </div>
              <div className="field-group">
                <label htmlFor="certifications">Certifications</label>
                <textarea id="certifications" name="certifications" value={editForm.certifications} onChange={handleEditChange} rows="2" placeholder="e.g. AWS Certified Developer" />
              </div>
              <div className="field-group">
                <label htmlFor="skills">Skills</label>
                <textarea id="skills" name="skills" value={editForm.skills || profile?.skills || ''} disabled style={{ backgroundColor: 'var(--surface-50)' }} rows="3" placeholder="Skills will be extracted from your resume..." title="Skills are automatically extracted from your resume" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'flex-end' }}>
            <button type="button" className="secondary-btn" onClick={() => !isProfileIncomplete && setIsEditing(false)}>Cancel</button>
            <button type="submit" className="primary-btn">Save Profile</button>
          </div>
        </form>
      ) : (
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Contact Info Card - View Mode */}
          <div style={{ backgroundColor: 'var(--surface-soft)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              Contact Info
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Email</span>
                <p style={{ fontWeight: '500', margin: '4px 0 0' }}>{user.email}</p>
              </div>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Phone</span>
                <p style={{ fontWeight: '500', margin: '4px 0 0' }}>{user.phone || 'Not provided'}</p>
              </div>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Full Name</span>
                <p style={{ fontWeight: '500', margin: '4px 0 0' }}>{user.full_name}</p>
              </div>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Location</span>
                <p style={{ fontWeight: '500', margin: '4px 0 0' }}>{profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Professional Info Card - View Mode */}
          <div style={{ backgroundColor: 'var(--surface-soft)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              Professional Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Professional Headline</span>
                <p style={{ fontWeight: '500', margin: '4px 0 0' }}>{profile?.headline || 'Not provided'}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Years of Experience</span>
                  <p style={{ fontWeight: '500', margin: '4px 0 0' }}>{profile?.experience_years !== null ? `${profile.experience_years} years` : 'Not provided'}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Education</span>
                  <p style={{ fontWeight: '500', margin: '4px 0 0' }}>{profile?.branch && profile?.stream ? `${profile.branch} - ${profile.stream}` : 'Not provided'}</p>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Professional Summary</span>
                <p style={{ color: profile?.summary ? 'var(--text)' : 'var(--muted)', whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: '4px 0 0' }}>{profile?.summary || 'No summary provided.'}</p>
              </div>
            </div>
          </div>

          {/* Preferences Card - View Mode */}
          <div style={{ backgroundColor: 'var(--surface-soft)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
              Preferences
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Preferred Job Type</span>
                <p style={{ fontWeight: '500', margin: '4px 0 0' }}>{profile?.preferred_job_type || 'Not provided'}</p>
              </div>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Preferred Location</span>
                <p style={{ fontWeight: '500', margin: '4px 0 0' }}>{profile?.preferred_city && profile?.preferred_state ? `${profile.preferred_city}, ${profile.preferred_state}` : 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Additional Information Card - View Mode */}
          <div style={{ backgroundColor: 'var(--surface-soft)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Additional Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Projects</span>
                <p style={{ color: profile?.projects ? 'var(--text)' : 'var(--muted)', whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: '4px 0 0' }}>{profile?.projects || 'No projects provided.'}</p>
              </div>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Certifications</span>
                <p style={{ color: profile?.certifications ? 'var(--text)' : 'var(--muted)', whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: '4px 0 0' }}>{profile?.certifications || 'No certifications provided.'}</p>
              </div>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Skills</span>
                <p style={{ color: profile?.skills ? 'var(--text)' : 'var(--muted)', whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: '4px 0 0' }}>{profile?.skills || 'No skills extracted yet. Please upload a resume.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isEditing && (
        <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
          <button className="primary-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
}
