import {
  useEffect,
  useState,
  useRef,
} from "react";

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

  // Programming Languages
  "C",
  "C++",
  "C#",
  "Java",
  "Python",
  "JavaScript",
  "TypeScript",
  "Go",
  "Rust",
  "PHP",
  "Kotlin",
  "Swift",
  "R",

  // Frontend
  "HTML",
  "CSS",
  "SASS",
  "Bootstrap",
  "Tailwind CSS",
  "React",
  "Next.js",
  "Angular",
  "Vue.js",
  "Redux",

  // Backend
  "Node.js",
  "Express.js",
  "FastAPI",
  "Django",
  "Flask",
  "Spring Boot",
  ".NET",
  "Laravel",

  // Databases
  "SQL",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "SQLite",
  "Oracle",
  "Redis",
  "Firebase",

  // DevOps & Cloud
  "Git",
  "GitHub",
  "GitLab",
  "Docker",
  "Kubernetes",
  "Jenkins",
  "AWS",
  "Azure",
  "Google Cloud",
  "Linux",

  // Data & AI
  "Machine Learning",
  "Deep Learning",
  "Data Science",
  "Data Analysis",
  "Data Engineering",
  "Artificial Intelligence",
  "TensorFlow",
  "PyTorch",
  "Scikit-learn",
  "Pandas",
  "NumPy",
  "Power BI",
  "Tableau",

  // Mobile
  "Android Development",
  "Flutter",
  "React Native",
  "Android Studio",

  // Tools
  "VS Code",
  "Postman",
  "Jira",
  "Figma",
  "UI/UX",

  // Concepts
  "REST API",
  "GraphQL",
  "Microservices",
  "System Design",
  "OOP",
  "DSA",
  "Computer Networks",
  "Operating Systems",
  "Cybersecurity",

  // Custom option
  "Other",
];


// ==========================================
// COMPONENT
// ==========================================

function EditProfile() {

  const navigate = useNavigate();

  const skillAreaRef = useRef(null);


  // ==========================================
  // FORM STATE
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
  // SKILL STATES
  // ==========================================

  const [selectedSkills, setSelectedSkills] =
    useState([]);

  const [skillSearch, setSkillSearch] =
    useState("");

  const [skillDropdownOpen, setSkillDropdownOpen] =
    useState(false);

  const [customSkill, setCustomSkill] =
    useState("");

  const [showCustomSkill, setShowCustomSkill] =
    useState(false);


  // ==========================================
  // OTHER STATES
  // ==========================================

  const [loading, setLoading] =
    useState(true);

  const [fullName, setFullName] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  // ==========================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // ==========================================

  useEffect(() => {

    const handleOutsideClick = (event) => {

      if (
        skillAreaRef.current &&
        !skillAreaRef.current.contains(event.target)
      ) {

        // Close dropdown
        setSkillDropdownOpen(false);

        // Close custom skill input
        setShowCustomSkill(false);

        // Clear search
        setSkillSearch("");

        // Clear unfinished custom skill
        setCustomSkill("");

      }

    };


    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

    };

  }, []);


  // ==========================================
  // LOAD PROFILE
  // ==========================================

  useEffect(() => {

    const loadProfile = async () => {

      try {

        const userResponse = await api.get(
          "/api/auth/me"
        );

        setFullName(
          userResponse.data.full_name || ""
        );

      } catch (err) {

        console.error(
          "USER LOAD ERROR:",
          err
        );

      }

      try {

        const response = await api.get(
          "/api/candidate/profile"
        );

        const profile = response.data;

        if (profile.full_name) {

          setFullName(
            profile.full_name
          );

        }


        // --------------------------------------
        // LOAD SAVED SKILLS
        // --------------------------------------

        const existingSkills =
          profile.skills
            ? profile.skills
                .split(",")
                .map((skill) =>
                  skill.trim()
                )
                .filter(Boolean)
            : [];


        // Remove "Other" if somehow saved

        const cleanedSkills =
          existingSkills.filter(
            (skill) =>
              skill.toLowerCase() !== "other"
          );


        setSelectedSkills(cleanedSkills);


        // --------------------------------------
        // LOAD FORM
        // --------------------------------------

        setForm({

          headline:
            profile.headline || "",

          bio:
            profile.bio || "",

          location:
            profile.location || "",

          education:
            profile.education || "",

          skills:
            cleanedSkills.join(", "),

          experience:
            profile.experience || "",

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


        if (
          err.response?.status === 401
        ) {

          localStorage.removeItem(
            "access_token"
          );

          navigate("/login");

          return;

        }


        if (
          err.response?.status !== 404
        ) {

          setError(
            "Unable to load profile."
          );

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
  // CHECK CUSTOM SKILLS
  // ==========================================

  const hasCustomSkill =
    selectedSkills.some(
      (skill) =>
        !AVAILABLE_SKILLS.some(
          (availableSkill) =>
            availableSkill.toLowerCase() ===
            skill.toLowerCase()
        )
    );


  // ==========================================
  // ADD PREDEFINED SKILL
  // ==========================================

  const addSkill = (skill) => {

    // ----------------------------------------
    // CUSTOM SKILL
    // ----------------------------------------

    if (skill === "Other") {

      setShowCustomSkill(true);

      setSkillDropdownOpen(false);

      setSkillSearch("");

      setCustomSkill("");

      setError("");

      return;

    }


    // ----------------------------------------
    // CHECK DUPLICATE
    // ----------------------------------------

    const alreadyExists =
      selectedSkills.some(
        (selectedSkill) =>
          selectedSkill.toLowerCase() ===
          skill.toLowerCase()
      );


    if (!alreadyExists) {

      setSelectedSkills(
        (previous) => [
          ...previous,
          skill,
        ]
      );

    }


    // ----------------------------------------
    // RESET
    // ----------------------------------------

    setSkillSearch("");

    setSkillDropdownOpen(false);

    setError("");

  };


  // ==========================================
  // REMOVE SKILL
  // ==========================================

  const removeSkill = (
    skillToRemove
  ) => {

    setSelectedSkills(
      (previous) =>
        previous.filter(
          (skill) =>
            skill.toLowerCase() !==
            skillToRemove.toLowerCase()
        )
    );


    setError("");

  };


  // ==========================================
  // ADD CUSTOM SKILL
  // ==========================================

  const addCustomSkill = () => {

    const value =
      customSkill.trim();


    // ----------------------------------------
    // EMPTY VALIDATION
    // ----------------------------------------

    if (!value) {

      setError(
        "Please enter a skill."
      );

      return;

    }


    // ----------------------------------------
    // SPLIT MULTIPLE SKILLS
    // ----------------------------------------

    const skillsToAdd =
      value
        .split(",")
        .map((skill) =>
          skill.trim()
        )
        .filter(Boolean)
        .filter(
          (skill) =>
            skill.toLowerCase() !== "other"
        );


    if (skillsToAdd.length === 0) {

      setError(
        "Please enter a valid skill."
      );

      return;

    }


    // ----------------------------------------
    // ADD SKILLS
    // ----------------------------------------

    setSelectedSkills(
      (previous) => {

        const updated = [
          ...previous,
        ];


        skillsToAdd.forEach(
          (skill) => {

            const alreadyExists =
              updated.some(
                (existingSkill) =>
                  existingSkill.toLowerCase() ===
                  skill.toLowerCase()
              );


            if (!alreadyExists) {

              updated.push(skill);

            }

          }
        );


        return updated;

      }
    );


    // ----------------------------------------
    // IMPORTANT:
    // CLOSE CUSTOM AREA AFTER ADDING
    // ----------------------------------------

    setCustomSkill("");

    setShowCustomSkill(false);

    setSkillDropdownOpen(false);

    setSkillSearch("");

    setError("");

  };


  // ==========================================
  // CUSTOM SKILL KEYBOARD
  // ==========================================

  const handleCustomSkillKeyDown = (
    e
  ) => {

    if (e.key === "Enter") {

      e.preventDefault();

      addCustomSkill();

    }

  };


  // ==========================================
  // FILTER SKILLS
  // ==========================================

  const filteredSkills =
    AVAILABLE_SKILLS.filter(
      (skill) => {

        // Hide selected skills

        const alreadySelected =
          selectedSkills.some(
            (selectedSkill) =>
              selectedSkill.toLowerCase() ===
              skill.toLowerCase()
          );


        if (alreadySelected) {
          return false;
        }


        // No search

        if (
          skillSearch.trim() === ""
        ) {
          return true;
        }


        // Search

        return skill
          .toLowerCase()
          .includes(
            skillSearch
              .trim()
              .toLowerCase()
          );

      }
    );


  // ==========================================
  // SUBMIT PROFILE
  // ==========================================

  const handleSubmit = async (
    e
  ) => {

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

    const salary =
      Number(
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

    if (
      selectedSkills.length === 0
    ) {

      setError(
        "Please select at least one skill."
      );

      setSaving(false);

      return;

    }


    try {

      // --------------------------------------
      // PREPARE DATA
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


      // --------------------------------------
      // SAVE PROFILE
      // --------------------------------------

      const response =
        await api.put(
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


      setTimeout(() => {

        navigate("/candidate");

      }, 1000);


    } catch (err) {

      console.error(
        "PROFILE UPDATE ERROR:",
        err.response?.data || err
      );


      // Unauthorized

      if (
        err.response?.status === 401
      ) {

        localStorage.removeItem(
          "access_token"
        );

        navigate("/login");

        return;

      }


      // Validation error

      if (
        err.response?.status === 422
      ) {

        const detail =
          err.response?.data?.detail;


        if (
          Array.isArray(detail)
        ) {

          setError(
            detail
              .map(
                (item) => item.msg
              )
              .join(", ")
          );

        } else {

          setError(
            detail ||
            "Invalid profile information."
          );

        }

        return;

      }


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
      <div className="flex min-h-[60vh] items-center justify-center text-sx-text-secondary">
        Loading profile...
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  const inputClasses =
    "w-full rounded-lg border border-sx-border px-3.5 py-2.5 text-sm text-sx-text outline-none transition focus:border-sx-primary focus:ring-2 focus:ring-sx-primary/20";

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-2xl border border-sx-border bg-sx-card p-8 shadow-sm">
        {/* HEADER */}

        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-sx-primary">
            CANDIDATE PROFILE
          </p>
          <h1 className="mt-2 text-2xl font-bold text-sx-text">
            Edit Profile
          </h1>
          <p className="mt-1 text-sm text-sx-text-secondary">
            Keep your profile updated to get better job recommendations.
          </p>
        </div>

        {/* SUCCESS */}

        {message && (
          <div className="mb-4 rounded-lg border border-sx-success-border bg-sx-success-bg px-4 py-3 text-sm text-sx-success">
            {message}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-4 rounded-lg border border-sx-danger-border bg-sx-danger-bg px-4 py-3 text-sm text-sx-danger">
            {error}
          </div>
        )}

        {/* FORM */}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* FULL NAME (READ-ONLY) */}

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-sx-text-secondary">
                Full Name
              </label>

              <input
                value={fullName}
                disabled
                readOnly
                className={`${inputClasses} cursor-not-allowed bg-sx-bg-soft text-sx-text-secondary`}
              />

              <small className="text-xs text-sx-text-muted">
                Your name is set at registration and can't be changed here.
              </small>
            </div>

            {/* HEADLINE */}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-sx-text-secondary">
                Headline
              </label>

              <input
                name="headline"
                value={form.headline}
                onChange={handleChange}
                placeholder="Example: CSE Student"
                className={inputClasses}
              />
            </div>

            {/* LOCATION */}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-sx-text-secondary">
                Location
              </label>

              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Example: Bengaluru"
                className={inputClasses}
              />
            </div>

            {/* BIO */}

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-sx-text-secondary">
                About / Bio
              </label>

              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell recruiters about yourself"
                rows="4"
                className={inputClasses}
              />
            </div>

            {/* EDUCATION */}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-sx-text-secondary">
                Education
              </label>

              <input
                name="education"
                value={form.education}
                onChange={handleChange}
                placeholder="Example: B.E Computer Science"
                className={inputClasses}
              />
            </div>

            {/* EXPERIENCE */}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-sx-text-secondary">
                Experience
              </label>

              <select
                name="experience"
                value={form.experience}
                onChange={handleChange}
                className={inputClasses}
              >
                <option value="">Select experience level</option>

                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* SKILLS */}

            <div
              className="relative flex flex-col gap-1.5 sm:col-span-2"
              ref={skillAreaRef}
            >
              <label className="text-sm font-medium text-sx-text-secondary">
                Skills
              </label>

              {/* SELECTED SKILLS */}

              {selectedSkills.length > 0 && (
                <div className="mb-1 flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-1.5 rounded-full bg-sx-primary-soft px-3 py-1.5 text-xs font-medium text-sx-primary-dark"
                    >
                      <span>{skill}</span>

                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                        className="text-sx-primary-dark/70 hover:text-sx-primary-dark"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* SEARCH */}

              <div className="relative">
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => {
                    setSkillSearch(e.target.value);
                    setSkillDropdownOpen(true);
                  }}
                  onFocus={() => setSkillDropdownOpen(true)}
                  placeholder="Search or select a skill..."
                  className={inputClasses}
                />

                {/* DROPDOWN */}

                {skillDropdownOpen && (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-sx-border bg-sx-card shadow-lg">
                    {filteredSkills.length > 0 ? (
                      filteredSkills.map((skill) => (
                        <button
                          type="button"
                          key={skill}
                          onClick={() => addSkill(skill)}
                          className="block w-full px-3.5 py-2 text-left text-sm text-sx-text transition hover:bg-sx-bg-soft"
                        >
                          {skill}
                        </button>
                      ))
                    ) : (
                      <div className="px-3.5 py-3 text-sm text-sx-text-muted">
                        No matching skills found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CUSTOM SKILL */}

              {showCustomSkill && (
                <div className="mt-2 rounded-lg border border-sx-border bg-sx-bg-soft p-3">
                  <label className="text-sm font-medium text-sx-text-secondary">
                    Add Custom Skill
                  </label>

                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyDown={handleCustomSkillKeyDown}
                      placeholder="Example: Flutter"
                      autoFocus
                      className={`flex-1 ${inputClasses}`}
                    />

                    <button
                      type="button"
                      onClick={addCustomSkill}
                      className="rounded-lg bg-sx-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-sx-primary-dark"
                    >
                      Add
                    </button>
                  </div>

                  <small className="mt-1.5 block text-xs text-sx-text-muted">
                    Enter a skill and click Add or press Enter. You can add
                    multiple skills separated by commas.
                  </small>
                </div>
              )}

              <small className="text-xs text-sx-text-muted">
                Select multiple skills that match your experience.
              </small>
            </div>

            {/* PREFERRED ROLE */}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-sx-text-secondary">
                Preferred Role
              </label>

              <input
                name="preferred_role"
                value={form.preferred_role}
                onChange={handleChange}
                placeholder="Example: Software Developer"
                className={inputClasses}
              />
            </div>

            {/* PREFERRED LOCATION */}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-sx-text-secondary">
                Preferred Location
              </label>

              <input
                name="preferred_location"
                value={form.preferred_location}
                onChange={handleChange}
                placeholder="Example: Bengaluru"
                className={inputClasses}
              />
            </div>

            {/* EXPECTED SALARY */}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-sx-text-secondary">
                Expected Salary
              </label>

              <input
                type="number"
                name="expected_salary"
                value={form.expected_salary}
                onChange={handleChange}
                min="10001"
                step="1"
                placeholder="Example: 600000"
                className={inputClasses}
              />

              <small className="text-xs text-sx-text-muted">
                Minimum expected salary: ₹10,001
              </small>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/candidate")}
              className="rounded-lg border border-sx-border px-5 py-2.5 text-sm font-semibold text-sx-text-secondary transition hover:bg-sx-bg-soft"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sx-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sx-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;