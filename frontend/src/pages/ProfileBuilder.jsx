import { useState, useEffect } from 'react';
import api from '../services/api';
import { UploadCloud, Save, Loader2, FileText, CheckCircle2, User, MapPin, Phone, Code, Link, Trash2 } from 'lucide-react';

export default function ProfileBuilder() {
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [completionScore, setCompletionScore] = useState(0);
    const [message, setMessage] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);

    const [formData, setFormData] = useState({
        phone_number: '',
        location: '',
        about_bio: '',
        linkedin_url: '',
        github_url: '',
        skills: '',
    });
    const [extraData, setExtraData] = useState({ education: [], experience: [] });

    // Live Profile Completion recalculation as the user types (0% to 100%)
    useEffect(() => {
        let score = 0;
        if (formData.phone_number?.trim()) score += 15;
        if (formData.location?.trim()) score += 15;
        if (formData.about_bio?.trim()) score += 15;
        const skillsList = formData.skills
            ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        if (skillsList.length > 0) score += 20;

        const hasLinkedIn = Boolean(formData.linkedin_url?.trim());
        const hasGitHub = Boolean(formData.github_url?.trim());
        if (hasLinkedIn && hasGitHub) score += 15;
        else if (hasLinkedIn || hasGitHub) score += 10;

        if (resumeFile) score += 20;

        if (extraData.education && extraData.education.length > 0) score += 10;
        if (extraData.experience && extraData.experience.length > 0) score += 10;

        setCompletionScore(Math.min(100, score));
    }, [formData, extraData, resumeFile]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/candidates/me');
                if (res.data && Object.keys(res.data).length > 0) {
                    setExtraData({
                        education: Array.isArray(res.data.education) ? res.data.education : [],
                        experience: Array.isArray(res.data.experience) ? res.data.experience : [],
                    });
                    setFormData({
                        phone_number: res.data.phone_number || '',
                        location: res.data.location || '',
                        about_bio: res.data.about_bio || '',
                        linkedin_url: res.data.linkedin_url || '',
                        github_url: res.data.github_url || '',
                        skills: res.data.skills ? res.data.skills.join(', ') : '',
                    });
                    if (res.data.has_resume) {
                        const filename = res.data.resume_file_url
                            ? res.data.resume_file_url.split('/').pop()
                            : 'Master_Resume.pdf';
                        setResumeFile(filename);
                    }
                    setCompletionScore(res.data.profile_completion ?? res.data.profile_health_score ?? 0);
                    return;
                }
                throw new Error("Empty DB data");
            } catch (err) {
                console.error('Failed to load this account profile', err);
            }
        };
        fetchProfile();
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage({ type: 'info', text: 'AI is analyzing your resume...' });

        const form = new FormData();
        form.append('file', file);

        try {
            const res = await api.post('/candidates/resume/upload', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const aiData = res.data.extracted_profile || {};

            setResumeFile(file.name);
            if (aiData.education || aiData.experience) {
                setExtraData(prev => ({
                    education: aiData.education || prev.education,
                    experience: aiData.experience || prev.experience,
                }));
            }
            setFormData(prev => ({
                phone_number: aiData.phone_number || prev.phone_number,
                location: aiData.location || prev.location,
                linkedin_url: aiData.linkedin_url || prev.linkedin_url,
                github_url: aiData.github_url || prev.github_url,
                about_bio: aiData.about_bio || prev.about_bio,
                skills: Array.from(new Set([
                    ...prev.skills.split(',').map(s => s.trim()).filter(Boolean),
                    ...(aiData.skills || []),
                ])).join(', '),
            }));

            setMessage({ type: 'success', text: 'Resume parsed! Review your auto-filled data below.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Resume parse failed. Try another PDF.' });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const payload = {
                phone_number: formData.phone_number,
                location: formData.location,
                about_bio: formData.about_bio,
                linkedin_url: formData.linkedin_url,
                github_url: formData.github_url,
                skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
            };

            const res = await api.put('/candidates/me', payload);
            setCompletionScore(res.data.profile_completion ?? res.data.profile_health_score ?? 0);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Could not save this profile.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Builder</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Upload your resume to let our AI build your profile instantly.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' :
                        message.type === 'info' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' :
                            'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}>
                    {message.type === 'success' && <CheckCircle2 className="w-5 h-5 mr-2" />}
                    {message.type === 'info' && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Completion</h3>

                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="56" className="stroke-current text-gray-200 dark:text-gray-700" strokeWidth="12" fill="transparent" />
                                <circle cx="64" cy="64" r="56" className="stroke-current text-indigo-600 dark:text-indigo-500 transition-all duration-1000 ease-out" strokeWidth="12" fill="transparent" strokeDasharray="351.86" strokeDashoffset={351.86 - (351.86 * completionScore) / 100} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">{completionScore}%</span>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Complete your profile to increase your match rate with top AI jobs.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-indigo-500" /> Master Resume
                        </h3>

                        {resumeFile ? (
                            <div className="flex flex-col h-48 justify-center p-4 border border-indigo-100 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800/50 rounded-xl relative group">
                                <div className="flex flex-col items-center text-center">
                                    <FileText className="w-12 h-12 text-indigo-500 mb-2" />
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{resumeFile}</p>
                                    <p className="text-xs text-green-600 font-bold mt-1 flex items-center justify-center">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Active Profile Source
                                    </p>
                                </div>
                                <button
                                    onClick={() => setResumeFile(null)}
                                    type="button"
                                    className="absolute top-3 right-3 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                    title="Delete & Upload New Resume"
                                >
                                    <Trash2 className="w-5 h-5 hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        ) : (
                            <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                    {uploading ? (
                                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                                    ) : (
                                        <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                                    )}
                                    <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">Upload to auto-fill profile</p>
                                </div>
                                <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                    <form onSubmit={handleSave} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"><Phone className="w-4 h-4 mr-1.5" /> Phone Number</label>
                                <input type="text" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors" placeholder="+1 (555) 000-0000" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> Location</label>
                                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors" placeholder="City, State" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"><Link className="w-4 h-4 mr-1.5" /> LinkedIn URL</label>
                                <input type="url" value={formData.linkedin_url} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors" placeholder="https://linkedin.com/in/..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"><Code className="w-4 h-4 mr-1.5" /> GitHub URL</label>
                                <input type="url" value={formData.github_url} onChange={e => setFormData({ ...formData, github_url: e.target.value })} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors" placeholder="https://github.com/..." />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Technical Skills (Comma separated)</label>
                            <textarea value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} rows="3" className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors leading-relaxed" placeholder="Python, React, Machine Learning..."></textarea>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"><User className="w-4 h-4 mr-1.5" /> Professional Bio</label>
                            <textarea value={formData.about_bio} onChange={e => setFormData({ ...formData, about_bio: e.target.value })} rows="4" className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors leading-relaxed" placeholder="Tell recruiters about your career goals..."></textarea>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={saving} className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                Save Profile
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}