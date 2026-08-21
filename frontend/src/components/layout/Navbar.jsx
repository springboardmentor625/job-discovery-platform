import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { logoutUser } from '../../api/auth';
import { getNotifications } from '../../api/notifications';

const links = [
  { to: '/discover', label: 'Discover' },
  { to: '/ats-workflow', label: 'ATS Workflow' },
  { to: '/saved', label: 'Saved' },
  { to: '/applications', label: 'Applications' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time background sync for notifications (every 10s)
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    function fetchSignalData() {
      getNotifications()
        .then((items) => {
          if (isMounted && Array.isArray(items)) {
            setUnreadCount(items.length);
          }
        })
        .catch(() => {});
    }

    fetchSignalData();
    const timer = setInterval(fetchSignalData, 10000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [user]);

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      // token may already be expired — clear locally regardless
    }
    clearAuth();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NavLink to="/discover" className="font-display text-xl font-semibold text-gold flex items-center gap-2">
          <span>SwipeX</span>
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse" title="Realtime Engine Active" />
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-body transition-colors ${
                  isActive ? 'text-gold bg-white/5 font-medium' : 'text-textLo hover:text-textHi'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-body transition-colors relative flex items-center gap-1.5 ${
                isActive ? 'text-gold bg-white/5 font-medium' : 'text-textLo hover:text-textHi'
              }`
            }
          >
            <span>Alerts</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-gold/20 text-gold border border-gold/40 animate-pulse">
                {unreadCount}
              </span>
            )}
          </NavLink>
          {user?.role === 'recruiter' && (
            <NavLink
              to="/recruiter"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-body transition-colors ${
                  isActive ? 'text-gold bg-white/5 font-medium' : 'text-textLo hover:text-textHi'
                }`
              }
            >
              Recruiter
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-body transition-colors ${
                  isActive ? 'text-gold bg-white/5 font-medium' : 'text-textLo hover:text-textHi'
                }`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal" />
            <span className="text-sm text-textHi font-medium">{user?.name}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surfaceHi border border-white/10 text-gold uppercase">
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-mono uppercase tracking-wide text-textLo hover:text-coral transition-colors ml-2"
          >
            Log out
          </button>
        </div>
      </div>

      <nav className="md:hidden flex items-center justify-around border-t border-white/10 py-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `text-xs font-mono ${isActive ? 'text-gold' : 'text-textLo'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
