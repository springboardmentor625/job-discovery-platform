import { useState, useEffect } from 'react';
import { Loader2, Users, Search, RefreshCw, Briefcase, Mail } from 'lucide-react';
import { applicationsApi, type ApplicationWithDetails } from '../../api/applications.api';

// Status styling mapping
const statusStyles: Record<string, { bg: string, text: string }> = {
  'Applied': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Shortlisted': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'Interview': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Offer': { bg: 'bg-green-100', text: 'text-green-700' },
  'Hired': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Rejected': { bg: 'bg-red-100', text: 'text-red-700' },
};

const STATUS_OPTIONS = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];

export const Applicants = () => {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchApplications = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await applicationsApi.getMyApplications();
      // Sort newest first
      const sorted = data.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
      setApplications(sorted);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load applicants.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    // Optimistic update
    const previousApps = [...applications];
    setApplications((prev) => 
      prev.map(app => app.application_id === appId ? { ...app, status: newStatus as any } : app)
    );

    try {
      await applicationsApi.updateApplicationStatus(appId, newStatus);
    } catch (err: any) {
      // Revert on failure
      setApplications(previousApps);
      alert('Failed to update status. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading applicants…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={fetchApplications} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      app.job?.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user?.first_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Applicant Tracking</h1>
        <p className="text-slate-500 mt-1">Review and manage candidates who applied to your jobs.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by role, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full rounded-xl border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all shadow-sm min-w-[200px]"
        >
          <option value="All">All Statuses</option>
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No applicants yet</h2>
          <p className="text-slate-500 max-w-md">
            You don't have any applications to review at the moment.
          </p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No applicants match your current filters.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((app) => {
            const style = statusStyles[app.status] || statusStyles['Applied'];
            
            return (
              <div key={app.application_id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-slate-900 text-lg">
                        {app.user?.first_name} {app.user?.last_name}
                      </h3>
                      <span className="text-sm text-slate-400">&bull;</span>
                      <span className="text-sm text-slate-500 font-medium flex items-center gap-1">
                        <Briefcase className="w-4 h-4" /> {app.job?.job_title}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <Mail className="w-3.5 h-3.5" /> {app.user?.email}
                      </span>
                      <span>Applied on {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Status Pipeline</span>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                        className={`font-bold text-sm px-4 py-2 rounded-xl outline-none cursor-pointer transition-colors border-0 ${style.bg} ${style.text}`}
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status} className="bg-white text-slate-900">{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
