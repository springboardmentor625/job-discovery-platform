import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications } from '../api/notifications';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((data) => setItems(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wide text-teal">Signal center</p>
        <h1 className="font-display text-3xl font-semibold mt-1">Notifications</h1>
        <p className="text-textLo text-sm mt-1">The opportunities and changes worth your attention.</p>
      </div>

      {loading && <p className="text-textLo text-center py-20">Loading notifications…</p>}

      {!loading && items.length === 0 && (
        <div className="bg-surface border border-white/10 rounded-xl p-8 text-center text-textLo">
          <p className="text-base text-textHi font-medium mb-1">No notifications yet</p>
          <p className="text-sm">Swipe right on roles in Discover to apply and receive application updates.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-white/10 rounded-xl p-5 hover:border-gold/40 transition-colors"
            >
              <div className="flex gap-4 items-start">
                <span className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 bg-gold" />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-semibold">{item.title}</h2>
                  <p className="text-sm text-textLo mt-1">{item.detail}</p>
                  <p className="text-[10px] font-mono text-textLo/60 mt-2">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
