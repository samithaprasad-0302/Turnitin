import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import './styles/App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerUpload from './pages/customer/Upload';
import CustomerFiles from './pages/customer/Files';
import CheckerDashboard from './pages/checker/Dashboard';
import CheckerJobs from './pages/checker/Jobs';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import Notifications from './pages/Notifications';
import SharedUpload from './pages/SharedUpload';

import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Helper component to hide Navbar on shared portals
function Navigation({ user, onLogout }) {
  const location = useLocation();
  if (location.pathname.startsWith('/shared/')) {
    return null;
  }
  return <Navbar user={user} onLogout={onLogout} />;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    checkMaintenance();
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const checkMaintenance = async () => {
    try {
      const response = await axios.get('/api/system/settings');
      setMaintenance(response.data.maintenance_mode);
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error);
    } finally {
      setCheckingMaintenance(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      // Short-polling mode for local development (keeps PHP thread unlocked)
      let lastFilesState = null;
      let lastNotificationCount = null;
      let lastCommentsCount = null;
      let isFirstCheck = true;

      const checkRealtime = async () => {
        try {
          const response = await axios.get('/api/realtime?poll=true', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const { filesState, notificationCount, commentsCount } = response.data;

          let hasChanges = false;
          if (lastFilesState !== filesState) {
            if (!isFirstCheck) hasChanges = true;
            lastFilesState = filesState;
          }
          if (lastNotificationCount !== notificationCount) {
            if (!isFirstCheck) hasChanges = true;
            lastNotificationCount = notificationCount;
          }
          if (lastCommentsCount !== commentsCount) {
            if (!isFirstCheck) hasChanges = true;
            lastCommentsCount = commentsCount;
          }

          if (isFirstCheck) {
            isFirstCheck = false;
          } else if (hasChanges) {
            window.dispatchEvent(new CustomEvent('realtime-update', { detail: { type: 'update' } }));
          }
        } catch (err) {
          console.error('Real-time poll failed:', err);
        }
      };

      // Poll every 3 seconds in dev
      checkRealtime();
      const interval = setInterval(checkRealtime, 3000);
      return () => clearInterval(interval);
    } else {
      // SSE (EventSource) mode for production (multi-threaded servers)
      const sseUrl = `${apiUrl}/realtime?token=${token}`;
      let eventSource = null;
      let reconnectTimeout = null;

      const connectRealtime = () => {
        if (eventSource) {
          eventSource.close();
        }

        eventSource = new EventSource(sseUrl);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'update') {
              window.dispatchEvent(new CustomEvent('realtime-update', { detail: data }));
            }
          } catch (err) {
            console.error('SSE JSON parse error:', err);
          }
        };

        eventSource.onerror = (err) => {
          eventSource.close();
          reconnectTimeout = setTimeout(connectRealtime, 5000);
        };
      };

      connectRealtime();

      return () => {
        if (eventSource) {
          eventSource.close();
        }
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
      };
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    checkMaintenance();
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const response = await axios.post('/api/auth/login', {
        email: adminEmail,
        password: adminPassword
      });

      const loggedUser = response.data.user;
      if (loggedUser.role !== 'admin') {
        setLoginError('Access denied: System is under maintenance. Only administrators can log in.');
        return;
      }

      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setUser(loggedUser);
      setShowAdminLogin(false);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoggingIn(false);
    }
  };

  if (checkingMaintenance || loading || showSplash) {
    return (
      <div className="splash-container">
        <div className="splash-content">
          <div className="splash-logo-wrapper">
            <div className="splash-logo-glow"></div>
            <svg
              className="splash-logo"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.0"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="splash-title">Turnscan</h1>
          <span className="splash-subtitle">by zytech 360</span>
          <div className="splash-loader-bar">
            <div className="splash-loader-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  if (maintenance && (!user || user.role !== 'admin')) {
    return (
      <div className="maintenance-container">
        <style>{`
          .maintenance-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            font-family: 'Inter', sans-serif;
            color: #f8fafc;
            padding: 20px;
            box-sizing: border-box;
          }
          .maintenance-card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 40px;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
            text-align: center;
            animation: fadeIn 0.6s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .maintenance-icon {
            font-size: 56px;
            margin-bottom: 24px;
            animation: spin 8s infinite linear;
            display: inline-block;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .maintenance-card h1 {
            font-size: 28px;
            font-weight: 800;
            margin: 0 0 16px;
            letter-spacing: -0.5px;
            background: linear-gradient(to right, #f8fafc, #cbd5e1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .maintenance-card p {
            color: #94a3b8;
            font-size: 15px;
            line-height: 1.6;
            margin: 0 0 30px;
          }
          .maintenance-badge {
            display: inline-block;
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.3);
            font-size: 12px;
            font-weight: 700;
            padding: 6px 14px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 20px;
          }
          .admin-login-link {
            background: transparent;
            border: none;
            color: #64748b;
            font-size: 13px;
            cursor: pointer;
            text-decoration: underline;
            transition: color 0.2s;
            margin-top: 15px;
          }
          .admin-login-link:hover {
            color: #cbd5e1;
          }
          .form-group-maint {
            margin-bottom: 16px;
            text-align: left;
          }
          .form-group-maint label {
            display: block;
            font-size: 12px;
            color: #94a3b8;
            font-weight: 600;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .form-group-maint input {
            width: 100%;
            padding: 12px;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: white;
            font-size: 14px;
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.2s;
          }
          .form-group-maint input:focus {
            border-color: #3b82f6;
          }
          .btn-maint-login {
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
            margin-top: 10px;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
            transition: background-color 0.2s;
          }
          .btn-maint-login:hover {
            background: #1d4ed8;
          }
          .btn-maint-login:disabled {
            background: #1e3a8a;
            color: #64748b;
            cursor: not-allowed;
          }
          .error-maint {
            color: #ef4444;
            font-size: 13px;
            margin-bottom: 12px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            padding: 8px;
            border-radius: 6px;
          }
        `}</style>
        <div className="maintenance-card">
          {!showAdminLogin ? (
            <>
              <div className="maintenance-badge">⚠️ Offline</div>
              <div className="maintenance-icon">⚙️</div>
              <h1>Under Maintenance</h1>
              <p>
                Our Turnscan portal is temporarily undergoing scheduled maintenance to improve services. We apologize for the inconvenience and will be back shortly.
              </p>
              <button className="admin-login-link" onClick={() => setShowAdminLogin(true)}>
                Sign In as Administrator
              </button>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', textAlign: 'center' }}>Admin Access Only</h2>
              {loginError && <div className="error-maint">{loginError}</div>}
              <form onSubmit={handleAdminLogin}>
                <div className="form-group-maint">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    required
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="form-group-maint">
                  <label>Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-maint-login" disabled={loggingIn}>
                  {loggingIn ? 'Signing In...' : 'Verify & Enter Dashboard'}
                </button>
              </form>
              <button className="admin-login-link" onClick={() => setShowAdminLogin(false)}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Navigation user={user} onLogout={handleLogout} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/shared/:token" element={<SharedUpload />} />

        {/* Global/Shared Private Routes */}
        <Route
          path="/notifications"
          element={<PrivateRoute><Notifications /></PrivateRoute>}
        />

        {/* Customer Routes */}
        <Route
          path="/customer/dashboard"
          element={<PrivateRoute><CustomerDashboard user={user} /></PrivateRoute>}
        />
        <Route
          path="/customer/upload"
          element={<PrivateRoute><CustomerUpload /></PrivateRoute>}
        />
        <Route
          path="/customer/files"
          element={<PrivateRoute><CustomerFiles /></PrivateRoute>}
        />

        {/* Checker Routes */}
        <Route
          path="/checker/dashboard"
          element={<PrivateRoute><CheckerDashboard user={user} /></PrivateRoute>}
        />
        <Route
          path="/checker/jobs"
          element={<PrivateRoute><CheckerJobs /></PrivateRoute>}
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={<PrivateRoute><AdminDashboard user={user} /></PrivateRoute>}
        />
        <Route
          path="/admin/users"
          element={<PrivateRoute><AdminUsers /></PrivateRoute>}
        />
      </Routes>
    </Router>
  );
}

export default App;
