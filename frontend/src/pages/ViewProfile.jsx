import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast, Toaster } from "react-hot-toast";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaGraduationCap,
  FaProjectDiagram,
  FaCertificate,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import api from "../services/api";

const formatExperience = (experience) => {
  if (!experience) return "Not specified";

  const value = String(experience).trim();

  if (value.toLowerCase() === "fresher") return "Fresher";
  if (value.toLowerCase() === "intern") return "Intern";

  if (/years?/i.test(value)) return value;

  return `${value} Years`;
};

function ViewProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const BASE_URL =
    import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

  useEffect(() => {
    fetchProfile();
  }, []);

  // =========================================
  // FETCH PROFILE
  // =========================================

  const fetchProfile = async () => {
    try {
      const response = await api.get("candidates/");

      const profiles = Array.isArray(response.data)
        ? response.data
        : [];

      if (profiles.length === 0) {
        setProfile(null);
      } else {
        setProfile(profiles[profiles.length - 1]);
      }
    } catch (error) {
      console.error(
        "FETCH PROFILE ERROR:",
        error.response?.data || error
      );

      toast.error("Unable to load profile.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // DELETE PROFILE
  // =========================================

  const handleDelete = async () => {
    if (!profile?.id || deleting) return;

    const result = await Swal.fire({
      title: "Delete Profile?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setDeleting(true);

      await api.delete(`candidates/${profile.id}/`);

      await Swal.fire({
        title: "Deleted!",
        text: "Your profile has been deleted successfully.",
        icon: "success",
        confirmButtonColor: "#4f46e5",
      });

      setProfile(null);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "DELETE PROFILE ERROR:",
        error.response?.data || error
      );

      Swal.fire({
        title: "Delete Failed",
        text:
          error.response?.data?.detail ||
          "Unable to delete your profile.",
        icon: "error",
        confirmButtonColor: "#4f46e5",
      });
    } finally {
      setDeleting(false);
    }
  };

  // =========================================
  // PROFILE IMAGE
  // =========================================

  const getProfileImage = () => {
    if (!profile?.profile_picture) return null;

    if (profile.profile_picture.startsWith("http")) {
      return profile.profile_picture;
    }

    return `${BASE_URL.replace(/\/$/, "")}/${profile.profile_picture.replace(
      /^\//,
      ""
    )}`;
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <>
        <Toaster position="top-right" />

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

            <p className="mt-4 text-sm font-medium text-gray-600">
              Loading your profile...
            </p>
          </div>
        </div>
      </>
    );
  }

  // =========================================
  // NO PROFILE
  // =========================================

  if (!profile) {
    return (
      <>
        <Toaster position="top-right" />

        <div className="flex min-h-[70vh] items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <FaUser size={28} />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-800">
              No Profile Found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Create your candidate profile to start receiving
              personalized job recommendations.
            </p>

            <button
              onClick={() => navigate("/create-profile")}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Create Profile
            </button>
          </div>
        </div>
      </>
    );
  }

  const imageUrl = getProfileImage();

  // =========================================
  // PROFILE PAGE
  // =========================================

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

        {/* PAGE TITLE */}

        <div className="mx-auto mb-6 max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
              <FaUser size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">
                My Profile
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your personal and professional information.
              </p>
            </div>
          </div>
        </div>

        {/* MAIN CARD */}

        <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* PROFILE HEADER */}

          <div className="flex flex-col items-center gap-4 border-b border-gray-100 p-6 sm:flex-row">

            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Profile"
                className="h-24 w-24 rounded-full border-4 border-indigo-100 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-3xl font-bold text-white shadow-sm">
                {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}

            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-800">
                {profile.full_name || "User"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Candidate
              </p>
            </div>

          </div>

          {/* INFORMATION */}

          <div className="grid gap-4 p-6 md:grid-cols-2">

            {/* NAME */}

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                  <FaUser />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Full Name
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {profile.full_name || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* EMAIL */}

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                  <FaEnvelope />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                    {profile.email || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* PHONE */}

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 text-green-600">
                  <FaPhone />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {profile.phone || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* EXPERIENCE */}

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                  <FaBriefcase />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Experience
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {formatExperience(profile.experience)}
                  </p>
                </div>
              </div>
            </div>

            {/* SKILLS */}

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                  <FaBriefcase />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Skills
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.skills ? (
                      profile.skills
                        .split(",")
                        .map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
                          >
                            {skill.trim()}
                          </span>
                        ))
                    ) : (
                      <span className="text-sm text-gray-500">
                        Not specified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* EDUCATION */}

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-green-100 p-2 text-green-600">
                  <FaGraduationCap />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Education
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {profile.education || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* PROJECTS */}

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                  <FaProjectDiagram />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Projects
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {profile.projects || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* CERTIFICATIONS */}

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-yellow-100 p-2 text-yellow-600">
                  <FaCertificate />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Certifications
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {profile.certifications || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* ACTIONS */}

          <div className="flex flex-wrap gap-3 border-t border-gray-100 p-6">

            <button
              onClick={() => navigate("/edit-profile")}
              disabled={deleting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaEdit />
              Edit Profile
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaTrash />
              {deleting ? "Deleting..." : "Delete Profile"}
            </button>

          </div>

        </div>
      </div>
    </>
  );
}

export default ViewProfile;