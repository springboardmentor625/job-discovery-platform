import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link2, Briefcase, Plus, Trash2 } from "lucide-react";
import { fetchMe, updateProfile } from "../services/api";
import Avatar from "../components/Avatar";
import TagInput from "../components/TagInput";
import { useSelector } from "react-redux";

const REQUIRED_LABELS = {
  bio: "Bio is required.",
  skills: "Add at least one skill.",
  experience: "Experience is required.",
};

const EMPTY_EXPERIENCE = { title: "", company: "", startMonth: "", endMonth: "", isCurrent: false, description: "" };

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Best-effort: turn an old free-text date string into real month values,
 * so existing entries still show something sensible in the new pickers.
 * Also recognizes the "Mon YYYY" format this page itself now saves, so
 * reloading a profile you just saved correctly re-populates the pickers.
 * Anything else that doesn't match a real date pattern just comes back
 * empty — intentional, since the whole point is no more free-text garbage. */
function parseDatesToMonths(dateStr) {
  if (!dateStr) return { startMonth: "", endMonth: "", isCurrent: false };

  const monthMatches = [...dateStr.matchAll(/([A-Za-z]{3})[a-z]*\s+(\d{4})/g)]
    .map((m) => {
      const idx = MONTH_NAMES.indexOf(m[1].toLowerCase());
      return idx === -1 ? null : `${m[2]}-${String(idx + 1).padStart(2, "0")}`;
    })
    .filter(Boolean);
  if (monthMatches.length > 0) {
    const isCurrent = /present|current/i.test(dateStr);
    return { startMonth: monthMatches[0], endMonth: isCurrent ? "" : (monthMatches[1] || ""), isCurrent };
  }

  const presentMatch = dateStr.match(/(\d{4})(?:-(\d{2}))?\s*[–\-—]+\s*(present|current)/i);
  if (presentMatch) {
    const [, y, m] = presentMatch;
    return { startMonth: `${y}-${m || "01"}`, endMonth: "", isCurrent: true };
  }
  const rangeMatch = dateStr.match(/(\d{4})(?:-(\d{2}))?\s*[–\-—]+\s*(\d{4})(?:-(\d{2}))?/);
  if (rangeMatch) {
    const [, y1, m1, y2, m2] = rangeMatch;
    return { startMonth: `${y1}-${m1 || "01"}`, endMonth: `${y2}-${m2 || "01"}`, isCurrent: false };
  }
  const singleYear = dateStr.match(/^\s*(\d{4})(?:-(\d{2}))?\s*$/);
  if (singleYear) {
    const [, y, m] = singleYear;
    return { startMonth: `${y}-${m || "01"}`, endMonth: "", isCurrent: false };
  }
  return { startMonth: "", endMonth: "", isCurrent: false };
}

function formatMonthDisplay(monthStr) {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDateRange(startMonth, endMonth, isCurrent) {
  const start = formatMonthDisplay(startMonth);
  if (!start) return "";
  if (isCurrent) return `${start} – Present`;
  const end = formatMonthDisplay(endMonth);
  return end ? `${start} – ${end}` : start;
}

/**
 * The backend stores experience as one plain text field, so we parse it into
 * structured entries on load, and serialize it back to the same text format
 * on save. No backend/migration change needed — the format is:
 *   Title — Company (Dates)
 *   Description text...
 * with a blank line between entries.
 */
function parseExperience(text) {
  if (!text || !text.trim()) return [{ ...EMPTY_EXPERIENCE }];
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const parsed = blocks.map((block) => {
    const lines = block.split("\n");
    const headerLine = lines[0];
    const description = lines.slice(1).join("\n");
    const match = headerLine.match(/^(.*?)\s+—\s+(.*?)\s*\((.*?)\)\s*$/);
    if (match) {
      const { startMonth, endMonth, isCurrent } = parseDatesToMonths(match[3].trim());
      return { title: match[1].trim(), company: match[2].trim(), startMonth, endMonth, isCurrent, description };
    }
    return { title: "", company: "", startMonth: "", endMonth: "", isCurrent: false, description: block };
  });
  return parsed.length > 0 ? parsed : [{ ...EMPTY_EXPERIENCE }];
}

function serializeExperience(entries) {
  return entries
    .filter((e) => e.title || e.company || e.startMonth || e.description)
    .map((e) => {
      const dates = formatDateRange(e.startMonth, e.endMonth, e.isCurrent);
      let header = e.title || "";
      if (e.company) header += (header ? " — " : "") + e.company;
      if (dates) header += ` (${dates})`;
      return e.description ? `${header}\n${e.description}` : header;
    })
    .join("\n\n");
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ bio: "", portfolio_url: "" });
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([{ ...EMPTY_EXPERIENCE }]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchMe().then(({ data }) => {
      setForm({ bio: data.bio || "", portfolio_url: data.portfolio_url || "" });
      setSkills(data.skills || []);
      setExperiences(parseExperience(data.experience));
      const isIncomplete = !data.bio || !(data.skills || []).length || !data.experience;
      setIsDirty(isIncomplete);
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setIsDirty(true);
  };

  const handleSkillsChange = (newSkills) => {
    setSkills(newSkills);
    setIsDirty(true);
  };

  const updateExperience = (index, field, value) => {
    setExperiences((prev) => prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)));
    setIsDirty(true);
  };

  const toggleCurrentlyWorking = (index, checked) => {
    setExperiences((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, isCurrent: checked, endMonth: checked ? "" : exp.endMonth } : exp))
    );
    setIsDirty(true);
  };

  const addExperience = () => {
    setExperiences((prev) => [...prev, { ...EMPTY_EXPERIENCE }]);
    setIsDirty(true);
  };

  const removeExperience = (index) => {
    setExperiences((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
    setIsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({}); setSaved(false); setLoading(true);
    try {
      const { data } = await updateProfile({
        bio: form.bio,
        skills,
        experience: serializeExperience(experiences),
        portfolio_url: form.portfolio_url,
      });
      setSkills(data.skills || []);
      setSaved(true);
      setIsDirty(false);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setFieldErrors(data);
      } else {
        setFieldErrors({ general: "Couldn't save your profile. Please try again." });
      }
    } finally { setLoading(false); }
  };

  const errorMessages = Object.values(fieldErrors).flat();

  return (
    <div className="pb-12">
      <div className="h-32 bg-violet-700 w-full" />
      <div className="px-8 sm:px-12 max-w-2xl mx-auto">
        <div className="flex flex-col items-center -mt-8 mb-6">
          <Avatar name={user?.username} size={80} rounded="rounded-2xl" />
        </div>
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">{user?.username || "Your profile"}</h1>
          <p className="text-sm text-muted">{user?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {errorMessages.length > 0 && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 space-y-0.5">
              {errorMessages.map((msg, i) => <p key={i}>{msg}</p>)}
            </div>
          )}
          {saved && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">Profile saved.</p>}

          <div className="bg-white border border-line rounded-xl p-5">
            <h2 className="font-display font-semibold text-ink mb-3 text-sm">
              About <span className="text-red-500">*</span>
            </h2>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              placeholder="A short bio about you"
              className={`w-full px-3.5 py-2.5 bg-paper border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 ${fieldErrors.bio ? "border-red-300" : "border-line"}`}
            />
          </div>

          <div className="bg-white border border-line rounded-xl p-5">
            <h2 className="font-display font-semibold text-ink mb-3 text-sm">
              Skills <span className="text-red-500">*</span>
            </h2>
            <TagInput
              value={skills}
              onChange={handleSkillsChange}
              placeholder="Type a skill and press Enter"
              error={fieldErrors.skills}
            />
            <p className="text-xs text-muted mt-1.5">Press Enter (or comma) after each skill to add it.</p>
          </div>

          <div className="bg-white border border-line rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-ink text-sm flex items-center gap-2">
                <Briefcase size={16} className="text-violet-600" /> Experience <span className="text-red-500">*</span>
              </h2>
              <button
                type="button"
                onClick={addExperience}
                className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
              >
                <Plus size={14} /> Add experience
              </button>
            </div>

            {fieldErrors.experience && (
              <p className="text-xs text-red-600 mb-3">{[].concat(fieldErrors.experience).join(" ")}</p>
            )}

            <div className="space-y-4">
              {experiences.map((exp, index) => (
                <div key={index} className="border border-line rounded-lg p-4 bg-paper relative">
                  {experiences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="absolute top-3 right-3 text-muted hover:text-red-600 transition-colors"
                      title="Remove this entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <div className="grid sm:grid-cols-2 gap-2.5 mb-2.5 pr-6">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Role</label>
                      <input
                        value={exp.title}
                        onChange={(ev) => updateExperience(index, "title", ev.target.value)}
                        placeholder="e.g. Frontend Developer"
                        className="w-full px-3 py-2 bg-white border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Company</label>
                      <input
                        value={exp.company}
                        onChange={(ev) => updateExperience(index, "company", ev.target.value)}
                        placeholder="e.g. Tech Solutions Inc."
                        className="w-full px-3 py-2 bg-white border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2.5 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Start date</label>
                      <input
                        type="month"
                        value={exp.startMonth}
                        onChange={(ev) => updateExperience(index, "startMonth", ev.target.value)}
                        max={new Date().toISOString().slice(0, 7)}
                        className="w-full px-3 py-2 bg-white border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">End date</label>
                      {exp.isCurrent ? (
                        <div className="w-full px-3 py-2 bg-gray-100 border border-line rounded-md text-sm text-muted">
                          Present
                        </div>
                      ) : (
                        <input
                          type="month"
                          value={exp.endMonth}
                          onChange={(ev) => updateExperience(index, "endMonth", ev.target.value)}
                          min={exp.startMonth || undefined}
                          max={new Date().toISOString().slice(0, 7)}
                          className="w-full px-3 py-2 bg-white border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                        />
                      )}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted mb-3">
                    <input
                      type="checkbox"
                      checked={exp.isCurrent}
                      onChange={(ev) => toggleCurrentlyWorking(index, ev.target.checked)}
                    />
                    I currently work here
                  </label>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(ev) => updateExperience(index, "description", ev.target.value)}
                      placeholder="What did you do? What did you achieve? Be specific — mention real tools, metrics, and outcomes."
                      rows={4}
                      className="w-full px-3 py-2 bg-white border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-line rounded-xl p-5">
            <h2 className="font-display font-semibold text-ink mb-3 text-sm flex items-center gap-2">
              <Link2 size={16} className="text-violet-600" /> Portfolio
              <span className="text-xs text-muted font-normal ml-1">(optional)</span>
            </h2>
            <input name="portfolio_url" value={form.portfolio_url} onChange={handleChange} placeholder="https://github.com/you" className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600" />
          </div>

          <div className="flex gap-3 pt-1 justify-center">
            {isDirty ? (
              <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50">{loading ? "Saving..." : "Save profile"}</button>
            ) : (
              <button type="button" onClick={() => navigate("/resume")} className="px-5 py-2.5 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">Next: upload resume</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}