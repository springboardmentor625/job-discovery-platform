import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Users, Eye, Building, PlusCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { recruiterDashboardApi, type RecruiterDashboardStats } from '../../api/recruiter-dashboard.api';
import { useAuth } from '../../context/AuthContext';

const iconMap: Record<string, any> = {
  Briefcase: Briefcase,
  Users: Users,
  Eye: Eye,
};

export const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<RecruiterDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await recruiterDashboardApi.getStats();
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading your dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={fetchDashboard} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Empty state: Needs a company
  if (!data.has_company) {
    return (
      <div className="p-6 max-w-5xl mx-auto h-[80vh] flex flex-col justify-center items-center text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
          <Building className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Welcome to SwipeX, Recruiter!</h1>
        <p className="text-slate-600 max-w-lg mb-8 leading-relaxed">
          Before you can start posting jobs and reviewing applicants, you need to set up your Company Profile. 
          This tells candidates who you are and helps them find the right fit.
        </p>
        <Link to="/recruiter/company" className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200">
          <PlusCircle className="w-5 h-5" /> Create Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recruiter Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.email}</p>
        </div>
        <Link 
          to="/recruiter/jobs" 
          className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Post a Job
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.stats.map((stat, i) => {
          const IconComponent = iconMap[stat.icon] || Briefcase;
          return (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Recent Applications</h2>
          <Link to="/recruiter/applicants" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {data.recent_activity.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No recent applications yet. Keep your jobs active and engaging!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                  <th className="p-4 font-semibold w-1/3">Applicant</th>
                  <th className="p-4 font-semibold w-1/3">Role Applied</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_activity.map((activity, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => navigate('/recruiter/applicants')}>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {activity.applicant_name}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{activity.role}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 capitalize">
                        {activity.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-500 text-sm">{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
