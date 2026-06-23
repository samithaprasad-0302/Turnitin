import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/auth.css';

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setUser(response.data.user);

      // Redirect based on role
      const dashboard = {
        customer: '/customer/dashboard',
        checker: '/checker/dashboard',
        admin: '/admin/dashboard'
      };

      navigate(dashboard[response.data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        {/* Detailed Info Column */}
        <div className="auth-info-column">
          <div className="auth-info-content">
            <h3>Turnscan Security</h3>
            <p className="auth-info-subtitle">Our secure verification guarantees:</p>
            
            <div className="info-list">
              <div className="info-list-item">
                <span className="info-list-icon">🛡️</span>
                <div className="info-list-text">
                  <strong>100% Secure & Private</strong>
                  <span>Encrypted sandbox analysis</span>
                </div>
              </div>

              <div className="info-list-item">
                <span className="info-list-icon">🏫</span>
                <div className="info-list-text">
                  <strong>Official Accounts Only</strong>
                  <span>Official instructor channels</span>
                </div>
              </div>

              <div className="info-list-item">
                <span className="info-list-icon">💾</span>
                <div className="info-list-text">
                  <strong>No Repository Settings</strong>
                  <span>Your papers are never indexed</span>
                </div>
              </div>

              <div className="info-list-item">
                <span className="info-list-icon">⚡</span>
                <div className="info-list-text">
                  <strong>15-30 Min Delivery</strong>
                  <span>Express report generation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="auth-form-column">
          <div className="auth-form">
            <h2>Login</h2>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="auth-link">
              Self-registration is disabled. Contact your administrator to request an account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
