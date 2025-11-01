export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>KnowlegeKnest</h3>
          <p>Your collaborative learning hub for quizzes and discussions</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/users">Users</a></li>
            <li><a href="/groups">Groups</a></li>
            <li><a href="/threads">Discussions</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Resources</h4>
          <ul>
            <li><a href="/about">About</a></li>
            <li><a href="/help">Help Center</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Connect</h4>
          <p>&copy; 2025 KnowledgeKnest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
