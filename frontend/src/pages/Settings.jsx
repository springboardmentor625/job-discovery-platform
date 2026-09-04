import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaHistory,
  FaUserCircle,
} from "react-icons/fa";

function Settings() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mt-2 text-3xl font-bold text-sx-text">Settings</h1>
          <p className="mt-1 text-sm text-sx-text-secondary">
            Manage your profile and review your swipe activity.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              navigate("/candidate/settings/profile", {
                state: { returnTo: "/candidate/settings" },
              })
            }
            className="group flex min-h-56 flex-col items-center justify-center rounded-2xl border border-sx-border bg-sx-card px-6 py-7 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-sx-primary-light hover:shadow-md"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sx-primary-soft text-3xl text-sx-primary-dark">
              <FaUserCircle />
            </span>
            <span className="mt-4 text-xl font-bold text-sx-primary-dark">
              Edit Profile
            </span>
            <span className="mt-2 max-w-xs text-sm leading-relaxed text-sx-text-secondary">
              Update your personal information and preferences.
            </span>
            <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sx-primary px-5 py-2 text-sm font-semibold text-white transition group-hover:bg-sx-primary-dark">
              Open <FaArrowRight className="text-xs" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/candidate/settings/history")}
            className="group flex min-h-56 flex-col items-center justify-center rounded-2xl border border-sx-border bg-sx-card px-6 py-7 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-sx-primary-light hover:shadow-md"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sx-primary-soft text-3xl text-sx-primary-dark">
              <FaHistory />
            </span>
            <span className="mt-4 text-xl font-bold text-sx-primary-dark">
              Swipe History
            </span>
            <span className="mt-2 max-w-xs text-sm leading-relaxed text-sx-text-secondary">
              View your past swipes, likes and passes.
            </span>
            <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sx-primary px-5 py-2 text-sm font-semibold text-white transition group-hover:bg-sx-primary-dark">
              Open <FaArrowRight className="text-xs" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
