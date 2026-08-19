import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function CandidateDashboard() {

  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ==========================================
  // LOAD CANDIDATE PROFILE
  // ==========================================

  useEffect(() => {

    const fetchProfile = async () => {

      try {

        const response = await api.get(
          "/api/candidate/profile"
        );

        setProfile(response.data);

      } catch (error) {

        console.error(error);

        if (error.response?.status === 401) {

          localStorage.removeItem("access_token");
          localStorage.removeItem("user_id");
          localStorage.removeItem("role");

          navigate("/login");

          return;
        }

        if (error.response?.status === 404) {

          setError(
            "Your candidate profile has not been created yet."
          );

        } else {

          setError(
            "Unable to load your profile."
          );

        }

      } finally {

        setLoading(false);

      }

    };

    fetchProfile();

  }, [navigate]);


  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {

    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");

    navigate("/login");

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="dashboard-loading">

        Loading your profile...

      </div>

    );

  }


  return (

    <div className="dashboard">


      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside className="sidebar">

        <div className="sidebar-logo">
          SwipeX
        </div>


        <nav>

          {/* Dashboard */}

          <button
            type="button"
            className="nav-item active"
            onClick={() =>
              navigate("/candidate")
            }
          >
            Dashboard
          </button>


          {/* Discover Jobs */}

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigate("/candidate/jobs")
            }
          >
            Discover Jobs
          </button>


          {/* Matches */}

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigate("/candidate/matches")
            }
          >
            Matches
          </button>


          {/* Saved Jobs */}

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigate("/candidate/saved-jobs")
            }
          >
            Saved Jobs
          </button>


          {/* Applications */}

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigate("/candidate/applications")
            }
          >
            Applications
          </button>


          {/* Profile */}

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigate(
                "/candidate/profile/edit"
              )
            }
          >
            Profile
          </button>


          {/* Resume */}

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigate("/candidate/resume")
            }
          >
            Resume
          </button>

        </nav>


        {/* Logout */}

        <button
          type="button"
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>

      </aside>


      {/* =====================================
          MAIN CONTENT
      ====================================== */}

      <main className="dashboard-main">


        {/* =================================
            HEADER
        ================================== */}

        <header className="dashboard-header">

          <div>

            <p className="dashboard-label">
              CANDIDATE WORKSPACE
            </p>

            <h1>
              Welcome back! 👋
            </h1>

          </div>


          <div className="candidate-badge">
            Candidate
          </div>

        </header>


        {/* =================================
            PROFILE
        ================================== */}

        {profile ? (

          <section className="profile-section">


            <div className="section-header">

              <div>

                <p className="section-label">
                  YOUR PROFILE
                </p>

                <h2>
                  Candidate Profile
                </h2>

              </div>


              <button
                type="button"
                className="edit-button"
                onClick={() =>
                  navigate(
                    "/candidate/profile/edit"
                  )
                }
              >
                Edit Profile
              </button>

            </div>


            <div className="profile-card">


              {/* =================================
                  PROFILE HEADER
              ================================== */}

              <div className="profile-header">

                <div className="profile-initial">

                  {profile.headline
                    ? profile.headline
                        .charAt(0)
                        .toUpperCase()
                    : "C"}

                </div>


                <div>

                  <h2>
                    {profile.headline ||
                      "Candidate"}
                  </h2>

                  <p>
                    {profile.location ||
                      "Location not added"}
                  </p>

                </div>

              </div>


              {/* =================================
                  PROFILE INFORMATION
              ================================== */}

              <div className="profile-grid">


                {/* ABOUT */}

                <div className="profile-field">

                  <span>
                    About
                  </span>

                  <p>
                    {profile.bio ||
                      "Not added"}
                  </p>

                </div>


                {/* EDUCATION */}

                <div className="profile-field">

                  <span>
                    Education
                  </span>

                  <p>
                    {profile.education ||
                      "Not added"}
                  </p>

                </div>


                {/* SKILLS */}

                <div className="profile-field">

                  <span>
                    Skills
                  </span>


                  {profile.skills ? (

                    <div className="profile-skills">

                      {profile.skills
                        .split(",")
                        .map(
                          (skill) =>
                            skill.trim()
                        )
                        .filter(Boolean)
                        .map(
                          (skill) => (

                            <span
                              className="profile-skill-tag"
                              key={skill}
                            >
                              {skill}
                            </span>

                          )
                        )}

                    </div>

                  ) : (

                    <p>
                      Not added
                    </p>

                  )}

                </div>


                {/* EXPERIENCE */}

                <div className="profile-field">

                  <span>
                    Experience
                  </span>

                  <p>
                    {profile.experience ||
                      "Not added"}
                  </p>

                </div>


                {/* PREFERRED ROLE */}

                <div className="profile-field">

                  <span>
                    Preferred Role
                  </span>

                  <p>
                    {profile.preferred_role ||
                      "Not added"}
                  </p>

                </div>


                {/* PREFERRED LOCATION */}

                <div className="profile-field">

                  <span>
                    Preferred Location
                  </span>

                  <p>
                    {profile.preferred_location ||
                      "Not added"}
                  </p>

                </div>


                {/* EXPECTED SALARY */}

                <div className="profile-field">

                  <span>
                    Expected Salary
                  </span>

                  <p>
                    {profile.expected_salary
                      ? `₹${Number(
                          profile.expected_salary
                        ).toLocaleString("en-IN")}`
                      : "Not added"}
                  </p>

                </div>


              </div>

            </div>

          </section>

        ) : (

          <section className="empty-profile">

            <h2>
              Complete your profile
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/candidate/profile/edit"
                )
              }
            >
              Create Profile
            </button>

          </section>

        )}


        {/* =================================
            QUICK ACTIONS
        ================================== */}

        <section className="quick-section">

          <p className="section-label">
            QUICK ACTIONS
          </p>

          <h2>
            Continue your job search
          </h2>


          <div className="quick-grid">


            {/* Discover Jobs */}

            <div
              className="quick-card"
              onClick={() =>
                navigate("/candidate/jobs")
              }
            >

              <h3>
                Discover Jobs
              </h3>

              <p>
                Find jobs that match your
                skills and preferences.
              </p>

            </div>


            {/* Saved Jobs */}

            <div
              className="quick-card"
              onClick={() =>
                navigate("/candidate/saved-jobs")
              }
            >

              <h3>
                Saved Jobs
              </h3>

              <p>
                View jobs you saved and
                continue exploring them later.
              </p>

            </div>


            {/* Resume */}

            <div
              className="quick-card"
              onClick={() =>
                navigate("/candidate/resume")
              }
            >

              <h3>
                Resume
              </h3>

              <p>
                Upload or manage your
                resume.
              </p>

            </div>


            {/* Applications */}

            <div
              className="quick-card"
              onClick={() =>
                navigate("/candidate/applications")
              }
            >

              <h3>
                Applications
              </h3>

              <p>
                Track your submitted job
                applications.
              </p>

            </div>


          </div>

        </section>


      </main>

    </div>

  );

}

export default CandidateDashboard;