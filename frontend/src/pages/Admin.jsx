import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getAdminOverview, getAdminActivity, getAdminUsers, toggleUserSuspension } from '../api/admin';

export default function Admin() {
  const user = useAuthStore((state) => state.user);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([getAdminOverview(), getAdminUsers(), getAdminActivity(20)])
      .then(([overviewData, usersData, activityData]) => {
        setOverview(overviewData);
        setUsers(usersData || []);
        setActivity(activityData || []);
      })
      .catch((err) => {
        setError('Failed to load admin data from backend.');
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/discover" replace />;

  async function handleToggleUser(targetUser) {
    const nextSuspended = targetUser.is_active; // if active, set suspended to true
    try {
      const updated = await toggleUserSuspension(targetUser.id, nextSuspended);
      setUsers((current) => current.map((u) => (u.id === targetUser.id ? updated : u)));
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not update user status.');
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wide text-coral">Control room</p>
        <h1 className="font-display text-3xl font-semibold mt-1">Platform administration</h1>
        <p className="text-textLo text-sm mt-1">Monitor users, jobs, and marketplace health in real time.</p>
      </div>

      {error && <p className="text-coral text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-textLo text-center py-20">Loading admin dashboard…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              ['Total Users', overview?.users || 0],
              ['Live Jobs', overview?.jobs || 0],
              ['Applications', overview?.applications || 0],
              ['Interviews', overview?.interviews || 0],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface border border-white/10 rounded-xl p-5">
                <p className="text-xs font-mono uppercase tracking-wide text-textLo">{label}</p>
                <p className="font-display text-3xl mt-2">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <section className="bg-surface border border-white/10 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h2 className="font-display text-xl font-semibold">User management</h2>
              </div>
              <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
                {users.map((candidate) => (
                  <div key={candidate.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        {candidate.name}{' '}
                        {!candidate.is_active && (
                          <span className="text-[10px] font-mono text-coral bg-coral/10 px-1.5 py-0.5 rounded">
                            SUSPENDED
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-textLo">
                        {candidate.email} · {candidate.role || 'seeker'}
                      </p>
                    </div>
                    {candidate.id !== user.id && (
                      <button
                        onClick={() => handleToggleUser(candidate)}
                        className={`text-xs font-mono ${candidate.is_active ? 'text-coral' : 'text-teal'}`}
                      >
                        {candidate.is_active ? 'Suspend' : 'Restore'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-surface border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold">System activity log</h2>
                <span className="text-xs font-mono text-textLo">Live stream</span>
              </div>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {activity.length === 0 ? (
                  <p className="text-sm text-textLo">No recent activity logged.</p>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="text-xs border-b border-white/5 pb-2.5 last:border-0">
                      <div className="flex items-center justify-between text-textLo font-mono">
                        <span>{item.action}</span>
                        <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-textHi mt-0.5">
                        Entity: {item.entity_type} #{item.entity_id || '—'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
