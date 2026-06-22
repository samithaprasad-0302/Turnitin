import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiUsers, FiFileText, FiBell } from 'react-icons/fi';
import '../styles/pages.css';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>AI & Plagiarism Detection Service</h1>
          <p>Professional document analysis and plagiarism checking</p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary btn-large">Get Started</Link>
            <Link to="/login" className="btn btn-outline btn-large">Login</Link>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <FiCheckCircle size={40} />
            <h3>Accurate Detection</h3>
            <p>Advanced AI technology for precise plagiarism and AI-generated content detection</p>
          </div>
          <div className="feature-card">
            <FiUsers size={40} />
            <h3>Professional Team</h3>
            <p>Expert checkers review and analyze your documents thoroughly</p>
          </div>
          <div className="feature-card">
            <FiFileText size={40} />
            <h3>Detailed Reports</h3>
            <p>Comprehensive reports with actionable insights and recommendations</p>
          </div>
          <div className="feature-card">
            <FiBell size={40} />
            <h3>Real-time Notifications</h3>
            <p>Get instant updates on your document status and report completion</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to Check Your Documents?</h2>
        <Link to="/login" className="btn btn-primary btn-large">Get Started Now</Link>
      </section>
    </div>
  );
};

export default Home;
