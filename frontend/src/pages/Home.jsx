import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">

      <div className="text-center max-w-2xl">

        <h1 className="text-6xl font-bold text-gray-900">
          SwipeX
        </h1>

        <p className="mt-5 text-2xl text-gray-600">
          Smart Job Discovery Platform
        </p>

        <p className="mt-4 text-gray-500">
          Discover jobs, connect with companies, and find
          opportunities that match your skills.
        </p>

        <div className="mt-8 flex justify-center gap-4">

          <button
            onClick={() => navigate("/register")}
            className="rounded-lg bg-blue-600 px-7 py-3
                       text-white font-semibold
                       hover:bg-blue-700"
          >
            Get Started
          </button>

          <button
            onClick={() => navigate("/login")}
            className="rounded-lg border border-gray-300
                       bg-white px-7 py-3
                       text-gray-700 font-semibold
                       hover:bg-gray-50"
          >
            Login
          </button>

        </div>

      </div>

    </div>
  );
}

export default Home;