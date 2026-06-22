import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import '../../styles/dashboard.css';
import '../../styles/forms.css';
import '../../styles/list.css';

const CustomerDashboard = ({ user }) => {
  const location = useLocation();

  const [activeMenu, setActiveMenu] = useState('upload'); // 'upload', 'pending', 'completed', 'notifications'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Files data
  const [files, setFiles] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const [disputingId, setDisputingId] = useState(null);

  // Upload data
  const [formData, setFormData] = useState({ service_type: 'both' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Notifications data
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync active tab with query parameters if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('tab') || params.get('filter');
    if (filter === 'pending') {
      setActiveMenu('pending');
    } else if (filter === 'completed') {
      setActiveMenu('completed');
    } else if (filter === 'notifications') {
      setActiveMenu('notifications');
    } else {
      setActiveMenu('upload');
    }
  }, [location.search]);

  // Load customer statistics
  useEffect(() => {
    fetchStats();
    fetchUnreadCount();
  }, []);

  // Fetch view data dynamically when active tab switches
  useEffect(() => {
    if (activeMenu === 'pending' || activeMenu === 'completed' || activeMenu === 'payments') {
      fetchFiles();
    } else if (activeMenu === 'notifications') {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [activeMenu]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await axios.get('/api/admin/customer-stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await axios.get('/api/files/my-files', {
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
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Upload handlers
  const handleUploadChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const ext = selected.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setUploadMessage('Only PDF (.pdf) and Word (.docx) files are accepted.');
      e.target.value = '';
      setUploadFile(null);
      return;
    }
    setUploadMessage('');
    setUploadFile(selected);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadMessage('');

    const uploadFormData = new FormData();
    uploadFormData.append('service_type', formData.service_type);
    uploadFormData.append('file', uploadFile);

    try {
      await axios.post('/api/files/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUploadMessage('File uploaded successfully!');
      setFormData({ service_type: 'both' });
      setUploadFile(null);
      // Reset input element value
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // Update statistics
      fetchStats();
    } catch (error) {
      setUploadMessage('Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  // Files tab handlers
  const handleDownloadReport = async (fileId, reportType) => {
    try {
      const response = await axios.get(`/api/reports/${fileId}/download/${reportType}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      const disposition = response.headers['content-disposition'] || '';
      const match       = disposition.match(/filename="?([^"]+)"?/);
      const filename    = match ? match[1] : `${reportType}-report-${fileId}`;
      triggerDownload(response.data, filename);
    } catch (error) {
      alert('Download failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const triggerDownload = (data, filename) => {
    const url  = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleCancel = async (fileId) => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setCancellingId(fileId);
    try {
      await axios.post(`/api/files/${fileId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'cancelled' } : f));
      fetchStats();
    } catch (error) {
      alert('Cancel failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setCancellingId(null);
    }
  };

  const handleDispute = async (fileId) => {
    if (!window.confirm(
      'Report a problem with these reports to the checker?\n\n' +
      'A fixed system alert will be sent to the checker asking them to re-upload the correct files. ' +
      'You cannot send a custom message.'
    )) return;

    setDisputingId(fileId);
    try {
      await axios.post(`/api/files/${fileId}/dispute`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, dispute_status: 'reported' } : f)
      );
      alert('✅ Alert sent. The checker has been notified to re-upload the correct reports.');
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setDisputingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending:     'badge-warning',
      accepted:    'badge-info',
      in_progress: 'badge-primary',
      completed:   'badge-success',
      cancelled:   'badge-secondary'
    };
    return badges[status] || 'badge-secondary';
  };

  if (loadingStats) return <div className="loading">Loading dashboard...</div>;

  const pendingFiles = files.filter(file => ['pending', 'accepted', 'in_progress'].includes(file.status));
  const completedFiles = files.filter(file => file.status === 'completed' && parseInt(file.customer_paid, 10) === 0);

  const fileLimit = stats?.file_limit || 10;
  const unpaidCount = stats?.unpaid_completed_count || 0;
  const remainingChecks = Math.max(0, fileLimit - unpaidCount);
  const limitReached = unpaidCount >= fileLimit;

  return (
    <div className="portal-container">
      <style>{`
        .billing-banner-container {
          width: 100%;
          margin-bottom: 24px;
        }
        .billing-alert-card {
          display: flex;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 10px;
          border: 1px solid;
          align-items: flex-start;
          text-align: left;
        }
        .billing-alert-card.limit-reached {
          background-color: #fdf2f2;
          border-color: #f5b7b1;
          color: #c0392b;
        }
        .billing-alert-card.limit-warning {
          background-color: #fff9e6;
          border-color: #fbe599;
          color: #b25e00;
        }
        .alert-icon {
          font-size: 24px;
          line-height: 1;
        }
        .alert-body h3 {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 700;
        }
        .alert-body p {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .billing-status-bar {
          display: flex;
          gap: 20px;
          padding: 12px 20px;
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          flex-wrap: wrap;
        }
        .billing-status-bar .status-item {
          font-size: 13.5px;
          color: #64748b;
          display: flex;
          gap: 6px;
        }
        .billing-status-bar .status-val {
          color: #0f172a;
          font-weight: 600;
        }
        .billing-status-bar .status-val.font-bold {
          color: #0f172a;
          font-weight: 800;
        }
        .payments-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .billing-summary-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          text-align: left;
        }
        .billing-summary-card h2 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 18px;
          color: #0f172a;
          font-weight: 700;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 16px;
        }
        .summary-item {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        .summary-item .label {
          display: block;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 6px;
        }
        .summary-item .val {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }
        .summary-item .val.highlight {
          color: #c0392b;
        }
        .unpaid-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 28px 0 12px;
        }
      `}</style>

      {/* Sidebar navigation plane */}
      <div className="portal-sidebar">
        <div className="portal-sidebar-header">
          <h2>Welcome, {user?.name}!</h2>
          <p>Customer Portal</p>
        </div>

        <ul className="portal-menu">
          <li>
            <button
              onClick={() => setActiveMenu('upload')}
              className={`portal-menu-item ${activeMenu === 'upload' ? 'active' : ''}`}
            >
              📤 Upload File
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('pending')}
              className={`portal-menu-item ${activeMenu === 'pending' ? 'active' : ''}`}
            >
              ⏳ Pending Files
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('completed')}
              className={`portal-menu-item ${activeMenu === 'completed' ? 'active' : ''}`}
            >
              ✔️ Completed Files
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('payments')}
              className={`portal-menu-item ${activeMenu === 'payments' ? 'active' : ''}`}
            >
              💳 Payments
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
        {/* Billing metrics and warning banners are now in the dedicated Payments tab */}

        {/* Workload Stats cards at the top of the main content area */}
        {activeMenu !== 'completed' && activeMenu !== 'payments' && activeMenu !== 'notifications' && (
          <div className="stats-grid compact" style={{ marginBottom: '20px' }}>
            <div
              className="stat-card"
              onClick={() => setActiveMenu('pending')}
              style={{ cursor: 'pointer' }}
              title="View Pending Files"
            >
              <h3>Total Uploads</h3>
              <p className="stat-value">{stats?.total_uploads || 0} / {fileLimit}</p>
            </div>
            <div
              className="stat-card"
              onClick={() => setActiveMenu('pending')}
              style={{ cursor: 'pointer' }}
              title="View Pending Files"
            >
              <h3>Pending Files</h3>
              <p className="stat-value">{stats?.pending || 0}</p>
            </div>
            <div
              className="stat-card"
              onClick={() => setActiveMenu('completed')}
              style={{ cursor: 'pointer' }}
              title="View Completed Files"
            >
              <h3>Completed Files</h3>
              <p className="stat-value">{stats?.completed || 0}</p>
            </div>
          </div>
        )}

        {activeMenu === 'upload' && (
          <div className="upload-container" style={{ padding: '0', maxWidth: '600px' }}>
            <div className="portal-content-header">
              <h1>Upload Document</h1>
            </div>

            {uploadMessage && (
              <div className={`message ${uploadMessage.includes('successfully') ? 'success' : 'error'}`}>
                {uploadMessage}
              </div>
            )}

            {limitReached && (
              <div className="message error">
                🚨 Uploads are currently blocked. Settle your due balance of LKR {parseFloat(stats?.due_amount || 0).toFixed(2)} to reset your limit.
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="upload-form">
              <div className="form-group">
                <label>Service Type</label>
                <select 
                  name="service_type" 
                  value={formData.service_type} 
                  onChange={handleUploadChange}
                  disabled={limitReached || uploading}
                >
                  <option value="ai_detection">AI Detection Only</option>
                  <option value="plagiarism_check">Plagiarism Check Only</option>
                  <option value="both">Both (AI + Plagiarism)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Select File <span className="file-type-hint">(PDF or DOCX only)</span></label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  accept=".pdf,.docx"
                  disabled={limitReached || uploading}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={uploading || limitReached}>
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>
        )}


        {activeMenu === 'pending' && (
          <>
            <div className="portal-content-header">
              <h1>Pending Files</h1>
            </div>

            {loadingFiles ? (
              <div className="loading">Loading files...</div>
            ) : pendingFiles.length === 0 ? (
              <p>No pending files at the moment. Select the "Upload File" tab to upload one.</p>
            ) : (
              <div className="files-table">
                <table>
                  <thead>
                    <tr>
                      <th>File ID</th>
                      <th>File Name</th>
                      <th>Service Type</th>
                      <th>Status</th>
                      <th>Upload Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingFiles.map(file => (
                      <tr key={file.id}>
                        <td><code style={{ color: '#2563eb', fontWeight: 600 }}>{file.uid}</code></td>
                        <td>{file.title || file.original_filename || file.original_file}</td>
                        <td>{file.service_type.replace(/_/g, ' ')}</td>
                        <td>
                          <div className="status-cell">
                            <span className={`badge ${getStatusBadge(file.status)}`}>
                              {file.status}
                            </span>
                          </div>
                        </td>
                        <td>{new Date(file.upload_date).toLocaleString()}</td>

                        {/* Actions */}
                        <td>
                          <div className="file-action-buttons">
                            {file.status === 'pending' && (
                              <button
                                onClick={() => handleCancel(file.id)}
                                className="btn btn-sm btn-danger"
                                disabled={cancellingId === file.id}
                              >
                                {cancellingId === file.id ? 'Cancelling...' : '✕ Cancel Order'}
                              </button>
                            )}
                            {file.status !== 'pending' && (
                              <span style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                                File is assigned and in check
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeMenu === 'completed' && (
          <>
            <div className="portal-content-header">
              <h1>Completed Files</h1>
            </div>

            {loadingFiles ? (
              <div className="loading">Loading files...</div>
            ) : completedFiles.length === 0 ? (
              <p>No completed files yet. Your documents are being checked.</p>
            ) : (
              <div className="files-table">
                <table>
                  <thead>
                    <tr>
                      <th>File ID</th>
                      <th>File Name</th>
                      <th>Service Type</th>
                      <th>Status</th>
                      <th>Upload Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedFiles.map(file => (
                      <tr key={file.id}>
                        <td><code style={{ color: '#2563eb', fontWeight: 600 }}>{file.uid}</code></td>
                        <td>{file.title || file.original_filename || file.original_file}</td>
                        <td>{file.service_type.replace(/_/g, ' ')}</td>
                        <td>
                          <div className="status-cell">
                            <span className={`badge ${getStatusBadge(file.status)}`}>
                              {file.status}
                            </span>
                            {/* Dispute status indicator */}
                            {file.dispute_status === 'reported' && (
                              <span className="dispute-badge reported" title="Wrong file reported — awaiting checker re-upload">
                                ⚠️ Reported
                              </span>
                            )}
                            {file.dispute_status === 'resolved' && (
                              <span className="dispute-badge resolved" title="Checker has re-uploaded corrected files">
                                ✅ Re-uploaded
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{new Date(file.upload_date).toLocaleString()}</td>

                        {/* Actions */}
                        <td>
                          <div className="file-action-buttons">
                            <>
                              {(file.service_type === 'ai_detection' || file.service_type === 'both') && (
                                <button
                                  onClick={() => handleDownloadReport(file.id, 'ai')}
                                  className="btn btn-sm btn-primary"
                                  title="Download AI Detection Report"
                                >
                                  🤖 AI Report
                                </button>
                              )}
                              {(file.service_type === 'plagiarism_check' || file.service_type === 'both') && (
                                <button
                                  onClick={() => handleDownloadReport(file.id, 'plagiarism')}
                                  className="btn btn-sm btn-success"
                                  title="Download Plagiarism Report"
                                >
                                  📋 Plagiarism Report
                                </button>
                              )}

                              {file.dispute_status !== 'reported' && (
                                <button
                                  onClick={() => handleDispute(file.id)}
                                  className="btn btn-sm btn-dispute"
                                  disabled={disputingId === file.id}
                                  title="Report a problem with the received report files"
                                >
                                  {disputingId === file.id ? 'Sending...' : '⚠️ Report a Problem'}
                                </button>
                              )}

                              {file.dispute_status === 'reported' && (
                                <span className="dispute-waiting">
                                  Awaiting correction…
                                </span>
                              )}
                            </>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeMenu === 'payments' && (
          <div className="payments-dashboard">
            <div className="portal-content-header">
              <h1>💳 Payments</h1>
            </div>

            {/* Warning Banner inside the Payments section */}
            {stats && (limitReached || (unpaidCount > 0 && remainingChecks <= 3)) && (
              <div className="billing-banner-container" style={{ margin: 0 }}>
                {limitReached ? (
                  <div className="billing-alert-card limit-reached">
                    <div className="alert-icon">🛑</div>
                    <div className="alert-body">
                      <h3>Upload Limit Reached ({unpaidCount} / {fileLimit} files checked)</h3>
                      <p>You have reached your file check limit. Please make the payment of your outstanding balance of <strong>LKR {parseFloat(stats.due_amount).toFixed(2)}</strong> with the administrator to reset your check limit and resume uploading new documents.</p>
                    </div>
                  </div>
                ) : (
                  <div className="billing-alert-card limit-warning">
                    <div className="alert-icon">⚠️</div>
                    <div className="alert-body">
                      <h3>Approaching Limit ({unpaidCount} / {fileLimit} files checked)</h3>
                      <p>You have <strong>{remainingChecks}</strong> check{remainingChecks === 1 ? '' : 's'} remaining before you hit your check limit. Settle your outstanding balance of <strong>LKR {parseFloat(stats.due_amount).toFixed(2)}</strong> soon to prevent uploads from being blocked.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="billing-summary-card">
              <h2>Billing Summary</h2>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="label">Rate Per File Check</span>
                  <span className="val">LKR {parseFloat(stats?.per_file_charge || 0).toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Unpaid Completed Checks</span>
                  <span className="val">{unpaidCount} / {fileLimit}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Outstanding Due Amount</span>
                  <span className="val highlight">LKR {parseFloat(stats?.due_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="unpaid-title">📄 Files Comprising Current Balance</div>
              {loadingFiles ? (
                <div className="loading">Loading files...</div>
              ) : files.filter(f => f.status === 'completed' && f.customer_paid === 0).length === 0 ? (
                <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '14px', marginTop: '10px' }}>No unpaid completed checks. You are up to date!</p>
              ) : (
                <div className="files-table" style={{ marginTop: '10px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>File ID</th>
                        <th>File Name</th>
                        <th>Completed Date</th>
                        <th>Charge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.filter(f => f.status === 'completed' && f.customer_paid === 0).map(file => (
                        <tr key={file.id}>
                          <td><code style={{ color: '#2563eb', fontWeight: 600 }}>{file.uid}</code></td>
                          <td>{file.title || file.original_filename || file.original_file}</td>
                          <td>{file.completed_at ? new Date(file.completed_at).toLocaleString() : new Date(file.upload_date).toLocaleString()}</td>
                          <td><strong>LKR {parseFloat(stats?.per_file_charge || 0).toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>


          </div>
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
      </div>
    </div>
  );
};

export default CustomerDashboard;
