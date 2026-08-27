import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Companies() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/companies/");

      setCompanies(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load companies."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const searchText = search.toLowerCase();

    return (
      company.company_name
        ?.toLowerCase()
        .includes(searchText) ||
      company.industry
        ?.toLowerCase()
        .includes(searchText) ||
      company.company_type
        ?.toLowerCase()
        .includes(searchText) ||
      company.headquarters
        ?.toLowerCase()
        .includes(searchText)
    );
  });

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
              onClick={() => navigate("/jobs")}
              className="text-gray-600 hover:text-blue-600"
            >
              Jobs
            </button>

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

          </div>

        </div>

      </nav>

      {/* MAIN */}

      <main className="max-w-6xl mx-auto px-6 py-10">

        <div className="text-center mb-8">

          <h1 className="text-4xl font-bold text-gray-900">
            Companies & Startups
          </h1>

          <p className="mt-2 text-gray-500">
            Explore companies and startups hiring through SwipeX.
          </p>

        </div>

        {/* SEARCH */}

        <div className="bg-white rounded-xl shadow p-5 mb-8">

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies, industries, or locations..."
            className="w-full border border-gray-300 rounded-lg
                       px-5 py-3
                       focus:outline-none focus:ring-2
                       focus:ring-blue-500"
          />

        </div>

        {/* LOADING */}

        {loading && (
          <div className="text-center py-20">

            <p className="text-gray-500 text-lg">
              Loading companies...
            </p>

          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="text-center py-20">

            <p className="text-red-500 text-lg">
              {error}
            </p>

            <button
              onClick={fetchCompanies}
              className="mt-5 bg-blue-600 text-white
                         px-6 py-3 rounded-lg"
            >
              Try Again
            </button>

          </div>
        )}

        {/* COMPANY GRID */}

        {!loading && !error && filteredCompanies.length > 0 && (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {filteredCompanies.map((company) => (

              <div
                key={company.company_id}
                className="bg-white rounded-2xl shadow
                           hover:shadow-xl transition
                           p-6"
              >

                {/* COMPANY ICON */}

                <div className="w-16 h-16 rounded-xl
                                bg-blue-100
                                flex items-center justify-center
                                text-3xl mb-5">
                  🏢
                </div>

                {/* COMPANY NAME */}

                <h2 className="text-2xl font-bold text-gray-900">
                  {company.company_name}
                </h2>

                {/* TYPE */}

                {company.company_type && (
                  <p className="mt-2 text-blue-600 font-medium">
                    {company.company_type}
                  </p>
                )}

                {/* INDUSTRY */}

                {company.industry && (
                  <p className="mt-4 text-gray-600">
                    💼 {company.industry}
                  </p>
                )}

                {/* LOCATION */}

                {company.headquarters && (
                  <p className="mt-2 text-gray-600">
                    📍 {company.headquarters}
                  </p>
                )}

                {/* WEBSITE */}

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-5
                               text-blue-600
                               hover:underline"
                  >
                    Visit Website →
                  </a>
                )}

              </div>

            ))}

          </div>

        )}

        {/* NO RESULTS */}

        {!loading &&
          !error &&
          filteredCompanies.length === 0 && (

            <div className="text-center py-20">

              <div className="text-6xl">
                🏢
              </div>

              <h2 className="mt-5 text-2xl font-bold text-gray-800">
                No Companies Found
              </h2>

              <p className="mt-2 text-gray-500">
                Try another company name, industry, or location.
              </p>

            </div>

          )}

      </main>

    </div>
  );
}

export default Companies;