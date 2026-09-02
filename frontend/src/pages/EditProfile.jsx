import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaGraduationCap,
  FaProjectDiagram,
  FaCertificate,
  FaCheckCircle,
  FaRobot,
  FaSave,
  FaArrowLeft,
} from "react-icons/fa";
import api from "../services/api";

function EditProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    id: null,
    full_name: "",
    email: "",
    phone: "",
    skills: "",
    experience: "",
    education: "",
    projects: "",
    certifications: "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =========================================
  // LOAD PROFILE
  // =========================================

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("candidates/");

      const candidates = Array.isArray(response.data)
        ? response.data
        : [];

      if (candidates.length === 0) {
        toast.error("Candidate profile not found.");
        navigate("/view-profile");
        return;
      }

      const candidate = candidates[candidates.length - 1];

      setProfile({
        id: candidate.id,
        full_name: candidate.full_name || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        skills: candidate.skills || "",
        experience: candidate.experience || "",
        education: candidate.education || "",
        projects: candidate.projects || "",
        certifications: candidate.certifications || "",
      });

      setSkills(
        candidate.skills
          ? candidate.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean)
          : []
      );
    } catch (error) {
      console.error(
        "LOAD PROFILE ERROR:",
        error.response?.data || error
      );

      toast.error("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // HANDLE CHANGE
  // =========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================
  // ADD SKILL
  // =========================================

  const addSkill = () => {
    const skill = skillInput.trim();

    const skillRegex = /^[A-Za-z+#.\-\s]{2,30}$/;

    if (!skill) {
      toast.error("Please enter a skill.");
      return;
    }

    if (!skillRegex.test(skill)) {
      toast.error("Enter a valid professional skill.");
      return;
    }

    if (
      skills.some(
        (existingSkill) =>
          existingSkill.toLowerCase() === skill.toLowerCase()
      )
    ) {
      toast.error("Skill already added.");
      return;
    }

    setSkills((previous) => [...previous, skill]);
    setSkillInput("");

    toast.success(`${skill} added`);
  };

  // =========================================
  // REMOVE SKILL
  // =========================================

  const removeSkill = (index) => {
    const removedSkill = skills[index];

    setSkills((previous) =>
      previous.filter((_, i) => i !== index)
    );

    toast.success(`${removedSkill} removed`);
  };

  // =========================================
  // SUGGESTED SKILLS
  // =========================================

  const suggestedSkills = [
    "Python",
    "React",
    "Java",
    "SQL",
    "JavaScript",
    "AWS",
    "Docker",
    "Git",
  ];

  const addSuggestedSkill = (skill) => {
    if (
      skills.some(
        (existingSkill) =>
          existingSkill.toLowerCase() === skill.toLowerCase()
      )
    ) {
      toast.error(`${skill} is already added.`);
      return;
    }

    setSkills((previous) => [...previous, skill]);

    toast.success(`${skill} added`);
  };

  // =========================================
  // PROFILE COMPLETION
  // =========================================

  const profileCompletion = useMemo(() => {
    const metrics = [
      Boolean(profile.full_name.trim()),
      Boolean(profile.email.trim()),
      Boolean(profile.phone.trim()),
      skills.length >= 2,
      Boolean(profile.experience.trim()),
      profile.education.trim().length >= 10,
      profile.projects.trim().length >= 20,
      profile.certifications.trim().length >= 5,
    ];

    const completed = metrics.filter(Boolean).length;

    return Math.round(
      (completed / metrics.length) * 100
    );
  }, [profile, skills]);

  const getCompletionColor = () => {
    if (profileCompletion >= 80) return "bg-green-500";
    if (profileCompletion >= 50) return "bg-yellow-500";

    return "bg-indigo-500";
  };

  // =========================================
  // UPDATE PROFILE
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile.id) {
      toast.error("Candidate profile ID not found.");
      return;
    }

    if (profile.full_name.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        profile.email.trim()
      )
    ) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(profile.phone.trim())) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }

    if (skills.length < 2) {
      toast.error("Please add at least 2 professional skills.");
      return;
    }

    if (profile.education.trim().length < 10) {
      toast.error("Please enter valid education details.");
      return;
    }

    if (profile.projects.trim().length < 20) {
      toast.error(
        "Please provide a meaningful project description."
      );
      return;
    }

    if (
      profile.certifications &&
      profile.certifications.trim().length < 5
    ) {
      toast.error("Please enter a valid certification.");
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        full_name: profile.full_name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        skills: skills.join(", "),
        experience: profile.experience,
        education: profile.education.trim(),
        projects: profile.projects.trim(),
        certifications: profile.certifications.trim(),
      };

      await api.put(
        `candidates/${profile.id}/`,
        updateData
      );

      toast.success("Profile updated successfully!");

      navigate("/view-profile");
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error.response?.data || error
      );

      if (!error.response) {
        toast.error("Unable to connect to backend.");
        return;
      }

      const data = error.response.data;

      if (typeof data === "string") {
        toast.error(data);
        return;
      }

      const message = Object.entries(data)
        .map(
          ([key, value]) =>
            `${key}: ${
              Array.isArray(value)
                ? value.join(", ")
                : value
            }`
        )
        .join("\n");

      toast.error(
        message || "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      {/* PAGE TITLE */}

      <div className="mx-auto mb-6 max-w-5xl">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
              <FaUser size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">
                Edit Profile
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Update your personal and professional information.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() => navigate("/view-profile")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-indigo-600"
          >
            <FaArrowLeft />
            Back to Profile
          </button>

        </div>

      </div>

      {/* MAIN */}

      <main className="mx-auto max-w-5xl">

        <form onSubmit={handleSubmit}>

          <div className="grid gap-6 lg:grid-cols-3">

            {/* ===================================== */}
            {/* LEFT */}
            {/* ===================================== */}

            <div className="space-y-6 lg:col-span-2">

              {/* BASIC INFORMATION */}

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center gap-3">

                  <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                    <FaUser />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      Basic Information
                    </h2>

                    <p className="text-sm text-gray-500">
                      Your personal and contact details.
                    </p>
                  </div>

                </div>

                <div className="grid gap-5 md:grid-cols-2">

                  {/* NAME */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Full Name
                    </label>

                    <div className="relative">
                      <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                      <input
                        name="full_name"
                        value={profile.full_name}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  {/* EMAIL */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>

                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                      <input
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* PHONE */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Mobile Number
                    </label>

                    <div className="relative">
                      <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                      <input
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        maxLength={10}
                        className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                        placeholder="10-digit mobile number"
                      />
                    </div>
                  </div>

                  {/* EXPERIENCE */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Experience Level
                    </label>

                    <div className="relative">
                      <FaBriefcase className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                      <select
                        name="experience"
                        value={profile.experience || ""}
                        onChange={handleChange}
                        className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">
                          Select Experience
                        </option>

                        <option value="Fresher">
                          Fresher
                        </option>

                        <option value="0-1 Years">
                          0-1 Years
                        </option>

                        <option value="1-3 Years">
                          1-3 Years
                        </option>

                        <option value="3-5 Years">
                          3-5 Years
                        </option>

                        <option value="5-8 Years">
                          5-8 Years
                        </option>

                        <option value="8+ Years">
                          8+ Years
                        </option>
                      </select>
                    </div>
                  </div>

                </div>

              </section>

              {/* SKILLS */}

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center gap-3">

                  <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                    <FaCheckCircle />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      Professional Skills
                    </h2>

                    <p className="text-sm text-gray-500">
                      Add skills relevant to your career.
                    </p>
                  </div>

                </div>

                <div className="flex gap-3">

                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) =>
                      setSkillInput(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                    placeholder="Type a skill..."
                  />

                  <button
                    type="button"
                    onClick={addSkill}
                    className="rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    + Add
                  </button>

                </div>

                <div className="mt-4 flex flex-wrap gap-2">

                  {skills.length > 0 ? (
                    skills.map((skill, index) => (
                      <div
                        key={`${skill}-${index}`}
                        className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
                      >
                        <span>{skill}</span>

                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="font-bold text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">
                      No skills added yet.
                    </p>
                  )}

                </div>

                <div className="mt-5">

                  <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
                    Suggested Skills
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {suggestedSkills.map((skill) => {
                      const alreadyAdded = skills.some(
                        (existingSkill) =>
                          existingSkill.toLowerCase() ===
                          skill.toLowerCase()
                      );

                      return (
                        <button
                          key={skill}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() =>
                            addSuggestedSkill(skill)
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            alreadyAdded
                              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                              : "border-gray-300 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
                          }`}
                        >
                          {alreadyAdded ? "✓ " : "+ "}
                          {skill}
                        </button>
                      );
                    })}

                  </div>

                </div>

              </section>

              {/* EDUCATION */}

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center gap-3">

                  <div className="rounded-xl bg-green-100 p-3 text-green-600">
                    <FaGraduationCap />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      Education
                    </h2>

                    <p className="text-sm text-gray-500">
                      Add your academic background.
                    </p>
                  </div>

                </div>

                <textarea
                  name="education"
                  value={profile.education}
                  onChange={handleChange}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-300 p-4 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                  placeholder="Example: B.Tech in Computer Science, JNTUH (2022-2026)"
                />

              </section>

              {/* PROJECTS */}

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center gap-3">

                  <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                    <FaProjectDiagram />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      Projects
                    </h2>

                    <p className="text-sm text-gray-500">
                      Highlight your practical experience.
                    </p>
                  </div>

                </div>

                <textarea
                  name="projects"
                  value={profile.projects}
                  onChange={handleChange}
                  rows={6}
                  className="w-full resize-none rounded-xl border border-gray-300 p-4 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                  placeholder="Example: Built an AI-powered job recommendation system using React, Django and machine learning..."
                />

              </section>

              {/* CERTIFICATIONS */}

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center gap-3">

                  <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
                    <FaCertificate />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      Certifications
                    </h2>

                    <p className="text-sm text-gray-500">
                      Add relevant certifications.
                    </p>
                  </div>

                </div>

                <textarea
                  name="certifications"
                  value={profile.certifications}
                  onChange={handleChange}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 p-4 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                  placeholder="Example: AWS Cloud Practitioner, Google Data Analytics"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Optional field.
                </p>

              </section>

            </div>

            {/* ===================================== */}
            {/* RIGHT */}
            {/* ===================================== */}

            <div>

              <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <h2 className="text-lg font-bold text-gray-800">
                  Profile Strength
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Complete your profile to improve job recommendations.
                </p>

                {/* CIRCLE */}

                <div className="flex justify-center py-6">

                  <div
                    className="flex h-32 w-32 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#4f46e5 ${profileCompletion}%, #e5e7eb ${profileCompletion}% 100%)`,
                    }}
                  >

                    <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">

                      <span className="text-2xl font-extrabold text-indigo-600">
                        {profileCompletion}%
                      </span>

                      <span className="text-xs text-gray-400">
                        Complete
                      </span>

                    </div>

                  </div>

                </div>

                {/* PROGRESS */}

                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">

                  <div
                    className={`${getCompletionColor()} h-2 rounded-full transition-all duration-500`}
                    style={{
                      width: `${profileCompletion}%`,
                    }}
                  />

                </div>

                {/* CHECKLIST */}

                <div className="mt-5 space-y-3">

                  {[
                    [
                      "Personal Information",
                      profile.full_name &&
                        profile.email &&
                        profile.phone,
                    ],
                    [
                      "Professional Skills",
                      skills.length >= 2,
                    ],
                    [
                      "Experience",
                      Boolean(profile.experience),
                    ],
                    [
                      "Education",
                      profile.education.trim().length >= 10,
                    ],
                    [
                      "Projects",
                      profile.projects.trim().length >= 20,
                    ],
                    [
                      "Certifications",
                      profile.certifications.trim().length >= 5,
                    ],
                  ].map(([label, completed]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">
                        {label}
                      </span>

                      {completed ? (
                        <FaCheckCircle className="text-green-500" />
                      ) : (
                        <span className="text-gray-300">
                          ○
                        </span>
                      )}
                    </div>
                  ))}

                </div>

                {/* AI TIP */}

                <div className="mt-5 rounded-xl bg-indigo-50 p-4">

                  <div className="flex gap-3">

                    <FaRobot className="mt-1 text-indigo-600" />

                    <div>
                      <p className="text-sm font-semibold text-indigo-700">
                        AI Recommendation Tip
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-indigo-600">
                        Add detailed projects and relevant skills
                        to improve your job matches.
                      </p>
                    </div>

                  </div>

                </div>

                {/* SAVE */}

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/view-profile")}
                  disabled={saving}
                  className="mt-3 w-full rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

              </div>

            </div>

          </div>

        </form>

      </main>
    </div>
  );
}

export default EditProfile;
