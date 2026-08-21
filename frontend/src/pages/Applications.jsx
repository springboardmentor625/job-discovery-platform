import { useEffect, useState } from 'react';
import { getApplications } from '../api/dashboard';
import { getApplicationAtsReport } from '../api/ats';
import ATSWorkflowVisualizer from '../components/ats/ATSWorkflowVisualizer';

const statusColors = {
  Applied: 'bg-textLo/15 text-textLo',
  Viewed: 'bg-gold/15 text-gold',
  Shortlisted: 'bg-teal/15 text-teal',
  Interview: 'bg-teal/25 text-teal',
  Rejected: 'bg-coral/15 text-coral',
  Offer: 'bg-teal/25 text-teal',
};

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    let isMounted = true;

    function fetchApps() {
      getApplications()
        .then((data) => {
          if (isMounted && Array.isArray(data)) {
            setApplications(data);
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    fetchApps();
    const timer = setInterval(fetchApps, 8000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  async function handleViewAtsReport(applicationId) {
    setLoadingReport(true);
    try {
      const report = await getApplicationAtsReport(applicationId);
      setSelectedReport(report);
    } catch {
      alert('Could not load ATS report for this application.');
    } finally {
      setLoadingReport(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-1">Applications</h1>
      <p className="text-textLo text-sm mb-8">Every job you've applied to, tracked in one place with automated ATS evaluation reports.</p>

      {loading && <p className="text-textLo text-center py-20">Loading applications…</p>}

      {!loading && applications.length === 0 && (
        <p className="text-textLo text-center py-20">
          No applications yet — swipe right on a job in Discover to apply.
        </p>
      )}

      {!loading && applications.length > 0 && (
        <div className="bg-surface border border-white/10 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-mono uppercase tracking-wide text-textLo border-b border-white/10">
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Match</th>
                <th className="px-5 py-3">Applied</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">ATS Report</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3 font-medium text-textHi">{app.job_title || app.title}</td>
                  <td className="px-5 py-3 text-textLo">{app.company}</td>
                  <td className="px-5 py-3 text-gold font-mono text-xs">{app.match_score ? `${Math.round(app.match_score)}%` : '—'}</td>
                  <td className="px-5 py-3 text-textLo font-mono text-xs">
                    {app.created_at || app.applied_at ? new Date(app.created_at || app.applied_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block text-xs font-mono px-2.5 py-1 rounded-full font-medium ${statusColors[app.status] || statusColors.Applied}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleViewAtsReport(app.id)}
                      disabled={loadingReport}
                      className="px-3 py-1.5 rounded-lg bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 font-mono text-xs transition-colors"
                    >
                      Workflow & Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ATS Workflow Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg border border-white/15 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display text-xl font-semibold text-textHi flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal" />
                Application ATS Report
              </h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-textLo hover:text-textHi text-sm font-mono px-2.5 py-1 rounded bg-surfaceHi"
              >
                ✕ Close
              </button>
            </div>

            <ATSWorkflowVisualizer report={selectedReport} />
          </div>
        </div>
      )}
    </div>
  );
}
