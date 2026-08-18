import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaUser,
  FaEye,
  FaChartLine,
  FaFileAlt,
  FaFileUpload,
  FaSignOutAlt,
  FaCheckCircle,
  FaBriefcase,
  FaHeart,
  FaTimes,
  FaStar,
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

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [swipingJobId, setSwipingJobId] = useState(null);

  // =====================================
  // LOAD DATA
  // =====================================

  useEffect(() => {
    fetchCandidate();
    fetchResume();
    fetchJobs();
  }, []);

  // =====================================
  // LOAD CANDIDATE
  // =====================================

  const fetchCandidate = async () => {
    try {
      const response = await api.get("candidates/");

      console.log("CANDIDATE RESPONSE:", response.data);

      if (response.data && response.data.length > 0) {
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

      if (response.data && response.data.length > 0) {
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
  // LOAD JOBS
  // =====================================

  const fetchJobs = async () => {
    try {
      const response = await api.get("jobs/");

      console.log("JOBS RESPONSE:", response.data);

      setJobs(response.data || []);
    } catch (error) {
      console.error(
        "LOAD JOBS ERROR:",
        error.response?.data || error
      );

      setJobs([]);
    } finally {
      setLoadingJobs(false);
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

    const completedFields = fields.filter(
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
  // SWIPE JOB
  // =====================================

  const handleSwipe = async (jobId, decision) => {
    try {
      setSwipingJobId(jobId);

      console.log("SWIPING JOB:", jobId);
      console.log("DECISION:", decision);

      const response = await api.post("swipes/", {
        job: jobId,
        decision: decision,
      });

      console.log("SWIPE RESPONSE:", response.data);

      // Remove job from current list
      setJobs((previousJobs) =>
        previousJobs.filter(
          (job) => job.id !== jobId
        )
      );
    } catch (error) {
      console.error(
        "SWIPE ERROR:",
        error.response?.data || error
      );

      alert(
        error.response?.data
          ? JSON.stringify(error.response.data)
          : "Unable to save swipe."
      );
    } finally {
      setSwipingJobId(null);
    }
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
  // MATCH COLOR
  // =====================================

  const getMatchColor = (percentage) => {
    if (percentage >= 80) {
      return "text-green-600 bg-green-100";
    }

    if (percentage >= 60) {
      return "text-yellow-600 bg-yellow-100";
    }

    return "text-red-600 bg-red-100";
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
  // CURRENT PROFILE COMPLETION
  // =====================================

  const profileCompletion = getProfileCompletion();

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* ================================= */}
      {/* SIDEBAR */}
      {/* ================================= */}

      <div
        className="
          w-72
          bg-gradient-to-b
          from-indigo-700
          via-indigo-800
          to-slate-900
          text-white
          p-8
        "
      >

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

        <hr
          className="
            my-8
            border-indigo-500
          "
        />

        <div className="space-y-6">

          {/* Dashboard */}

          <div
            className="
              flex
              items-center
              gap-4
              hover:text-cyan-300
              transition
              cursor-pointer
            "
          >
            <FaChartLine size={22} />

            <span className="text-lg">
              Dashboard
            </span>
          </div>

          {/* My Profile */}

          <Link to="/view-profile">

            <div
              className="
                flex
                items-center
                gap-4
                hover:text-cyan-300
                transition
                cursor-pointer
              "
            >

              <FaUser size={22} />

              <span className="text-lg">
                My Profile
              </span>

            </div>

          </Link>
          <Link to="/applications">
            <div className="flex items-center gap-4 hover:text-cyan-300 transition cursor-pointer">
              <FaBriefcase size={22} />
                <span className="text-lg">Applications</span>
            </div>
          </Link>
          {/* Job Matches */}

          <button
            onClick={() => {
              document
                .getElementById("recommended-jobs")
                ?.scrollIntoView({
                  behavior: "smooth",
                });
            }}
            className="
              flex
              items-center
              gap-4
              hover:text-cyan-300
              transition
              cursor-pointer
              w-full
              text-left
            "
          >

            <FaBriefcase size={22} />

            <span className="text-lg">
              Job Matches
            </span>

          </button>

          {/* Logout */}

          <button
            onClick={logout}
            className="
              mt-10
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

      </div>

      {/* ================================= */}
      {/* MAIN CONTENT */}
      {/* ================================= */}

      <div className="flex-1 p-10">

        <h2
          className="
            text-4xl
            font-bold
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
          Manage your SwipeX profile, resume and discover matching jobs.
        </p>

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

            <span className="font-semibold">
              Profile Completion
            </span>

            <span className="font-semibold">

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
                ${getCompletionColor(profileCompletion)}
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
            <p className="text-gray-500 text-sm mt-3">

              {profileCompletion === 100
                ? "Your profile is complete."
                : "Complete your profile to improve your job matches."}

            </p>
          )}

        </div>

        {/* ================================= */}
        {/* PROFILE + RESUME CARDS */}
        {/* ================================= */}

        <div
          className="
            grid
            md:grid-cols-3
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
                p-6
                hover:shadow-2xl
                hover:scale-105
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
                  mb-4
                "
              />

              <h3
                className="
                  text-xl
                  font-bold
                "
              >
                My Profile
              </h3>

              <p
                className="
                  text-gray-500
                  mt-2
                "
              >
                View and update your candidate profile.
              </p>

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
              p-6
              hover:shadow-2xl
              transition
              duration-300
              md:col-span-2
            "
          >

            <div
              className="
                flex
                items-start
                gap-5
              "
            >

              <div>

                <FaFileAlt
                  className="
                    text-5xl
                    text-purple-600
                  "
                />

              </div>

              <div className="flex-1">

                <h3
                  className="
                    text-2xl
                    font-bold
                  "
                >
                  My Resume
                </h3>

                {loadingResume ? (

                  <p
                    className="
                      text-gray-500
                      mt-2
                    "
                  >
                    Checking resume...
                  </p>

                ) : resume ? (

                  <>

                    {/* FILE */}

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        mt-3
                      "
                    >

                      <FaCheckCircle
                        className="text-green-500"
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

                    {/* ATS SCORE */}

                    <div
                      className="
                        mt-3
                        inline-flex
                        items-center
                        bg-green-100
                        text-green-700
                        px-4
                        py-2
                        rounded-full
                        font-semibold
                      "
                    >

                      <FaStar className="mr-2" />

                      ATS Score:{" "}
                      {resume.ats_score ?? 0}%

                    </div>

                    {/* BUTTONS */}

                    <div
                      className="
                        flex
                        flex-wrap
                        gap-3
                        mt-5
                      "
                    >

                      {/* VIEW RESUME */}

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

                      {/* REPLACE RESUME */}

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

                  <>

                    <p
                      className="
                        text-gray-500
                        mt-2
                      "
                    >
                      No resume uploaded yet.
                    </p>

                    <button
                      onClick={() =>
                        navigate("/resume-upload")
                      }
                      className="
                        mt-5
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

          </div>

        </div>

        {/* ========================================= */}
        {/* RECOMMENDED JOBS */}
        {/* ========================================= */}

        <div
          id="recommended-jobs"
          className="mt-12"
        >

          <div
            className="
              flex
              items-center
              justify-between
              mb-6
            "
          >

            <div>

              <h2
                className="
                  text-3xl
                  font-bold
                  text-gray-800
                "
              >
                Recommended Jobs
              </h2>

              <p
                className="
                  text-gray-500
                  mt-1
                "
              >
                Swipe right if you're interested.
              </p>

            </div>

            <FaBriefcase
              className="
                text-4xl
                text-indigo-600
              "
            />

          </div>

          {/* ================================= */}
          {/* LOADING */}
          {/* ================================= */}

          {loadingJobs && (

            <div
              className="
                bg-white
                rounded-xl
                shadow
                p-8
                text-center
              "
            >

              <p
                className="
                  text-gray-500
                  text-lg
                "
              >
                Finding jobs for you...
              </p>

            </div>

          )}

          {/* ================================= */}
          {/* NO JOBS */}
          {/* ================================= */}

          {!loadingJobs && jobs.length === 0 && (

            <div
              className="
                bg-white
                rounded-xl
                shadow
                p-10
                text-center
              "
            >

              <FaBriefcase
                className="
                  text-5xl
                  text-gray-300
                  mx-auto
                  mb-4
                "
              />

              <h3
                className="
                  text-xl
                  font-bold
                  text-gray-700
                "
              >
                No matching jobs yet
              </h3>

              <p
                className="
                  text-gray-500
                  mt-2
                "
              >
                Upload your resume and make sure your
                profile contains your skills.
              </p>

            </div>

          )}

          {/* ================================= */}
          {/* JOB CARDS */}
          {/* ================================= */}

          {!loadingJobs && jobs.length > 0 && (

            <div
              className="
                grid
                md:grid-cols-2
                xl:grid-cols-3
                gap-6
              "
            >

              {jobs.map((job) => (

                <div
                  key={job.id}
                  className="
                    bg-white
                    rounded-2xl
                    shadow-lg
                    p-6
                    hover:shadow-2xl
                    transition
                    duration-300
                    border
                    border-gray-100
                  "
                >

                  {/* JOB HEADER */}

                  <div
                    className="
                      flex
                      justify-between
                      items-start
                      gap-4
                    "
                  >

                    <div>

                      <h3
                        className="
                          text-xl
                          font-bold
                          text-gray-800
                        "
                      >
                        {job.title}
                      </h3>

                      <p
                        className="
                          text-indigo-600
                          font-semibold
                          mt-1
                        "
                      >
                        {job.company}
                      </p>

                      <p
                        className="
                          text-gray-500
                          text-sm
                          mt-1
                        "
                      >
                        📍 {job.location}
                      </p>

                    </div>

                    {/* MATCH */}

                    <div
                      className={`
                        px-3
                        py-2
                        rounded-full
                        font-bold
                        text-sm
                        whitespace-nowrap
                        ${getMatchColor(
                          job.match_percentage ?? 0
                        )}
                      `}
                    >

                      {job.match_percentage ?? 0}%
                      Match

                    </div>

                  </div>

                  {/* ATS */}

                  <div
                    className="
                      mt-5
                      bg-gray-50
                      rounded-lg
                      p-4
                    "
                  >

                    <div
                      className="
                        flex
                        justify-between
                        items-center
                      "
                    >

                      <span
                        className="
                          text-gray-600
                          font-medium
                        "
                      >
                        ATS Score
                      </span>

                      <span
                        className="
                          font-bold
                          text-indigo-600
                        "
                      >
                        {job.ats_score ?? 0}%
                      </span>

                    </div>

                    <div
                      className="
                        mt-2
                        w-full
                        h-2
                        bg-gray-200
                        rounded-full
                      "
                    >

                      <div
                        className="
                          h-2
                          bg-indigo-600
                          rounded-full
                        "
                        style={{
                          width: `${Math.min(
                            job.ats_score ?? 0,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* MATCHED SKILLS */}

                  <div className="mt-5">

                    <p
                      className="
                        font-semibold
                        text-gray-700
                        mb-2
                      "
                    >
                      Your Matching Skills
                    </p>

                    <div
                      className="
                        flex
                        flex-wrap
                        gap-2
                      "
                    >

                      {job.matched_skills &&
                      job.matched_skills.length > 0 ? (

                        job.matched_skills.map(
                          (skill, index) => (

                            <span
                              key={index}
                              className="
                                bg-green-100
                                text-green-700
                                px-3
                                py-1
                                rounded-full
                                text-sm
                                font-medium
                              "
                            >
                              ✓ {skill}
                            </span>

                          )
                        )

                      ) : (

                        <span
                          className="
                            text-gray-400
                            text-sm
                          "
                        >
                          No matching skills
                        </span>

                      )}

                    </div>

                  </div>

                  {/* MISSING SKILLS */}

                  {job.missing_skills &&
                  job.missing_skills.length > 0 && (

                    <div className="mt-4">

                      <p
                        className="
                          font-semibold
                          text-gray-700
                          mb-2
                        "
                      >
                        Skills to Improve
                      </p>

                      <div
                        className="
                          flex
                          flex-wrap
                          gap-2
                        "
                      >

                        {job.missing_skills.map(
                          (skill, index) => (

                            <span
                              key={index}
                              className="
                                bg-red-100
                                text-red-600
                                px-3
                                py-1
                                rounded-full
                                text-sm
                              "
                            >
                              + {skill}
                            </span>

                          )
                        )}

                      </div>

                    </div>

                  )}

                  {/* REQUIRED SKILLS */}

                  <div className="mt-4">

                    <p
                      className="
                        text-xs
                        text-gray-400
                      "
                    >
                      Required Skills
                    </p>

                    <p
                      className="
                        text-sm
                        text-gray-600
                        mt-1
                      "
                    >
                      {job.required_skills}
                    </p>

                  </div>

                  {/* SWIPE BUTTONS */}

                  <div
                    className="
                      flex
                      gap-3
                      mt-6
                    "
                  >

                    {/* PASS */}

                    <button
                      disabled={
                        swipingJobId === job.id
                      }
                      onClick={() =>
                        handleSwipe(
                          job.id,
                          "left"
                        )
                      }
                      className="
                        flex-1
                        border-2
                        border-red-400
                        text-red-500
                        py-3
                        rounded-xl
                        font-bold
                        hover:bg-red-50
                        transition
                        flex
                        items-center
                        justify-center
                        gap-2
                        disabled:opacity-50
                      "
                    >

                      <FaTimes />

                      Pass

                    </button>

                    {/* INTERESTED */}

                    <button
                      disabled={
                        swipingJobId === job.id
                      }
                      onClick={() =>
                        handleSwipe(
                          job.id,
                          "right"
                        )
                      }
                      className="
                        flex-1
                        bg-green-500
                        text-white
                        py-3
                        rounded-xl
                        font-bold
                        hover:bg-green-600
                        transition
                        flex
                        items-center
                        justify-center
                        gap-2
                        disabled:opacity-50
                      "
                    >

                      <FaHeart />

                      Interested

                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default Profile;