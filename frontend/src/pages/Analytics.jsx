import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  FileText,
  Briefcase,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function Analytics() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [swipeHistory, setSwipeHistory] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const res = await api.get("/analytics/dashboard");
      const data = res.data;

      // Status data with positive values
      const statusData = (data.status_distribution || [
        { name: "Applied", value: data.applied_count || 0, color: "#3b82f6" },
        { name: "Shortlisted", value: data.shortlisted_count || 0, color: "#f59e0b" },
        { name: "Selected", value: data.selected_count || 0, color: "#10b981" },
        { name: "Rejected", value: data.rejected_count || 0, color: "#ef4444" },
      ]).filter((s) => s.value > 0);

      setStats({
        totalApplications: data.total_applications || 0,
        appliedCount: data.applied_count || 0,
        interviewCount: data.shortlisted_count || 0,
        offersCount: data.selected_count || 0,
        rejectedCount: data.rejected_count || 0,
        interestedCount: data.interested_count || 0,
        avgAtsScore: data.avg_ats_score || 0,
        skillGaps: data.skill_gaps || [],
        last7Days: data.application_trends || [],
        statusData: statusData.length > 0 ? statusData : [{ name: "No Applications Yet", value: 1, color: "#64748b" }],
        responseRate: data.response_rate || 0,
      });
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
        <div className="text-center text-slate-400">
          <p>No data available yet</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${color} rounded-lg p-6 text-white shadow-lg`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-200">{label}</p>
        <Icon className="w-6 h-6 opacity-70" />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold">{value}</p>
        {trend && (
          <span className="text-sm text-green-200 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics</h1>
              <p className="text-slate-400">Track your job search progress</p>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Briefcase}
            label="Total Applications"
            value={stats.totalApplications}
            color="from-blue-600 to-blue-700"
            trend={`+${stats.appliedCount} this period`}
          />
          <StatCard
            icon={Clock}
            label="Interested Jobs"
            value={stats.interestedCount}
            color="from-purple-600 to-purple-700"
          />
          <StatCard
            icon={CheckCircle}
            label="Response Rate"
            value={`${stats.responseRate}%`}
            color="from-green-600 to-green-700"
          />
          <StatCard
            icon={FileText}
            label="Interviews"
            value={stats.interviewCount}
            color="from-orange-600 to-orange-700"
            trend={`+${stats.offersCount} offers`}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Application Trend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-2 bg-slate-800 rounded-lg p-6 border border-slate-700"
          >
            <h2 className="text-xl font-bold text-white mb-6">
              Application Trend (Last 7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Status Distribution */}
          {stats.statusData.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700"
            >
              <h2 className="text-xl font-bold text-white mb-6">
                Status Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {/* Detailed Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800 rounded-lg p-6 border border-slate-700"
        >
          <h2 className="text-xl font-bold text-white mb-6">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm mb-2">Applied Jobs</p>
              <p className="text-2xl font-bold text-blue-400">
                {stats.appliedCount}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {((stats.appliedCount / stats.totalApplications) * 100).toFixed(
                  1
                )}
                % of total
              </p>
            </div>

            <div className="p-4 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm mb-2">Interviewing</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.interviewCount}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {((stats.interviewCount / stats.totalApplications) * 100).toFixed(
                  1
                )}
                % of total
              </p>
            </div>

            <div className="p-4 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm mb-2">Offers Received</p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.offersCount}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {((stats.offersCount / stats.totalApplications) * 100).toFixed(
                  1
                )}
                % of total
              </p>
            </div>

            <div className="p-4 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm mb-2">Rejected</p>
              <p className="text-2xl font-bold text-red-400">
                {stats.rejectedCount}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {((stats.rejectedCount / stats.totalApplications) * 100).toFixed(
                  1
                )}
                % of total
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 p-6 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg"
        >
          <p className="text-blue-300">
            💡 <strong>Pro Tip:</strong> Keep applying to multiple positions and
            customize your resume for each application to increase your response rate.
            Most successful candidates apply to 5-10 positions per week.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
