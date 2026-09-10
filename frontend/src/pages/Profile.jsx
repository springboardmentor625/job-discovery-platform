import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaBriefcase,
  FaHeart,
  FaLaptopCode,
  FaSave,
  FaBuilding,
  FaPlus,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import api from "../services/api";

function Profile() {
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    current_location: "",
    education: "",
    experience: "",
    preferred_job_roles: "",
    preferred_locations: "",
    preferred_work_mode: "Any",
    career_interests: "",
    skills: "",
    bio: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Skill input tag helper
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("candidates/me/");
      if (res.data) {
        setProfile({
          full_name: res.data.full_name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          current_location: res.data.current_location || "",
          education: res.data.education || "",
          experience: res.data.experience || "",
          preferred_job_roles: res.data.preferred_job_roles || "",
          preferred_locations: res.data.preferred_locations || "",
          preferred_work_mode: res.data.preferred_work_mode || "Any",
          career_interests: res.data.career_interests || "",
          skills: res.data.skills || "",
          bio: res.data.bio || "",
        });
      }
    } catch (error) {
      console.error("Profile load error:", error);
      toast.error("Unable to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const clean = newSkill.trim();
    if (!clean) return;

    const currentSkills = profile.skills
      ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    if (!currentSkills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      const updated = [...currentSkills, clean].join(", ");
      setProfile((prev) => ({ ...prev, skills: updated }));
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    const currentSkills = profile.skills
      ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const updated = currentSkills
      .filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase())
      .join(", ");
    setProfile((prev) => ({ ...prev, skills: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      const res = await api.patch("candidates/me/", profile);
      if (res.data) {
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  const skillList = profile.skills
    ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {profile.full_name || "Your Profile"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{profile.email}</span>
              {profile.current_location && (
                <>
                  <span>•</span>
                  <span>{profile.current_location}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BASIC INFORMATION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FaUser className="text-indigo-600 text-sm" /> Personal Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FULL NAME */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
                />
              </div>
            </div>

            {/* PHONE NUMBER */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
                />
              </div>
            </div>

            {/* CURRENT LOCATION */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Location
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  name="current_location"
                  value={profile.current_location}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
                />
              </div>
            </div>

            {/* PREFERRED WORK MODE */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preferred Work Mode
              </label>
              <div className="relative">
                <FaBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <select
                  name="preferred_work_mode"
                  value={profile.preferred_work_mode}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm bg-white"
                >
                  <option value="Any">Any Work Mode</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CAREER PREFERENCES */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FaBriefcase className="text-indigo-600 text-sm" /> Career Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preferred Job Roles
              </label>
              <input
                type="text"
                name="preferred_job_roles"
                value={profile.preferred_job_roles}
                onChange={handleChange}
                placeholder="e.g. Full Stack Developer, Software Engineer"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">Separate multiple roles with commas</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preferred Locations
              </label>
              <input
                type="text"
                name="preferred_locations"
                value={profile.preferred_locations}
                onChange={handleChange}
                placeholder="e.g. New York, Austin, Remote"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">Separate multiple cities with commas</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Career Interests
            </label>
            <input
              type="text"
              name="career_interests"
              value={profile.career_interests}
              onChange={handleChange}
              placeholder="e.g. Distributed Systems, FinTech, Machine Learning, Cloud Architecture"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
            />
          </div>
        </div>

        {/* SKILLS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FaLaptopCode className="text-indigo-600 text-sm" /> Technical Skills
          </h2>

          {/* ADD SKILL FORM */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a technical skill (e.g. React, Python, Docker)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill(e);
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition"
            >
              <FaPlus /> Add
            </button>
          </div>

          {/* BADGES DISPLAY */}
          <div className="flex flex-wrap gap-2 pt-1">
            {skillList.length > 0 ? (
              skillList.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-indigo-400 hover:text-indigo-700 rounded-full"
                  >
                    <FaTimes className="text-[10px]" />
                  </button>
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">
                No skills listed yet. Add skills or upload a resume to automatically detect them.
              </p>
            )}
          </div>
        </div>

        {/* EDUCATION & EXPERIENCE */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FaGraduationCap className="text-indigo-600 text-sm" /> Background & Experience
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Education
              </label>
              <textarea
                name="education"
                rows={3}
                value={profile.education}
                onChange={handleChange}
                placeholder="e.g. B.S. in Computer Science, University of California (2020 - 2024)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Experience
              </label>
              <textarea
                name="experience"
                rows={4}
                value={profile.experience}
                onChange={handleChange}
                placeholder="e.g. Software Engineer at Tech Corp (2 years) - Developed REST APIs and microservices using Python and React."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Professional Bio
              </label>
              <textarea
                name="bio"
                rows={3}
                value={profile.bio}
                onChange={handleChange}
                placeholder="Brief summary of your background, passions, and what you're looking for in your next role."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM SUBMIT */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            <FaSave /> {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Profile;
