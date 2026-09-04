import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function CandidateDashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD USER + CANDIDATE PROFILE
  // ==========================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await api.get("/api/auth/me");
        setFullName(userResponse.data.full_name || "");
      } catch (err) {
        console.error(err);
      }

      try {
        const response = await api.get("/api/candidate/profile");
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
          setError("Your candidate profile has not been created yet.");
        } else {
          setError("Unable to load your profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sx-text-secondary">
        Loading your profile...
      </div>
    );
  }

  const displayName = profile?.full_name || fullName;
  const firstLetter = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : "C";

  return (
    <div className="px-10 py-8">
      {/* =================================
          HEADER
      ================================== */}

      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-sx-primary">
            CANDIDATE WORKSPACE
          </p>

          <h1 className="mt-1 text-2xl font-bold text-sx-text">
            Welcome back{displayName ? `, ${displayName}` : ""}!
          </h1>
        </div>

        <div className="rounded-full bg-sx-primary-soft px-4 py-1.5 text-sm font-semibold text-sx-primary-dark">
          Candidate
        </div>
      </header>

      {/* =================================
          PROFILE
      ================================== */}

      {profile ? (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest text-sx-text-muted">
                YOUR PROFILE
              </p>

              <h2 className="mt-1 text-xl font-semibold text-sx-text">
                Candidate Profile
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/candidate/profile/edit")}
              className="rounded-lg border border-sx-border bg-sx-card px-4 py-2 text-sm font-semibold text-sx-primary transition hover:bg-sx-bg-soft"
            >
              Edit Profile
            </button>
          </div>

          <div className="rounded-2xl border border-sx-border bg-sx-card p-6 shadow-sm">
            {/* =================================
                PROFILE HEADER
            ================================== */}

            <div className="mb-6 flex items-center gap-4 border-b border-sx-border pb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sx-primary text-2xl font-bold text-white">
                {firstLetter}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-sx-text">
                  {displayName || "Candidate"}
                </h2>
                <p className="text-sm text-sx-text-secondary">
                  {profile.headline || "Headline not added"}
                </p>
                <p className="text-sm text-sx-text-secondary">
                  {profile.location || "Location not added"}
                </p>
              </div>
            </div>

            {/* =================================
                PROFILE INFORMATION
            ================================== */}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* ABOUT */}

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-sx-text-muted">
                  About
                </span>
                <p className="mt-1 text-sm text-sx-text">
                  {profile.bio || "Not added"}
                </p>
              </div>

              {/* EDUCATION */}

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-sx-text-muted">
                  Education
                </span>
                <p className="mt-1 text-sm text-sx-text">
                  {profile.education || "Not added"}
                </p>
              </div>

              {/* SKILLS */}

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-sx-text-muted">
                  Skills
                </span>

                {profile.skills ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.skills
                      .split(",")
                      .map((skill) => skill.trim())
                      .filter(Boolean)
                      .map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-sx-primary-soft px-3 py-1 text-xs font-medium text-sx-primary-dark"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-sx-text">Not added</p>
                )}
              </div>

              {/* EXPERIENCE */}

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-sx-text-muted">
                  Experience
                </span>
                <p className="mt-1 text-sm text-sx-text">
                  {profile.experience || "Not added"}
                </p>
              </div>

              {/* PREFERRED ROLE */}

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-sx-text-muted">
                  Preferred Role
                </span>
                <p className="mt-1 text-sm text-sx-text">
                  {profile.preferred_role || "Not added"}
                </p>
              </div>

              {/* PREFERRED LOCATION */}

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-sx-text-muted">
                  Preferred Location
                </span>
                <p className="mt-1 text-sm text-sx-text">
                  {profile.preferred_location || "Not added"}
                </p>
              </div>

              {/* EXPECTED SALARY */}

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-sx-text-muted">
                  Expected Salary
                </span>
                <p className="mt-1 text-sm text-sx-text">
                  {profile.expected_salary
                    ? `₹${Number(profile.expected_salary).toLocaleString(
                        "en-IN"
                      )}`
                    : "Not added"}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-10 rounded-2xl border border-sx-border bg-sx-card p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-sx-text">
            Complete your profile
          </h2>
          <p className="mt-2 text-sm text-sx-text-secondary">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/candidate/profile/edit")}
            className="mt-4 rounded-lg bg-sx-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sx-primary-dark"
          >
            Create Profile
          </button>
        </section>
      )}

      {/* =================================
          QUICK ACTIONS
      ================================== */}

      <section>
        <p className="text-xs font-bold tracking-widest text-sx-text-muted">
          QUICK ACTIONS
        </p>
        <h2 className="mt-1 mb-5 text-xl font-semibold text-sx-text">
          Continue your job search
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* Discover Jobs */}

          <div
            onClick={() => navigate("/candidate/jobs")}
            className="cursor-pointer rounded-2xl border border-sx-border bg-sx-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="mb-1.5 font-semibold text-sx-text">
              Discover Jobs
            </h3>
            <p className="text-sm text-sx-text-secondary">
              Find jobs that match your skills and preferences.
            </p>
          </div>

          {/* Saved Jobs */}

          <div
            onClick={() => navigate("/candidate/saved-jobs")}
            className="cursor-pointer rounded-2xl border border-sx-border bg-sx-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="mb-1.5 font-semibold text-sx-text">Saved Jobs</h3>
            <p className="text-sm text-sx-text-secondary">
              View jobs you saved and continue exploring them later.
            </p>
          </div>

          {/* Resume */}

          <div
            onClick={() => navigate("/candidate/resume")}
            className="cursor-pointer rounded-2xl border border-sx-border bg-sx-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="mb-1.5 font-semibold text-sx-text">Resume</h3>
            <p className="text-sm text-sx-text-secondary">
              Upload or manage your resume.
            </p>
          </div>

          {/* AI Recommendations */}

          <div
            onClick={() => navigate("/candidate/ai-recommendations")}
            className="cursor-pointer rounded-2xl border border-sx-border bg-sx-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="mb-1.5 font-semibold text-sx-text">
              AI Recommendations
            </h3>
            <p className="text-sm text-sx-text-secondary">
              See your best matches and how to improve them.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CandidateDashboard;
