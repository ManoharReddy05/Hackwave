import { Link } from "react-router-dom";

export default function Users() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1 className="about-title">Welcome to KnowledgeKnest</h1>
          <p className="about-subtitle">Your Collaborative Learning Hub</p>
          <div className="about-description">
            <p>
              KnowledgeKnest is a comprehensive learning ecosystem designed to transform the way 
              students collaborate, learn, and grow together. Our platform combines interactive quizzes, 
              study groups, real-time discussions, and collaborative tools to create an engaging learning experience.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-section">
        <h2 className="section-title">Our Mission</h2>
        <div className="mission-content">
          <p>
            We believe that learning is most effective when it's collaborative and engaging. 
            Our mission is to provide students with powerful tools to work together, challenge 
            themselves, and achieve their academic goals in a supportive community.
          </p>
        </div>
      </section>

      {/* What We Offer */}
      <section className="about-section">
        <h2 className="section-title">What We Offer</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👨‍👩‍👧‍👦</div>
            <h3>Study Groups</h3>
            <p>
              Create or join study groups where you can collaborate with peers, share resources, 
              and work together towards common learning goals. Each group has its own space for 
              discussions, quizzes, and collaborative sessions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Interactive Quizzes</h3>
            <p>
              Access a vast library of quizzes or create your own. Support for multiple question 
              types including multiple-choice, true/false, and short-answer questions. Get instant 
              feedback and detailed explanations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Collaborative Playground</h3>
            <p>
              Work together in real-time using our interactive playground. Draw, brainstorm, 
              solve problems together, and visualize concepts with your study group members 
              in a shared canvas environment.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Leaderboards & Rankings</h3>
            <p>
              Track your progress with detailed leaderboards. See how you rank within your 
              study groups and globally. Compete in a friendly environment and celebrate 
              achievements together.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Discussion Forums</h3>
            <p>
              Engage in threaded discussions, ask questions, share insights, and help fellow 
              learners. Our discussion system supports nested comments and rich interactions 
              to keep conversations organized.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Performance Analytics</h3>
            <p>
              Get detailed insights into your learning progress. View statistics on quiz performance, 
              participation rates, and improvement trends. Use data to identify areas for growth.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="about-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create an Account</h3>
            <p>Sign up for free and join our learning community</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Join or Create Groups</h3>
            <p>Find study groups that match your interests or create your own</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Start Learning</h3>
            <p>Take quizzes, join sessions, and collaborate with peers</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Track Progress</h3>
            <p>Monitor your performance and compete on leaderboards</p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="about-section">
        <h2 className="section-title">Why Choose SmartQuiz?</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <div>
              <h4>Free to Use</h4>
              <p>Access all core features without any cost</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <div>
              <h4>Real-time Collaboration</h4>
              <p>Work together with peers in real-time</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <div>
              <h4>Comprehensive Learning Tools</h4>
              <p>Everything you need in one platform</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <div>
              <h4>Active Community</h4>
              <p>Join thousands of engaged learners</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <div>
              <h4>Mobile Friendly</h4>
              <p>Learn on any device, anywhere</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <div>
              <h4>Regular Updates</h4>
              <p>New features and improvements continuously</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <h2>Ready to Start Your Learning Journey?</h2>
        <p>Join our community and experience collaborative learning like never before</p>
        <div className="cta-buttons">
          <Link to="/groups" className="btn btn-primary btn-large">
            Explore Groups
          </Link>
          <Link to="/threads" className="btn btn-secondary btn-large">
            Join Discussions
          </Link>
        </div>
      </section>
    </div>
  );
}
