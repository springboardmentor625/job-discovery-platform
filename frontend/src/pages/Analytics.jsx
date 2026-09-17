import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { TrendingUp, Send, Layers } from "lucide-react";
import { fetchAnalyticsSummary } from "../services/api";
import { SkeletonCard } from "../components/Skeleton";

const STATUS_LABELS = { saved: "Saved", interested: "Interested", skipped: "Skipped", interview: "Interview", shortlisted: "Shortlisted", rejected: "Rejected" };
const DIRECTION_LABELS = { left: "Skipped", save: "Saved", right: "Applied" };
const VIOLET_SHADES = ["#5B21B6", "#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD"];

function BarSection({ title, data }) {
  if (data.length === 0) {
    return (
      <div>
        <h2 className="font-display font-semibold text-ink mb-4 text-sm">{title}</h2>
        <p className="text-sm text-muted">No data yet.</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="font-display font-semibold text-ink mb-4 text-sm">{title}</h2>
      <ResponsiveContainer width="100%" height={Math.max(140, data.length * 44)}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 12, fill: "#6B6478" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#F3EFFB" }} contentStyle={{ borderRadius: 8, border: "1px solid #E7E3EE", fontSize: 12 }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
            {data.map((_, i) => <Cell key={i} fill={VIOLET_SHADES[i % VIOLET_SHADES.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsSummary().then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-8 sm:px-12 py-12 max-w-3xl space-y-4">
        <SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  if (!data) {
    return <div className="px-8 sm:px-12 py-12 text-muted">Couldn't load analytics.</div>;
  }

  const statusData = Object.entries(data.applications_by_status || {}).map(([status, count]) => ({ label: STATUS_LABELS[status] || status, count }));
  const directionData = Object.entries(data.swipes_by_direction || {}).map(([direction, count]) => ({ label: DIRECTION_LABELS[direction] || direction, count }));
  const skillData = (data.top_skills_in_your_applications || []).map((s) => ({ label: s.skill, count: s.count }));

  return (
    <div className="px-8 sm:px-12 py-12">
      <h1 className="font-display text-3xl font-bold text-ink mb-1">Your analytics</h1>
      <p className="text-muted mb-8">A real read on your job search so far.</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-line rounded-xl p-5">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-2">
            <TrendingUp size={16} className="text-violet-600" />
          </div>
          <p className="text-xs text-muted mb-0.5">Average match score</p>
          <p className="font-display text-2xl font-bold text-ink">
            {data.average_match_score !== null ? `${data.average_match_score}%` : "—"}
          </p>
        </div>
        <div className="bg-white border border-line rounded-xl p-5">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-2">
            <Send size={16} className="text-violet-600" />
          </div>
          <p className="text-xs text-muted mb-0.5">Applications sent</p>
          <p className="font-display text-2xl font-bold text-ink">
            {statusData.reduce((sum, s) => sum + s.count, 0)}
          </p>
        </div>
        <div className="bg-white border border-line rounded-xl p-5">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-2">
            <Layers size={16} className="text-violet-600" />
          </div>
          <p className="text-xs text-muted mb-0.5">Jobs on platform</p>
          <p className="font-display text-2xl font-bold text-ink">{data.total_jobs_in_platform}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-8 bg-white border border-line rounded-xl p-6 mb-8">
        <BarSection title="Application funnel" data={statusData} />
        <BarSection title="Swipe activity" data={directionData} />
      </div>

      <div className="bg-white border border-line rounded-xl p-6">
        <BarSection title="Most common skills in jobs you've applied to" data={skillData} />
      </div>
    </div>
  );
}