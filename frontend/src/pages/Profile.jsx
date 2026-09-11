import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaBriefcase,
  FaLaptopCode,
  FaSave,
  FaBuilding,
  FaPlus,
  FaTimes,
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
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  // --------------------------------------------------
  // LOAD PROFILE
  // --------------------------------------------------
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

  // --------------------------------------------------
  // INPUT CHANGE
  // --------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // FRONTEND VALIDATION HELPERS
  // --------------------------------------------------

  const validateFullName = (value) => {
    const clean = value.trim();

    if (!clean) {
      return "Full name is required.";
    }

    if (clean.length < 2) {
      return "Full name must contain at least 2 characters.";
    }

    if (clean.length > 100) {
      return "Full name must not exceed 100 characters.";
    }

    if (
      !/^[A-Za-zÀ-ÖØ-öø-ÿ.'-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ.'-]+)*$/.test(
        clean
      )
    ) {
      return "Full name can contain only letters, spaces, dots, apostrophes and hyphens.";
    }

    return "";
  };

  const validatePhone = (value) => {
    const clean = value.trim();

    if (!clean) {
      return "";
    }

    const digits = clean.replace(/\D/g, "");

    let mobile = digits;

    if (digits.startsWith("91") && digits.length === 12) {
      mobile = digits.slice(2);
    } else if (digits.startsWith("0") && digits.length === 11) {
      mobile = digits.slice(1);
    }

    if (mobile.length !== 10) {
      return "Enter a valid 10-digit mobile number.";
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return "Enter a valid Indian mobile number.";
    }

    return "";
  };

  const validateLocation = (value) => {
    const clean = value.trim();

    if (!clean) {
      return "";
    }

    if (clean.length > 150) {
      return "Location must not exceed 150 characters.";
    }

    if (!/[A-Za-z]/.test(clean)) {
      return "Enter a valid location.";
    }

    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'&()/-]+$/.test(clean)) {
      return "Location contains invalid characters.";
    }

    return "";
  };

  const validateCommaSeparatedText = (
    value,
    fieldName,
    maxLength = 300
  ) => {
    const clean = value.trim();

    if (!clean) {
      return "";
    }

    if (clean.length > maxLength) {
      return `${fieldName} must not exceed ${maxLength} characters.`;
    }

    const items = clean
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    for (const item of items) {
      if (item.length < 2) {
        return `Each ${fieldName.toLowerCase()} entry must contain meaningful text.`;
      }

      if (!/[A-Za-z]/.test(item)) {
        return `Invalid ${fieldName.toLowerCase()}: ${item}`;
      }
    }

    return "";
  };

  const validateFreeText = (value, fieldName, maxLength) => {
    const clean = value.trim();

    if (!clean) {
      return "";
    }

    if (clean.length > maxLength) {
      return `${fieldName} must not exceed ${maxLength} characters.`;
    }

    return "";
  };

  // --------------------------------------------------
  // SKILL VALIDATION
  // --------------------------------------------------
  const validateSkill = (skill) => {
  const value = skill.trim();

  if (!value) {
    return "Please enter a skill.";
  }

  if (value.length > 60) {
    return "Skill must not exceed 60 characters.";
  }

  if (!/^[A-Za-z0-9+#./&()' -]+$/.test(value)) {
    return "Skill contains invalid characters.";
  }

  // Legitimate one-letter technical skills.
  if (value.length === 1) {
    if (!["c", "r"].includes(value.toLowerCase())) {
      return "Please enter a valid technical skill.";
    }

    return "";
  }

  return "";
};

  // --------------------------------------------------
  // ADD SKILL
  // --------------------------------------------------
  const handleAddSkill = (e) => {
    e.preventDefault();

    const clean = newSkill.trim();
    const validationError = validateSkill(clean);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    const currentSkills = profile.skills
      ? profile.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    if (currentSkills.length >= 40) {
      toast.error("You can add up to 40 skills.");
      return;
    }

    const alreadyExists = currentSkills.some(
      (skill) => skill.toLowerCase() === clean.toLowerCase()
    );

    if (alreadyExists) {
      toast.error("Skill already added.");
      return;
    }

    const updatedSkills = [...currentSkills, clean].join(", ");

    setProfile((prev) => ({
      ...prev,
      skills: updatedSkills,
    }));

    setNewSkill("");
  };

  // --------------------------------------------------
  // REMOVE SKILL
  // --------------------------------------------------
  const handleRemoveSkill = (skillToRemove) => {
    const currentSkills = profile.skills
      ? profile.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const updatedSkills = currentSkills
      .filter(
        (skill) =>
          skill.toLowerCase() !== skillToRemove.toLowerCase()
      )
      .join(", ");

    setProfile((prev) => ({
      ...prev,
      skills: updatedSkills,
    }));
  };

  // --------------------------------------------------
  // VALIDATE COMPLETE PROFILE
  // --------------------------------------------------
  const validateProfile = () => {
    const errors = [];

    const nameError = validateFullName(profile.full_name);
    if (nameError) {
      errors.push(nameError);
    }

    const phoneError = validatePhone(profile.phone);
    if (phoneError) {
      errors.push(phoneError);
    }

    const locationError = validateLocation(
      profile.current_location
    );
    if (locationError) {
      errors.push(locationError);
    }

    const rolesError = validateCommaSeparatedText(
      profile.preferred_job_roles,
      "Job roles",
      300
    );
    if (rolesError) {
      errors.push(rolesError);
    }

    const preferredLocationsError =
      validateCommaSeparatedText(
        profile.preferred_locations,
        "Locations",
        300
      );

    if (preferredLocationsError) {
      errors.push(preferredLocationsError);
    }

    const educationError = validateFreeText(
      profile.education,
      "Education",
      3000
    );
    if (educationError) {
      errors.push(educationError);
    }

    const experienceError = validateFreeText(
      profile.experience,
      "Experience",
      5000
    );
    if (experienceError) {
      errors.push(experienceError);
    }

    const interestsError = validateFreeText(
      profile.career_interests,
      "Career interests",
      500
    );
    if (interestsError) {
      errors.push(interestsError);
    }

    const bioError = validateFreeText(
      profile.bio,
      "Professional bio",
      2000
    );
    if (bioError) {
      errors.push(bioError);
    }

    // Validate all existing skills too.
    const skills = profile.skills
      ? profile.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

    if (skills.length > 40) {
      errors.push("You can add up to 40 skills.");
    }

    for (const skill of skills) {
      const skillError = validateSkill(skill);

      if (skillError) {
        errors.push(skillError);
        break;
      }
    }

    return errors;
  };

  // --------------------------------------------------
  // SAVE PROFILE
  // --------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) {
      return;
    }

    const validationErrors = validateProfile();

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    try {
      setSaving(true);

      const res = await api.patch(
        "candidates/me/",
        profile
      );

      if (res.data) {
        // Keep UI synchronized with backend response.
        setProfile((prev) => ({
          ...prev,
          ...res.data,
          email: res.data.email || prev.email,
        }));

        toast.success(
          "Profile updated successfully!"
        );
      }
    } catch (error) {
      console.error("Save error:", error);

      const data = error.response?.data;

      // Django REST Framework usually returns:
      // { "field": ["error message"] }
      if (data && typeof data === "object") {
        const firstError = Object.values(data)
          .flat()
          .find(
            (message) =>
              typeof message === "string"
          );

        if (firstError) {
          toast.error(firstError);
        } else if (data.detail) {
          toast.error(data.detail);
        } else {
          toast.error(
            "Please correct the highlighted profile information."
          );
        }
      } else {
        toast.error(
          "Failed to update profile."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">
            Loading candidate profile...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // SKILL LIST
  // --------------------------------------------------
  const skillList = profile.skills
    ? profile.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">

          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {profile.full_name
              ? profile.full_name
                  .charAt(0)
                  .toUpperCase()
              : "U"}
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {profile.full_name ||
                "Your Profile"}
            </h1>

            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{profile.email}</span>

              {profile.current_location && (
                <>
                  <span>•</span>
                  <span>
                    {profile.current_location}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* PERSONAL DETAILS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">

          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FaUser className="text-indigo-600 text-sm" />
            Personal Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* FULL NAME */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />

                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
                />
              </div>
            </div>

            {/* PHONE */}
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
                  maxLength={20}
                  placeholder="e.g. 9876543210"
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
                  maxLength={150}
                  placeholder="e.g. Vijayawada, Andhra Pradesh"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
                />
              </div>
            </div>

            {/* WORK MODE */}
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
                  <option value="Any">
                    Any Work Mode
                  </option>
                  <option value="Remote">
                    Remote
                  </option>
                  <option value="Hybrid">
                    Hybrid
                  </option>
                  <option value="On-site">
                    On-site
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CAREER PREFERENCES */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">

          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FaBriefcase className="text-indigo-600 text-sm" />
            Career Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* JOB ROLES */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preferred Job Roles
              </label>

              <input
                type="text"
                name="preferred_job_roles"
                value={profile.preferred_job_roles}
                onChange={handleChange}
                maxLength={300}
                placeholder="e.g. Full Stack Developer, Software Engineer"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
              />

              <p className="text-[11px] text-slate-400 mt-1">
                Separate multiple roles with commas
              </p>
            </div>

            {/* LOCATIONS */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preferred Locations
              </label>

              <input
                type="text"
                name="preferred_locations"
                value={profile.preferred_locations}
                onChange={handleChange}
                maxLength={300}
                placeholder="e.g. Vijayawada, Hyderabad, Remote"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
              />

              <p className="text-[11px] text-slate-400 mt-1">
                Separate multiple cities with commas
              </p>
            </div>
          </div>

          {/* CAREER INTERESTS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Career Interests
            </label>

            <input
              type="text"
              name="career_interests"
              value={profile.career_interests}
              onChange={handleChange}
              maxLength={500}
              placeholder="e.g. Distributed Systems, FinTech, Machine Learning, Cloud Architecture"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
            />
          </div>
        </div>

        {/* TECHNICAL SKILLS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">

          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FaLaptopCode className="text-indigo-600 text-sm" />
            Technical Skills
          </h2>

          {/* ADD SKILL */}
          <div className="flex gap-2">

            <input
              type="text"
              value={newSkill}
              maxLength={60}
              onChange={(e) =>
                setNewSkill(e.target.value)
              }
              placeholder="Add a technical skill (e.g. React, Python, Docker)"
              aria-label="Add technical skill"
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
              <FaPlus />
              Add
            </button>
          </div>

          {/* SKILL BADGES */}
          <div className="flex flex-wrap gap-2 pt-1">

            {skillList.length > 0 ? (
              skillList.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {skill}

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveSkill(skill)
                    }
                    aria-label={`Remove ${skill}`}
                    className="text-indigo-400 hover:text-indigo-700 rounded-full"
                  >
                    <FaTimes className="text-[10px]" />
                  </button>
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">
                No skills listed yet. Add skills or
                upload a resume to automatically detect
                them.
              </p>
            )}
          </div>
        </div>

        {/* EDUCATION & EXPERIENCE */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">

          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FaGraduationCap className="text-indigo-600 text-sm" />
            Background & Experience
          </h2>

          <div className="space-y-4">

            {/* EDUCATION */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Education
              </label>

              <textarea
                name="education"
                rows={3}
                value={profile.education}
                onChange={handleChange}
                maxLength={3000}
                placeholder="e.g. B.Tech in Computer Science, PVPSIT (2024 - 2028)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm leading-relaxed"
              />
            </div>

            {/* EXPERIENCE */}
            <div>
  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
    Experience
  </label>

  <div className="relative">
    <FaBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />

    <select
      name="experience"
      value={profile.experience}
      onChange={handleChange}
      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm bg-white"
    >
      <option value="">
        Select experience
      </option>

      <option value="Fresher">
        Fresher
      </option>

      <option value="0-1 years">
        0–1 year
      </option>

      <option value="1-3 years">
        1–3 years
      </option>

      <option value="3-5 years">
        3–5 years
      </option>

      <option value="5-10 years">
        5–10 years
      </option>

      <option value="10+ years">
        10+ years
      </option>
    </select>
  </div>
</div>

            {/* BIO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Professional Bio
              </label>

              <textarea
                name="bio"
                rows={3}
                value={profile.bio}
                onChange={handleChange}
                maxLength={2000}
                placeholder="Brief summary of your background, passions, and what you're looking for in your next role."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* SAVE */}
        <div className="flex justify-end gap-3 pt-2">

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            <FaSave />

            {saving
              ? "Saving Changes..."
              : "Save Profile"}
          </button>

        </div>
      </form>
    </div>
  );
}

export default Profile;