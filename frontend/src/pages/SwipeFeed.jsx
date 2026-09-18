import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import api from '../services/api';
import JobCard from '../components/swipe/JobCard';
import { Loader2, Briefcase } from 'lucide-react';

function normalizeJobs(payload) {
    const list = Array.isArray(payload) ? payload : payload?.jobs || payload?.items || [];
    return list.filter((job) => job && job.id).map((job) => ({
        id: job.id,
        title: job.title,
        company_name: job.company_name,
        location: job.location || null,
        description: job.description,
        required_skills: Array.isArray(job.required_skills) ? job.required_skills : [],
        is_active: job.is_active !== false,
        match_score: typeof job.match_score === 'number' ? job.match_score : null,
        top_resume_match: job.top_resume_match || null,
    }));
}

export default function SwipeFeed() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchFeed = async () => {
            try {
                const res = await api.get('/jobs');
                if (!cancelled) {
                    setJobs(normalizeJobs(res.data));
                }
            } catch (error) {
                console.error('Recommended job feed unavailable', error);
                if (!cancelled) setJobs([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchFeed();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSwipe = async (direction, jobId) => {
        setJobs((currentJobs) => currentJobs.filter((job) => job && job.id !== jobId));

        try {
            await api.post('/swipes/action', {
                job_id: jobId,
                direction,
            });
        } catch (error) {
            console.error('Swipe failed to register on backend', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Ranking jobs for your profile...</p>
            </div>
        );
    }

    const validJobs = jobs.filter((job) => job && job.id);
    const visibleJobs = validJobs.slice(0, 3);

    return (
        <div className="w-full min-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
            <div className="text-center mb-4 shrink-0">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">AI Job Queue</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Swipe right to apply, left to pass.</p>
            </div>

            <div className="relative flex-1 w-full min-h-[560px]">
                {visibleJobs.length > 0 ? (
                    <AnimatePresence>
                        {visibleJobs.slice().reverse().map((job, reversedIndex) => {
                            const stackIndex = visibleJobs.length - 1 - reversedIndex;
                            return (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    onSwipe={handleSwipe}
                                    isTop={stackIndex === 0}
                                    stackIndex={stackIndex}
                                />
                            );
                        })}
                    </AnimatePresence>
                ) : (
                    <div className="text-center flex flex-col items-center p-10 bg-white dark:bg-gray-800 rounded-[28px] border border-dashed border-gray-300 dark:border-gray-700 w-full h-full justify-center">
                        <Briefcase className="w-20 h-20 text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">You're all caught up!</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs">We are scanning the market for more matches. Check back later.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
