import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../services/api";

const TYPE_STYLES = {
  high_match: "bg-cobalt-50 text-cobalt-700",
  status_change: "bg-gold-50 text-gold-700",
};

const TYPE_LABELS = {
  high_match: "Strong match",
  status_change: "Status update",
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
    <div className="flex-1 px-6 sm:px-10 py-14 max-w-2xl mx-auto w-full">
      <div className="flex items-start justify-between mb-1">
        <h1 className="font-display text-3xl font-semibold text-ink">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-cobalt-600 font-medium hover:text-cobalt-700"
          >
            Mark all read
          </button>
        )}
      </div>
      <p className="text-slate mb-6">Real alerts from your matches and applications.</p>

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setFilter(false)}
          className={`px-3.5 py-1.5 rounded-full text-sm transition-colors ${!filter ? "bg-ink text-paper" : "text-slate hover:text-ink"}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter(true)}
          className={`px-3.5 py-1.5 rounded-full text-sm transition-colors ${filter ? "bg-ink text-paper" : "text-slate hover:text-ink"}`}
        >
          Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </button>
      </div>

      {loading ? (
        <p className="text-slate mt-6">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-slate mt-6">
          Nothing yet — notifications appear when a job scores a strong match, or when an
          application's status changes. Try{" "}
          <Link to="/jobs" className="text-cobalt-600 font-medium">discovering jobs</Link>.
        </p>
      ) : (
        <div>
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 py-4 border-t border-line last:border-b ${!n.read ? "bg-white/60 -mx-3 px-3 rounded-lg" : ""}`}
            >
              <div>
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-1.5 ${TYPE_STYLES[n.notification_type] || "bg-paper text-slate"}`}>
                  {TYPE_LABELS[n.notification_type] || n.notification_type}
                </span>
                <p className="text-sm text-ink">{n.message}</p>
                <p className="text-xs text-slate mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs text-slate hover:text-ink shrink-0 mt-1"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}