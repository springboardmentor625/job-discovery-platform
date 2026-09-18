import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function MatchBadge({ score }) {
    if (!score && score !== 0) return <span className="text-gray-400 dark:text-gray-500 text-sm">Processing...</span>;
    
    if (score >= 75) {
        return (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {score}% Match
            </div>
        );
    } else if (score >= 50) {
        return (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> {score}% Match
            </div>
        );
    } else {
        return (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                <XCircle className="w-3.5 h-3.5 mr-1" /> {score}% Match
            </div>
        );
    }
}