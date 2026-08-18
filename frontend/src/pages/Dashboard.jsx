import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchMe } from "../services/api";

const STEPS = [
  { to: "/profile", label: "Complete your profile", desc: "Bio, skills, experience, portfolio" },
  { to: "/resume", label: "Upload your resume", desc: "AI-parsed for skills automatically" },
  { to: "/jobs", label: "Discover jobs", desc: "Swipe through ATS-matched recommendations" },
  { to: "/applications", label: "Track applications", desc: "See what you've saved and applied to" },
];

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchMe()
      .then(({ data }) => setProfile(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome{user?.username ? `, ${user.username}` : ""} 👋
      </h1>
      <p className="text-gray-500 mb-8">
        Here's the candidate workflow, start to finish.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {STEPS.map((step) => (
          <Link
            key={step.to}
            to={step.to}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-300 hover:shadow-sm transition"
          >
            <h3 className="font-semibold text-gray-900">{step.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{step.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Your account
        </h2>
        {profile ? (
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900">{profile.email}</dd>
            <dt className="text-gray-500">Role</dt>
            <dd className="text-gray-900 capitalize">{profile.role.replace("_", " ")}</dd>
          </dl>
        ) : (
          <p className="text-sm text-gray-400">Loading profile...</p>
        )}
      </div>
    </div>
  );
}