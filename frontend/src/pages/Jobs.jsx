import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Jobs() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Values entered by the user
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [employmentInput, setEmploymentInput] = useState("");
  const [experienceInput, setExperienceInput] = useState("");

  // Values actually applied after clicking Search
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/jobs/");

      setJobs(response.data);
      setCurrentIndex(0);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load jobs."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // APPLY SEARCH + FILTERS
  // -----------------------------

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setLocationFilter(locationInput.trim());
    setEmploymentFilter(employmentInput);
    setExperienceFilter(experienceInput);
    setCurrentIndex(0);
  };

  // -----------------------------
  // FILTER JOBS
  // -----------------------------

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        !searchText ||
        job.title?.toLowerCase().includes(searchText) ||
        job.description?.toLowerCase().includes(searchText) ||
        String(job.required_skills || "")
          .toLowerCase()
          .includes(searchText);

      const matchesLocation =
        !locationFilter ||
        job.location
          ?.toLowerCase()
          .includes(locationFilter.toLowerCase());

      const matchesEmployment =
        !employmentFilter ||
        job.employment_type?.toLowerCase() ===
          employmentFilter.toLowerCase();

      const matchesExperience =
        !experienceFilter ||
        job.experience_required
          ?.toLowerCase()
          .includes(experienceFilter.toLowerCase());

      return (
        matchesSearch &&
        matchesLocation &&
        matchesEmployment &&
        matchesExperience
      );
    });
  }, [
    jobs,
    search,
    locationFilter,
    employmentFilter,
    experienceFilter,
  ]);

  // -----------------------------
  // NEXT JOB
  // -----------------------------

  const nextJob = () => {
    if (currentIndex < filteredJobs.length - 1) {
      setCurrentIndex((previous) => previous + 1);
    } else {
      setCurrentIndex(filteredJobs.length);
    }
  };

  const handlePass = () => {
    nextJob();
  };

  const handleInterested = () => {
    nextJob();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // -----------------------------
  // CLEAR FILTERS
  // -----------------------------

  const clearFilters = () => {
    setSearchInput("");
    setLocationInput("");
    setEmploymentInput("");
    setExperienceInput("");

    setSearch("");
    setLocationFilter("");
    setEmploymentFilter("");
    setExperienceFilter("");

    setCurrentIndex(0);
  };

  // -----------------------------
  // LOADING
  // -----------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">
          Finding jobs for you...
        </p>
      </div>
    );
  }

  // -----------------------------
  // ERROR
  // -----------------------------

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">

        <nav className="bg-white shadow px-8 py-4 flex justify-between items-center">

          <h1 className="text-2xl font-bold text-blue-600">
            SwipeX
          </h1>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-5 py-2 rounded-lg"
          >
            Logout
          </button>

        </nav>

        <div className="flex items-center justify-center min-h-[80vh]">

          <div className="text-center">

            <p className="text-red-600 text-lg">
              {error}
            </p>

            <button
              onClick={fetchJobs}
              className="mt-5 bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Try Again
            </button>

          </div>

        </div>

      </div>
    );
  }

  // -----------------------------
  // NO MATCHING JOBS
  // -----------------------------

  if (filteredJobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">

        <nav className="bg-white shadow px-8 py-4">

          <div className="max-w-6xl mx-auto flex justify-between items-center">

            <button
              onClick={() => navigate("/dashboard")}
              className="text-2xl font-bold text-blue-600"
            >
              SwipeX
            </button>

            <div className="flex items-center gap-5">

              <button
                onClick={() => navigate("/applications")}
                className="text-gray-600 hover:text-blue-600"
              >
                My Applications
              </button>

              <button
                onClick={() => navigate("/resumes")}
                className="text-gray-600 hover:text-blue-600"
              >
                My Resume
              </button>

              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-5 py-2 rounded-lg"
              >
                Logout
              </button>

            </div>

          </div>

        </nav>

        <main className="max-w-5xl mx-auto px-6 py-10">

          {/* Search remains visible */}

          <div className="bg-white rounded-xl shadow p-5 mb-10">

            <div className="relative">

              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search job title, skills, or keywords..."
                className="w-full border border-gray-300 rounded-lg
                           px-5 py-3 pl-11
                           focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              />

              <span className="absolute left-4 top-3 text-xl">
                🔎
              </span>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Location"
                className="border border-gray-300 rounded-lg px-4 py-3
                           focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              />

              <select
                value={employmentInput}
                onChange={(e) => setEmploymentInput(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3
                           focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              >

                <option value="">
                  All Employment Types
                </option>

                <option value="Full-time">
                  Full-time
                </option>

                <option value="Part-time">
                  Part-time
                </option>

                <option value="Internship">
                  Internship
                </option>

                <option value="Contract">
                  Contract
                </option>

              </select>

              <select
                value={experienceInput}
                onChange={(e) => setExperienceInput(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3
                           focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              >

                <option value="">
                  All Experience Levels
                </option>

                <option value="0-2">
                  0-2 years
                </option>

                <option value="2-5">
                  2-5 years
                </option>

                <option value="5-10">
                  5-10 years
                </option>

                <option value="10+">
                  10+ years
                </option>

              </select>

            </div>

            <div className="mt-4 flex justify-center gap-3">

              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-7 py-3 rounded-lg
                           font-semibold hover:bg-blue-700"
              >
                🔎 Search Jobs
              </button>

              <button
                onClick={clearFilters}
                className="border border-gray-300 px-7 py-3 rounded-lg
                           font-semibold text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>

            </div>

          </div>

          <div className="text-center">

            <div className="text-6xl">
              🔎
            </div>

            <h2 className="mt-5 text-3xl font-bold text-gray-800">
              No Jobs Found
            </h2>

            <p className="mt-3 text-gray-500">
              No jobs match your search criteria.
            </p>

            <p className="mt-2 text-gray-400">
              Try another job title, skill, location, or filter.
            </p>

          </div>

        </main>

      </div>
    );
  }

  // -----------------------------
  // ALL JOBS COMPLETED
  // -----------------------------

  if (currentIndex >= filteredJobs.length) {
    return (
      <div className="min-h-screen bg-gray-100">

        <nav className="bg-white shadow px-8 py-4">

          <div className="max-w-6xl mx-auto flex justify-between items-center">

            <button
              onClick={() => navigate("/dashboard")}
              className="text-2xl font-bold text-blue-600"
            >
              SwipeX
            </button>

            <div className="flex items-center gap-5">

              <button
                onClick={() => navigate("/applications")}
                className="text-gray-600 hover:text-blue-600"
              >
                My Applications
              </button>

              <button
                onClick={() => navigate("/resumes")}
                className="text-gray-600 hover:text-blue-600"
              >
                My Resume
              </button>

              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-5 py-2 rounded-lg"
              >
                Logout
              </button>

            </div>

          </div>

        </nav>

        <div className="flex items-center justify-center min-h-[75vh]">

          <div className="text-center">

            <div className="text-6xl">
              🎉
            </div>

            <h2 className="mt-5 text-3xl font-bold text-gray-800">
              You're All Caught Up!
            </h2>

            <p className="mt-3 text-gray-500">
              You've viewed all matching jobs.
            </p>

            <button
              onClick={() => setCurrentIndex(0)}
              className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg
                         font-semibold hover:bg-blue-700"
            >
              Start Again
            </button>

          </div>

        </div>

      </div>
    );
  }

  const job = filteredJobs[currentIndex];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* NAVBAR */}

      <nav className="bg-white shadow px-8 py-4">

        <div className="max-w-6xl mx-auto flex justify-between items-center">

          <button
            onClick={() => navigate("/dashboard")}
            className="text-2xl font-bold text-blue-600"
          >
            SwipeX
          </button>

          <div className="flex items-center gap-5">

            <button
              onClick={() => navigate("/applications")}
              className="text-gray-600 hover:text-blue-600"
            >
              My Applications
            </button>

            <button
              onClick={() => navigate("/resumes")}
              className="text-gray-600 hover:text-blue-600"
            >
              My Resume
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

      {/* MAIN */}

      <main className="max-w-5xl mx-auto px-6 py-8">

        <div className="text-center mb-7">

          <h2 className="text-4xl font-bold text-gray-900">
            Discover Jobs
          </h2>

          <p className="mt-2 text-gray-500">
            Find opportunities that match your skills and preferences.
          </p>

        </div>

        {/* SEARCH AND FILTERS */}

        <div className="bg-white rounded-xl shadow p-5 mb-7">

          <div className="relative">

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search job title, skills, or keywords..."
              className="w-full border border-gray-300 rounded-lg
                         px-5 py-3 pl-11
                         focus:outline-none focus:ring-2
                         focus:ring-blue-500"
            />

            <span className="absolute left-4 top-3 text-xl">
              🔎
            </span>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Location"
              className="border border-gray-300 rounded-lg px-4 py-3
                         focus:outline-none focus:ring-2
                         focus:ring-blue-500"
            />

            <select
              value={employmentInput}
              onChange={(e) => setEmploymentInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3
                         focus:outline-none focus:ring-2
                         focus:ring-blue-500"
            >

              <option value="">
                All Employment Types
              </option>

              <option value="Full-time">
                Full-time
              </option>

              <option value="Part-time">
                Part-time
              </option>

              <option value="Internship">
                Internship
              </option>

              <option value="Contract">
                Contract
              </option>

            </select>

            <select
              value={experienceInput}
              onChange={(e) => setExperienceInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3
                         focus:outline-none focus:ring-2
                         focus:ring-blue-500"
            >

              <option value="">
                All Experience Levels
              </option>

              <option value="0-2">
                0-2 years
              </option>

              <option value="2-5">
                2-5 years
              </option>

              <option value="5-10">
                5-10 years
              </option>

              <option value="10+">
                10+ years
              </option>

            </select>

          </div>

          {/* SEARCH BUTTON */}

          <div className="mt-4 flex justify-center gap-3">

            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-7 py-3 rounded-lg
                         font-semibold hover:bg-blue-700"
            >
              🔎 Search Jobs
            </button>

            {(searchInput ||
              locationInput ||
              employmentInput ||
              experienceInput) && (

              <button
                onClick={clearFilters}
                className="border border-gray-300 px-7 py-3 rounded-lg
                           font-semibold text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>

            )}

          </div>

          {/* RESULTS COUNT */}

          <div className="mt-4 text-center">

            <p className="text-sm text-gray-500">

              {filteredJobs.length} matching job
              {filteredJobs.length !== 1 ? "s" : ""}

            </p>

          </div>

        </div>

        {/* JOB CARD */}

        <div className="relative">

          <AnimatePresence mode="wait">

            <motion.div
              key={job.job_id}
              initial={{
                opacity: 0,
                x: 100,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                x: -100,
                scale: 0.95,
              }}
              transition={{
                duration: 0.3,
              }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >

              {/* HEADER */}

              <div className="bg-blue-600 p-8 text-white">

                <p className="text-blue-100 text-sm">
                  Job Opportunity
                </p>

                <h3 className="text-3xl font-bold mt-2">
                  {job.title}
                </h3>

                {job.location && (
                  <p className="mt-3 text-blue-100">
                    📍 {job.location}
                  </p>
                )}

              </div>

              {/* BODY */}

              <div className="p-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

                  {job.employment_type && (
                    <div>
                      <p className="text-sm text-gray-400">
                        Employment Type
                      </p>

                      <p className="font-semibold text-gray-800 mt-1">
                        {job.employment_type}
                      </p>
                    </div>
                  )}

                  {job.experience_required && (
                    <div>
                      <p className="text-sm text-gray-400">
                        Experience
                      </p>

                      <p className="font-semibold text-gray-800 mt-1">
                        {job.experience_required}
                      </p>
                    </div>
                  )}

                  {(job.salary_min || job.salary_max) && (
                    <div>
                      <p className="text-sm text-gray-400">
                        Salary
                      </p>

                      <p className="font-semibold text-gray-800 mt-1">
                        {job.salary_min || "N/A"}
                        {" - "}
                        {job.salary_max || "N/A"}
                      </p>
                    </div>
                  )}

                  {job.status && (
                    <div>
                      <p className="text-sm text-gray-400">
                        Status
                      </p>

                      <p className="font-semibold text-gray-800 mt-1">
                        {job.status}
                      </p>
                    </div>
                  )}

                </div>

                {/* DESCRIPTION */}

                <div>

                  <h4 className="text-lg font-semibold text-gray-900">
                    Description
                  </h4>

                  <p className="mt-2 text-gray-600 leading-relaxed">
                    {job.description || "No description provided."}
                  </p>

                </div>

                {/* SKILLS */}

                {job.required_skills && (
                  <div className="mt-7">

                    <h4 className="text-lg font-semibold text-gray-900">
                      Required Skills
                    </h4>

                    <div className="mt-3 flex flex-wrap gap-2">

                      {Array.isArray(job.required_skills)
                        ? job.required_skills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-700
                                           px-3 py-1 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            )
                          )
                        : (
                            <span
                              className="bg-blue-100 text-blue-700
                                         px-3 py-1 rounded-full text-sm"
                            >
                              {String(job.required_skills)}
                            </span>
                          )}

                    </div>

                  </div>
                )}

                {/* ACTION BUTTONS */}

              {/* ACTION BUTTONS */}

<div className="mt-10 flex justify-center items-center gap-4">

  {/* PREVIOUS */}

  <button
    onClick={() =>
      setCurrentIndex((previous) =>
        Math.max(previous - 1, 0)
      )
    }
    disabled={currentIndex === 0}
    className={`h-14 w-14 rounded-full border-2
      text-2xl transition
      ${
        currentIndex === 0
          ? "border-gray-200 text-gray-300 cursor-not-allowed"
          : "border-blue-400 text-blue-500 hover:bg-blue-50"
      }`}
    title="Previous Job"
  >
    ↩
  </button>


  {/* PASS */}

  <button
    onClick={handlePass}
    className="h-14 w-14 rounded-full border-2
               border-red-400 text-red-500
               text-2xl hover:bg-red-50 transition"
    title="Pass"
  >
    ✕
  </button>


  {/* INTERESTED */}

  <button
    onClick={handleInterested}
    className="h-14 w-14 rounded-full border-2
               border-yellow-400 text-yellow-500
               text-2xl hover:bg-yellow-50 transition"
    title="Interested"
  >
    ★
  </button>


  {/* APPLY */}

  <button
    onClick={() =>
      navigate(`/apply/${job.job_id}`)
    }
    className="h-14 w-14 rounded-full bg-green-500
               text-white text-2xl
               hover:bg-green-600 transition shadow-md"
    title="Apply"
  >
    ♥
  </button>

</div>

              </div>

            </motion.div>

          </AnimatePresence>

        </div>

        {/* PROGRESS */}

        <div className="mt-6 text-center">

          <p className="text-gray-500">
            Job {currentIndex + 1} of {filteredJobs.length}
          </p>

          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">

            <div
              className="h-full bg-blue-600 transition-all"
              style={{
                width: `${
                  ((currentIndex + 1) /
                    filteredJobs.length) *
                  100
                }%`,
              }}
            />

          </div>

        </div>

      </main>

    </div>
  );
}

export default Jobs;