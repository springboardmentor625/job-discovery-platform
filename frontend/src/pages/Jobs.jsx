import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaTimes,
  FaMapMarkerAlt,
  FaBuilding,
} from "react-icons/fa";
import api from "../services/api";

function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);

  // =========================
  // LOAD JOBS
  // =========================

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get("jobs/");

      console.log("JOBS RESPONSE:", response.data);

      setJobs(response.data);
    } catch (error) {
      console.error(
        "LOAD JOBS ERROR:",
        error.response?.data || error
      );

      alert("Unable to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SWIPE JOB
  // =========================

  const swipeJob = async (job, decision) => {
    if (swiping) {
      return;
    }

    try {
      setSwiping(true);

      console.log("SWIPING:", {
        job: job.id,
        decision: decision,
      });

      // =========================
      // SAVE SWIPE
      // =========================

      await api.post("swipes/", {
        job: job.id,
        decision: decision,
      });

      console.log("SWIPE SAVED");

      // =========================
      // RIGHT SWIPE = APPLICATION
      // =========================

      if (decision === "right") {
        try {
          await api.post("applications/", {
            job: job.id,
          });

          console.log("APPLICATION CREATED");
        } catch (applicationError) {
          console.error(
            "APPLICATION ERROR:",
            applicationError.response?.data ||
              applicationError
          );

          /*
           * Do not show an application error
           * if the application was already created.
           *
           * The swipe has already been saved.
           */
          const errorData =
            applicationError.response?.data;

          if (
            errorData &&
            JSON.stringify(errorData)
              .toLowerCase()
              .includes("already")
          ) {
            console.log(
              "Application already exists."
            );
          } else {
            alert(
              applicationError.response?.data
                ? JSON.stringify(
                    applicationError.response.data
                  )
                : "Job liked, but application could not be created."
            );
          }
        }
      }

      // =========================
      // REMOVE JOB FROM SCREEN
      // =========================

      setJobs((previousJobs) =>
        previousJobs.filter(
          (item) => item.id !== job.id
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
      setSwiping(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl text-gray-600">
          Finding jobs for you...
        </p>
      </div>
    );
  }

  // =========================
  // NO JOBS
  // =========================

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">

        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-lg">

          <div className="text-6xl mb-5">
            🎉
          </div>

          <h2 className="text-3xl font-bold text-gray-800">
            No More Jobs
          </h2>

          <p className="text-gray-500 mt-3">
            You have gone through all the jobs currently
            matching your profile.
          </p>

          <button
            onClick={() => navigate("/profile")}
            className="
              mt-6
              bg-indigo-600
              text-white
              px-6
              py-3
              rounded-xl
              hover:bg-indigo-700
              transition
            "
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }

  // =========================
  // CURRENT JOB
  // =========================

  const job = jobs[0];

  // =========================
  // PAGE
  // =========================

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 p-6">

      {/* Header */}

      <div className="max-w-3xl mx-auto mb-8 flex justify-between items-center">

        <div>

          <h1 className="text-4xl font-extrabold text-indigo-700">
            SwipeX Jobs
          </h1>

          <p className="text-gray-500 mt-1">
            Find your next opportunity
          </p>

        </div>

        <button
          onClick={() => navigate("/profile")}
          className="
            text-indigo-600
            font-semibold
            hover:text-indigo-800
          "
        >
          Dashboard
        </button>

      </div>

      {/* JOB CARD */}

      <div className="max-w-xl mx-auto">

        <div
          className="
            bg-white
            rounded-3xl
            shadow-2xl
            overflow-hidden
          "
        >

          {/* Top */}

          <div
            className="
              bg-gradient-to-r
              from-indigo-600
              to-cyan-500
              text-white
              p-7
            "
          >

            <h2 className="text-3xl font-bold">
              {job.title}
            </h2>

            <div className="flex items-center gap-2 mt-3">
              <FaBuilding />

              <span>
                {job.company}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <FaMapMarkerAlt />

              <span>
                {job.location}
              </span>
            </div>

          </div>

          {/* MATCH INFORMATION */}

          <div className="p-7">

            <div className="grid grid-cols-2 gap-4">

              {/* ATS */}

              <div
                className="
                  bg-indigo-50
                  rounded-2xl
                  p-5
                  text-center
                "
              >

                <p className="text-gray-500 text-sm">
                  ATS Score
                </p>

                <p className="text-3xl font-bold text-indigo-700 mt-1">
                  {job.ats_score}%
                </p>

              </div>

              {/* MATCH */}

              <div
                className="
                  bg-green-50
                  rounded-2xl
                  p-5
                  text-center
                "
              >

                <p className="text-gray-500 text-sm">
                  Overall Match
                </p>

                <p className="text-3xl font-bold text-green-600 mt-1">
                  {job.match_percentage}%
                </p>

              </div>

            </div>

            {/* MATCHED SKILLS */}

            <div className="mt-7">

              <h3 className="font-bold text-lg text-gray-800">
                Matched Skills
              </h3>

              <div className="flex flex-wrap gap-2 mt-3">

                {job.matched_skills?.length > 0 ? (

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

                  <span className="text-gray-400">
                    No matching skills
                  </span>

                )}

              </div>

            </div>

            {/* MISSING SKILLS */}

            <div className="mt-6">

              <h3 className="font-bold text-lg text-gray-800">
                Missing Skills
              </h3>

              <div className="flex flex-wrap gap-2 mt-3">

                {job.missing_skills?.length > 0 ? (

                  job.missing_skills.map(
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
                        {skill}
                      </span>
                    )
                  )

                ) : (

                  <span className="text-green-600">
                    ✓ You have all required skills
                  </span>

                )}

              </div>

            </div>

            {/* REQUIRED SKILLS */}

            <div className="mt-6">

              <h3 className="font-bold text-lg text-gray-800">
                Required Skills
              </h3>

              <p className="text-gray-500 mt-2">
                {job.required_skills}
              </p>

            </div>

            {/* SWIPE BUTTONS */}

            <div className="flex justify-center gap-10 mt-9">

              {/* LEFT */}

              <button
                disabled={swiping}
                onClick={() =>
                  swipeJob(job, "left")
                }
                className="
                  w-16
                  h-16
                  rounded-full
                  bg-red-100
                  text-red-500
                  flex
                  items-center
                  justify-center
                  text-2xl
                  shadow-lg
                  hover:bg-red-500
                  hover:text-white
                  hover:scale-110
                  transition
                  disabled:opacity-50
                "
              >
                <FaTimes />
              </button>

              {/* RIGHT */}

              <button
                disabled={swiping}
                onClick={() =>
                  swipeJob(job, "right")
                }
                className="
                  w-16
                  h-16
                  rounded-full
                  bg-green-100
                  text-green-500
                  flex
                  items-center
                  justify-center
                  text-2xl
                  shadow-lg
                  hover:bg-green-500
                  hover:text-white
                  hover:scale-110
                  transition
                  disabled:opacity-50
                "
              >
                <FaHeart />
              </button>

            </div>

            <div className="flex justify-center gap-16 mt-3 text-sm">

              <span className="text-red-500 font-semibold">
                Swipe Left
              </span>

              <span className="text-green-500 font-semibold">
                Swipe Right
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Jobs;