import { useNavigate } from "react-router-dom";

function Start() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="start-container">

        <h1 className="logo">SwipeX</h1>

        <h2>Find Your Next Opportunity</h2>

        <p>
          Discover relevant jobs, showcase your skills,
          and find opportunities that match your career goals.
        </p>

        <button
          onClick={() => navigate("/register")}
        >
          Get Started
        </button>

        <div className="login-option">
          <span>Already have an account?</span>

          <button
            className="link-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>

      </div>
    </div>
  );
}

export default Start;

//This creates your first SwipeX screen
/*The important part is:

navigate("/register")

When the candidate clicks Get Started, we'll take them to the Register page.

And:

navigate("/login")

takes an existing candidate directly to Login.*/