import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Sparkles, RefreshCw } from "lucide-react";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../services/api";
import { SkeletonList } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

const TYPE_CONFIG = {
  high_match: { icon: Sparkles, style: "bg-violet-50 text-violet-700", label: "Strong match" },
  status_change: { icon: RefreshCw, style: "bg-amber-50 text-amber-700", label: "Status update" },
};

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(false);

  const load = () => {
    setLoading(true);
    fetchNotifications(filter).then(({ data }) => setNotifications(data)).finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="px-8 sm:px-12 py-12">
      <div className="flex items-start justify-between mb-1">
        <h1 className="font-display text-3xl font-bold text-ink">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-violet-600 font-semibold hover:text-violet-700">
            Mark all read
          </button>
        )}
      </div>
      <p className="text-muted mb-6">Real alerts from your matches and applications.</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter(false)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${!filter ? "bg-violet-600 text-white" : "bg-white border border-line text-muted hover:border-violet-300"}`}>
          All
        </button>
        <button onClick={() => setFilter(true)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${filter ? "bg-violet-600 text-white" : "bg-white border border-line text-muted hover:border-violet-300"}`}>
          Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </button>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing yet"
          description="Notifications appear when a job scores a strong match, or when an application's status changes."
          action={<Link to="/jobs" className="text-violet-600 font-semibold text-sm">Discover jobs →</Link>}
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.notification_type] || { icon: Bell, style: "bg-gray-50 text-muted", label: n.notification_type };
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${!n.read ? "bg-violet-50/40 border-violet-100" : "bg-white border-line"}`}
              >
                <div className={`w-9 h-9 rounded-full ${config.style} flex items-center justify-center shrink-0`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted mb-0.5">{config.label}</p>
                  <p className="text-sm text-ink">{n.message}</p>
                  <p className="text-xs text-muted mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && (
                  <button onClick={() => handleMarkRead(n.id)} className="text-xs text-muted hover:text-ink shrink-0">
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}