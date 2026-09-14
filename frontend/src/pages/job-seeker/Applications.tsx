import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Building, MapPin, Loader2, RefreshCw, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { applicationsApi, type ApplicationWithDetails } from '../../api/applications.api';

// Status styling mapping
const statusStyles: Record<string, { bg: string, text: string, icon: any }> = {
  'Applied': { bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  'Shortlisted': { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: CheckCircle },
  'Interview': { bg: 'bg-amber-50', text: 'text-amber-700', icon: Calendar },
  'Offer': { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle },
  'Hired': { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
  'Rejected': { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
};

export const Applications = () => {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await applicationsApi.getMyApplications();
      setApplications(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load applications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm">Loading applications…</p>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={fetchApplications} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // ─── Empty ────────────────────────────────────────────────────────────────
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No applications yet</h2>
        <p className="text-slate-500 text-sm max-w-md">
          You haven't submitted any job applications. Save jobs you like and apply to them from your Saved Jobs page!
        </p>
        <Link to="/saved" className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors">
          View Saved Jobs
        </Link>
      </div>
    );
  }

  // Sort applications by date descending
  const sortedApps = [...applications].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());

  // ─── List ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Application Tracking</h1>
        <p className="text-slate-500 text-sm mt-1">Track the status of your {applications.length} submitted application{applications.length !== 1 ? 's' : ''}.</p>
      </div>

      <div className="grid gap-4">
        {sortedApps.map((app) => {
          const style = statusStyles[app.status] || statusStyles['Applied'];
          const StatusIcon = style.icon;

          return (
            <div
              key={app.application_id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center gap-6"
            >
              <div className="flex items-start gap-4 flex-1">
                {/* Company Logo */}
                <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  {app.job?.company_logo
                    ? <img src={app.job.company_logo} alt={app.job.company_name || ''} className="w-full h-full object-cover rounded-xl" />
                    : <Building className="w-7 h-7 text-slate-400" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg truncate">{app.job?.job_title || 'Unknown Position'}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">{app.job?.company_name || 'Company'}</p>

                  <div className="flex flex-wrap gap-3 mt-3">
                    {app.job?.location && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <MapPin className="w-3.5 h-3.5" />{app.job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      <Calendar className="w-3.5 h-3.5" /> Applied {new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 flex items-center justify-end">
                <div className={`px-4 py-2.5 rounded-xl flex items-center gap-2 ${style.bg} ${style.text}`}>
                  <StatusIcon className="w-5 h-5" />
                  <span className="font-bold text-sm">{app.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
