import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Applications() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/applications/");

      setApplications(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load applications."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Applied":
        return "bg-blue-100 text-blue-700";

      case "Shortlisted":
        return "bg-yellow-100 text-yellow-700";

      case "Selected":
        return "bg-green-100 text-green-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
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

      {/* Main */}

      <main className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-gray-900">
            My Applications
          </h1>

          <p className="mt-2 text-gray-500">
            Track the jobs you have applied for.
          </p>

        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}

        {loading ? (

          <div className="bg-white rounded-xl shadow p-10 text-center">

            <p className="text-gray-500">
              Loading applications...
            </p>

          </div>

        ) : applications.length === 0 ? (

          <div className="bg-white rounded-xl shadow p-10 text-center">

            <div className="text-5xl">
              📋
            </div>

            <h2 className="mt-4 text-2xl font-bold text-gray-800">
              No Applications Yet
            </h2>

            <p className="mt-2 text-gray-500">
              You haven't applied for any jobs yet.
            </p>

            <button
              onClick={() => navigate("/jobs")}
              className="mt-6 bg-blue-600 text-white px-6 py-3
                         rounded-lg font-semibold hover:bg-blue-700"
            >
              Discover Jobs
            </button>

          </div>

        ) : (

          <div className="space-y-5">

            {applications.map((application) => (

              <div
                key={application.application_id}
                className="bg-white rounded-xl shadow p-6"
              >

                <div className="flex justify-between items-start">

                  <div>

                    <h2 className="text-xl font-bold text-gray-900">
                      Job ID: {application.job_id}
                    </h2>

                    <p className="mt-2 text-gray-500">
                      Resume ID: {application.resume_id}
                    </p>

                    <p className="mt-2 text-sm text-gray-400">
                      Applied on{" "}
                      {new Date(
                        application.applied_at
                      ).toLocaleDateString()}
                    </p>

                  </div>

                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold
                      ${getStatusStyle(application.status)}`}
                  >
                    {application.status || "Applied"}
                  </span>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}

export default Applications;