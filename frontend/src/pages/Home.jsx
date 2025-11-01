import { Link } from "react-router-dom";

export default function Home() {
  const isLoggedIn = localStorage.getItem("token");

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to SmartQuiz Platform</h1>
          <p className="hero-subtitle">
            Collaborate, Learn, and Grow Together
          </p>
          <p className="hero-description">
            Join study groups, take quizzes, compete on leaderboards, and engage in meaningful discussions with learners worldwide.
          </p>
          <div className="hero-buttons">
            {isLoggedIn ? (
              <>
                <Link to="/users" className="btn btn-primary">
                  Explore Users
                </Link>
                <Link to="/groups" className="btn btn-secondary">
                  Browse Groups
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Platform Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Study Groups</h3>
            <p>Create or join groups to collaborate with fellow learners</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Interactive Quizzes</h3>
            <p>Test your knowledge with diverse quiz formats and instant feedback</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Leaderboards</h3>
            <p>Track your progress and compete with others to reach the top</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Discussions</h3>
            <p>Engage in threaded discussions and share knowledge</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Monitor your performance with detailed statistics and insights</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Personalized Learning</h3>
            <p>Adaptive content tailored to your learning pace and style</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <h3>1000+</h3>
            <p>Active Users</p>
          </div>
          <div className="stat-item">
            <h3>500+</h3>
            <p>Study Groups</p>
          </div>
          <div className="stat-item">
            <h3>10,000+</h3>
            <p>Quizzes Taken</p>
          </div>
          <div className="stat-item">
            <h3>95%</h3>
            <p>Satisfaction Rate</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isLoggedIn && (
        <section className="cta-section">
          <h2>Ready to Start Learning?</h2>
          <p>Join thousands of learners already on the platform</p>
          <Link to="/register" className="btn btn-primary btn-large">
            Create Free Account
          </Link>
        </section>
      )}
    </div>
  );
}
