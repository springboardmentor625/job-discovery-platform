import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">

      <nav className="bg-white shadow-sm px-8 py-4 flex
                      justify-between items-center">

        <h1 className="text-2xl font-bold text-gray-900">
          SwipeX
        </h1>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-500 px-5 py-2
                     text-white font-semibold
                     hover:bg-red-600"
        >
          Logout
        </button>

      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">

        <h2 className="text-4xl font-bold text-gray-900">
          Welcome to SwipeX 👋
        </h2>

        <p className="mt-3 text-gray-600">
          Your job discovery dashboard is ready.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">

          <div onClick={() => navigate("/jobs")}
  className="bg-white rounded-xl p-6 shadow cursor-pointer
             hover:shadow-lg transition"
>
  <h3 className="text-xl font-semibold">
    Discover Jobs
  </h3>

  <p className="mt-2 text-gray-500">
    Find jobs matched to your skills.
  </p>

  <button
    className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg"
  >
    Browse Jobs
  </button>
          </div>

          <div
  onClick={() => navigate("/applications")}
  className="bg-white rounded-xl p-6 shadow cursor-pointer
             hover:shadow-lg transition"
>
  <h3 className="text-xl font-semibold">
    My Applications
  </h3>

  <p className="mt-2 text-gray-500">
    Track your job applications.
  </p>

  <button className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg">
    View Applications
  </button>
</div>
          <div
  onClick={() => navigate("/resumes")}
  className="bg-white rounded-xl p-6 shadow cursor-pointer
             hover:shadow-lg transition"
>
  <h3 className="text-xl font-semibold">
    My Resume
  </h3>

  <p className="mt-2 text-gray-500">
    Manage your resume and profile.
  </p>

  <button
    className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg"
  >
    Manage Resumes
  </button>
</div>
<div
  onClick={() => navigate("/companies")}
  className="bg-white rounded-2xl shadow-md p-6
             cursor-pointer hover:shadow-xl
             transition"
>
  <div className="text-4xl mb-4">
    🏢
  </div>

  <h2 className="text-xl font-bold text-gray-800">
    Companies & Startups
  </h2>

  <p className="text-gray-500 mt-2">
    Explore companies and startups hiring on SwipeX.
  </p>
</div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;