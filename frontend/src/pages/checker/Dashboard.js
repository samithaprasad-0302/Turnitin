import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import '../../styles/dashboard.css';

const CheckerDashboard = ({ user }) => {
  const location = useLocation();

  const [activeMenu, setActiveMenu] = useState('available'); // 'available', 'accepted', 'completed', 'notifications', 'earnings'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Files data
  const [files, setFiles] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);
  const [uploadPanels, setUploadPanels] = useState({});

  // Notifications data
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const MAX_JOBS = 3;

  // Sync active tab with query parameters if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter') || params.get('tab');
    if (filter === 'accepted') {
      setActiveMenu('accepted');
    } else if (filter === 'completed') {
      setActiveMenu('completed');
    } else if (filter === 'notifications') {
      setActiveMenu('notifications');
    } else if (filter === 'earnings') {
      setActiveMenu('earnings');
    } else {
      setActiveMenu('available');
    }
  }, [location.search]);

  // Load checker workload stats & earnings totals
  useEffect(() => {
    fetchStats();
    fetchUnreadCount();
  }, []);

  // Fetch view data dynamically when active tab switches
  useEffect(() => {
    if (activeMenu === 'available' || activeMenu === 'accepted' || activeMenu === 'completed' || activeMenu === 'earnings') {
      fetchFiles(activeMenu === 'earnings' ? 'completed' : activeMenu);
    } else if (activeMenu === 'notifications') {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [activeMenu]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await axios.get('/api/admin/checker-stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchFiles = async (tabType) => {
    setLoadingFiles(true);
    try {
      const endpoint =
        tabType === 'available' ? '/api/files/pending' :
        tabType === 'completed' ? '/api/files/completed' :
                                  '/api/files/accepted';
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await axios.get('/api/notifications?limit=50', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotifications();
      fetchUnreadCount();
      fetchStats();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotifications();
      fetchUnreadCount();
      fetchStats();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleAccept = async (fileId) => {
    if (!window.confirm('Accept this job? You will be Assigned to this document.')) return;
    setAcceptingId(fileId);
    try {
      await axios.post(`/api/files/${fileId}/accept`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setActiveMenu('accepted');
      fetchStats();
    } catch (error) {
      alert('Failed to accept job: ' + (error.response?.data?.message || error.message));
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await axios.get(`/api/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', filename || `file-${fileId}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Download failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const togglePanel = (fileId) => {
    setUploadPanels(prev => ({
      ...prev,
      [fileId]: {
        open:      !prev[fileId]?.open,
        form:      prev[fileId]?.form || {
          ai_report: null, plagiarism_report: null,
        },
        uploading: false,
        msg:       ''
      }
    }));
  };

  const updatePanelForm = (fileId, field, value) => {
    setUploadPanels(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        form: { ...prev[fileId].form, [field]: value }
      }
    }));
  };

  const handleReportUpload = async (fileId) => {
    const panel = uploadPanels[fileId];
    const form  = panel?.form;

    if (!form?.ai_report && !form?.plagiarism_report) {
      setUploadPanels(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], msg: '❌ Please upload at least one report file.' }
      }));
      return;
    }

    setUploadPanels(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], uploading: true, msg: '' }
    }));

    try {
      const fd = new FormData();
      fd.append('file_id', fileId);
      if (form.ai_report)         fd.append('ai_report', form.ai_report);
      if (form.plagiarism_report) fd.append('plagiarism_report', form.plagiarism_report);

      await axios.post('/api/reports/upload', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      await axios.post('/api/reports/mark-completed',
        { file_id: fileId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setUploadPanels(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          uploading: false,
          msg: '✅ Reports uploaded & job marked as completed! Customer has been notified.'
        }
      }));
      
      fetchFiles(activeMenu);
      fetchStats();
    } catch (error) {
      setUploadPanels(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          uploading: false,
          msg: '❌ ' + (error.response?.data?.message || error.message)
        }
      }));
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    return (kb / 1024).toFixed(2) + ' MB';
  };

  const renderJobCard = (file) => {
    const panel = uploadPanels[file.id] || {};
    const isAccepting = acceptingId === file.id;
    const atLimit = (stats?.accepted_jobs || 0) >= MAX_JOBS;

    return (
      <div key={file.id} className={`job-card${file.dispute_status === 'reported' && activeMenu === 'accepted' ? ' job-card-disputed' : ''}`}>

        {activeMenu === 'accepted' && file.dispute_status === 'reported' && (
          <div className="dispute-alert-banner">
            <div className="dispute-alert-icon">🚨</div>
            <div className="dispute-alert-body">
              <strong>Customer Reported Wrong Files!</strong>
              <p>The customer says the uploaded reports are incorrect. Please re-upload the correct files immediately using the <em>Upload Reports</em> button below.</p>
            </div>
          </div>
        )}

        <div className="job-card-header">
          <h3>{file.title || file.original_file}</h3>
          <span className={`file-type-badge type-${(file.file_type || 'file').toLowerCase()}`}>
            {file.file_type || 'FILE'}
          </span>
        </div>

        <div className="job-meta">
          <span className="meta-item">📄 UID: {file.uid}</span>
          <span className="meta-item">👤 {file.customer_name}</span>
          <span className="meta-item">🔧 {file.service_type.replace(/_/g, ' ')}</span>
          <span className="meta-item">📦 {formatBytes(file.file_size)}</span>
          <span className="meta-item">📅 {new Date(file.upload_date).toLocaleString()}</span>
        </div>

        <div className="job-status-row">
          <span className={`badge badge-status-${file.status}`}>{file.status}</span>
        </div>

        <div className="job-actions">
          {activeMenu === 'available' && (
            <button
              onClick={() => handleAccept(file.id)}
              className={`btn btn-block ${atLimit ? 'btn-secondary' : 'btn-success'}`}
              disabled={isAccepting || atLimit}
              title={atLimit ? 'Complete your current 3 jobs before accepting new ones' : ''}
            >
              {isAccepting ? '⏳ Accepting...' : atLimit ? '🔒 Slot Full' : '✅ Accept Job'}
            </button>
          )}

          {activeMenu === 'accepted' && (
            <>
              <button
                onClick={() => handleDownload(file.id, file.original_filename || file.original_file)}
                className="btn btn-sm btn-info"
              >
                📥 Download Document
              </button>
              <button
                onClick={() => togglePanel(file.id)}
                className="btn btn-sm btn-primary"
              >
                📤 {panel.open ? 'Hide Upload' : 'Upload Reports'}
              </button>
            </>
          )}
        </div>

        {activeMenu === 'available' && (
          <p className="accept-hint">
            ⚠️ You must accept this job to download and work on the document.
          </p>
        )}

        {activeMenu === 'accepted' && panel.open && (
          <div className="report-upload-panel">
            <h4>Upload Report Documents</h4>
            <div className="report-upload-grid">
              <div className="form-group">
                <label>AI Report File (PDF / DOCX)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={e => updatePanelForm(file.id, 'ai_report', e.target.files[0])}
                />
              </div>
              <div className="form-group">
                <label>Plagiarism Report File (PDF / DOCX)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={e => updatePanelForm(file.id, 'plagiarism_report', e.target.files[0])}
                />
              </div>
            </div>
            {panel.msg && (
              <div className={`message ${panel.msg.startsWith('✅') ? 'success' : 'error'}`}>
                {panel.msg}
              </div>
            )}
            <button
              className="btn btn-primary"
              disabled={panel.uploading}
              onClick={() => handleReportUpload(file.id)}
            >
              {panel.uploading ? '⏳ Uploading...' : '🚀 Submit Reports & Complete Job'}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loadingStats) return <div className="loading">Loading dashboard...</div>;

  const normalAccepted = files.filter(f => f.dispute_status !== 'reported');
  const disputed = files.filter(f => f.dispute_status === 'reported');

  return (
    <div className="portal-container">
      {/* Sidebar navigation plane */}
      <div className="portal-sidebar">
        <div className="portal-sidebar-header">
          <h2>Welcome, {user?.name}!</h2>
          <p>Checker Portal</p>
        </div>

        <ul className="portal-menu">
          <li>
            <button
              onClick={() => setActiveMenu('available')}
              className={`portal-menu-item ${activeMenu === 'available' ? 'active' : ''}`}
            >
              📋 Available Jobs
              <span className="portal-menu-badge">{stats?.available_jobs || 0}</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('accepted')}
              className={`portal-menu-item ${activeMenu === 'accepted' ? 'active' : ''}`}
            >
              ✅ My Accepted Jobs
              <span className="portal-menu-badge">{stats?.accepted_jobs || 0}</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('completed')}
              className={`portal-menu-item ${activeMenu === 'completed' ? 'active' : ''}`}
            >
              ✔️ Completed Jobs
              <span className="portal-menu-badge">{stats?.completed_jobs || 0}</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('earnings')}
              className={`portal-menu-item ${activeMenu === 'earnings' ? 'active' : ''}`}
            >
              💰 Earnings & Payouts
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('notifications')}
              className={`portal-menu-item ${activeMenu === 'notifications' ? 'active' : ''}`}
            >
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="portal-menu-badge active">{unreadCount}</span>
              )}
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="portal-content">
        {activeMenu !== 'completed' && activeMenu !== 'earnings' && activeMenu !== 'notifications' && (
          <div className="stats-grid compact" style={{ marginBottom: '20px' }}>
            <div
              className="stat-card"
              onClick={() => setActiveMenu('available')}
              style={{ cursor: 'pointer' }}
              title="View Available Jobs"
            >
              <h3>Available Jobs</h3>
              <p className="stat-value">{stats?.available_jobs || 0}</p>
            </div>
            <div
              className="stat-card"
              onClick={() => setActiveMenu('accepted')}
              style={{ cursor: 'pointer' }}
              title="View My Accepted Jobs"
            >
              <h3>Accepted Jobs</h3>
              <p className="stat-value">{stats?.accepted_jobs || 0}</p>
            </div>
            <div
              className="stat-card"
              onClick={() => setActiveMenu('completed')}
              style={{ cursor: 'pointer' }}
              title="View Completed Jobs"
            >
              <h3>Completed Jobs</h3>
              <p className="stat-value">{stats?.completed_jobs || 0}</p>
            </div>
          </div>
        )}

        {activeMenu === 'available' && (
          <>
            <div className="portal-content-header">
              <h1>Available Jobs</h1>
            </div>

            {/* Capacity banner */}
            <div className={`capacity-banner ${(stats?.accepted_jobs || 0) >= MAX_JOBS ? 'capacity-full' : (stats?.accepted_jobs || 0) > 0 ? 'capacity-partial' : 'capacity-free'}`}>
              <span className="capacity-icon">
                {(stats?.accepted_jobs || 0) >= MAX_JOBS ? '🔒' : (stats?.accepted_jobs || 0) > 0 ? '⚡' : '✅'}
              </span>
              <span className="capacity-text">
                <strong>{stats?.accepted_jobs || 0} / {MAX_JOBS}</strong> active job slots used
                {(stats?.accepted_jobs || 0) >= MAX_JOBS
                  ? ' — Complete your current jobs to accept new ones.'
                  : ` — You can accept ${MAX_JOBS - (stats?.accepted_jobs || 0)} more job${MAX_JOBS - (stats?.accepted_jobs || 0) !== 1 ? 's' : ''}.`
                }
              </span>
            </div>

            {loadingFiles ? (
              <div className="loading">Loading files...</div>
            ) : files.length === 0 ? (
              <div className="empty-state">
                <p>📭 No available jobs at the moment.</p>
              </div>
            ) : (
              <div className="jobs-grid">
                {files.map(renderJobCard)}
              </div>
            )}
          </>
        )}

        {activeMenu === 'accepted' && (
          <>
            <div className="portal-content-header">
              <h1>My Accepted Jobs</h1>
            </div>

            {loadingFiles ? (
              <div className="loading">Loading files...</div>
            ) : files.length === 0 ? (
              <div className="empty-state">
                <p>📋 You have no accepted jobs.</p>
              </div>
            ) : (
              <>
                {/* My Accepted Jobs section */}
                <div className="jobs-section">
                  <h2 className="section-title">Active Assigned Jobs ({normalAccepted.length})</h2>
                  {normalAccepted.length === 0 ? (
                    <p className="no-jobs-hint">No active assigned jobs.</p>
                  ) : (
                    <div className="jobs-grid">
                      {normalAccepted.map(renderJobCard)}
                    </div>
                  )}
                </div>

                {/* Wrong File Alerts section */}
                {disputed.length > 0 && (
                  <div className="jobs-section dispute-section-wrapper">
                    <div className="dispute-section-header">
                      <span className="dispute-header-icon">🚨</span>
                      <div className="dispute-header-text">
                        <h2>Wrong File Alerts <span className="dispute-count-badge">{disputed.length}</span></h2>
                        <p>The customer has flagged the following jobs — please re-upload the correct report files immediately.</p>
                      </div>
                    </div>
                    <div className="jobs-grid">
                      {disputed.map(renderJobCard)}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeMenu === 'completed' && (
          <>
            <div className="portal-content-header">
              <h1>Completed Jobs</h1>
            </div>

            {loadingFiles ? (
              <div className="loading">Loading files...</div>
            ) : files.filter(file => parseInt(file.checker_paid, 10) === 0).length === 0 ? (
              <div className="empty-state">
                <p>🎉 No completed jobs yet.</p>
              </div>
            ) : (
              <div className="jobs-grid">
                {files.filter(file => parseInt(file.checker_paid, 10) === 0).map(file => (
                  <div key={file.id} className="job-card job-card-completed">
                    <div className="job-card-header">
                      <h3>{file.title || file.original_file}</h3>
                      <span className={`file-type-badge type-${(file.file_type || 'file').toLowerCase()}`}>
                        {file.file_type || 'FILE'}
                      </span>
                    </div>

                    <div className="job-meta">
                      <span className="meta-item">📄 UID: {file.uid}</span>
                      <span className="meta-item">👤 {file.customer_name}</span>
                      <span className="meta-item">🔧 {file.service_type.replace(/_/g, ' ')}</span>
                      <span className="meta-item">📦 {formatBytes(file.file_size)}</span>
                      <span className="meta-item">📅 {new Date(file.upload_date).toLocaleString()}</span>
                    </div>

                    <div className="job-status-row">
                      <span className="badge badge-status-completed">✅ Completed</span>
                      {file.dispute_status === 'resolved' && (
                        <span className="dispute-badge resolved">🔁 Re-uploaded</span>
                      )}
                    </div>

                    <div className="completed-files-info">
                      {file.ai_report && (
                        <span className="completed-file-chip">🤖 AI Report uploaded</span>
                      )}
                      {file.plagiarism_report && (
                        <span className="completed-file-chip">📋 Plagiarism Report uploaded</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeMenu === 'notifications' && (
          <>
            <div className="portal-content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1>Notifications</h1>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllAsRead} className="btn btn-sm btn-primary">
                  Mark All as Read
                </button>
              )}
            </div>

            {loadingNotifications ? (
              <div className="loading">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <p>No notifications yet.</p>
            ) : (
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  >
                    <div className="notification-content">
                      <h3>{notification.title}</h3>
                      <p>{notification.message}</p>
                      <small>{new Date(notification.created_at).toLocaleString()}</small>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="btn btn-sm btn-outline"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeMenu === 'earnings' && (
          <>
            <div className="portal-content-header">
              <h1>Earnings & Payouts</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '15px' }}>
              <div style={{ padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Unpaid Completed Jobs</span>
                <p style={{ fontSize: '32px', fontWeight: '800', margin: '15px 0 0', color: '#0f172a' }}>{stats?.unpaid_completed_jobs || 0}</p>
              </div>
              <div style={{ padding: '25px', borderRadius: '12px', border: '1px solid #bbf7d0', background: '#f0fdf4', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '13px', color: '#166534', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Due Balance (Unpaid)</span>
                <p style={{ fontSize: '32px', fontWeight: '800', margin: '15px 0 0', color: '#15803d' }}>${parseFloat(stats?.due_amount || 0).toFixed(2)}</p>
              </div>
            </div>
            <div style={{ marginTop: '30px', padding: '20px', borderRadius: '8px', background: '#f8fafc', borderLeft: '4px solid #94a3b8' }}>
              <h3 style={{ fontSize: '14px', margin: '0 0 8px', color: '#334155' }}>Payout Rules & Information</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                Checkers are assigned to check uploaded documents and receive a flat fee of <strong>$0.60 per file</strong> completed successfully.
                Payouts are processed daily by the administrator and are credited directly. Once a payout is completed, your unpaid counts will be reset.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckerDashboard;
