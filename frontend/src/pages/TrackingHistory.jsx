import { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, FileText, ExternalLink, X, CheckCircle2, AlertCircle, Briefcase, MapPin } from 'lucide-react';

export default function TrackingHistory() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'applied' | 'passed'

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/swipes/history');
                setApplications(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Failed to load swipe history for this account', err);
                setApplications([]);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const formatStatus = (status) => {
        if (!status) return 'Submitted';
        const s = String(status).toLowerCase();
        if (s === 'pending') return 'Submitted';
        if (s === 'interviewing') return 'Interviewing';
        if (s === 'rejected') return 'Rejected';
        if (s === 'passed') return 'Passed';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const getStatusBadgeStyle = (status) => {
        const s = String(status || '').toLowerCase();
        if (s === 'pending' || s === 'submitted') {
            return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800';
        }
        if (s === 'interviewing') {
            return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-800';
        }
        if (s === 'rejected') {
            return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800';
        }
        if (s === 'passed') {
            return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
        }
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-800';
    };

    const getScore = (app) => {
        if (!app) return null;
        if (app.ats_report && typeof app.ats_report.ats_score === 'number') {
            return app.ats_report.ats_score;
        }
        if (typeof app.ats_score === 'number') {
            return app.ats_score;
        }
        return null;
    };

    const appliedApps = applications.filter(
        (a) => a.swipe_direction === 'right' || (a.status !== 'passed' && a.swipe_direction !== 'left')
    );
    const passedApps = applications.filter(
        (a) => a.swipe_direction === 'left' || a.status === 'passed'
    );

    const counts = {
        all: applications.length,
        applied: appliedApps.length,
        passed: passedApps.length,
    };

    const filteredApplications =
        activeTab === 'applied'
            ? appliedApps
            : activeTab === 'passed'
            ? passedApps
            : applications;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    const modalReport = selectedApp?.ats_report || {};
    const modalAtsScore = getScore(selectedApp);
    const missingSkills = Array.isArray(modalReport.missing_skills) ? modalReport.missing_skills : [];
    const suggestions = Array.isArray(modalReport.improvement_suggestions) ? modalReport.improvement_suggestions : [];
    const hasAtsData = modalAtsScore !== null;
    const isLowScore = hasAtsData && modalAtsScore < 75;

    return (
        <div className="max-w-6xl mx-auto space-y-6 relative">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                    <FileText className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-400" />
                    Application History
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Track the status of all roles you swiped right (applied) or left (passed) on.
                </p>
            </div>

            {/* 3-Way Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                {[
                    { id: 'all', label: 'All', count: counts.all },
                    { id: 'applied', label: 'Applied', count: counts.applied },
                    { id: 'passed', label: 'Passed', count: counts.passed },
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${
                                isActive
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/30'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`px-2 py-0.5 text-xs rounded-full font-extrabold ${
                                    isActive
                                        ? 'bg-white/25 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {filteredApplications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
                            {activeTab === 'applied'
                                ? 'No applied roles yet'
                                : activeTab === 'passed'
                                ? 'No passed roles yet'
                                : 'No activity yet'}
                        </h3>
                        <p className="text-sm mt-1">
                            {activeTab === 'applied'
                                ? 'Swipe right on job cards in your feed to apply and view your applications.'
                                : activeTab === 'passed'
                                ? 'Jobs you swipe left on will appear here with match breakdown.'
                                : 'Swipe right to apply or left to pass on job cards in your feed.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                                    <th className="p-4 text-left">Role / Company</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center">AI ATS Score</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredApplications.map((app, idx) => {
                                    const score = getScore(app);
                                    const isPassed = app.swipe_direction === 'left' || app.status === 'passed';
                                    const displayStatus = isPassed ? 'passed' : app.status;

                                    return (
                                        <tr key={app.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 text-left">
                                                <div className="font-bold text-gray-900 dark:text-white">{app.job?.title || 'Job Application'}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{app.job?.company_name || 'Hiring Company'}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadgeStyle(displayStatus)}`}>
                                                    {formatStatus(displayStatus)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {score !== null ? (
                                                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-extrabold border ${
                                                        score >= 75
                                                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800'
                                                            : 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800'
                                                    }`}>
                                                        {Number(score).toFixed(2)}% Match
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                                                        {isPassed ? 'Passed' : 'Not Scored'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => setSelectedApp(app)}
                                                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold flex items-center text-sm"
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-1.5" /> Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                        
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-gray-900/50">
                            <div>
                                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                    {selectedApp.job?.title || 'Job Application'}
                                </h2>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                    <Briefcase className="w-4 h-4 mr-1.5 text-gray-400" />
                                    {selectedApp.job?.company_name || 'Hiring Company'}
                                    {selectedApp.job?.location && (
                                        <>
                                            <span className="mx-2">•</span>
                                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                            {selectedApp.job.location}
                                        </>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-gray-700 p-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 space-y-6">
                            
                            {/* Application Status & Role Summary */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                                <div>
                                    <span className="text-xs uppercase font-bold text-gray-400">Application Status</span>
                                    <div className="mt-1">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadgeStyle(selectedApp.status)}`}>
                                            {formatStatus(selectedApp.status)}
                                        </span>
                                    </div>
                                </div>
                                {selectedApp.job?.required_skills && selectedApp.job.required_skills.length > 0 && (
                                    <div className="text-right">
                                        <span className="text-xs uppercase font-bold text-gray-400">Target Skills</span>
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
                                            {selectedApp.job.required_skills.slice(0, 4).join(', ')}
                                            {selectedApp.job.required_skills.length > 4 && '...'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Real ATS Analysis Section */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">AI Match Analysis</h3>
                                <div className="bg-indigo-50/60 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50 p-5 rounded-2xl space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                                        <div className="relative flex-shrink-0 w-20 h-20">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="40" cy="40" r="36" className="stroke-current text-indigo-100 dark:text-indigo-950" strokeWidth="8" fill="transparent" />
                                                {hasAtsData && (
                                                    <circle
                                                        cx="40"
                                                        cy="40"
                                                        r="36"
                                                        className={`stroke-current transition-all duration-1000 ${
                                                            modalAtsScore >= 75 ? 'text-green-500' : 'text-amber-500'
                                                        }`}
                                                        strokeWidth="8"
                                                        fill="transparent"
                                                        strokeDasharray="226"
                                                        strokeDashoffset={226 - (226 * Math.min(100, Math.max(0, modalAtsScore))) / 100}
                                                        strokeLinecap="round"
                                                    />
                                                )}
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-900 dark:text-white">
                                                {hasAtsData ? `${Number(modalAtsScore).toFixed(2)}%` : 'N/A'}
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-2 text-left">
                                            {hasAtsData ? (
                                                suggestions.length > 0 ? (
                                                    suggestions.map((suggestion, idx) => (
                                                        <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                                                            {isLowScore ? (
                                                                <AlertCircle className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                                                            ) : (
                                                                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                                            )}
                                                            <span>{suggestion}</span>
                                                        </p>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                                        <span>Profile match evaluated against job criteria.</span>
                                                    </p>
                                                )
                                            ) : (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Upload your resume in Profile Builder to generate real AI ATS match reports for applied positions.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actionable Missing Skills from Real ATS Report */}
                                    {missingSkills.length > 0 && (
                                        <div className="space-y-2 pt-3 border-t border-indigo-100 dark:border-indigo-800/50">
                                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Missing Skills Identified
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {missingSkills.map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold rounded-lg border border-red-200 dark:border-red-800/50"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Job Description Overview */}
                            {selectedApp.job?.description && (
                                <section>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Job Description</h3>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-48 overflow-y-auto">
                                        {selectedApp.job.description}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}