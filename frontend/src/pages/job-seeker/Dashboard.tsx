import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText,
  Building,
  ArrowRight,
  Loader2,
  RefreshCw,
  Bookmark,
  Zap,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi, type JobSeekerDashboardStats } from '../../api/dashboard.api';

// Icon mapping from backend string to Lucide component
const iconMap: Record<string, any> = {
  'Briefcase': Briefcase,
  'Clock': Clock,
  'CheckCircle': CheckCircle,
  'XCircle': XCircle,
};

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<JobSeekerDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const stats = await dashboardApi.getJobSeekerDashboard();
      setData(stats);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <p className="text-red-500 font-medium">{error || 'Something went wrong.'}</p>
        <button onClick={fetchDashboard} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.first_name || 'Job Seeker'}! 👋
        </h1>
        <p className="text-slate-600 mt-1">Here is what is happening with your job search today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {data.stats.map((stat, i) => {
          const Icon = iconMap[stat.icon] || Briefcase;
          return (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Action Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Continue Swiping</h3>
                <p className="text-blue-100 mb-6 max-w-[200px]">
                  {data.new_matches_count > 0 
                    ? `We have ${data.new_matches_count} new job matches waiting for your review.` 
                    : `Check back soon for new job matches!`}
                </p>
                <Link to="/discover" className="inline-flex items-center bg-white text-blue-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                  Start Swiping <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Resume Optimization</h3>
                <p className="text-slate-600 text-sm mb-4">Your current resume score is --/100. Update it to improve your match rate.</p>
              </div>
              <Link to="/resumes" className="text-indigo-600 font-semibold text-sm hover:text-indigo-700 flex items-center">
                Review Suggestions <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" /> AI Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-100/50 rounded-full blur-2xl" />
                <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-2">Learning Engine</h3>
                <p className="text-slate-600 text-sm mb-4">SwipeX is analyzing your swipes and saves to find you the perfect role. Keep swiping to improve your tailored recommendations!</p>
                <Link to="/discover" className="text-indigo-600 font-bold text-sm hover:text-indigo-700 flex items-center gap-1">
                  Discover Jobs <Zap className="w-4 h-4" />
                </Link>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-3xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100/50 rounded-full blur-2xl" />
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-2">Skill Gap Analysis</h3>
                <p className="text-slate-600 text-sm mb-4">Click "Why This Match?" on any job card to see what skills you need to learn to increase your compatibility score.</p>
                <span className="text-emerald-600 font-bold text-sm flex items-center gap-1">
                  Powered by AI <Target className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            </div>
            
            {data.recent_activity.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500">No recent activity. Start exploring jobs to see updates here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recent_activity.map((activity, i) => (
                  <div key={i} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                      {activity.type === 'saved_job' ? <Bookmark className="w-5 h-5 text-amber-500" /> : <Building className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{activity.role}</p>
                      <p className="text-sm text-slate-500 truncate">{activity.company}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 mb-1">
                        {activity.status}
                      </span>
                      <p className="text-xs text-slate-400 block">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Profile Completion</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className={`text-xs font-semibold inline-block ${data.profile_completion_percentage === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                    {data.profile_completion_percentage}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-100">
                <div 
                  style={{ width: `${data.profile_completion_percentage}%` }} 
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ${data.profile_completion_percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {data.profile_completion_percentage === 100 
                  ? "Looking great! Your profile is fully complete." 
                  : "Complete your profile to unlock premium matches."}
              </p>
              {data.profile_completion_percentage < 100 && (
                <Link to="/profile" className="mt-4 w-full block text-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg transition-colors">
                  Complete Profile
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
