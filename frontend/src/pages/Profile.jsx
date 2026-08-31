import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  BookOpen,
  Award,
  Edit2,
  Save,
  X,
} from "lucide-react";

export default function Profile() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    headline: "",
    summary: "",
    location: "",
    preferred_job_type: "",
    preferred_location: "",
    experience_years: "",
    education: [],
    projects: [],
    certifications: [],
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Fetch current user info
      const userRes = await api.get("/me");
      setUserInfo(userRes.data);

      // Fetch candidate profile
      try {
        const profileRes = await api.get("/candidate-profile");
        if (profileRes.data) {
          setProfile(profileRes.data);
          setFormData({
            headline: profileRes.data.headline || "",
            summary: profileRes.data.summary || "",
            location: profileRes.data.location || "",
            preferred_job_type: profileRes.data.preferred_job_type || "",
            preferred_location: profileRes.data.preferred_location || "",
            experience_years: profileRes.data.experience_years || "",
            education: profileRes.data.education || [],
            projects: profileRes.data.projects || [],
            certifications: profileRes.data.certifications || [],
          });
        }
      } catch (e) {
        console.log("Profile not found, creating new one");
      }

      setError(null);
    } catch (err) {
      setError("Failed to load profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        user_id: userInfo.user_id,
        ...formData,
      };

      if (profile) {
        // Update existing profile
        await api.put(`/candidate-profile/${profile.profile_id}`, payload);
      } else {
        // Create new profile
        await api.post("/candidate-profile", payload);
      }

      setSuccess("Profile updated successfully!");
      setEditing(false);
      setTimeout(() => setSuccess(null), 3000);
      fetchProfile();
    } catch (err) {
      setError("Failed to save profile");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">My Profile</h1>
                <p className="text-slate-400">Manage your professional information</p>
              </div>
            </div>
            {!editing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </motion.button>
            )}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-500 bg-opacity-10 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-6"
          >
            {success}
          </motion.div>
        )}

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8 text-white"
        >
          <h2 className="text-2xl font-bold mb-4">{userInfo?.full_name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              <span>{userInfo?.email}</span>
            </div>
            {userInfo?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <span>{userInfo.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              <span className="capitalize">{userInfo?.role}</span>
            </div>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Headline */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <label className="flex items-center gap-2 text-white font-semibold mb-3">
              <Briefcase className="w-5 h-5 text-blue-400" />
              Professional Headline
            </label>
            <input
              type="text"
              name="headline"
              value={formData.headline}
              onChange={handleInputChange}
              disabled={!editing}
              placeholder="e.g., Full-Stack Developer | React & Node.js"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
            />
            {editing && (
              <p className="text-xs text-slate-400 mt-2">
                A catchy headline that summarizes your professional role
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <label className="flex items-center gap-2 text-white font-semibold mb-3">
              <User className="w-5 h-5 text-blue-400" />
              Professional Summary
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              disabled={!editing}
              placeholder="Tell employers about yourself, your skills, and what you're looking for..."
              rows="5"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Location & Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <MapPin className="w-5 h-5 text-blue-400" />
                Current Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="e.g., San Francisco, CA"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <Briefcase className="w-5 h-5 text-blue-400" />
                Years of Experience
              </label>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="e.g., 5"
                min="0"
                max="70"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <Briefcase className="w-5 h-5 text-blue-400" />
                Preferred Job Type
              </label>
              <input
                type="text"
                name="preferred_job_type"
                value={formData.preferred_job_type}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="e.g., Full-time, Remote"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <MapPin className="w-5 h-5 text-blue-400" />
                Preferred Location
              </label>
              <input
                type="text"
                name="preferred_location"
                value={formData.preferred_location}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="e.g., Remote, US"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex gap-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  setEditing(false);
                  fetchProfile();
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleSave}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 p-6 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg"
        >
          <p className="text-blue-300">
            💡 <strong>Pro Tip:</strong> A complete profile with a professional
            headline and summary increases your chances of getting matched with
            relevant job opportunities. Make sure to highlight your key strengths!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
