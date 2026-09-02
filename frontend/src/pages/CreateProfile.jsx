import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

function CreateProfile() {
  const navigate = useNavigate();

  // ============================================
  // STEP
  // ============================================

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // ============================================
  // FORM DATA
  // ============================================

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    experience: "",
    education: "",
    projects: "",
    certifications: "",
  });

  // ============================================
  // SKILLS
  // ============================================

  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);

  const suggestedSkills = [
    "Python",
    "React",
    "Java",
    "JavaScript",
    "SQL",
    "Django",
    "AWS",
    "Docker",
  ];

  // ============================================
  // HANDLE INPUT
  // ============================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ============================================
  // ADD SKILL
  // ============================================

  const addSkill = (skillValue = skillInput) => {
    const skill = skillValue.trim();

    const skillRegex = /^[A-Za-z+#.\-\s]{2,30}$/;

    if (!skill) {
      toast.error("Please enter a skill.");
      return;
    }

    if (!skillRegex.test(skill)) {
      toast.error(
        "Enter a valid professional skill such as Python, React, C++, or SQL."
      );
      return;
    }

    if (
      skills.some(
        (s) => s.toLowerCase() === skill.toLowerCase()
      )
    ) {
      toast.error("Skill already added.");
      return;
    }

    setSkills([...skills, skill]);
    setSkillInput("");

    toast.success(`${skill} added`);
  };

  // ============================================
  // REMOVE SKILL
  // ============================================

  const removeSkill = (index) => {
    const removedSkill = skills[index];

    setSkills(
      skills.filter((_, i) => i !== index)
    );

    toast.success(`${removedSkill} removed`);
  };

  // ============================================
  // STEP 1 VALIDATION
  // ============================================

  const validateStepOne = () => {
    if (!formData.full_name.trim()) {
      toast.error("Please enter your full name.");
      return false;
    }

    if (formData.full_name.trim().length < 3) {
      toast.error("Please enter a valid full name.");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter your email.");
      return false;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error(
        "Enter a valid 10-digit mobile number."
      );
      return false;
    }

    if (!formData.experience) {
      toast.error("Please select your experience.");
      return false;
    }

    return true;
  };

  // ============================================
  // STEP 2 VALIDATION
  // ============================================

  const validateStepTwo = () => {
    if (skills.length < 2) {
      toast.error(
        "Please add at least 2 professional skills."
      );
      return false;
    }

    if (formData.education.trim().length < 10) {
      toast.error(
        "Please enter valid education details."
      );
      return false;
    }

    return true;
  };

  // ============================================
  // STEP 3 VALIDATION
  // ============================================

  const validateStepThree = () => {
    if (formData.projects.trim().length < 20) {
      toast.error(
        "Please provide a meaningful project description with at least 20 characters."
      );
      return false;
    }

    if (
      formData.certifications &&
      formData.certifications.trim().length < 5
    ) {
      toast.error(
        "Please enter a valid certification."
      );
      return false;
    }

    return true;
  };

  // ============================================
  // NEXT STEP
  // ============================================

  const nextStep = () => {
    if (step === 1) {
      if (!validateStepOne()) return;
    }

    if (step === 2) {
      if (!validateStepTwo()) return;
    }

    setStep((current) => Math.min(current + 1, 3));
  };

  // ============================================
  // PREVIOUS STEP
  // ============================================

  const previousStep = () => {
    setStep((current) => Math.max(current - 1, 1));
  };

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStepThree()) {
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        ...formData,
        skills: skills.join(", "),
      };

      await api.post("candidates/", data);

      toast.success(
        "Profile created successfully! 🎉"
      );

      navigate("/profile");
    } catch (error) {
      console.error(
        "CREATE PROFILE ERROR:",
        error.response?.data || error
      );

      if (error.response?.data) {
        const message = Object.entries(
          error.response.data
        )
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
          message || "Unable to create profile."
        );
      } else {
        toast.error(
          "Unable to create profile. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // STEP INFORMATION
  // ============================================

  const steps = [
    {
      number: 1,
      title: "Basic Information",
      description: "Tell us about yourself",
    },
    {
      number: 2,
      title: "Professional Profile",
      description: "Your skills and education",
    },
    {
      number: 3,
      title: "Career Details",
      description: "Projects and certifications",
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ======================================== */}
      {/* LEFT BRAND PANEL */}
      {/* ======================================== */}

      <div className="hidden lg:flex lg:w-[38%] bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950 text-white p-12 flex-col justify-between">

        <div>

          {/* LOGO */}

          <div>
            <h1 className="text-4xl font-extrabold tracking-wide">
              SwipeX
            </h1>

            <p className="text-indigo-200 mt-2">
              AI-Powered Job Discovery
            </p>
          </div>

          {/* HERO */}

          <div className="mt-24">

            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full text-cyan-200 text-sm font-semibold">
              ✨ Build your AI career profile
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mt-6">
              Find opportunities
              <span className="text-cyan-300">
                {" "}that fit you.
              </span>
            </h2>

            <p className="text-indigo-100 text-lg mt-6 leading-relaxed max-w-lg">
              Tell SwipeX about your skills, experience,
              education and projects. Your profile helps
              our recommendation system understand what
              kind of opportunities are right for you.
            </p>

          </div>

          {/* BENEFITS */}

          <div className="mt-12 space-y-4">

            <div className="flex items-center gap-3">
              <div className="bg-emerald-400/20 text-emerald-300 w-9 h-9 rounded-full flex items-center justify-center">
                ✓
              </div>

              <p className="text-indigo-100">
                Better job recommendations
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-cyan-400/20 text-cyan-300 w-9 h-9 rounded-full flex items-center justify-center">
                ✓
              </div>

              <p className="text-indigo-100">
                Personalized career discovery
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-purple-400/20 text-purple-300 w-9 h-9 rounded-full flex items-center justify-center">
                ✓
              </div>

              <p className="text-indigo-100">
                AI-powered job matching
              </p>
            </div>

          </div>

        </div>

        <p className="text-indigo-300 text-sm">
          SwipeX • Discover. Swipe. Get matched.
        </p>

      </div>

      {/* ======================================== */}
      {/* RIGHT FORM AREA */}
      {/* ======================================== */}

      <div className="flex-1 flex justify-center py-8 px-5 md:px-10 overflow-y-auto">

        <div className="w-full max-w-3xl">

          {/* MOBILE LOGO */}

          <div className="lg:hidden mb-8">

            <h1 className="text-3xl font-extrabold text-indigo-700">
              SwipeX
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              AI-Powered Job Discovery
            </p>

          </div>

          {/* ====================================== */}
          {/* HEADER */}
          {/* ====================================== */}

          <div className="mb-8">

            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">
              Profile Setup
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
              Complete your profile
            </h2>

            <p className="text-gray-500 mt-2">
              The more we know about you, the better
              SwipeX can personalize your opportunities.
            </p>

          </div>

          {/* ====================================== */}
          {/* PROGRESS */}
          {/* ====================================== */}

          <div className="mb-8">

            <div className="flex items-center justify-between">

              {steps.map((item, index) => {

                const active = step === item.number;
                const completed = step > item.number;

                return (
                  <div
                    key={item.number}
                    className="flex items-center flex-1"
                  >

                    <div className="flex items-center gap-3">

                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                          completed
                            ? "bg-emerald-500 text-white"
                            : active
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {completed
                          ? "✓"
                          : item.number}
                      </div>

                      <div className="hidden sm:block">

                        <p
                          className={`text-sm font-semibold ${
                            active
                              ? "text-indigo-700"
                              : completed
                              ? "text-emerald-600"
                              : "text-gray-400"
                          }`}
                        >
                          {item.title}
                        </p>

                        <p className="text-xs text-gray-400">
                          {item.description}
                        </p>

                      </div>

                    </div>

                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-4 rounded-full ${
                          step > item.number
                            ? "bg-emerald-400"
                            : "bg-gray-200"
                        }`}
                      />
                    )}

                  </div>
                );
              })}

            </div>

          </div>

          {/* ====================================== */}
          {/* FORM CARD */}
          {/* ====================================== */}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8"
          >

            {/* ==================================== */}
            {/* STEP 1 */}
            {/* ==================================== */}

            {step === 1 && (
              <div>

                <div className="mb-7">

                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
                    👋
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mt-5">
                    Let's get to know you
                  </h3>

                  <p className="text-gray-500 mt-2">
                    Start with some basic information.
                  </p>

                </div>

                <div className="space-y-5">

                  {/* NAME */}

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>

                    <input
                      className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      name="full_name"
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                    />

                  </div>

                  {/* EMAIL */}

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>

                    <input
                      className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />

                  </div>

                  {/* PHONE */}

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number
                    </label>

                    <input
                      className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      type="tel"
                      name="phone"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      required
                    />

                    <p className="text-xs text-gray-400 mt-2">
                      Example: 9876543210
                    </p>

                  </div>

                  {/* EXPERIENCE */}

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Experience Level
                    </label>

                    <select
                      className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      required
                    >

                      <option value="">
                        Select your experience
                      </option>

                      <option value="Student">
                        🎓 Student
                      </option>

                      <option value="Fresher">
                        🌱 Fresher
                      </option>

                      <option value="0-1 Years">
                        💼 0-1 Years
                      </option>

                      <option value="1-3 Years">
                        🚀 1-3 Years
                      </option>

                      <option value="3-5 Years">
                        📈 3-5 Years
                      </option>

                      <option value="5-8 Years">
                        🏆 5-8 Years
                      </option>

                      <option value="8+ Years">
                        ⭐ 8+ Years
                      </option>

                    </select>

                  </div>

                </div>

                {/* NEXT */}

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full mt-8 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  Continue
                  <span>→</span>
                </button>

              </div>
            )}

            {/* ==================================== */}
            {/* STEP 2 */}
            {/* ==================================== */}

            {step === 2 && (
              <div>

                <div className="mb-7">

                  <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center text-xl">
                    💼
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mt-5">
                    Tell us about your skills
                  </h3>

                  <p className="text-gray-500 mt-2">
                    These details help SwipeX find relevant jobs.
                  </p>

                </div>

                {/* SKILLS */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Professional Skills
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2">

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
                      placeholder="Type a skill, e.g. Python"
                      className="border border-gray-200 rounded-xl p-3.5 flex-1 outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <button
                      type="button"
                      onClick={() => addSkill()}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition font-semibold"
                    >
                      + Add
                    </button>

                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Add at least 2 skills. Press Enter to add quickly.
                  </p>

                  {/* SUGGESTED SKILLS */}

                  <div className="mt-5">

                    <p className="text-sm font-medium text-gray-600 mb-3">
                      Suggested skills
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {suggestedSkills.map((skill) => {

                        const alreadyAdded = skills.some(
                          (s) =>
                            s.toLowerCase() ===
                            skill.toLowerCase()
                        );

                        return (
                          <button
                            key={skill}
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() => addSkill(skill)}
                            className={`px-3 py-1.5 rounded-full text-sm transition ${
                              alreadyAdded
                                ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700"
                            }`}
                          >
                            {alreadyAdded ? "✓ " : "+ "}
                            {skill}
                          </button>
                        );
                      })}

                    </div>

                  </div>

                  {/* SELECTED SKILLS */}

                  {skills.length > 0 && (
                    <div className="mt-6">

                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Your skills ({skills.length})
                      </p>

                      <div className="flex flex-wrap gap-2">

                        {skills.map((skill, index) => (

                          <div
                            key={`${skill}-${index}`}
                            className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-full flex items-center gap-2 font-medium"
                          >

                            {skill}

                            <button
                              type="button"
                              onClick={() =>
                                removeSkill(index)
                              }
                              className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 hover:bg-red-100 hover:text-red-600 transition"
                            >
                              ×
                            </button>

                          </div>

                        ))}

                      </div>

                    </div>
                  )}

                </div>

                {/* EDUCATION */}

                <div className="mt-7">

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Education
                  </label>

                  <textarea
                    className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                    rows={4}
                    name="education"
                    placeholder="Example: B.Tech in Computer Science, JNTUH (2022-2026)"
                    value={formData.education}
                    onChange={handleChange}
                    required
                  />

                  <p className="text-xs text-gray-400 mt-2">
                    Include your degree, institution and graduation year.
                  </p>

                </div>

                {/* BUTTONS */}

                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">

                  <button
                    type="button"
                    onClick={previousStep}
                    className="sm:w-1/3 border border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition"
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="sm:flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition"
                  >
                    Continue →
                  </button>

                </div>

              </div>
            )}

            {/* ==================================== */}
            {/* STEP 3 */}
            {/* ==================================== */}

            {step === 3 && (
              <div>

                <div className="mb-7">

                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-xl">
                    🚀
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mt-5">
                    Showcase your experience
                  </h3>

                  <p className="text-gray-500 mt-2">
                    Projects and certifications help improve your job matches.
                  </p>

                </div>

                {/* PROJECTS */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Projects
                  </label>

                  <textarea
                    className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                    rows={7}
                    name="projects"
                    placeholder="Describe your academic or personal projects. Mention what you built, technologies used, and your contribution..."
                    value={formData.projects}
                    onChange={handleChange}
                    required
                  />

                  <div className="flex justify-between text-xs text-gray-400 mt-2">

                    <span>
                      Minimum 20 characters
                    </span>

                    <span>
                      {formData.projects.length} characters
                    </span>

                  </div>

                </div>

                {/* CERTIFICATIONS */}

                <div className="mt-7">

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Certifications
                    <span className="text-gray-400 font-normal">
                      {" "}(Optional)
                    </span>
                  </label>

                  <textarea
                    className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                    rows={4}
                    name="certifications"
                    placeholder="Example: AWS Cloud Practitioner, Google Data Analytics, Microsoft Azure Fundamentals"
                    value={formData.certifications}
                    onChange={handleChange}
                  />

                  <p className="text-xs text-gray-400 mt-2">
                    Add relevant certifications separated by commas.
                  </p>

                </div>

                {/* SUMMARY */}

                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mt-7">

                  <div className="flex items-start gap-3">

                    <div className="text-indigo-600 text-xl">
                      🤖
                    </div>

                    <div>

                      <p className="font-semibold text-indigo-800">
                        Your profile powers SwipeX AI
                      </p>

                      <p className="text-sm text-indigo-600 mt-1">
                        Your skills, experience, education and
                        projects help us identify more relevant
                        job opportunities for you.
                      </p>

                    </div>

                  </div>

                </div>

                {/* BUTTONS */}

                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">

                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={submitting}
                    className="sm:w-1/3 border border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="sm:flex-1 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white py-3.5 rounded-xl font-bold hover:from-indigo-700 hover:to-cyan-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        Complete Profile
                        <span>→</span>
                      </>
                    )}
                  </button>

                </div>

              </div>
            )}

          </form>

          {/* ====================================== */}
          {/* FOOTER */}
          {/* ====================================== */}

          <div className="text-center mt-6 pb-5">

            <p className="text-sm text-gray-400">
              Step {step} of 3 • You can update your profile later
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default CreateProfile;
