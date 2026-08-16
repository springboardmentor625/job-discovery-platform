import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function EditProfile() {
  const navigate = useNavigate();

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/api/candidate/profile");

        setForm({
          headline: response.data.headline || "",
          bio: response.data.bio || "",
          location: response.data.location || "",
          education: response.data.education || "",
          skills: response.data.skills || "",
          experience: response.data.experience || "",
          preferred_role: response.data.preferred_role || "",
          preferred_location:
            response.data.preferred_location || "",
          expected_salary:
            response.data.expected_salary || "",
        });
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login");
          return;
        }

        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await api.put(
        "/api/candidate/profile",
        form
      );

      setMessage("Profile updated successfully.");

      setTimeout(() => {
        navigate("/candidate");
      }, 1000);

    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.detail ||
        "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="edit-profile-page">

      <div className="edit-profile-card">

        <div className="edit-profile-header">

          <button
            className="back-button"
            onClick={() => navigate("/candidate")}
          >
            ← Back
          </button>

          <div>
            <p className="section-label">
              CANDIDATE PROFILE
            </p>

            <h1>Edit Profile</h1>

            <p>
              Keep your profile updated to get better
              job recommendations.
            </p>
          </div>

        </div>

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="edit-form-grid">

            <div className="form-group">
              <label>Headline</label>

              <input
                name="headline"
                value={form.headline}
                onChange={handleChange}
                placeholder="Example: CSE Student"
              />
            </div>

            <div className="form-group">
              <label>Location</label>

              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Example: Bengaluru"
              />
            </div>

            <div className="form-group full-width">
              <label>About / Bio</label>

              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell recruiters about yourself"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Education</label>

              <input
                name="education"
                value={form.education}
                onChange={handleChange}
                placeholder="Example: B.E Computer Science"
              />
            </div>

            <div className="form-group">
              <label>Experience</label>

              <input
                name="experience"
                value={form.experience}
                onChange={handleChange}
                placeholder="Example: Fresher"
              />
            </div>

            <div className="form-group full-width">
              <label>Skills</label>

              <input
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="Example: C++, Python, React, SQL"
              />
            </div>

            <div className="form-group">
              <label>Preferred Role</label>

              <input
                name="preferred_role"
                value={form.preferred_role}
                onChange={handleChange}
                placeholder="Example: Software Developer"
              />
            </div>

            <div className="form-group">
              <label>Preferred Location</label>

              <input
                name="preferred_location"
                value={form.preferred_location}
                onChange={handleChange}
                placeholder="Example: Bengaluru"
              />
            </div>

            <div className="form-group">
              <label>Expected Salary</label>

              <input
                name="expected_salary"
                value={form.expected_salary}
                onChange={handleChange}
                placeholder="Example: 600000"
              />
            </div>

          </div>

          <div className="edit-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/candidate")}
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