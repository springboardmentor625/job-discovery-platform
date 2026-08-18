import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function CreateProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    experience: "",
    education: "",
    projects: "",
    certifications: "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // -------------------------
  // Add Skill Validation
  // -------------------------
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
        (s) => s.toLowerCase() === skill.toLowerCase()
      )
    ) {
      alert("Skill already added.");
      return;
    }

    setSkills([...skills, skill]);
    setSkillInput("");
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // -------------------------
  // Submit
  // -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (skills.length < 2) {
      alert("Please add at least 2 professional skills.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      alert("Enter a valid 10-digit mobile number.");
      return;
    }

    if (formData.education.trim().length < 10) {
      alert("Please enter valid education details.");
      return;
    }

    if (formData.projects.trim().length < 20) {
      alert(
        "Please provide a meaningful project description (minimum 20 characters)."
      );
      return;
    }

    if (
      formData.certifications &&
      formData.certifications.trim().length < 5
    ) {
      alert("Please enter a valid certification.");
      return;
    }

    try {
      const data = {
        ...formData,
        skills: skills.join(", "),
      };

      await api.post("candidates/", data);

      alert("Profile Created Successfully!");
      navigate("/profile");
    } catch (error) {
      console.log(error.response?.data);

      if (error.response?.data) {
        const message = Object.entries(error.response.data)
          .map(
            ([key, value]) =>
              `${key}: ${
                Array.isArray(value) ? value.join(", ") : value
              }`
          )
          .join("\n");

        alert(message);
      } else {
        alert("Unable to create profile.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center py-10">
      <div className="bg-white shadow-xl rounded-xl w-full max-w-3xl p-8">

        <h2 className="text-3xl font-bold text-indigo-700 mb-2">
          Create Candidate Profile
        </h2>

        <p className="text-gray-500 mb-6">
          Complete your professional profile to receive better job recommendations.
        </p>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4"
        >

          <input
            className="border p-3 rounded-lg"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />

          <input
            className="border p-3 rounded-lg"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            className="border p-3 rounded-lg"
            name="phone"
            placeholder="10-digit Mobile Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <select
            className="border p-3 rounded-lg"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            required
          >
            <option value="">Select Experience</option>
            <option value="Fresher">Fresher</option>
            <option value="0-1 Years">0-1 Years</option>
            <option value="1-3 Years">1-3 Years</option>
            <option value="3-5 Years">3-5 Years</option>
            <option value="5-8 Years">5-8 Years</option>
            <option value="8+ Years">8+ Years</option>
          </select>

          <div className="col-span-2">
            <label className="block font-semibold mb-2">
              Professional Skills
            </label>

            <div className="flex gap-2">

              <input
                type="text"
                value={skillInput}
                onChange={(e) =>
                  setSkillInput(e.target.value)
                }
                placeholder="Example: Python"
                className="border rounded-lg p-3 flex-1"
              />

              <button
                type="button"
                onClick={addSkill}
                className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700"
              >
                + Add
              </button>

            </div>

            <p className="text-sm text-gray-500 mt-2">
              Add technical or professional skills like React, SQL, Java, AWS.
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
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

          <textarea
            className="border p-3 rounded-lg col-span-2"
            rows={3}
            name="education"
            placeholder="Example: B.Tech in Computer Science, JNTUH (2022-2026)"
            value={formData.education}
            onChange={handleChange}
            required
          />

          <textarea
            className="border p-3 rounded-lg col-span-2"
            rows={4}
            name="projects"
            placeholder="Describe your academic or personal projects..."
            value={formData.projects}
            onChange={handleChange}
            required
          />

          <textarea
            className="border p-3 rounded-lg col-span-2"
            rows={3}
            name="certifications"
            placeholder="Example: AWS Cloud Practitioner, Google Data Analytics"
            value={formData.certifications}
            onChange={handleChange}
          />

          <button
            className="col-span-2 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Save Profile
          </button>

        </form>

      </div>
    </div>
  );
}

export default CreateProfile;