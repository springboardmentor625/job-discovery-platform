import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  // =========================
  // LOAD LOGGED-IN PROFILE
  // =========================

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("candidates/");

      console.log("CANDIDATE RESPONSE:", response.data);

      if (!response.data || response.data.length === 0) {
        alert("Candidate profile not found.");
        navigate("/profile");
        return;
      }

      const candidate = response.data[0];

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

      // Convert backend skills string into array
      setSkills(
        candidate.skills
          ? candidate.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter((skill) => skill)
          : []
      );
    } catch (error) {
      console.error(
        "LOAD PROFILE ERROR:",
        error.response?.data || error
      );

      alert("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // HANDLE CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================
  // ADD SKILL
  // =========================

  const addSkill = () => {
    const skill = skillInput.trim();

    const skillRegex = /^[A-Za-z+#.\-\s]{2,30}$/;

    if (!skill) {
      alert("Please enter a skill.");
      return;
    }

    if (!skillRegex.test(skill)) {
      alert(
        "Enter a valid professional skill (Example: Python, React, C++, SQL)."
      );
      return;
    }

    if (
      skills.some(
        (existingSkill) =>
          existingSkill.toLowerCase() === skill.toLowerCase()
      )
    ) {
      alert("Skill already added.");
      return;
    }

    setSkills([...skills, skill]);
    setSkillInput("");
  };

  // =========================
  // REMOVE SKILL
  // =========================

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // =========================
  // UPDATE PROFILE
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile.id) {
      alert("Candidate profile ID not found.");
      return;
    }

    // =========================
    // VALIDATION
    // =========================

    if (profile.full_name.trim().length < 2) {
      alert("Please enter your full name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(profile.phone.trim())) {
      alert("Enter a valid 10-digit mobile number.");
      return;
    }

    if (skills.length < 2) {
      alert("Please add at least 2 professional skills.");
      return;
    }

    if (profile.education.trim().length < 10) {
      alert("Please enter valid education details.");
      return;
    }

    if (profile.projects.trim().length < 20) {
      alert("Please provide a meaningful project description.");
      return;
    }

    if (
      profile.certifications &&
      profile.certifications.trim().length < 5
    ) {
      alert("Please enter a valid certification.");
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,

        // Convert skill array back to backend string
        skills: skills.join(", "),

        experience: profile.experience,
        education: profile.education,
        projects: profile.projects,
        certifications: profile.certifications,
      };

      console.log("UPDATING CANDIDATE:", profile.id);
      console.log("UPDATE DATA:", updateData);

      const response = await api.put(
        `candidates/${profile.id}/`,
        updateData
      );

      console.log("UPDATE RESPONSE:", response.data);

      alert("Profile Updated Successfully!");

      navigate("/view-profile");
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      console.error(
        "STATUS:",
        error.response?.status
      );

      console.error(
        "DATA:",
        error.response?.data
      );

      if (!error.response) {
        alert("Unable to connect to backend.");
        return;
      }

      const data = error.response.data;

      if (typeof data === "string") {
        alert(data);
        return;
      }

      const message = Object.entries(data)
        .map(([key, value]) =>
          `${key}: ${
            Array.isArray(value)
              ? value.join(", ")
              : value
          }`
        )
        .join("\n");

      alert(message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl text-gray-600">
          Loading profile...
        </p>
      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">

      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-3xl">

        <h2 className="text-3xl font-bold text-indigo-700 mb-6">
          Edit Profile
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >

          {/* FULL NAME */}

          <input
            name="full_name"
            value={profile.full_name}
            onChange={handleChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Full Name"
          />

          {/* EMAIL */}

          <input
            name="email"
            type="email"
            value={profile.email}
            onChange={handleChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Email"
          />

          {/* PHONE */}

          <input
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Phone"
          />

          {/* EXPERIENCE */}

          <select
            name="experience"
            value={profile.experience || ""}
            onChange={handleChange}
            className="border p-3 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          {/* SKILLS */}

          <div className="md:col-span-2">

            <div className="flex gap-2">

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
                className="border p-3 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Skills"
              />

              <button
                type="button"
                onClick={addSkill}
                className="bg-indigo-600 text-white px-4 rounded hover:bg-indigo-700"
              >
                Add
              </button>

            </div>

            <div className="flex flex-wrap gap-2 mt-3">

              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  {skill}

                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-red-500 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}

            </div>

          </div>

          {/* EDUCATION */}

          <textarea
            name="education"
            value={profile.education}
            onChange={handleChange}
            className="border p-3 rounded md:col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Education"
            rows="3"
          />

          {/* PROJECTS */}

          <textarea
            name="projects"
            value={profile.projects}
            onChange={handleChange}
            className="border p-3 rounded md:col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Projects"
            rows="3"
          />

          {/* CERTIFICATIONS */}

          <textarea
            name="certifications"
            value={profile.certifications}
            onChange={handleChange}
            className="border p-3 rounded md:col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Certifications"
            rows="3"
          />

          {/* UPDATE BUTTON */}

          <button
            type="submit"
            disabled={saving}
            className="md:col-span-2 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
          >
            {saving
              ? "Updating..."
              : "Update Profile"}
          </button>

        </form>

        {/* BACK */}

        <button
          type="button"
          onClick={() => navigate("/view-profile")}
          className="mt-5 text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          ← Back to Profile
        </button>

      </div>

    </div>
  );
}

export default EditProfile;