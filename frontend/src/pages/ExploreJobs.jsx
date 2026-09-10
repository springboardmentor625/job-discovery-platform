import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaCompass,
  FaSearch,
  FaMapMarkerAlt,
  FaBookmark,
  FaCheckCircle,
  FaFilter,
  FaTimes,
} from "react-icons/fa";

import api from "../services/api";
import JobDetailsModal from "../components/JobDetailsModal";

function ExploreJobs() {
  /* =========================================================
     STATE
  ========================================================= */

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMap, setSavingMap] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Filters
  const [filterSkills, setFilterSkills] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterExperience, setFilterExperience] = useState("all");
  const [filterWorkMode, setFilterWorkMode] = useState("all");

  // Applied filters
  const [appliedSkills, setAppliedSkills] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedExperience, setAppliedExperience] = useState("all");
  const [appliedWorkMode, setAppliedWorkMode] = useState("all");

  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const JOBS_PER_PAGE = 6;

  /* =========================================================
     FETCH JOBS FROM BACKEND
  ========================================================= */

  const fetchJobs = async (page = 1) => {
    try {
      setLoading(true);

      const params = {
        page,
      };

      // Search
      if (search.trim()) {
        params.search = search.trim();
      }

      // Skills
      if (appliedSkills.trim()) {
        params.skills = appliedSkills.trim();
      }

      // Location
      if (appliedLocation.trim()) {
        params.location = appliedLocation.trim();
      }

      // Work Mode
      if (appliedWorkMode !== "all") {
        params.work_mode = appliedWorkMode;
      }

      // Experience
      if (appliedExperience !== "all") {
        params.experience = appliedExperience;
      }

      const res = await api.get("jobs/", {
        params,
      });

      const data = res.data;

      // DRF paginated response
      const results = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      setJobs(results);

      setTotalJobs(
        typeof data?.count === "number"
          ? data.count
          : results.length
      );
    } catch (error) {
      console.error("Jobs fetch error:", error);

      toast.error("Unable to load jobs.");

      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FETCH WHEN PAGE / APPLIED SEARCH / FILTERS CHANGE
  ========================================================= */

  useEffect(() => {
    fetchJobs(currentPage);
  }, [
    currentPage,
    search,
    appliedSkills,
    appliedLocation,
    appliedExperience,
    appliedWorkMode,
  ]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = () => {
    const newSearch = searchInput.trim();

    if (currentPage !== 1) {
      setCurrentPage(1);
    }

    setSearch(newSearch);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");

    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  /* =========================================================
     APPLY FILTERS
  ========================================================= */

  const applyFilters = () => {
    setAppliedSkills(filterSkills.trim());
    setAppliedLocation(filterLocation.trim());
    setAppliedExperience(filterExperience);
    setAppliedWorkMode(filterWorkMode);

    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    // UI values
    setSearchInput("");
    setFilterSkills("");
    setFilterLocation("");
    setFilterExperience("all");
    setFilterWorkMode("all");

    // Applied values
    setSearch("");
    setAppliedSkills("");
    setAppliedLocation("");
    setAppliedExperience("all");
    setAppliedWorkMode("all");

    setCurrentPage(1);
  };

  /* =========================================================
     SAVE JOB
  ========================================================= */

  const handleSaveJob = async (e, job) => {
    e.stopPropagation();

    if (savingMap[job.id] || job.is_saved) return;

    try {
      setSavingMap((prev) => ({
        ...prev,
        [job.id]: true,
      }));

      await api.post("swipes/", {
        job_id: job.id,
        decision: "saved",
      });

      toast.success(`${job.title} saved!`);

      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? { ...j, is_saved: true }
            : j
        )
      );
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save job.");
    } finally {
      setSavingMap((prev) => ({
        ...prev,
        [job.id]: false,
      }));
    }
  };

  /* =========================================================
     APPLY SUCCESS
  ========================================================= */

  const handleApplySuccess = (jobId) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, is_applied: true }
          : j
      )
    );

    if (selectedJob?.id === jobId) {
      setSelectedJob((prev) => ({
        ...prev,
        is_applied: true,
      }));
    }
  };

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(totalJobs / JOBS_PER_PAGE)
  );

  const startIndex =
    totalJobs === 0
      ? 0
      : (currentPage - 1) * JOBS_PER_PAGE + 1;

  const endIndex = Math.min(
    currentPage * JOBS_PER_PAGE,
    totalJobs
  );

  /* =========================================================
     PAGE NUMBERS
  ========================================================= */

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="space-y-6 pb-12">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs">

        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <FaCompass className="text-indigo-600" />
          Explore Jobs
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Browse career opportunities and find jobs that match your skills.
        </p>

        {!loading && (
          <p className="text-xs text-slate-400 mt-2">
            {totalJobs.toLocaleString()} jobs available
          </p>
        )}

      </div>


      {/* =====================================================
          SEARCH & FILTERS
      ===================================================== */}

      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">

        <div className="flex flex-col lg:flex-row gap-3">

          {/* SEARCH INPUT */}

          <div className="relative flex-1">

            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Search jobs, companies, skills..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
            />

            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                <FaTimes />
              </button>
            )}

          </div>


          {/* FILTER BUTTON */}

          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`px-5 py-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 transition ${
              showFilters
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <FaFilter />
            Filters
          </button>


          {/* SEARCH BUTTON */}

          <button
            type="button"
            onClick={handleSearch}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
          >
            Search
          </button>

        </div>


        {/* =====================================================
            FILTER OPTIONS
        ===================================================== */}

        {showFilters && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* SKILLS */}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Skills
              </label>

              <input
                type="text"
                value={filterSkills}
                onChange={(e) => setFilterSkills(e.target.value)}
                placeholder="e.g. Python, React"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
              />
            </div>


            {/* LOCATION */}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Location
              </label>

              <input
                type="text"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                placeholder="e.g. Hyderabad"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
              />
            </div>


            {/* WORK MODE */}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Work Mode
              </label>

              <select
                value={filterWorkMode}
                onChange={(e) =>
                  setFilterWorkMode(e.target.value)
                }
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
              >
                <option value="all">
                  All Work Modes
                </option>

                <option value="Remote">
                  Remote
                </option>

                <option value="Hybrid">
                  Hybrid
                </option>

                <option value="On-site">
                  On-site
                </option>

              </select>
            </div>


            {/* EXPERIENCE */}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Experience
              </label>

              <select
                value={filterExperience}
                onChange={(e) =>
                  setFilterExperience(e.target.value)
                }
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
              >
                <option value="all">
                  All Levels
                </option>

                <option value="entry">
                  Entry Level (0–2 years)
                </option>

                <option value="mid">
                  Mid Level (2–5 years)
                </option>

                <option value="senior">
                  Senior Level (5+ years)
                </option>

              </select>
            </div>


            {/* FILTER ACTIONS */}

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-3 pt-1">

              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={applyFilters}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
              >
                Apply Filters
              </button>

            </div>

          </div>
        )}

      </div>


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {[1, 2, 3, 4, 5, 6].map((i) => (

            <div
              key={i}
              className="h-[380px] bg-white rounded-2xl border border-slate-200 p-6 animate-pulse"
            >

              <div className="flex gap-3">

                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />

                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>

              </div>

              <div className="h-16 bg-slate-100 rounded-xl mt-5" />
              <div className="h-12 bg-slate-100 rounded-xl mt-4" />

            </div>

          ))}

        </div>


      ) : jobs.length > 0 ? (

        <>

          {/* =====================================================
              JOB GRID
          ===================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {jobs.map((job) => {

              const isApplied = job.is_applied;
              const isSaved = job.is_saved;

              return (

                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="h-[380px] bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer p-6 flex flex-col justify-between group"
                >

                  {/* TOP CONTENT */}

                  <div className="space-y-3">


                    {/* JOB HEADER */}

                    <div className="flex items-start justify-between gap-2">

                      <div className="flex items-start gap-3 min-w-0">

                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-base shrink-0 border border-indigo-100">

                          {job.company
                            ? job.company.charAt(0).toUpperCase()
                            : "C"}

                        </div>


                        <div className="min-w-0 flex-1">

                          <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">
                            {job.title || "Job Title"}
                          </h3>

                          <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                            {job.company || "Company"}
                          </p>

                        </div>

                      </div>


                      {isApplied && (

                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">

                          <FaCheckCircle className="text-[8px]" />

                          Applied

                        </span>

                      )}

                    </div>


                    {/* LOCATION & WORK MODE */}

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">

                      <span className="flex items-center gap-1">

                        <FaMapMarkerAlt className="text-slate-400" />

                        {job.location || "Remote"}

                      </span>


                      <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">

                        {job.work_mode || "Not specified"}

                      </span>

                    </div>


                    {/* SALARY & EXPERIENCE */}

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs">

                      <div>

                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Salary
                        </p>

                        <p className="font-bold text-slate-800 mt-1 truncate max-w-[140px]">
                          {job.salary || "Competitive"}
                        </p>

                      </div>


                      <div className="text-right">

                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Experience
                        </p>

                        <p className="font-medium text-slate-600 mt-1 truncate max-w-[140px]">
                          {job.experience || "Not specified"}
                        </p>

                      </div>

                    </div>


                    {/* DESCRIPTION */}

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">

                      {job.description ||
                        "Click to view the full job description and requirements."}

                    </p>

                  </div>


                  {/* =====================================================
                      ACTIONS
                  ===================================================== */}

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">


                    {/* APPLY */}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(job);
                      }}
                      className={`flex-1 h-10 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 transition ${
                        isApplied
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >

                      {isApplied ? (
                        <>
                          <FaCheckCircle />
                          Applied
                        </>
                      ) : (
                        "Apply"
                      )}

                    </button>


                    {/* SAVE */}

                    <button
                      type="button"
                      onClick={(e) => handleSaveJob(e, job)}
                      disabled={isSaved || savingMap[job.id]}
                      className={`flex-1 h-10 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 transition border ${
                        isSaved
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      } disabled:opacity-70 disabled:cursor-not-allowed`}
                    >

                      <FaBookmark
                        className={
                          isSaved
                            ? "text-amber-600"
                            : "text-slate-400"
                        }
                      />

                      {savingMap[job.id]
                        ? "Saving..."
                        : isSaved
                        ? "Saved"
                        : "Save"}

                    </button>

                  </div>

                </div>

              );
            })}

          </div>


          {/* =====================================================
              PAGINATION
          ===================================================== */}

          {totalJobs > 0 && (

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">

              {/* SHOWING COUNT */}

              <p className="text-xs text-slate-500">

                Showing{" "}

                <span className="font-bold text-slate-700">
                  {startIndex.toLocaleString()}
                </span>

                {" – "}

                <span className="font-bold text-slate-700">
                  {endIndex.toLocaleString()}
                </span>

                {" of "}

                <span className="font-bold text-slate-700">
                  {totalJobs.toLocaleString()}
                </span>

                {" jobs"}

              </p>


              {/* PAGE CONTROLS */}

              <div className="flex items-center gap-2">

                {/* PREVIOUS */}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.max(prev - 1, 1)
                    )
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ‹ Previous
                </button>


                {/* PAGE NUMBERS */}

                <div className="flex items-center gap-1">

                  {getPageNumbers().map((page) => (

                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                        currentPage === page
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>

                  ))}

                </div>


                {/* NEXT */}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next ›
                </button>

              </div>

            </div>

          )}

        </>


      ) : (

        /* =====================================================
           EMPTY STATE
        ===================================================== */

        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-xs text-center">

          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">

            <FaSearch />

          </div>


          <h2 className="text-lg font-bold text-slate-800 mt-4">
            No Jobs Found
          </h2>


          <p className="text-sm text-slate-500 mt-2">
            Try changing your search keywords or adjusting your filters.
          </p>


          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
          >
            Reset Filters
          </button>

        </div>

      )}


      {/* =====================================================
          JOB DETAILS MODAL
      ===================================================== */}

      {selectedJob && (

        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApplySuccess={handleApplySuccess}
        />

      )}

    </div>
  );
}

export default ExploreJobs;