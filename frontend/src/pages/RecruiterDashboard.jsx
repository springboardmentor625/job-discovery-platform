import { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Plus, Briefcase, Users, MapPin, ExternalLink, X, FileText, CheckCircle2 } from 'lucide-react';

export default function RecruiterDashboard() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    // EXPANDED FORM: Now includes Company Name and Description for the DB
    const [newJob, setNewJob] = useState({ 
        title: '', 
        company_name: '',
        location: '', 
        description: '',
        skills: '' 
    });

    useEffect(() => {
        // Fetch real jobs posted by this specific recruiter from the database
        const fetchMyJobs = async () => {
            try {
                // Make sure your FastAPI backend has an endpoint like /jobs/me or /jobs
                const res = await api.get('/jobs/me');
                setJobs(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Failed to fetch jobs for this recruiter", err);
                setJobs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMyJobs();
    }, []);

    // THIS IS THE MAGIC: Sending the manual job to the PostgreSQL Database
    const handlePostJob = async (e) => {
        e.preventDefault();
        
        try {
            // 1. Format the payload for FastAPI
            const payload = {
                title: newJob.title,
                company_name: newJob.company_name,
                location: newJob.location,
                description: newJob.description,
                // Convert comma string to an array for the backend
                required_skills: newJob.skills.split(',').map(s => s.trim()).filter(Boolean)
            };

            // 2. Send to Backend Database
            const res = await api.post('/jobs', payload);
            
            // 3. Update the UI instantly with the real DB record
            setJobs([res.data, ...jobs]); 
            
        } catch (err) {
            console.error("Failed to save job for this recruiter", err);
        } finally {
            // Reset form and close
            setNewJob({ title: '', company_name: '', location: '', description: '', skills: '' }); 
            setIsPostModalOpen(false); 
        }
    };

    const [candidates, setCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);

    useEffect(() => {
        if (!selectedJob) {
            setCandidates([]);
            return;
        }
        const fetchCandidates = async () => {
            setLoadingCandidates(true);
            try {
                const res = await api.get('/recruiters/feed');
                const list = Array.isArray(res.data) ? res.data : [];
                const filtered = list.filter(c => c.job_id === selectedJob.id);
                setCandidates(filtered);
            } catch (err) {
                console.error("Failed to fetch candidates for this job", err);
                setCandidates([]);
            } finally {
                setLoadingCandidates(false);
            }
        };
        fetchCandidates();
    }, [selectedJob]);

    const handleUpdateStatus = async (applicationId, newStatus) => {
        try {
            await api.put('/recruiters/decision', {
                application_id: applicationId,
                status: newStatus
            });
            setCandidates(prev => prev.map(c => c.application_id === applicationId ? { ...c, status: newStatus } : c));
        } catch (err) {
            console.error("Failed to update candidate status", err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 relative">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Briefcase className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-400" />
                        Candidate Overview
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage your open roles and review your AI-matched candidates.
                    </p>
                </div>
                <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <Plus className="w-5 h-5 mr-1.5" /> Post New Job
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {jobs.map((job) => (
                    <div key={job.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight pr-4">
                                    {job.title}
                                </h3>
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                    (job.status || 'Active') === 'Active' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800/50' 
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                }`}>
                                    {job.status || 'Active'}
                                </span>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    <Briefcase className="w-4 h-4 mr-2 text-gray-400" /> {job.company_name || 'My Company'}
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" /> {job.location}
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    <Users className="w-4 h-4 mr-2 text-gray-400" /> {job.applicants || 0} Candidates Matched
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedJob(job)}
                            className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Review Candidates <ExternalLink className="w-4 h-4 ml-1.5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* MODAL 1: POST NEW JOB TO DATABASE */}
            {isPostModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Post a Custom Job</h2>
                            <button onClick={() => setIsPostModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handlePostJob} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                                    <input type="text" required value={newJob.company_name} onChange={e => setNewJob({...newJob, company_name: e.target.value})} className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2.5 border outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Google, OpenAI" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                                    <input type="text" required value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2.5 border outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Prompt Engineer" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                                <input type="text" required value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2.5 border outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Remote, or New York, NY" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Description</label>
                                <textarea required value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} rows="3" className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2.5 border outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Describe the day-to-day responsibilities..."></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Required Skills (Comma separated)</label>
                                <textarea required value={newJob.skills} onChange={e => setNewJob({...newJob, skills: e.target.value})} rows="2" className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2.5 border outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Python, PyTorch, React, Docker..."></textarea>
                            </div>
                            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors mt-6 shadow-md">
                                Publish Job to Database
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: VIEW CANDIDATES (UNCHANGED) */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[85vh]">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Candidate Shortlist</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedJob.title} • {selectedJob.location}</p>
                            </div>
                            <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6 space-y-4">
                            {loadingCandidates ? (
                                <div className="flex justify-center items-center py-12">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                </div>
                            ) : candidates.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                    <p className="font-semibold text-gray-700 dark:text-gray-300">No candidates have applied to this role yet.</p>
                                    <p className="text-sm mt-1">Candidates will appear here as they swipe right in their feed.</p>
                                </div>
                            ) : (
                                candidates.map((candidate) => {
                                    const matchScore = candidate.ats_score !== null && candidate.ats_score !== undefined
                                        ? Math.round(candidate.ats_score)
                                        : null;
                                    const isInterviewing = candidate.status === 'interviewing';

                                    return (
                                        <div key={candidate.application_id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm gap-4">
                                            <div className="flex items-center w-full sm:w-auto">
                                                <div className="relative flex-shrink-0">
                                                    <svg className="w-14 h-14 transform -rotate-90">
                                                        <circle cx="28" cy="28" r="24" className="stroke-current text-gray-100 dark:text-gray-800" strokeWidth="4" fill="transparent" />
                                                        {matchScore !== null && (
                                                            <circle
                                                                cx="28"
                                                                cy="28"
                                                                r="24"
                                                                className={`stroke-current ${matchScore >= 75 ? 'text-green-500' : 'text-yellow-500'}`}
                                                                strokeWidth="4"
                                                                fill="transparent"
                                                                strokeDasharray="150"
                                                                strokeDashoffset={150 - (150 * matchScore) / 100}
                                                            />
                                                        )}
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white">
                                                        {matchScore !== null ? `${matchScore}%` : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="ml-4 text-left">
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg flex items-center">
                                                        {candidate.candidate_name}
                                                        {matchScore !== null && matchScore >= 75 && (
                                                            <CheckCircle2 className="w-4 h-4 text-green-500 ml-1.5" />
                                                        )}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                                                            isInterviewing
                                                                ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400'
                                                                : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400'
                                                        }`}>
                                                            {isInterviewing ? 'Interviewing' : 'Under Review'}
                                                        </span>
                                                        {candidate.skills && candidate.skills.length > 0 && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                                                {candidate.skills.slice(0, 3).join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                                                <button
                                                    onClick={() => handleUpdateStatus(
                                                        candidate.application_id,
                                                        isInterviewing ? 'pending' : 'interviewing'
                                                    )}
                                                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                                                        isInterviewing
                                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                                    }`}
                                                >
                                                    {isInterviewing ? 'Revert to Review' : 'Interview'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}