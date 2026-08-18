import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ViewProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("candidates/");

      if (response.data.length === 0) {
        setProfile(null);
      } else {
        setProfile(response.data[response.data.length - 1]);
      }
    } catch (error) {
      console.log(error.response?.data);
      alert("Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your profile?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`candidates/${profile.id}/`);

      alert("Profile Deleted Successfully!");

      navigate("/profile");
    } catch (error) {
      console.log(error.response?.data);
      alert("Delete Failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white shadow-xl rounded-2xl p-10 text-center max-w-md">
          <h2 className="text-3xl font-bold text-indigo-700">
            No Profile Found
          </h2>

          <p className="text-gray-500 mt-3">
            You haven't created your candidate profile yet.
          </p>

          <button
            onClick={() => navigate("/create-profile")}
            className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-8">
      <div className="bg-white shadow-xl rounded-xl w-full max-w-3xl p-8">

        <h2 className="text-3xl font-bold text-indigo-700 mb-6">
          My Profile
        </h2>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <strong>Full Name</strong>
            <p>{profile.full_name}</p>
          </div>

          <div>
            <strong>Email</strong>
            <p>{profile.email}</p>
          </div>

          <div>
            <strong>Phone</strong>
            <p>{profile.phone}</p>
          </div>

          <div>
            <strong>Experience</strong>
            <p>{profile.experience} Years</p>
          </div>

          <div className="col-span-2">
            <strong>Skills</strong>
            <p>{profile.skills}</p>
          </div>

          <div className="col-span-2">
            <strong>Education</strong>
            <p>{profile.education}</p>
          </div>

          <div className="col-span-2">
            <strong>Projects</strong>
            <p>{profile.projects}</p>
          </div>

          <div className="col-span-2">
            <strong>Certifications</strong>
            <p>{profile.certifications}</p>
          </div>

        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate("/edit-profile")}
            className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600"
          >
            Edit Profile
          </button>

          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          >
            Delete Profile
          </button>
        </div>

      </div>
    </div>
  );
}

export default ViewProfile;