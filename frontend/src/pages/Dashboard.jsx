import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FileText, Layers, BarChart3 } from "lucide-react";
import { fetchMe } from "../services/api";
import { SkeletonLine } from "../components/Skeleton";

const QUICK_LINKS = [
  { to: "/resume", label: "Upload your resume", desc: "Parsed automatically for skills", icon: FileText },
  { to: "/jobs", label: "Discover jobs", desc: "Swipe through model-ranked matches", icon: Layers },
  { to: "/analytics", label: "Your analytics", desc: "A real read on your job search", icon: BarChart3 },
];

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe().then(({ data }) => setProfile(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 sm:px-12 py-12">
      <p className="text-sm text-muted mb-1">
        {loading ? <SkeletonLine width="180px" height="0.875rem" /> : (profile ? `${profile.role.replace("_", " ")}` : "\u00A0")}
      </p>
      <h1 className="font-display text-3xl font-bold text-ink mb-10">
        Welcome{user?.username ? `, ${user.username}` : ""}
      </h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="group bg-white border border-line rounded-xl p-5 hover:border-violet-500 hover:shadow-sm transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center mb-3 group-hover:bg-violet-100 transition-colors">
                <Icon size={18} className="text-violet-600" />
              </div>
              <h3 className="font-display font-semibold text-ink text-sm mb-1">{link.label}</h3>
              <p className="text-xs text-muted">{link.desc}</p>
            </Link>
          );
        })}
      </div>

      <div className="bg-white border border-line rounded-xl p-6">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">
          Your account
        </h2>
        {loading ? (
          <div className="space-y-2">
            <SkeletonLine width="60%" />
            <SkeletonLine width="40%" />
          </div>
        ) : profile ? (
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted">Email</dt>
            <dd className="text-ink">{profile.email}</dd>
            <dt className="text-muted">Role</dt>
            <dd className="text-ink capitalize">{profile.role.replace("_", " ")}</dd>
          </dl>
        ) : (
          <p className="text-sm text-muted">Couldn't load profile.</p>
        )}
      </div>
    </div>
  );
}