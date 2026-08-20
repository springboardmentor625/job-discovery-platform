import "./Dashboard.css";

function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="sidebar-logo">
          SWIPEX
        </div>

        <nav className="sidebar-menu">

          <button className="menu-item active">
            🏠 Dashboard
          </button>

          <button className="menu-item">
            🔎 Find Jobs
          </button>

          <button className="menu-item">
            📄 My Applications
          </button>

          <button className="menu-item">
            ❤️ Saved Jobs
          </button>

          <button className="menu-item">
            👤 Profile
          </button>

          <button className="menu-item">
            ⚙️ Settings
          </button>

        </nav>

        <button
          className="logout-button"
          onClick={onLogout}
        >
          🚪 Logout
        </button>

      </aside>

      {/* Main Content */}
      <main className="dashboard-content">

        {/* Top Bar */}
        <header className="dashboard-header">

          <div>
            <h1>Dashboard</h1>
            <p>Find your next opportunity with SWIPEX.</p>
          </div>

          <div className="user-info">

            <div className="user-avatar">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div>
              <strong>{user?.full_name || "User"}</strong>
              <span>{user?.email || ""}</span>
            </div>

          </div>

        </header>

        {/* Welcome Section */}
        <section className="welcome-section">

          <h2>
            Welcome back, {user?.full_name || "User"}! 👋
          </h2>

          <p>
            Discover jobs, track applications and build your career.
          </p>

        </section>

        {/* Statistics */}
        <section className="stats-container">

          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div>
              <h3>0</h3>
              <p>Available Jobs</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📄</div>
            <div>
              <h3>0</h3>
              <p>Applications</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">❤️</div>
            <div>
              <h3>0</h3>
              <p>Saved Jobs</p>
            </div>
          </div>

        </section>

        {/* Search */}
        <section className="search-section">

          <h2>Find Your Next Job</h2>

          <div className="search-bar">

            <input
              type="text"
              placeholder="Search for jobs, skills or companies..."
            />

            <button>
              Search
            </button>

          </div>

        </section>

        {/* Recommended Jobs */}
        <section className="jobs-section">

          <div className="section-header">
            <h2>Recommended Jobs</h2>
            <button>View All</button>
          </div>

          <div className="job-card">

            <div className="job-details">

              <h3>Software Developer</h3>

              <p className="company">
                ABC Technologies
              </p>

              <p className="job-info">
                📍 Hyderabad &nbsp; • &nbsp; 💼 Full Time
              </p>

            </div>

            <button className="apply-button">
              Apply
            </button>

          </div>

          <div className="job-card">

            <div className="job-details">

              <h3>Frontend Developer</h3>

              <p className="company">
                Tech Solutions
              </p>

              <p className="job-info">
                📍 Bangalore &nbsp; • &nbsp; 💼 Full Time
              </p>

            </div>

            <button className="apply-button">
              Apply
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;