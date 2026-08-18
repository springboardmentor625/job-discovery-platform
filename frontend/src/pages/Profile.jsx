import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, updateProfile } from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bio: "",
    skills: "",
    experience: "",
    portfolio_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMe().then(({ data }) => {
      setForm({
        bio: data.bio || "",
        skills: (data.skills || []).join(", "),
        experience: data.experience || "",
        portfolio_url: data.portfolio_url || "",
      });
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setLoading(true);
    try {
      await updateProfile({
        bio: form.bio,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        experience: form.experience,
        portfolio_url: form.portfolio_url,
      });
      setSaved(true);
    } catch {
      setError("Couldn't save your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete your profile</h1>
      <p className="text-gray-500 mb-8">
        This helps us tailor your job recommendations.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-4"
      >
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </p>
        )}
        {saved && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2">
            Profile saved.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Skills (comma-separated)
          </label>
          <input
            name="skills"
            value={form.skills}
            onChange={handleChange}
            placeholder="python, react, sql"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
          <textarea
            name="experience"
            value={form.experience}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Portfolio URL
          </label>
          <input
            name="portfolio_url"
            value={form.portfolio_url}
            onChange={handleChange}
            placeholder="https://github.com/you"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save profile"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/resume")}
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition"
          >
            Next: Upload resume →
          </button>
        </div>
      </form>
    </div>
  );
}