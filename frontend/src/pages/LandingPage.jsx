import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Shapes */}
      <div className="bg-shape-left">
        <svg className="bg-shape-wave" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h4l3-9 5 18 3-9h5"/>
        </svg>
      </div>

      {/* Floating Chat Bubble */}
      <div className="floating-chat-btn">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>

      {/* Navigation Bar */}
      <nav className="landing-navbar">
        <div className="logo">
          <div className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          SwipeX
        </div>

        <div className="landing-nav-links">
          <a href="#">
            Product 
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </a>
          <a href="#">Pricing</a>
          <a href="#">
            Solutions 
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </a>
          <a href="#">Reviews</a>
          <a href="#">Blog</a>
          <a href="#">
            Resources 
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </a>
        </div>

        <div>
          <Link to="/login" className="secondary-btn" style={{ padding: '8px 24px', fontWeight: '600' }}>
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero-section">
        
        {/* Subtle lightning bolt decorations */}
        <svg style={{ position: 'absolute', top: '-20px', left: '10%', opacity: 0.1, width: '40px' }} viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <svg style={{ position: 'absolute', top: '40px', right: '15%', opacity: 0.1, width: '50px' }} viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>

        <h1 className="hero-title">
          Find your perfect <br/>
          <span className="blue-text">dream job</span> in minutes with AI
        </h1>
        
        <p className="hero-subtitle">
          Quickly swipe through highly relevant, AI-matched job opportunities without the hassle using SwipeX, the smart job portal for ambitious professionals.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Link to="/register" className="primary-btn" style={{ padding: '16px 32px', fontSize: '1.1rem', fontWeight: '600', borderRadius: '8px' }}>
            Try SwipeX for Free
          </Link>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            No credit card required
          </span>
        </div>



      </main>

    </div>
  );
}
