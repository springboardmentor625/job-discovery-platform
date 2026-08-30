import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadResume, getATSReport, getResume } from '../api/candidateApi';
import { fetchCurrentUser } from '../api/authApi';
export default function ResumeATS() {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [currentResume, setCurrentResume] = useState(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [parsedProfile, setParsedProfile] = useState(null);
  const fileInputRef = useRef(null);
  const { refreshUser, token } = useAuth();
  useEffect(() => {
    fetchReport();
  }, []);
  useEffect(() => {
    if (successInfo) {
      const timer = setTimeout(() => setSuccessInfo(null), 15000);
      return () => clearTimeout(timer);
    }
  }, [successInfo]);
  const fetchReport = async () => {
    try {
      const data = await getATSReport();
      setReport(data);
    } catch (err) {
      console.log('No ATS report found');
    }
    try {
      const resumeData = await getResume();
      setCurrentResume(resumeData);
    } catch (err) {
      console.log('No resume found');
    }
  };
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccessInfo(null);
    setParsedProfile(null);
    try {
      setLoadingStep('Uploading your resume...');
      await new Promise(r => setTimeout(r, 500));
      setLoadingStep('Parsing resume with AI...');
      const res = await uploadResume(file);
      if (res) {
        setLoadingStep('Updating your profile...');
        await refreshUser();
        await new Promise(r => setTimeout(r, 400));
        setLoadingStep('Generating ATS report...');
        await fetchReport();
        await new Promise(r => setTimeout(r, 300));
        const freshData = await fetchCurrentUser(token);
        const profile = freshData?.profile;
        setParsedProfile(profile);
        const skillsCount = res.extracted_skills?.skills?.length || 0;
        const skillsList = res.extracted_skills?.skills || [];
        const projectsText = profile?.projects || '';
        const certsText = profile?.certifications || '';
        const projectsCount = projectsText ? (projectsText.match(/^\d+\./gm) || []).length : 0;
        const certsCount = certsText ? certsText.split(',').filter(c => c.trim()).length : 0;
        setSuccessInfo({
          message: isReplacing ? 'Resume replaced & profile updated!' : 'Resume parsed & profile updated!',
          skills: skillsList,
          skillsCount,
          projectsCount,
          certsCount,
          projectsText: projectsText.substring(0, 300),
          certsText,
        });
        setFile(null);
        setIsReplacing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to upload resume. Please try again.');
      }
    }
    setLoading(false);
    setLoadingStep('');
  };
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setSuccessInfo(null);
    }
    e.target.value = '';
  };
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
      setSuccessInfo(null);
    }
  };
  const handleStartReplace = () => {
    setIsReplacing(true);
    setError('');
    setSuccessInfo(null);
    setFile(null);
    setParsedProfile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  return (
    <div className="resume-ats-container" style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div className="section-header" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Resume & ATS Analysis</h2>
        <p className="subtitle" style={{ fontSize: '1.1rem', color: 'var(--muted)', maxWidth: '600px', margin: '0 auto' }}>
          Upload your resume to auto-fill your profile and see how you match with our AI-powered ATS scanner.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto', gap: '32px' }}>
        {}
        {successInfo && (
          <div className="resume-success-toast" style={{ flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div className="success-toast-icon">✅</div>
              <div className="success-toast-content">
                <strong>{successInfo.message}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', opacity: 0.85 }}>
                  Extracted <strong>{successInfo.skillsCount} skills</strong>, <strong>{successInfo.projectsCount} projects</strong>, and <strong>{successInfo.certsCount} certifications</strong> from your resume.
                </p>
              </div>
            </div>
            {}
            {successInfo.skills?.length > 0 && (
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.82rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Extracted Skills</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {successInfo.skills.map(s => (
                    <span key={s} style={{ padding: '3px 10px', background: '#dcfce7', color: '#166534', borderRadius: '100px', fontSize: '0.78rem', fontWeight: '600', border: '1px solid #bbf7d0' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {}
            {successInfo.certsText && (
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.82rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Certifications</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d', lineHeight: '1.5' }}>{successInfo.certsText}</p>
              </div>
            )}
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#15803d', fontWeight: '600' }}>
              ✨ Your Profile tab has been updated with all extracted information.
            </p>
          </div>
        )}
        {}
        {loading && (
          <div style={{ width: '100%', backgroundColor: 'var(--surface, #ffffff)', borderRadius: '24px', padding: '60px 40px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div className="swipe-loading-spinner" style={{ width: '56px', height: '56px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: '700' }}>{loadingStep}</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>This may take a few seconds. We're extracting all your details...</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {['Uploading', 'Parsing', 'Updating', 'Generating'].map((step, i) => {
                const currentIdx = ['Uploading', 'Parsing', 'Updating', 'Generating'].findIndex(s => loadingStep.includes(s));
                const isDone = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step} style={{
                    width: '80px', height: '4px', borderRadius: '2px',
                    background: isDone ? '#22c55e' : isCurrent ? 'var(--primary)' : 'var(--border)',
                    transition: 'background 0.3s ease'
                  }} />
                );
              })}
            </div>
          </div>
        )}
        {}
        {!loading && (
        <div style={{ width: '100%', backgroundColor: 'var(--surface, #ffffff)', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {currentResume && !isReplacing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'var(--primary-soft, #eef2ff)', width: '72px', height: '72px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary, #4f46e5)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main, #111827)' }}>Currently Uploaded Resume</h3>
                <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-muted, #6b7280)' }}>{currentResume.resume_name}</p>
                {currentResume.extracted_skills?.skills?.length > 0 && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--primary, #000)' }}>
                    {currentResume.extracted_skills.skills.length} skills detected
                  </p>
                )}
              </div>
              <button 
                onClick={handleStartReplace} 
                style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: 'transparent', border: '1px solid var(--primary, #4f46e5)', color: 'var(--primary, #4f46e5)', borderRadius: '12px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.target.style.backgroundColor = 'var(--primary-soft, #eef2ff)' }}
                onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent' }}
              >
                Replace Resume
              </button>
              <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--muted, #9ca3af)' }}>
                Replacing your resume will re-parse and update your profile automatically.
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept=".pdf,.doc,.docx" 
                style={{ display: 'none' }} 
              />
              {!file ? (
                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragActive ? 'var(--primary, #4f46e5)' : 'rgba(0,0,0,0.1)'}`,
                    backgroundColor: isDragActive ? 'var(--primary-soft, #eef2ff)' : 'transparent',
                    borderRadius: '20px', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                  }}
                >
                  <div style={{ backgroundColor: 'var(--surface-50, #f9fafb)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary, #4f46e5)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--text-main, #111827)' }}>
                      {isReplacing ? 'Upload new resume to replace' : 'Click to browse or drag and drop'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted, #6b7280)' }}>Supports PDF, DOC, DOCX (Max 5MB)</p>
                    <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--primary, #000)', fontWeight: '600' }}>
                      Your profile will be auto-filled from the resume
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', border: '1px solid var(--primary, #4f46e5)', borderRadius: '16px', backgroundColor: 'var(--primary-soft, #eef2ff)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary, #4f46e5)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <span style={{ fontWeight: '500', color: 'var(--text-main, #111827)' }}>{file.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #6b7280)', display: 'flex', padding: '4px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', width: '100%', justifyContent: 'center' }}>
                <button 
                  onClick={handleUpload} 
                  disabled={!file || loading} 
                  style={{ 
                    flex: 1, padding: '14px 24px', fontSize: '1.05rem', fontWeight: '600',
                    backgroundColor: (!file || loading) ? '#d1d5db' : 'var(--primary, #4f46e5)', 
                    color: '#fff', border: 'none', borderRadius: '12px', cursor: (!file || loading) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                  }}
                >
                  {isReplacing ? 'Replace & Re-Analyze' : 'Upload & Analyze'}
                </button>
                {currentResume && isReplacing && (
                  <button 
                    onClick={() => { setIsReplacing(false); setError(''); setFile(null); }} 
                    style={{ 
                      flex: 1, padding: '14px 24px', fontSize: '1.05rem', fontWeight: '600',
                      backgroundColor: 'transparent', color: 'var(--text-main, #111827)', border: '1px solid rgba(0,0,0,0.1)', 
                      borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
              {error && (
                <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 18px', textAlign: 'left' }}>
                  <p style={{ color: '#991b1b', margin: 0, fontWeight: '600', fontSize: '0.92rem' }}>⚠️ {error}</p>
                  <p style={{ color: '#b91c1c', margin: '6px 0 0', fontSize: '0.82rem' }}>Please make sure you're uploading a valid resume PDF with sections like Education, Skills, Experience, etc.</p>
                </div>
              )}
            </div>
          )}
        </div>
        )}
        {}
        {report && !isReplacing && !loading && (
          <div style={{ width: '100%', backgroundColor: 'var(--surface, #ffffff)', borderRadius: '24px', padding: '36px 40px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main, #111827)' }}>ATS Match Score</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>Based on your current resume</p>
            </div>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: report.ats_score > 75 ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : report.ats_score > 50 ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'linear-gradient(135deg, #fee2e2, #fecaca)',
              color: report.ats_score > 75 ? '#065f46' : report.ats_score > 50 ? '#78350f' : '#991b1b',
              fontSize: '1.6rem', fontWeight: '800', boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}>
              {report.ats_score.toFixed(0)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}