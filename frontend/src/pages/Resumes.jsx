import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Resumes() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [resumes, setResumes] = useState([]);

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    resume_name: "",
    file_path: "",
    extracted_skills: "",
    is_default: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/resumes/");

      setResumes(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load resumes."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateResume = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const skills = formData.extracted_skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      await api.post("/resumes/", {
        resume_name: formData.resume_name,
        file_path: formData.file_path,
        extracted_skills: skills,
        is_default: formData.is_default,
      });

      setSuccess("Resume added successfully.");

      setFormData({
        resume_name: "",
        file_path: "",
        extracted_skills: "",
        is_default: false,
      });

      setShowForm(false);

      await fetchResumes();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to create resume."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (resume) => {
    try {
      setError("");
      setSuccess("");

      await Promise.all(
        resumes.map((item) =>
          api.put(`/resumes/${item.resume_id}`, {
            is_default: item.resume_id === resume.resume_id,
          })
        )
      );

      setSuccess("Default resume updated.");

      await fetchResumes();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to update default resume."
      );
    }
  };

  const handleDelete = async (resumeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/resumes/${resumeId}`);

      setSuccess("Resume deleted successfully.");

      await fetchResumes();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete resume."
      );
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4">

        <div className="max-w-6xl mx-auto flex justify-between items-center">

          <button
            onClick={() => navigate("/dashboard")}
            className="text-2xl font-bold text-blue-600"
          >
            SwipeX
          </button>

          <div className="flex items-center gap-5">

            <button
              onClick={() => navigate("/jobs")}
              className="text-gray-600 hover:text-blue-600"
            >
              Discover Jobs
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-5 py-2 rounded-lg
                         hover:bg-red-600"
            >
              Logout
            </button>

          </div>

        </div>

      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">

        <div className="flex justify-between items-center">

          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              My Resumes
            </h1>

            <p className="mt-2 text-gray-500">
              Manage your resumes for job applications.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setSuccess("");
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg
                       font-semibold hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Add Resume"}
          </button>

        </div>

        {/* Messages */}

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-lg bg-green-100 p-4 text-green-700">
            {success}
          </div>
        )}

        {/* Add Resume Form */}

        {showForm && (
          <div className="mt-8 bg-white rounded-xl shadow p-8">

            <h2 className="text-2xl font-bold text-gray-900">
              Add Resume
            </h2>

            <p className="mt-2 text-gray-500">
              Add your resume details.
            </p>

            <form
              onSubmit={handleCreateResume}
              className="mt-6 space-y-5"
            >

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Resume Name
                </label>

                <input
                  type="text"
                  name="resume_name"
                  value={formData.resume_name}
                  onChange={handleChange}
                  placeholder="Example: Data Engineer Resume"
                  required
                  className="w-full rounded-lg border border-gray-300
                             px-4 py-3 outline-none
                             focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  File Path
                </label>

                <input
                  type="text"
                  name="file_path"
                  value={formData.file_path}
                  onChange={handleChange}
                  placeholder="Example: resumes/data_engineer_resume.pdf"
                  required
                  className="w-full rounded-lg border border-gray-300
                             px-4 py-3 outline-none
                             focus:ring-2 focus:ring-blue-500"
                />

                <p className="mt-2 text-sm text-gray-500">
                  For now, enter the path or name of your resume file.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Skills
                </label>

                <input
                  type="text"
                  name="extracted_skills"
                  value={formData.extracted_skills}
                  onChange={handleChange}
                  placeholder="Python, SQL, FastAPI, PostgreSQL"
                  className="w-full rounded-lg border border-gray-300
                             px-4 py-3 outline-none
                             focus:ring-2 focus:ring-blue-500"
                />

                <p className="mt-2 text-sm text-gray-500">
                  Separate skills using commas.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">

                <input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleChange}
                  className="h-5 w-5"
                />

                <span className="text-gray-700">
                  Set as default resume
                </span>

              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white
                           px-6 py-3 rounded-lg font-semibold
                           hover:bg-blue-700
                           disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Resume"}
              </button>

            </form>

          </div>
        )}

        {/* Resume List */}

        <div className="mt-8">

          {loading ? (
            <div className="bg-white rounded-xl shadow p-10 text-center">

              <p className="text-gray-500">
                Loading resumes...
              </p>

            </div>
          ) : resumes.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-10 text-center">

              <div className="text-5xl">
                📄
              </div>

              <h2 className="mt-4 text-2xl font-bold text-gray-800">
                No Resumes Yet
              </h2>

              <p className="mt-2 text-gray-500">
                Add your first resume to start applying for jobs.
              </p>

              <button
                onClick={() => setShowForm(true)}
                className="mt-6 bg-blue-600 text-white px-6 py-3
                           rounded-lg font-semibold hover:bg-blue-700"
              >
                + Add Your First Resume
              </button>

            </div>
          ) : (
            <div className="space-y-5">

              {resumes.map((resume) => (

                <div
                  key={resume.resume_id}
                  className="bg-white rounded-xl shadow p-6"
                >

                  <div className="flex justify-between items-start">

                    <div className="flex gap-4">

                      <div className="text-4xl">
                        📄
                      </div>

                      <div>

                        <div className="flex items-center gap-3">

                          <h2 className="text-xl font-bold text-gray-900">
                            {resume.resume_name}
                          </h2>

                          {resume.is_default && (
                            <span className="bg-green-100 text-green-700
                                             text-sm px-3 py-1 rounded-full">
                              Default
                            </span>
                          )}

                        </div>

                        <p className="mt-2 text-sm text-gray-500">
                          {resume.file_path}
                        </p>

                        {resume.extracted_skills &&
                          Array.isArray(resume.extracted_skills) &&
                          resume.extracted_skills.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">

                              {resume.extracted_skills.map(
                                (skill, index) => (
                                  <span
                                    key={index}
                                    className="bg-blue-100 text-blue-700
                                               px-3 py-1 rounded-full text-sm"
                                  >
                                    {skill}
                                  </span>
                                )
                              )}

                            </div>
                          )}

                      </div>

                    </div>

                    <div className="flex gap-3">

                      {!resume.is_default && (
                        <button
                          onClick={() => handleSetDefault(resume)}
                          className="border border-blue-500 text-blue-600
                                     px-4 py-2 rounded-lg
                                     hover:bg-blue-50"
                        >
                          Set Default
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(resume.resume_id)}
                        className="border border-red-400 text-red-500
                                   px-4 py-2 rounded-lg
                                   hover:bg-red-50"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>
          )}

        </div>

      </main>

    </div>
  );
}

export default Resumes;