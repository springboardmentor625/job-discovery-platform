import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";


function Matches() {

  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ==========================================
  // LOAD MATCHES
  // ==========================================

  useEffect(() => {

    const fetchMatches = async () => {

      try {

        const response = await api.get(
          "/api/matches"
        );

        setMatches(
          response.data
        );

      } catch (err) {

        console.error(err);


        // --------------------------------------
        // UNAUTHORIZED
        // --------------------------------------

        if (
          err.response?.status === 401
        ) {

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "user_id"
          );

          localStorage.removeItem(
            "role"
          );

          navigate("/login");

          return;

        }


        // --------------------------------------
        // OTHER ERROR
        // --------------------------------------

        setError(

          err.response?.data?.detail ||

          "Unable to load matches."

        );

      } finally {

        setLoading(false);

      }

    };


    fetchMatches();

  }, [navigate]);


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="dashboard-loading">

        Loading your matches...

      </div>

    );

  }


  // ==========================================
  // PAGE
  // ==========================================

  return (

    <div className="matches-page">

      <div className="matches-container">


        {/* =====================================
            HEADER
        ====================================== */}

        <div className="matches-header">


          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate("/candidate")
            }
          >

            ← Back

          </button>


          <div>

            <p className="section-label">

              CANDIDATE WORKSPACE

            </p>


            <h1>

              Your Matches

            </h1>


            <p>

              Jobs you've shown interest in.

            </p>

          </div>

        </div>


        {/* =====================================
            ERROR
        ====================================== */}

        {error && (

          <div className="login-error">

            {error}

          </div>

        )}


        {/* =====================================
            EMPTY MATCHES
        ====================================== */}

        {!error &&
          matches.length === 0 && (

            <div className="empty-matches">


              <div className="empty-matches-icon">

                ❤️

              </div>


              <h2>

                No matches yet

              </h2>


              <p>

                Start discovering jobs and
                like the ones you're interested in.

              </p>


              <button
                type="button"
                className="dashboard-button"
                onClick={() =>
                  navigate(
                    "/candidate/jobs"
                  )
                }
              >

                Discover Jobs

              </button>


            </div>

          )}


        {/* =====================================
            MATCHES
        ====================================== */}

        {matches.length > 0 && (

          <div className="matches-grid">


            {matches.map(
              (match) => (

                <div
                  className="match-card"
                  key={match.match_id}
                >


                  {/* =================================
                      CARD TOP
                  ================================= */}

                  <div className="match-card-top">


                    <div className="match-icon">

                      💼

                    </div>


                    <span className="match-badge">

                      ✓ Liked

                    </span>


                  </div>


                  {/* =================================
                      JOB TITLE
                  ================================= */}

                  <h2>

                    {match.title ||
                      "Job Title"}

                  </h2>


                  <h3>

                    {match.company ||
                      "Company"}

                  </h3>


                  {/* =================================
                      JOB DETAILS
                  ================================= */}

                  <div className="match-details">


                    <span>

                      📍{" "}

                      {match.location ||
                        "Location not specified"}

                    </span>


                    <span>

                      💼{" "}

                      {match.employment_type ||
                        "Employment type not specified"}

                    </span>


                    <span>

                      💰{" "}

                      {match.salary ||
                        "Salary not specified"}

                    </span>


                  </div>


                  {/* =================================
                      SKILLS
                  ================================= */}

                  {match.skills && (

                    <div className="match-skills">


                      {match.skills

                        .split(",")

                        .map(
                          (skill) =>
                            skill.trim()
                        )

                        .filter(Boolean)

                        .map(
                          (skill) => (

                            <span
                              className="match-skill-tag"
                              key={skill}
                            >

                              {skill}

                            </span>

                          )
                        )}


                    </div>

                  )}


                  {/* =================================
                      DESCRIPTION
                  ================================= */}

                  <p className="match-description">


                    {match.description

                      ? match.description.length > 180

                        ? `${match.description.substring(
                            0,
                            180
                          )}...`

                        : match.description

                      : "No description available."}


                  </p>


                  {/* =================================
                      VIEW JOB
                  ================================= */}

                  <button
                    type="button"
                    className="apply-match-button"
                    onClick={() =>
                      navigate(
                        `/candidate/jobs/${match.job_id}`
                      )
                    }
                  >

                    View Job →

                  </button>


                  {/* =================================
                      MATCHED DATE
                  ================================= */}

                  <small className="matched-date">


                    Liked on{" "}


                    {match.matched_at

                      ? new Date(
                          match.matched_at
                        ).toLocaleDateString(
                          "en-IN"
                        )

                      : "N/A"}


                  </small>


                </div>

              )
            )}


          </div>

        )}


      </div>

    </div>

  );

}


export default Matches;