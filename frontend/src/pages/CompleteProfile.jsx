import { useState } from "react";
import { useNavigate } from "react-router-dom";

/*
 * Existing skills available in SwipeX.
 *
 * Later, these can come from the backend/database.
 */

const EXISTING_SKILLS = [
  "C",
  "C++",
  "C#",
  "Java",
  "JavaScript",
  "TypeScript",
  "Python",
  "React",
  "React Native",
  "Angular",
  "Vue.js",
  "Node.js",
  "Express.js",
  "Django",
  "FastAPI",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Bootstrap",
  "SQL",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Git",
  "GitHub",
  "Docker",
  "AWS",
  "Azure",
  "Machine Learning",
  "Deep Learning",
  "Natural Language Processing",
  "Data Science",
  "Data Analysis",
  "scikit-learn",
  "TensorFlow",
  "PyTorch",
  "Figma",
  "UI/UX Design",
  "REST API",
];

/*
 * Existing job roles available in SwipeX.
 */

const EXISTING_ROLES = [
  "Software Developer",
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "React Developer",
  "Java Developer",
  "Python Developer",
  "Node.js Developer",
  "Web Developer",
  "Mobile App Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Database Administrator",
  "UI/UX Designer",
  "Product Designer",
  "QA Engineer",
  "Software Tester",
  "Cybersecurity Analyst",
];

/*
 * Minimum acceptable salary.
 *
 * 0 and 1 will therefore never be accepted.
 */

const MIN_SALARY = 10000;

function CompleteProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    headline: "",
    summary: "",
    location: "",
    experience: "",
    education: "",
    projects: "",
    certifications: "",
    preferredJobType: "",
    preferredLocation: "",
    preferredRole: "",
    expectedSalary: "",
  });

  const [skills, setSkills] = useState([]);

  const [skillInput, setSkillInput] = useState("");

  const [error, setError] = useState("");

  /*
   * -----------------------------
   * GENERAL INPUT
   * -----------------------------
   */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  };

  /*
   * -----------------------------
   * SKILL SEARCH
   * -----------------------------
   */

  const filteredSkills =
    skillInput.trim() === ""
      ? []
      : EXISTING_SKILLS.filter((skill) =>
          skill
            .toLowerCase()
            .includes(skillInput.toLowerCase())
        ).filter(
          (skill) => !skills.includes(skill)
        );

  /*
   * -----------------------------
   * ADD EXISTING SKILL
   * -----------------------------
   */

  const addExistingSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills((previousSkills) => [
        ...previousSkills,
        skill,
      ]);
    }

    setSkillInput("");
  };

  /*
   * -----------------------------
   * ADD CUSTOM SKILL
   * -----------------------------
   */

  const addCustomSkill = () => {
    const newSkill = skillInput.trim();

    if (newSkill === "") {
      return;
    }

    /*
     * Check whether the typed skill already exists.
     *
     * If it exists, use the existing version.
     */

    const existingSkill =
      EXISTING_SKILLS.find(
        (skill) =>
          skill.toLowerCase() ===
          newSkill.toLowerCase()
      );

    if (existingSkill) {
      addExistingSkill(existingSkill);
      return;
    }

    /*
     * Otherwise allow the candidate
     * to add their own skill.
     */

    if (!skills.includes(newSkill)) {
      setSkills((previousSkills) => [
        ...previousSkills,
        newSkill,
      ]);
    }

    setSkillInput("");
  };

  /*
   * -----------------------------
   * REMOVE SKILL
   * -----------------------------
   */

  const removeSkill = (skillToRemove) => {
    setSkills((previousSkills) =>
      previousSkills.filter(
        (skill) => skill !== skillToRemove
      )
    );
  };

  /*
   * -----------------------------
   * SKILL ENTER KEY
   * -----------------------------
   */

  const handleSkillKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      if (filteredSkills.length > 0) {
        addExistingSkill(filteredSkills[0]);
      } else {
        addCustomSkill();
      }
    }
  };

  /*
   * -----------------------------
   * SALARY INPUT
   * -----------------------------
   *
   * Only numbers are accepted.
   */

  const handleSalaryChange = (event) => {
    const value =
      event.target.value.replace(/\D/g, "");

    setFormData((previousData) => ({
      ...previousData,
      expectedSalary: value,
    }));

    setError("");
  };

  /*
   * -----------------------------
   * VALIDATION
   * -----------------------------
   */

  const validateForm = () => {
    if (!formData.headline.trim()) {
      return "Please enter your professional headline.";
    }

    if (!formData.summary.trim()) {
      return "Please enter your professional summary.";
    }

    if (!formData.location.trim()) {
      return "Please enter your current location.";
    }

    if (!formData.experience) {
      return "Please select your experience.";
    }

    if (!formData.education.trim()) {
      return "Please enter your education.";
    }

    if (skills.length === 0) {
      return "Please add at least one skill.";
    }

    /*
     * Preferred role is optional,
     * but if selected it MUST come from
     * the predefined list.
     */

    if (
      formData.preferredRole &&
      !EXISTING_ROLES.includes(
        formData.preferredRole
      )
    ) {
      return "Please select a valid preferred job role.";
    }

    /*
     * Preferred location remains optional.
     */

    /*
     * Salary is optional.
     *
     * If entered, it must be at least
     * MIN_SALARY.
     */

    if (formData.expectedSalary) {
      const salary =
        Number(formData.expectedSalary);

      if (salary < MIN_SALARY) {
        return `Expected salary must be at least ₹${MIN_SALARY.toLocaleString("en-IN")}.`;
      }
    }

    return "";
  };

  /*
   * -----------------------------
   * SUBMIT
   * -----------------------------
   */

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    /*
     * Profile completed.
     *
     * Next step:
     * Upload Resume
     */

    navigate("/upload-resume");
  };

  return (
    <div className="page">

      <div className="form-container profile-container">

        <h1>
          Complete Your Profile
        </h1>

        <p className="form-subtitle">
          Tell us about yourself so SwipeX can
          find suitable opportunities.
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* HEADLINE */}

          <div className="form-group">

            <label htmlFor="headline">
              Professional Headline
            </label>

            <input
              id="headline"
              name="headline"
              type="text"
              value={formData.headline}
              onChange={handleChange}
              placeholder="e.g. Computer Science Student"
              required
            />

          </div>

          {/* SUMMARY */}

          <div className="form-group">

            <label htmlFor="summary">
              Professional Summary
            </label>

            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Tell us briefly about yourself"
              rows="4"
              required
            />

          </div>

          {/* CURRENT LOCATION */}

          <div className="form-group">

            <label htmlFor="location">
              Current Location
            </label>

            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Bangalore"
              required
            />

          </div>

          {/* EXPERIENCE */}

          <div className="form-group">

            <label htmlFor="experience">
              Experience
            </label>

            <select
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              required
            >

              <option value="">
                Select experience
              </option>

              <option value="Fresher">
                Fresher
              </option>

              <option value="0-1">
                0-1 Years
              </option>

              <option value="1-2">
                1-2 Years
              </option>

              <option value="2-5">
                2-5 Years
              </option>

              <option value="5-10">
                5-10 Years
              </option>

              <option value="10+">
                10+ Years
              </option>

            </select>

          </div>

          {/* EDUCATION */}

          <div className="form-group">

            <label htmlFor="education">
              Education
            </label>

            <input
              id="education"
              name="education"
              type="text"
              value={formData.education}
              onChange={handleChange}
              placeholder="e.g. B.Tech Computer Science"
              required
            />

          </div>

          {/* SKILLS */}

          <div className="form-group">

            <label htmlFor="skills">
              Skills
            </label>

            <div className="skill-input-container">

              <input
                id="skills"
                type="text"
                value={skillInput}
                onChange={(event) =>
                  setSkillInput(
                    event.target.value
                  )
                }
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill, e.g. React"
              />

            </div>

            {/* SUGGESTIONS */}

            {filteredSkills.length > 0 && (
              <div className="skill-suggestions">

                {filteredSkills
                  .slice(0, 8)
                  .map((skill) => (

                    <button
                      type="button"
                      key={skill}
                      className="skill-suggestion"
                      onClick={() =>
                        addExistingSkill(skill)
                      }
                    >
                      {skill}
                    </button>

                  ))}

              </div>
            )}

            {/* CUSTOM SKILL */}

            {skillInput.trim() !== "" &&
              filteredSkills.length === 0 && (
                <button
                  type="button"
                  className="add-custom-skill"
                  onClick={addCustomSkill}
                >
                  + Add "{skillInput.trim()}"
                </button>
              )}

            {/* SELECTED SKILLS */}

            {skills.length > 0 && (
              <div className="selected-skills">

                {skills.map((skill) => (

                  <span
                    className="selected-skill"
                    key={skill}
                  >

                    {skill}

                    <button
                      type="button"
                      onClick={() =>
                        removeSkill(skill)
                      }
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>

                  </span>

                ))}

              </div>
            )}

            <p className="field-hint">
              Start typing to find an existing skill.
              If it is not available, you can add your
              own skill.
            </p>

          </div>

          {/* PROJECTS */}

          <div className="form-group">

            <label htmlFor="projects">
              Projects
            </label>

            <textarea
              id="projects"
              name="projects"
              value={formData.projects}
              onChange={handleChange}
              placeholder="Mention your projects"
              rows="3"
            />

          </div>

          {/* CERTIFICATIONS */}

          <div className="form-group">

            <label htmlFor="certifications">
              Certifications
            </label>

            <textarea
              id="certifications"
              name="certifications"
              value={formData.certifications}
              onChange={handleChange}
              placeholder="Mention your certifications"
              rows="3"
            />

          </div>

          {/* PREFERRED JOB TYPE */}

          <div className="form-group">

            <label htmlFor="preferredJobType">
              Preferred Job Type
            </label>

            <select
              id="preferredJobType"
              name="preferredJobType"
              value={formData.preferredJobType}
              onChange={handleChange}
            >

              <option value="">
                Select job type
              </option>

              <option value="Full Time">
                Full Time
              </option>

              <option value="Part Time">
                Part Time
              </option>

              <option value="Internship">
                Internship
              </option>

              <option value="Contract">
                Contract
              </option>

            </select>

          </div>

          {/* PREFERRED LOCATION */}

          <div className="form-group">

            <label htmlFor="preferredLocation">
              Preferred Location
              <span className="optional-label">
                {" "} (Optional)
              </span>
            </label>

            <input
              id="preferredLocation"
              name="preferredLocation"
              type="text"
              value={formData.preferredLocation}
              onChange={handleChange}
              placeholder="e.g. Bangalore"
            />

          </div>

          {/* PREFERRED ROLE */}

          <div className="form-group">

            <label htmlFor="preferredRole">
              Preferred Job Role
              <span className="optional-label">
                {" "} (Optional)
              </span>
            </label>

            <select
              id="preferredRole"
              name="preferredRole"
              value={formData.preferredRole}
              onChange={handleChange}
            >

              <option value="">
                Select preferred role
              </option>

              {EXISTING_ROLES.map((role) => (

                <option
                  value={role}
                  key={role}
                >
                  {role}
                </option>

              ))}

            </select>

            <p className="field-hint">
              Select a role from the available job
              roles.
            </p>

          </div>

          {/* EXPECTED SALARY */}

          <div className="form-group">

            <label htmlFor="expectedSalary">
              Expected Salary
              <span className="optional-label">
                {" "} (Optional)
              </span>
            </label>

            <input
              id="expectedSalary"
              name="expectedSalary"
              type="text"
              inputMode="numeric"
              value={formData.expectedSalary}
              onChange={handleSalaryChange}
              placeholder={`Minimum ₹${MIN_SALARY.toLocaleString("en-IN")}`}
            />

            <p className="field-hint">
              Enter salary as a number only.
              Minimum accepted value is ₹
              {MIN_SALARY.toLocaleString("en-IN")}.
            </p>

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            className="primary-button"
          >
            Save Profile & Continue
          </button>

        </form>

      </div>

    </div>
  );
}

export default CompleteProfile;