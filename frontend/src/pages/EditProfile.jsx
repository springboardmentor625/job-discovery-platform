import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// ==========================================
// EXPERIENCE LEVELS
// ==========================================

const EXPERIENCE_LEVELS = [
  "Fresher / Entry-Level",
  "Intern",
  "Trainee",
  "Junior / Associate",
  "Mid-Level",
  "Senior-Level",
  "Lead",
  "Manager",
  "Experienced Professional",
];

// ==========================================
// AVAILABLE SKILLS
// ==========================================

const AVAILABLE_SKILLS = [
  "C",
  "C++",
  "Java",
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Express.js",
  "FastAPI",
  "Django",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Git",
  "GitHub",
  "Docker",
  "AWS",
  "Machine Learning",
  "Data Science",
  "TensorFlow",
  "PyTorch",
  "Figma",
  "UI/UX",
  "Other",
];

function EditProfile() {
  const navigate = useNavigate();

  // ==========================================
  // FORM
  // ==========================================

  const [form, setForm] = useState({
    headline: "",
    bio: "",
    location: "",
    education: "",
    skills: "",
    experience: "",
    preferred_role: "",
    preferred_location: "",
    expected_salary: "",
  });

  // ==========================================
  // SKILLS
  // ==========================================

  const [selectedSkills, setSelectedSkills] = useState([]);

  const [skillSearch, setSkillSearch] = useState("");

  const [skillDropdownOpen, setSkillDropdownOpen] =
    useState(false);

  const [customSkill, setCustomSkill] = useState("");

  const [showCustomSkill, setShowCustomSkill] =
    useState(false);

  // ==========================================
  // OTHER STATES
  // ==========================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // ==========================================
  // LOAD EXISTING PROFILE
  // ==========================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get(
          "/api/candidate/profile"
        );

        const profile = response.data;

        // --------------------------------------
        // Load saved skills
        // --------------------------------------

        const existingSkills = profile.skills
          ? profile.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean)
          : [];

        // Never store "Other" as a skill
        const cleanedSkills = existingSkills.filter(
          (skill) => skill !== "Other"
        );

        setSelectedSkills(cleanedSkills);

        // --------------------------------------
        // Load form
        // --------------------------------------

        setForm({
          headline: profile.headline || "",

          bio: profile.bio || "",

          location: profile.location || "",

          education: profile.education || "",

          skills: cleanedSkills.join(", "),

          experience: profile.experience || "",

          preferred_role:
            profile.preferred_role || "",

          preferred_location:
            profile.preferred_location || "",

          expected_salary:
            profile.expected_salary ?? "",
        });

      } catch (err) {
        console.error(
          "PROFILE LOAD ERROR:",
          err.response?.data || err
        );

        // --------------------------------------
        // Unauthorized
        // --------------------------------------

        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");

          navigate("/login");

          return;
        }

        // --------------------------------------
        // 404 = profile not created yet
        // --------------------------------------

        if (err.response?.status !== 404) {
          setError("Unable to load profile.");
        }

      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  // ==========================================
  // NORMAL INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================
  // CHECK CUSTOM SKILL
  // ==========================================

  const hasCustomSkill =
    selectedSkills.some(
      (skill) =>
        !AVAILABLE_SKILLS.includes(skill)
    );

  // ==========================================
  // ADD PREDEFINED SKILL
  // ==========================================

  const addSkill = (skill) => {
    // ----------------------------------------
    // OTHER
    // ----------------------------------------

    if (skill === "Other") {
      setShowCustomSkill(true);

      setSkillDropdownOpen(false);

      setSkillSearch("");

      setError("");

      return;
    }

    // ----------------------------------------
    // NORMAL SKILL
    // ----------------------------------------

    if (!selectedSkills.includes(skill)) {
      setSelectedSkills((previous) => [
        ...previous,
        skill,
      ]);
    }

    setSkillSearch("");

    setSkillDropdownOpen(false);

    setError("");
  };

  // ==========================================
  // REMOVE SKILL
  // ==========================================

  const removeSkill = (skillToRemove) => {
    setSelectedSkills((previous) =>
      previous.filter(
        (skill) =>
          skill !== skillToRemove
      )
    );

    // If custom skill was removed,
    // Other can be selected again.

    if (
      !AVAILABLE_SKILLS.includes(
        skillToRemove
      )
    ) {
      setShowCustomSkill(false);
    }

    setError("");
  };

  // ==========================================
  // ADD CUSTOM SKILL
  // ==========================================

  const addCustomSkill = () => {
    const value = customSkill.trim();

    // ----------------------------------------
    // Empty validation
    // ----------------------------------------

    if (!value) {
      setError("Please enter a skill.");

      return;
    }

    // ----------------------------------------
    // Allow comma-separated skills
    // ----------------------------------------

    const skillsToAdd = value
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    let addedAtLeastOne = false;

    setSelectedSkills((previous) => {
      const updated = [...previous];

      skillsToAdd.forEach((skill) => {
        const alreadyExists = updated.some(
          (existingSkill) =>
            existingSkill.toLowerCase() ===
            skill.toLowerCase()
        );

        if (
          !alreadyExists &&
          skill.toLowerCase() !== "other"
        ) {
          updated.push(skill);

          addedAtLeastOne = true;
        }
      });

      return updated;
    });

    // ----------------------------------------
    // If skill was successfully added
    // hide Other input
    // ----------------------------------------

    if (addedAtLeastOne) {
      setCustomSkill("");

      setShowCustomSkill(false);

      setSkillDropdownOpen(false);

      setSkillSearch("");

      setError("");
    }
  };

  // ==========================================
  // CUSTOM SKILL KEYBOARD
  // ==========================================

  const handleCustomSkillKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      addCustomSkill();
    }
  };

  // ==========================================
  // FILTER SKILLS
  // ==========================================

  const filteredSkills =
    AVAILABLE_SKILLS.filter((skill) => {
      // Hide already selected skills
      if (selectedSkills.includes(skill)) {
        return false;
      }

      // Hide Other after custom skill
      // has already been added
      if (
        skill === "Other" &&
        hasCustomSkill
      ) {
        return false;
      }

      // Search
      if (
        skillSearch.trim() === ""
      ) {
        return true;
      }

      return skill
        .toLowerCase()
        .includes(
          skillSearch
            .toLowerCase()
            .trim()
        );
    });

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    setMessage("");

    setError("");

    // ========================================
    // EXPERIENCE VALIDATION
    // ========================================

    if (!form.experience) {
      setError(
        "Please select your experience level."
      );

      setSaving(false);

      return;
    }

    // ========================================
    // SALARY VALIDATION
    // ========================================

    const salary = Number(
      form.expected_salary
    );

    if (
      !form.expected_salary ||
      Number.isNaN(salary)
    ) {
      setError(
        "Please enter your expected salary."
      );

      setSaving(false);

      return;
    }

    if (salary <= 10000) {
      setError(
        "Expected salary must be more than ₹10,000."
      );

      setSaving(false);

      return;
    }

    // ========================================
    // SKILL VALIDATION
    // ========================================

    if (selectedSkills.length === 0) {
      setError(
        "Please select at least one skill."
      );

      setSaving(false);

      return;
    }

    try {
      // --------------------------------------
      // Prepare data
      // --------------------------------------

      const profileData = {
        headline:
          form.headline.trim(),

        bio:
          form.bio.trim(),

        location:
          form.location.trim(),

        education:
          form.education.trim(),

        skills:
          selectedSkills.join(", "),

        experience:
          form.experience,

        preferred_role:
          form.preferred_role.trim(),

        preferred_location:
          form.preferred_location.trim(),

        expected_salary:
          salary,
      };

      console.log(
        "PROFILE DATA:",
        profileData
      );

      // --------------------------------------
      // Save profile
      // --------------------------------------

      const response = await api.put(
        "/api/candidate/profile",
        profileData
      );

      console.log(
        "PROFILE UPDATE SUCCESS:",
        response.data
      );

      setMessage(
        "Profile saved successfully."
      );

      // --------------------------------------
      // Go back to dashboard
      // --------------------------------------

      setTimeout(() => {
        navigate("/candidate");
      }, 1000);

    } catch (err) {
      console.error(
        "PROFILE UPDATE ERROR:",
        err.response?.data || err
      );

      // --------------------------------------
      // Unauthorized
      // --------------------------------------

      if (
        err.response?.status === 401
      ) {
        localStorage.removeItem(
          "access_token"
        );

        navigate("/login");

        return;
      }

      // --------------------------------------
      // Validation error
      // --------------------------------------

      if (
        err.response?.status === 422
      ) {
        const detail =
          err.response?.data?.detail;

        if (Array.isArray(detail)) {
          const messages =
            detail
              .map((item) =>
                item.msg
              )
              .join(", ");

          setError(messages);
        } else {
          setError(
            detail ||
            "Invalid profile information."
          );
        }

        return;
      }

      // --------------------------------------
      // Other backend errors
      // --------------------------------------

      setError(
        err.response?.data?.detail ||
        "Failed to save profile."
      );

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading profile...
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="edit-profile-page">

      <div className="edit-profile-card">

        {/* ==================================
            HEADER
        =================================== */}

        <div className="edit-profile-header">

          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate("/candidate")
            }
          >
            ← Back
          </button>

          <div>

            <p className="section-label">
              CANDIDATE PROFILE
            </p>

            <h1>
              Edit Profile
            </h1>

            <p>
              Keep your profile updated to get
              better job recommendations.
            </p>

          </div>

        </div>

        {/* ==================================
            SUCCESS
        =================================== */}

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {/* ==================================
            ERROR
        =================================== */}

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        {/* ==================================
            FORM
        =================================== */}

        <form onSubmit={handleSubmit}>

          <div className="edit-form-grid">

            {/* HEADLINE */}

            <div className="form-group">

              <label>
                Headline
              </label>

              <input
                name="headline"
                value={form.headline}
                onChange={handleChange}
                placeholder="Example: CSE Student"
              />

            </div>

            {/* LOCATION */}

            <div className="form-group">

              <label>
                Location
              </label>

              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Example: Bengaluru"
              />

            </div>

            {/* BIO */}

            <div className="form-group full-width">

              <label>
                About / Bio
              </label>

              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell recruiters about yourself"
                rows="4"
              />

            </div>

            {/* EDUCATION */}

            <div className="form-group">

              <label>
                Education
              </label>

              <input
                name="education"
                value={form.education}
                onChange={handleChange}
                placeholder="Example: B.E Computer Science"
              />

            </div>

            {/* EXPERIENCE */}

            <div className="form-group">

              <label>
                Experience
              </label>

              <select
                name="experience"
                value={form.experience}
                onChange={handleChange}
              >

                <option value="">
                  Select experience level
                </option>

                {EXPERIENCE_LEVELS.map(
                  (level) => (
                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* =================================
                SKILLS
            ================================= */}

            <div className="form-group full-width">

              <label>
                Skills
              </label>

              {/* SELECTED SKILLS */}

              {selectedSkills.length > 0 && (
                <div className="selected-skills">

                  {selectedSkills.map(
                    (skill) => (
                      <div
                        className="skill-chip"
                        key={skill}
                      >

                        <span>
                          {skill}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeSkill(skill)
                          }
                          aria-label={
                            `Remove ${skill}`
                          }
                        >
                          ×
                        </button>

                      </div>
                    )
                  )}

                </div>
              )}

              {/* SEARCH SKILLS */}

              <div className="skill-selector">

                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => {
                    setSkillSearch(
                      e.target.value
                    );

                    setSkillDropdownOpen(
                      true
                    );
                  }}
                  onFocus={() =>
                    setSkillDropdownOpen(
                      true
                    )
                  }
                  placeholder="Search or select a skill..."
                  className="skill-search-input"
                />

                {/* DROPDOWN */}

                {skillDropdownOpen && (
                  <div className="skills-dropdown">

                    {filteredSkills.length > 0 ? (

                      filteredSkills.map(
                        (skill) => (
                          <button
                            type="button"
                            className="skill-option"
                            key={skill}
                            onClick={() =>
                              addSkill(skill)
                            }
                          >
                            {skill}
                          </button>
                        )
                      )

                    ) : (

                      <div className="no-skill-result">
                        No matching skills found
                      </div>

                    )}

                  </div>
                )}

              </div>

              {/* =================================
                  CUSTOM SKILL
              ================================= */}

              {showCustomSkill && (
                <div className="custom-skill-area">

                  <label>
                    Add Your Skill
                  </label>

                  <div className="custom-skill-row">

                    <input
                      type="text"
                      value={customSkill}
                      onChange={(e) =>
                        setCustomSkill(
                          e.target.value
                        )
                      }
                      onKeyDown={
                        handleCustomSkillKeyDown
                      }
                      placeholder="Example: Flutter"
                      className="custom-skill-input"
                      autoFocus
                    />

                    <button
                      type="button"
                      className="custom-skill-add-button"
                      onClick={
                        addCustomSkill
                      }
                    >
                      Add
                    </button>

                  </div>

                  <small className="field-help">
                    Enter your skill and click
                    Add or press Enter.
                  </small>

                </div>
              )}

              <small className="field-help">
                Select multiple skills that match
                your experience.
              </small>

            </div>

            {/* PREFERRED ROLE */}

            <div className="form-group">

              <label>
                Preferred Role
              </label>

              <input
                name="preferred_role"
                value={form.preferred_role}
                onChange={handleChange}
                placeholder="Example: Software Developer"
              />

            </div>

            {/* PREFERRED LOCATION */}

            <div className="form-group">

              <label>
                Preferred Location
              </label>

              <input
                name="preferred_location"
                value={
                  form.preferred_location
                }
                onChange={handleChange}
                placeholder="Example: Bengaluru"
              />

            </div>

            {/* EXPECTED SALARY */}

            <div className="form-group">

              <label>
                Expected Salary
              </label>

              <input
                type="number"
                name="expected_salary"
                value={
                  form.expected_salary
                }
                onChange={handleChange}
                min="10001"
                step="1"
                placeholder="Example: 600000"
              />

              <small className="field-help">
                Minimum expected salary:
                ₹10,001
              </small>

            </div>

          </div>

          {/* ==================================
              ACTIONS
          =================================== */}

          <div className="edit-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() =>
                navigate("/candidate")
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EditProfile;