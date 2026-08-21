import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getDashboardStats } from '../api/dashboard';
import SplitFlapStat from '../components/dashboard/SplitFlapStat';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-textLo text-center py-20">Loading dashboard…</p>;
  if (!stats) return <p className="text-coral text-center py-20">Could not load dashboard data.</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-1">Dashboard</h1>
      <p className="text-textLo text-sm mb-8">Your search, at a glance.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <SplitFlapStat label="Applications" value={stats.applications} />
        <SplitFlapStat label="New matches (7d)" value={stats.new_matches} />
        <SplitFlapStat label="Saved jobs" value={stats.saved_jobs} />
        <SplitFlapStat label="Shortlisted" value={stats.shortlisted} />
        <SplitFlapStat label="Interviews" value={stats.interviews} />
        <SplitFlapStat label="Avg. match" value={`${stats.average_match}%`} />
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-6">
        <section className="bg-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-mono uppercase tracking-wide text-teal">Career intelligence</p>
              <h2 className="font-display text-xl font-semibold mt-1">Your next best moves</h2>
            </div>
            <span className="text-xs font-mono text-textLo">Live signals</span>
          </div>
          <div className="space-y-3">
            {(stats.notifications || []).map((notification) => (
              <div key={notification.title} className="flex gap-3 rounded-lg bg-surfaceHi border border-white/5 p-3">
                <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notification.type === 'competition' ? 'bg-teal' : notification.type === 'skill' ? 'bg-coral' : 'bg-gold'}`} />
                <div>
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-textLo mt-0.5">{notification.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-dossier text-inkOnPaper rounded-xl p-6 shadow-dossier">
          <p className="text-xs font-mono uppercase tracking-wide text-inkOnPaper/60">Resume optimization</p>
          <div className="flex items-end justify-between gap-4 mt-2">
            <h2 className="font-display text-4xl font-semibold">{stats.average_match || 0}%</h2>
            <span className="text-xs font-mono text-inkOnPaper/60">application match</span>
          </div>
          <div className="h-2 bg-inkOnPaper/10 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-teal rounded-full" style={{ width: `${Math.min(100, stats.average_match || 0)}%` }} />
          </div>
          <p className="text-sm text-inkOnPaper/70 mt-4">
            {stats.skill_gaps?.length ? `Add ${stats.skill_gaps.join(', ')} to improve ATS keyword coverage.` : 'Your profile skills cover the current recommendation set.'}
          </p>
        </section>
      </div>

      <div className="bg-surface border border-white/10 rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Applications — last 7 days</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={stats.trend}>
            <defs>
              <linearGradient id="applicationsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D6A24E" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#D6A24E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff10" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })}
              stroke="#9AA6B8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#9AA6B8" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#121F35', border: '1px solid #ffffff20', borderRadius: 8 }}
              labelStyle={{ color: '#F5F3EC' }}
            />
            <Area
              type="monotone"
              dataKey="applications"
              stroke="#D6A24E"
              strokeWidth={2}
              fill="url(#applicationsFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
