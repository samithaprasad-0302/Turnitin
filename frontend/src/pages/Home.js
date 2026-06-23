import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiShield, 
  FiZap, 
  FiDatabase, 
  FiArrowRight, 
  FiLock, 
  FiCheck, 
  FiFileText, 
  FiHelpCircle
} from 'react-icons/fi';
import '../styles/pages.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-text-content">
            <div className="security-badge-top">
              <FiLock className="badge-lock-icon" />
              <span>100% Secure & Confidential No-Repository Checks</span>
            </div>
            <h1>
              Official <span className="gradient-text">Turnitin Reports</span> Without Database Retention
            </h1>
            <p className="hero-description">
              Get original, instructor-grade similarity and AI detection reports directly from official Turnitin instructor accounts. No third-party API wrappers, and absolutely zero document storage.
            </p>
            <div className="hero-cta-buttons">
              <Link to="/login" className="btn btn-hero-primary">
                Check Document Now <FiArrowRight className="btn-icon" />
              </Link>
              <Link to="/pricing" className="btn btn-hero-secondary">
                View Pricing
              </Link>
            </div>
            <div className="trust-metrics">
              <div className="metric-item">
                <span className="metric-number">0%</span>
                <span className="metric-label">DB Storage (No Repository)</span>
              </div>
              <div className="metric-item">
                <span className="metric-number">100%</span>
                <span className="metric-label">Official Instructor Reports</span>
              </div>
              <div className="metric-item">
                <span className="metric-number">100%</span>
                <span className="metric-label">Privacy Guaranteed</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-content">
            <div className="mock-card main-mock">
              <div className="mock-header">
                <span className="mock-dot red"></span>
                <span className="mock-dot yellow"></span>
                <span className="mock-dot green"></span>
                <div className="mock-title">Turnscan Secure Portal</div>
              </div>
              <div className="mock-body">
                <div className="secure-scanner">
                  <div className="scan-line"></div>
                  <div className="scanner-file">
                    <FiFileText className="file-icon" />
                    <div className="file-details">
                      <span className="file-name">research_paper_final.docx</span>
                      <span className="file-status checking">Analyzing through Instructor Account...</span>
                    </div>
                  </div>
                </div>

                <div className="mock-stats">
                  <div className="stat-row">
                    <span>Similarity Index</span>
                    <span className="stat-val low">12% (Safe)</span>
                  </div>
                  <div className="stat-row">
                    <span>AI-Generated Content</span>
                    <span className="stat-val zero">0% (Human Written)</span>
                  </div>
                  <div className="stat-row">
                    <span>Database Status</span>
                    <span className="stat-val secure">Not Saved (No Repository)</span>
                  </div>
                </div>

                <div className="security-seal">
                  <FiShield className="seal-icon" />
                  <div>
                    <h4>Turnitin Sandbox Shield</h4>
                    <p>Protected by active non-retention policies</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="glowing-orb-1"></div>
            <div className="glowing-orb-2"></div>
          </div>
        </div>
      </section>

      {/* Trust Badges / Key Features Section */}
      <section className="key-pillars-section">
        <div className="section-header">
          <span className="section-tag">Security & Authenticity</span>
          <h2>Why Students and Researchers Trust Turnscan</h2>
          <p>We built Turnscan to provide maximum accuracy while guaranteeing that your work remains exclusively yours.</p>
        </div>

        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon-wrapper">
              <FiShield className="pillar-icon" />
            </div>
            <h3>100% Secure & Confidential</h3>
            <p>
              Your research files are encrypted end-to-end. We maintain a strict no-retention server policy. Files are analyzed in a sandboxed environment and automatically deleted after your check is complete.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-wrapper">
              <FiZap className="pillar-icon" />
            </div>
            <h3>Original Instructor Reports</h3>
            <p>
              We route all document checks through official Turnitin Instructor portals, not third-party API wrapper sites. You receive the exact, authentic PDF reports with identical results to those seen by institutions.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-wrapper">
              <FiDatabase className="pillar-icon" />
            </div>
            <h3>Zero Database Retention</h3>
            <p>
              Every file is submitted under the strict <strong>"No Repository"</strong> setting. This ensures your documents are never saved, indexed, or stored in Turnitin's global databases, preventing future self-plagiarism flags.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="comparison-section">
        <div className="section-header">
          <span className="section-tag">Comparison</span>
          <h2>How Turnscan Compares to Alternatives</h2>
          <p>Don't risk your academic career with cheap API scrapers or unsafe databases.</p>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="highlight-column">Turnscan Service</th>
                <th>Standard Third-Party Checkers</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="feat-title">Report Source</td>
                <td className="highlight-column text-success">
                  <FiCheck className="table-icon check" /> Official Turnitin Instructor Account
                </td>
                <td className="text-danger">
                  <FiCheck className="table-icon err" /> Cheap Third-Party API Wrappers
                </td>
              </tr>
              <tr>
                <td className="feat-title">Database Retention</td>
                <td className="highlight-column text-success">
                  <FiCheck className="table-icon check" /> Guaranteed "No Repository" (Never Saved)
                </td>
                <td className="text-danger">
                  <FiCheck className="table-icon err" /> High risk of indexing & storing documents
                </td>
              </tr>
              <tr>
                <td className="feat-title">AI & Plagiarism Check</td>
                <td className="highlight-column text-success">
                  <FiCheck className="table-icon check" /> Both AI Detection & Similarity (Full PDF)
                </td>
                <td className="text-muted">
                  Only partial checks or basic heuristics
                </td>
              </tr>
              <tr>
                <td className="feat-title">File Privacy</td>
                <td className="highlight-column text-success">
                  <FiCheck className="table-icon check" /> 100% Confidential & Secure Encryption
                </td>
                <td className="text-danger">
                  Files stored or resold to AI training sets
                </td>
              </tr>
              <tr>
                <td className="feat-title">PDF Report Access</td>
                <td className="highlight-column text-success">
                  <FiCheck className="table-icon check" /> Original interactive PDF with full breakdown
                </td>
                <td className="text-muted">
                  Simple text results with no details
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* How it Works */}
      <section className="workflow-section">
        <div className="section-header">
          <span className="section-tag">Easy Process</span>
          <h2>Get Your Report in 3 Simple Steps</h2>
          <p>Our streamlined process takes just minutes from upload to your complete, original reports.</p>
        </div>

        <div className="workflow-steps">
          <div className="step-card">
            <span className="step-num">01</span>
            <h4>Upload Document</h4>
            <p>Upload your draft file (PDF, DOCX, DOC, or TXT) safely through our client dashboard.</p>
          </div>
          <div className="step-card">
            <span className="step-num">02</span>
            <h4>Instructor Check</h4>
            <p>Our checkers process your file using official Turnitin Instructor credentials on the "No Repository" settings.</p>
          </div>
          <div className="step-card">
            <span className="step-num">03</span>
            <h4>Download Original Report</h4>
            <p>Get notified instantly. Access and download the official PDF report containing similarity metrics and AI detection analysis.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="section-header">
          <span className="section-tag">Common Questions</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about our secure checking process.</p>
        </div>

        <div className="faq-grid">
          <div className="faq-item">
            <div className="faq-q">
              <FiHelpCircle className="faq-icon" />
              <h4>Will my school or university know I checked my file here?</h4>
            </div>
            <p className="faq-a">
              Absolutely not. Because we check your document under the "No Repository" setting of our official instructor account, the document is never saved. Turnitin will have no record of this scan when your university conducts their own check later.
            </p>
          </div>

          <div className="faq-item">
            <div className="faq-q">
              <FiHelpCircle className="faq-icon" />
              <h4>What is the difference between Turnscan and other API tools?</h4>
            </div>
            <p className="faq-a">
              Most online checking tools use cheap, unofficial API endpoints that do not query the actual Turnitin database, leading to inaccurate results. Turnscan processes reports via legitimate instructor portals, rendering the exact same results your instructors will see.
            </p>
          </div>

          <div className="faq-item">
            <div className="faq-q">
              <FiHelpCircle className="faq-icon" />
              <h4>Are my documents secure and private?</h4>
            </div>
            <p className="faq-a">
              Yes, 100%. We employ bank-grade encryption for all uploads. Files are processed in a highly secure environment and automatically deleted from our servers as soon as your check is complete. Your intellectual property is completely protected.
            </p>
          </div>

          <div className="faq-item">
            <div className="faq-q">
              <FiHelpCircle className="faq-icon" />
              <h4>How long does it take to get my Turnitin reports?</h4>
            </div>
            <p className="faq-a">
              Most reports are processed and returned in under 15-30 minutes. Our professional checkers are active around the clock to ensure you get your results as fast as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="final-cta-section">
        <div className="cta-card">
          <h2>Ensure Your Work is 100% Ready and Secure</h2>
          <p>Join thousands of students and researchers who rely on Turnscan for authentic Turnitin checks without repository risks.</p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-hero-primary">Get Started Now</Link>
            <Link to="/contact" className="btn btn-hero-secondary">Contact Support</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
