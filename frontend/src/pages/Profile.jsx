import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaUser,
  FaChartLine,
  FaFileAlt,
  FaFileUpload,
  FaSignOutAlt,
  FaCheckCircle,
  FaEye,
  FaRobot,
  FaChartBar,
  FaBriefcase,
  FaEnvelope,
  FaBrain,
} from "react-icons/fa";

import api from "../services/api";

function Profile() {
  const navigate = useNavigate();

  // =====================================
  // STATES
  // =====================================

  const [candidate, setCandidate] = useState(null);
  const [loadingCandidate, setLoadingCandidate] = useState(true);

  const [resume, setResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);

  // =====================================
  // LOAD DATA
  // =====================================

  useEffect(() => {
    fetchCandidate();
    fetchResume();
  }, []);

  // =====================================
  // LOAD CANDIDATE
  // =====================================

  const fetchCandidate = async () => {
    try {
      const response = await api.get("candidates/");

      console.log("CANDIDATE RESPONSE:", response.data);

      if (
        response.data &&
        response.data.length > 0
      ) {
        setCandidate(response.data[0]);
      } else {
        setCandidate(null);
      }
    } catch (error) {
      console.error(
        "LOAD CANDIDATE ERROR:",
        error.response?.data || error
      );

      setCandidate(null);
    } finally {
      setLoadingCandidate(false);
    }
  };

  // =====================================
  // LOAD RESUME
  // =====================================

  const fetchResume = async () => {
    try {
      const response = await api.get("resumes/");

      console.log("RESUME RESPONSE:", response.data);

      if (
        response.data &&
        response.data.length > 0
      ) {
        setResume(response.data[0]);
      } else {
        setResume(null);
      }
    } catch (error) {
      console.error(
        "LOAD RESUME ERROR:",
        error.response?.data || error
      );

      setResume(null);
    } finally {
      setLoadingResume(false);
    }
  };

  // =====================================
  // PROFILE COMPLETION
  // =====================================

  const getProfileCompletion = () => {
    if (!candidate) {
      return 0;
    }

    const fields = [
      candidate.full_name,
      candidate.phone,
      candidate.skills,
      candidate.experience,
      candidate.education,
      candidate.projects,
      candidate.certifications,
      candidate.profile_picture,
    ];

    const completedFields =
      fields.filter(
        (field) =>
          field !== null &&
          field !== undefined &&
          String(field).trim() !== ""
      ).length;

    return Math.round(
      (completedFields / fields.length) * 100
    );
  };

  // =====================================
  // PROFILE COMPLETION COLOR
  // =====================================

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) {
      return "bg-green-500";
    }

    if (percentage >= 50) {
      return "bg-yellow-500";
    }

    return "bg-cyan-500";
  };

  // =====================================
  // LOGOUT
  // =====================================

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    navigate("/");
  };

  // =====================================
  // RESUME FILE NAME
  // =====================================

  const getFileName = () => {
    if (!resume?.resume_file) {
      return "No resume uploaded";
    }

    return resume.resume_file
      .split("/")
      .pop();
  };

  // =====================================
  // FUTURE FEATURE CLICK
  // =====================================

  const comingSoon = (feature) => {
    alert(
      `${feature} will be available in the next milestone.`
    );
  };

  // =====================================
  // PROFILE COMPLETION
  // =====================================

  const profileCompletion =
    getProfileCompletion();

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* ================================= */}
      {/* SIDEBAR */}
      {/* ================================= */}

      <aside
        className="
          w-72
          min-h-screen
          bg-gradient-to-b
          from-indigo-700
          via-indigo-800
          to-slate-900
          text-white
          p-8
          flex
          flex-col
        "
      >

        {/* LOGO */}

        <div>

          <h1
            className="
              text-4xl
              font-extrabold
              tracking-wide
            "
          >
            SwipeX
          </h1>

          <p
            className="
              text-gray-300
              text-sm
              mt-2
            "
          >
            Candidate Portal
          </p>

        </div>

        <hr
          className="
            my-8
            border-indigo-500
          "
        />

        {/* ================================= */}
        {/* SIDEBAR MENU */}
        {/* ================================= */}

        <nav className="space-y-3">

          {/* DASHBOARD */}

          <div
            className="
              flex
              items-center
              gap-4
              bg-indigo-600
              px-4
              py-3
              rounded-xl
              text-cyan-200
            "
          >

            <FaChartLine size={20} />

            <span className="text-base font-semibold">
              Dashboard
            </span>

          </div>

          {/* MY PROFILE */}

          <Link to="/view-profile">

            <div
              className="
                flex
                items-center
                gap-4
                px-4
                py-3
                rounded-xl
                hover:bg-indigo-600
                hover:text-cyan-200
                transition
                cursor-pointer
              "
            >

              <FaUser size={20} />

              <span className="text-base">
                My Profile
              </span>

            </div>

          </Link>

          {/* MY RESUME */}

          <Link to="/my-resume">

            <div
              className="
                flex
                items-center
                gap-4
                px-4
                py-3
                rounded-xl
                hover:bg-indigo-600
                hover:text-cyan-200
                transition
                cursor-pointer
              "
            >

              <FaFileAlt size={20} />

              <span className="text-base">
                My Resume
              </span>

            </div>

          </Link>

          {/* ================================= */}
          {/* FUTURE FEATURES */}
          {/* ================================= */}

          {/* AI ANALYSIS */}

          <button
            onClick={() =>
              comingSoon("AI Analysis")
            }
            className="
              w-full
              flex
              items-center
              justify-between
              gap-4
              px-4
              py-3
              rounded-xl
              hover:bg-indigo-600
              transition
              text-left
            "
          >

            <div className="flex items-center gap-4">

              <FaRobot size={20} />

              <span className="text-base">
                AI Analysis
              </span>

            </div>

            <span
              className="
                text-[10px]
                bg-indigo-500
                px-2
                py-1
                rounded-full
              "
            >
              Soon
            </span>

          </button>

          {/* ATS SCORE */}

          <button
            onClick={() =>
              comingSoon("ATS Score")
            }
            className="
              w-full
              flex
              items-center
              justify-between
              gap-4
              px-4
              py-3
              rounded-xl
              hover:bg-indigo-600
              transition
              text-left
            "
          >

            <div className="flex items-center gap-4">

              <FaChartBar size={20} />

              <span className="text-base">
                ATS Score
              </span>

            </div>

            <span
              className="
                text-[10px]
                bg-indigo-500
                px-2
                py-1
                rounded-full
              "
            >
              Soon
            </span>

          </button>

          {/* JOB MATCHES */}

          <button
            onClick={() =>
              comingSoon("Job Matches")
            }
            className="
              w-full
              flex
              items-center
              justify-between
              gap-4
              px-4
              py-3
              rounded-xl
              hover:bg-indigo-600
              transition
              text-left
            "
          >

            <div className="flex items-center gap-4">

              <FaBriefcase size={20} />

              <span className="text-base">
                Job Matches
              </span>

            </div>

            <span
              className="
                text-[10px]
                bg-indigo-500
                px-2
                py-1
                rounded-full
              "
            >
              Soon
            </span>

          </button>

          {/* APPLICATIONS */}

          <button
            onClick={() =>
              comingSoon("Applications")
            }
            className="
              w-full
              flex
              items-center
              justify-between
              gap-4
              px-4
              py-3
              rounded-xl
              hover:bg-indigo-600
              transition
              text-left
            "
          >

            <div className="flex items-center gap-4">

              <FaEnvelope size={20} />

              <span className="text-base">
                Applications
              </span>

            </div>

            <span
              className="
                text-[10px]
                bg-indigo-500
                px-2
                py-1
                rounded-full
              "
            >
              Soon
            </span>

          </button>

          {/* MISSING SKILLS */}

          <button
            onClick={() =>
              comingSoon("Missing Skills")
            }
            className="
              w-full
              flex
              items-center
              justify-between
              gap-4
              px-4
              py-3
              rounded-xl
              hover:bg-indigo-600
              transition
              text-left
            "
          >

            <div className="flex items-center gap-4">

              <FaBrain size={20} />

              <span className="text-base">
                Missing Skills
              </span>

            </div>

            <span
              className="
                text-[10px]
                bg-indigo-500
                px-2
                py-1
                rounded-full
              "
            >
              Soon
            </span>

          </button>

        </nav>

        {/* ================================= */}
        {/* LOGOUT */}
        {/* ================================= */}

        <div className="mt-auto pt-8">

          <button
            onClick={logout}
            className="
              w-full
              bg-red-500
              py-3
              rounded-xl
              hover:bg-red-600
              transition
              font-semibold
              flex
              items-center
              justify-center
              gap-2
            "
          >

            <FaSignOutAlt />

            Logout

          </button>

        </div>

      </aside>

      {/* ================================= */}
      {/* MAIN CONTENT */}
      {/* ================================= */}

      <main className="flex-1 p-10 overflow-y-auto">

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div>

          <h2
            className="
              text-4xl
              font-bold
              text-gray-800
            "
          >
            Welcome Back 👋
          </h2>

          <p
            className="
              text-gray-500
              mt-2
            "
          >
            Manage your SwipeX profile and resume.
          </p>

        </div>

        {/* ================================= */}
        {/* PROFILE COMPLETION */}
        {/* ================================= */}

        <div
          className="
            bg-white
            rounded-xl
            shadow-lg
            p-6
            mt-8
          "
        >

          <div
            className="
              flex
              justify-between
              mb-3
            "
          >

            <span
              className="
                font-semibold
                text-gray-700
              "
            >
              Profile Completion
            </span>

            <span
              className="
                font-semibold
                text-gray-700
              "
            >

              {loadingCandidate
                ? "..."
                : `${profileCompletion}%`}

            </span>

          </div>

          <div
            className="
              w-full
              bg-gray-200
              rounded-full
              h-3
            "
          >

            <div
              className={`
                ${getCompletionColor(
                  profileCompletion
                )}
                h-3
                rounded-full
                transition-all
                duration-500
              `}
              style={{
                width: `${profileCompletion}%`,
              }}
            />

          </div>

          {!loadingCandidate && (

            <p
              className="
                text-gray-500
                text-sm
                mt-3
              "
            >

              {profileCompletion === 100
                ? "Your profile is complete."
                : "Complete your profile to keep your information up to date."}

            </p>

          )}

        </div>

        {/* ================================= */}
        {/* PROFILE + RESUME CARDS */}
        {/* ================================= */}

        <div
          className="
            grid
            md:grid-cols-2
            gap-6
            mt-10
          "
        >

          {/* ================================= */}
          {/* MY PROFILE */}
          {/* ================================= */}

          <Link to="/view-profile">

            <div
              className="
                bg-white
                rounded-xl
                shadow-lg
                p-8
                hover:shadow-2xl
                hover:scale-[1.02]
                transition
                duration-300
                cursor-pointer
                h-full
              "
            >

              <FaUser
                className="
                  text-5xl
                  text-blue-600
                  mb-5
                "
              />

              <h3
                className="
                  text-2xl
                  font-bold
                  text-gray-800
                "
              >
                My Profile
              </h3>

              <p
                className="
                  text-gray-500
                  mt-3
                "
              >
                View and update your candidate
                profile, personal information,
                skills and experience.
              </p>

              <div
                className="
                  mt-6
                  text-blue-600
                  font-semibold
                "
              >
                View Profile →
              </div>

            </div>

          </Link>

          {/* ================================= */}
          {/* MY RESUME */}
          {/* ================================= */}

          <div
            className="
              bg-white
              rounded-xl
              shadow-lg
              p-8
              hover:shadow-2xl
              transition
              duration-300
            "
          >

            <FaFileAlt
              className="
                text-5xl
                text-purple-600
                mb-5
              "
            />

            <h3
              className="
                text-2xl
                font-bold
                text-gray-800
              "
            >
              My Resume
            </h3>

            {/* LOADING */}

            {loadingResume ? (

              <p
                className="
                  text-gray-500
                  mt-4
                "
              >
                Checking resume...
              </p>

            ) : resume ? (

              /* =================================
                 RESUME EXISTS
              ================================= */

              <>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    mt-4
                  "
                >

                  <FaCheckCircle
                    className="
                      text-green-500
                    "
                  />

                  <p
                    className="
                      text-gray-700
                      font-medium
                      break-all
                    "
                  >
                    {getFileName()}
                  </p>

                </div>

                <p
                  className="
                    text-green-600
                    text-sm
                    font-semibold
                    mt-3
                  "
                >
                  Resume uploaded successfully.
                </p>

                {/* BUTTONS */}

                <div
                  className="
                    flex
                    flex-wrap
                    gap-3
                    mt-6
                  "
                >

                  {/* VIEW */}

                  <button
                    onClick={() =>
                      navigate("/my-resume")
                    }
                    className="
                      bg-indigo-600
                      text-white
                      px-5
                      py-2
                      rounded-lg
                      hover:bg-indigo-700
                      transition
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <FaEye />

                    View Resume

                  </button>

                  {/* REPLACE */}

                  <button
                    onClick={() =>
                      navigate("/resume-upload")
                    }
                    className="
                      bg-purple-600
                      text-white
                      px-5
                      py-2
                      rounded-lg
                      hover:bg-purple-700
                      transition
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <FaFileUpload />

                    Replace Resume

                  </button>

                </div>

              </>

            ) : (

              /* =================================
                 NO RESUME
              ================================= */

              <>

                <p
                  className="
                    text-gray-500
                    mt-4
                  "
                >
                  No resume uploaded yet.
                </p>

                <button
                  onClick={() =>
                    navigate("/resume-upload")
                  }
                  className="
                    mt-6
                    bg-purple-600
                    text-white
                    px-5
                    py-2
                    rounded-lg
                    hover:bg-purple-700
                    transition
                    flex
                    items-center
                    gap-2
                  "
                >

                  <FaFileUpload />

                  Upload Resume

                </button>

              </>

            )}

          </div>

        </div>

        {/* ================================= */}
        {/* CURRENT STATUS */}
        {/* ================================= */}

        <div
          className="
            bg-white
            rounded-xl
            shadow-lg
            p-8
            mt-8
          "
        >

          <h3
            className="
              text-2xl
              font-bold
              text-gray-800
            "
          >
            Current Status
          </h3>

          <div
            className="
              grid
              md:grid-cols-2
              gap-4
              mt-6
            "
          >

            {/* PROFILE STATUS */}

            <div
              className="
                bg-blue-50
                border
                border-blue-100
                rounded-xl
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <FaUser
                  className="text-blue-600"
                />

                <span
                  className="
                    font-semibold
                    text-gray-700
                  "
                >
                  Candidate Profile
                </span>

              </div>

              <p
                className="
                  text-sm
                  text-gray-500
                  mt-2
                "
              >
                {candidate
                  ? "Profile created successfully."
                  : "Profile not created yet."}
              </p>

            </div>

            {/* RESUME STATUS */}

            <div
              className="
                bg-purple-50
                border
                border-purple-100
                rounded-xl
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <FaFileAlt
                  className="text-purple-600"
                />

                <span
                  className="
                    font-semibold
                    text-gray-700
                  "
                >
                  Resume
                </span>

              </div>

              <p
                className="
                  text-sm
                  text-gray-500
                  mt-2
                "
              >
                {resume
                  ? "Resume uploaded successfully."
                  : "Resume upload pending."}
              </p>

            </div>

          </div>

        </div>

        {/* ================================= */}
        {/* FUTURE FEATURES MESSAGE */}
        {/* ================================= */}

        <div
          className="
            bg-indigo-50
            border
            border-indigo-100
            rounded-xl
            p-6
            mt-8
          "
        >

          <h3
            className="
              text-lg
              font-bold
              text-indigo-800
            "
          >
            More features coming soon
          </h3>

          <p
            className="
              text-indigo-600
              text-sm
              mt-2
            "
          >
            AI Analysis, ATS Score, Job Matches,
            Applications and Missing Skills will
            be added in upcoming milestones.
          </p>

        </div>

      </main>

    </div>
  );
}

export default Profile;
