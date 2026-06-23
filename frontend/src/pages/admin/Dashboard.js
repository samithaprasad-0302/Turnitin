import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminUsers from './Users';
import AdminTemporaryLinks from './TemporaryLinks';
import '../../styles/dashboard.css';

const AdminDashboard = ({ user }) => {
  const [activeMenu, setActiveMenu] = useState('overview'); // 'overview', 'users', 'payments', 'storage'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignmentSearch, setAssignmentSearch] = useState('');

  const [storageStats, setStorageStats] = useState(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [maintMode, setMaintMode] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchMaintenanceStatus();

    const handleRealtime = () => {
      fetchStats();
      if (activeMenu === 'system') {
        fetchStorageStats();
      }
    };

    window.addEventListener('realtime-update', handleRealtime);
    return () => window.removeEventListener('realtime-update', handleRealtime);
  }, [activeMenu]);

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await axios.get('/api/system/settings');
      setMaintMode(response.data.maintenance_mode);
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error);
    }
  };

  const handleToggleMaintenance = async () => {
    const nextState = !maintMode;
    const confirmMsg = nextState
      ? 'Put the website under maintenance? All checkers and customers will be blocked from accessing the system.'
      : 'Disable maintenance mode and resume normal website operations?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await axios.put('/api/admin/settings/maintenance', { enabled: nextState }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMaintMode(nextState);
      alert(`✅ Maintenance mode has been ${nextState ? 'enabled (offline)' : 'disabled (online)'}.`);
    } catch (error) {
      alert('Failed to update maintenance settings: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    if (activeMenu === 'system') {
      fetchStorageStats();
    }
  }, [activeMenu]);

  const fetchStorageStats = async () => {
    setLoadingStorage(true);
    try {
      const response = await axios.get('/api/admin/storage-stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStorageStats(response.data);
    } catch (error) {
      console.error('Failed to fetch storage stats:', error);
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleClearCompleted = async () => {
    const eligibleCount = storageStats?.clearing_eligible_count || 0;
    if (eligibleCount === 0) {
      alert('There are no completed files older than 24 hours to clear.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently clear ${eligibleCount} completed files older than 24 hours?\n\nThis will delete the original files, reports on disk, and their records in the database. This action cannot be undone.`)) {
      return;
    }

    setClearing(true);
    try {
      const response = await axios.post('/api/admin/clear-completed-files', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(`✅ ${response.data.message}`);
      fetchStorageStats();
      fetchStats();
    } catch (error) {
      alert('Failed to clear completed files: ' + (error.response?.data?.message || error.message));
    } finally {
      setClearing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async (checkerId, name, dueAmount) => {
    const formattedAmt = parseFloat(dueAmount).toFixed(2);
    if (!window.confirm(`Confirm payment of $${formattedAmt} to ${name}?\n\nThis will reset their unpaid file count.`)) {
      return;
    }

    try {
      await axios.post('/api/admin/payout', { checker_id: checkerId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(`✅ Payout of $${formattedAmt} completed and file count reset for ${name}.`);
      fetchStats();
    } catch (error) {
      alert('Failed to process payout: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCustomerPayment = async (customerId, name, dueBalance) => {
    const formattedAmt = parseFloat(dueBalance).toFixed(2);
    if (!window.confirm(`Confirm payment of LKR ${formattedAmt} from ${name}?\n\nThis will reset their unpaid completed checks count.`)) {
      return;
    }

    try {
      await axios.post('/api/admin/customer-payout', { customer_id: customerId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(`✅ Customer payment of LKR ${formattedAmt} recorded for ${name}.`);
      fetchStats();
    } catch (error) {
      alert('Failed to process customer payment: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="portal-container">
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .live-pulse {
          animation: pulse 1.8s infinite ease-in-out;
        }
        .live-activity-table {
          max-height: 520px;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
        }
        .live-activity-table th {
          position: sticky;
          top: 0;
          background-color: #f8fafc;
          z-index: 1;
        }

        /* Stats Grid Container */
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          margin-top: 20px;
          margin-bottom: 25px;
        }
        @media (max-width: 1400px) {
          .admin-stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .admin-stats-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Base Card Styling */
        .admin-stat-card {
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          text-align: left;
        }
        .admin-stat-card:hover {
          transform: translateY(-4px);
        }

        /* Flat Cards (System Metrics) */
        .admin-stat-card.flat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
        }
        .admin-stat-card.flat-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
        }
        .admin-stat-card.flat-card .card-icon-wrapper {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .admin-stat-card.flat-card .card-icon-wrapper.users-icon {
          background-color: #eff6ff;
          color: #2563eb;
        }
        .admin-stat-card.flat-card .card-icon-wrapper.files-icon {
          background-color: #faf5ff;
          color: #9333ea;
        }
        .admin-stat-card.flat-card .card-icon-wrapper.completed-icon {
          background-color: #f0fdf4;
          color: #16a34a;
        }
        .admin-stat-card.flat-card .card-icon-wrapper.pending-icon {
          background-color: #fffbeb;
          color: #d97706;
        }
        .admin-stat-card.flat-card .card-info {
          display: flex;
          flex-direction: column;
        }
        .admin-stat-card.flat-card .card-info h3 {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .admin-stat-card.flat-card .card-info .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          line-height: 1;
        }

        /* Gradient Cards (Financial Metrics) */
        .admin-stat-card.gradient-card {
          color: #ffffff;
          position: relative;
          overflow: hidden;
          border: none;
        }
        .admin-stat-card.gradient-card.dues-card {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 4px 14px 0 rgba(217, 119, 6, 0.35);
        }
        .admin-stat-card.gradient-card.payouts-card {
          background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%);
          box-shadow: 0 4px 14px 0 rgba(126, 34, 206, 0.35);
        }
        .admin-stat-card.gradient-card .card-icon-wrapper {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          background-color: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(4px);
          flex-shrink: 0;
        }
        .admin-stat-card.gradient-card .card-info {
          display: flex;
          flex-direction: column;
        }
        .admin-stat-card.gradient-card .card-info h3 {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .admin-stat-card.gradient-card .card-info .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          line-height: 1.2;
        }
        .admin-stat-card.gradient-card::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent 45%, rgba(255, 255, 255, 0.1) 50%, transparent 55%);
          transform: rotate(45deg);
          transition: all 0.6s ease;
          pointer-events: none;
        }
        .admin-stat-card.gradient-card:hover::after {
          left: 100%;
          top: 100%;
        }
      `}</style>

      {/* Sidebar navigation */}
      <div className="portal-sidebar">
        <div className="portal-sidebar-header">
          <h2>Welcome, Admin!</h2>
          <p>System Administrator Portal</p>
        </div>

        <ul className="portal-menu">
          <li>
            <button
              onClick={() => setActiveMenu('overview')}
              className={`portal-menu-item ${activeMenu === 'overview' ? 'active' : ''}`}
            >
              📊 System Overview
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('users')}
              className={`portal-menu-item ${activeMenu === 'users' ? 'active' : ''}`}
            >
              👥 User Management
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('payments')}
              className={`portal-menu-item ${activeMenu === 'payments' ? 'active' : ''}`}
            >
              💳 Payments & Earnings
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('checked_counts')}
              className={`portal-menu-item ${activeMenu === 'checked_counts' ? 'active' : ''}`}
            >
              📁 Checked Counts
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('retail_links')}
              className={`portal-menu-item ${activeMenu === 'retail_links' ? 'active' : ''}`}
            >
              🔗 Temporary Links
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveMenu('system')}
              className={`portal-menu-item ${activeMenu === 'system' ? 'active' : ''}`}
            >
              ⚙️ System Management
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="portal-content" style={{ flex: 1, padding: '30px' }}>

        {activeMenu === 'overview' && (
          <>
            <div className="portal-content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h1>System Overview</h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Real-time statistics & activity logging</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="live-pulse" style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981'
                }} />
                <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Log</span>
                <button
                  onClick={fetchStats}
                  className="btn btn-sm btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
                >
                  🔄 Refresh Data
                </button>
              </div>
            </div>

            <div className="admin-stats-grid">
              <div className="admin-stat-card flat-card" onClick={() => setActiveMenu('users')} style={{ cursor: 'pointer' }}>
                <div className="card-icon-wrapper users-icon">
                  <span>👥</span>
                </div>
                <div className="card-info">
                  <h3>Total Users</h3>
                  <p className="stat-value">{stats?.users?.admin + stats?.users?.customer + stats?.users?.checker || 0}</p>
                </div>
              </div>

              <div className="admin-stat-card flat-card" style={{ cursor: 'default' }}>
                <div className="card-icon-wrapper files-icon">
                  <span>📄</span>
                </div>
                <div className="card-info">
                  <h3>Total Files</h3>
                  <p className="stat-value">{stats?.files?.total || 0}</p>
                </div>
              </div>

              <div className="admin-stat-card flat-card" style={{ cursor: 'default' }}>
                <div className="card-icon-wrapper completed-icon">
                  <span>✅</span>
                </div>
                <div className="card-info">
                  <h3>Completed Files</h3>
                  <p className="stat-value">{stats?.files?.completed || 0}</p>
                </div>
              </div>

              <div className="admin-stat-card flat-card" style={{ cursor: 'default' }}>
                <div className="card-icon-wrapper pending-icon">
                  <span>⏳</span>
                </div>
                <div className="card-info">
                  <h3>Pending Files</h3>
                  <p className="stat-value">{stats?.files?.pending || 0}</p>
                </div>
              </div>

              <div className="admin-stat-card gradient-card dues-card" onClick={() => setActiveMenu('payments')} style={{ cursor: 'pointer' }}>
                <div className="card-icon-wrapper">
                  <span>💰</span>
                </div>
                <div className="card-info">
                  <h3>Customer Dues</h3>
                  <p className="stat-value">LKR {((stats?.customerPerformance || []).reduce((acc, c) => acc + parseFloat(c.due_balance || 0), 0)).toFixed(2)}</p>
                </div>
              </div>

              <div className="admin-stat-card gradient-card payouts-card" onClick={() => setActiveMenu('payments')} style={{ cursor: 'pointer' }}>
                <div className="card-icon-wrapper">
                  <span>💸</span>
                </div>
                <div className="card-info">
                  <h3>Checker Payouts</h3>
                  <p className="stat-value">${((stats?.checkerPerformance || []).reduce((acc, chk) => acc + parseFloat(chk.due_amount || 0), 0)).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Live Upload Activity - landing screen focal point */}
            <div className="dashboard-section" style={{ marginTop: '30px' }}>
              <h2>⚡ Live Upload Activity</h2>
              <div style={{ margin: '15px 0' }}>
                <input
                  type="text"
                  placeholder="🔍 Search live actions by File ID, title, customer details, or checker details..."
                  value={assignmentSearch}
                  onChange={(e) => setAssignmentSearch(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                  }}
                />
              </div>

              <div className="live-activity-table">
                <table className="dashboard-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>File ID</th>
                      <th>File Name / Title</th>
                      <th>Customer (Uploader)</th>
                      <th>Assigned Checker</th>
                      <th>Status</th>
                      <th>Upload Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredAssignments = (stats?.fileDetails || []).filter(file => {
                        if (!assignmentSearch) return true;
                        const searchLower = assignmentSearch.toLowerCase();
                        return (
                          (file.uid && file.uid.toLowerCase().includes(searchLower)) ||
                          (file.title && file.title.toLowerCase().includes(searchLower)) ||
                          (file.original_filename && file.original_filename.toLowerCase().includes(searchLower)) ||
                          (file.original_file && file.original_file.toLowerCase().includes(searchLower)) ||
                          (file.customer_uid && file.customer_uid.toLowerCase().includes(searchLower)) ||
                          (file.customer_name && file.customer_name.toLowerCase().includes(searchLower)) ||
                          (file.customer_email && file.customer_email.toLowerCase().includes(searchLower)) ||
                          (file.checker_uid && file.checker_uid.toLowerCase().includes(searchLower)) ||
                          (file.checker_name && file.checker_name.toLowerCase().includes(searchLower)) ||
                          (file.checker_email && file.checker_email.toLowerCase().includes(searchLower))
                        );
                      });

                      if (filteredAssignments.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No activity records match your search</td>
                          </tr>
                        );
                      }

                      return filteredAssignments.map(file => (
                        <tr key={file.id}>
                          <td><code style={{ color: '#2563eb', fontWeight: 600 }}>{file.uid}</code></td>
                          <td style={{ fontWeight: 600 }}>{file.title || file.original_filename || file.original_file}</td>
                          <td>
                            <div className="user-info-cell">
                              {file.customer_uid && <code style={{ color: '#2563eb', fontWeight: 600, fontSize: '11px', display: 'block', marginBottom: '2px' }}>{file.customer_uid}</code>}
                              <span className="user-name-text">{file.customer_name}</span>
                              <span className="email-subtext">{file.customer_email}</span>
                            </div>
                          </td>
                          <td>
                            {file.checker_email ? (
                              <div className="user-info-cell">
                                {file.checker_uid && <code style={{ color: '#2563eb', fontWeight: 600, fontSize: '11px', display: 'block', marginBottom: '2px' }}>{file.checker_uid}</code>}
                                <span className="user-name-text">{file.checker_name}</span>
                                <span className="email-subtext">{file.checker_email}</span>
                              </div>
                            ) : (
                              <span style={{ color: '#aaa', fontStyle: 'italic' }}>Unassigned</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge badge-status-${file.status}`}>
                              {file.status}
                            </span>
                          </td>
                          <td>{new Date(file.upload_date).toLocaleString()}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeMenu === 'users' && (
          <div className="portal-view-wrapper">
            <AdminUsers />
          </div>
        )}

        {activeMenu === 'payments' && (
          <>
            <div className="portal-content-header">
              <h1>💳 Payments & Earnings</h1>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>System outstanding balances, customer billing, and checker payouts</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '20px' }}>
              <div style={{ padding: '25px', borderRadius: '12px', border: '1px solid #bbf7d0', background: '#f0fdf4', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '13px', color: '#166534', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Outstanding Customer Balance</span>
                <p style={{ fontSize: '32px', fontWeight: '800', margin: '15px 0 0', color: '#15803d' }}>
                  LKR {(() => {
                    const totalCustomerDue = (stats?.customerPerformance || []).reduce((acc, c) => acc + parseFloat(c.due_balance || 0), 0);
                    return totalCustomerDue.toFixed(2);
                  })()}
                </p>
              </div>
              <div style={{ padding: '25px', borderRadius: '12px', border: '1px solid #fecaca', background: '#fef2f2', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '13px', color: '#991b1b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Outstanding Checker Payouts</span>
                <p style={{ fontSize: '32px', fontWeight: '800', margin: '15px 0 0', color: '#b91c1c' }}>
                  ${(() => {
                    const totalCheckerDue = (stats?.checkerPerformance || []).reduce((acc, chk) => acc + parseFloat(chk.due_amount || 0), 0);
                    return totalCheckerDue.toFixed(2);
                  })()}
                </p>
              </div>
              <div style={{ padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Customer Unpaid Checks</span>
                <p style={{ fontSize: '32px', fontWeight: '800', margin: '15px 0 0', color: '#0f172a' }}>
                  {(() => {
                    const totalCustomerUnpaid = (stats?.fileDetails || []).filter(f => f.status === 'completed' && parseInt(f.customer_paid, 10) === 0 && !f.temporary_link_id && f.customer_email !== 'retail@system.com').length;
                    return totalCustomerUnpaid;
                  })()}
                </p>
              </div>
              <div style={{ padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Checker Unpaid Jobs</span>
                <p style={{ fontSize: '32px', fontWeight: '800', margin: '15px 0 0', color: '#0f172a' }}>
                  {(() => {
                    const totalCheckerUnpaid = (stats?.fileDetails || []).filter(f => f.status === 'completed' && parseInt(f.checker_paid, 10) === 0).length;
                    return totalCheckerUnpaid;
                  })()}
                </p>
              </div>
            </div>

            {/* Customers Billing & Payments Section */}
            <div className="dashboard-section" style={{ marginTop: '40px' }}>
              <h2>👤 Customer Accounts Billing</h2>
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Customer Info</th>
                      <th>Rate Per File</th>
                      <th>Unpaid Checks</th>
                      <th>Outstanding Balance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.customerPerformance || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center' }}>No customers found</td>
                      </tr>
                    ) : (
                      stats.customerPerformance.map(cust => (
                        <tr key={cust.id}>
                          <td><code style={{ color: '#2563eb', fontWeight: 600 }}>{cust.uid}</code></td>
                          <td>
                            <div className="user-info-cell">
                              <span className="user-name-text">{cust.name}</span>
                              <span className="email-subtext">{cust.email}</span>
                            </div>
                          </td>
                          <td>LKR {parseFloat(cust.per_file_charge || 10).toFixed(2)}</td>
                          <td>
                            <span className="badge-count pending">{cust.unpaid_checks || 0} / {cust.file_limit} files</span>
                          </td>
                          <td>
                            <strong style={{ color: parseFloat(cust.due_balance || 0) > 0 ? '#b91c1c' : '#2c3e50', fontSize: '15px' }}>
                              LKR {parseFloat(cust.due_balance || 0).toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <button
                              onClick={() => handleCustomerPayment(cust.id, cust.name, cust.due_balance)}
                              className="btn btn-sm btn-success"
                              disabled={parseFloat(cust.due_balance || 0) <= 0}
                              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 'bold' }}
                            >
                              💵 Record Payment
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Checkers Payouts Section */}
            <div className="dashboard-section">
              <h2>🛠️ Checker Accounts Payouts</h2>
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Checker ID</th>
                      <th>Checker Info</th>
                      <th>Checked Files</th>
                      <th>Due Payout</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.checkerPerformance || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center' }}>No checkers found</td>
                      </tr>
                    ) : (
                      stats.checkerPerformance.map(chk => (
                        <tr key={chk.id}>
                          <td><code style={{ color: '#2563eb', fontWeight: 600 }}>{chk.uid}</code></td>
                          <td>
                            <div className="user-info-cell">
                              <span className="user-name-text">{chk.name}</span>
                              <span className="email-subtext">{chk.email}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge-count pending">{chk.unpaid_completed_files || 0}</span>
                          </td>
                          <td>
                            <strong style={{ color: parseFloat(chk.due_amount || 0) > 0 ? '#b91c1c' : '#2c3e50', fontSize: '15px' }}>
                              ${parseFloat(chk.due_amount).toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <button
                              onClick={() => handlePayout(chk.id, chk.name, chk.due_amount)}
                              className="btn btn-sm btn-success"
                              disabled={parseFloat(chk.due_amount) <= 0}
                              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 'bold' }}
                            >
                              💵 Complete Payout
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeMenu === 'system' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div className="portal-content-header">
              <div>
                <h1>⚙️ System Management</h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage system maintenance mode, monitor database sizing, and perform system cleanup checks</p>
              </div>
            </div>

            {/* Maintenance Mode Status Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderRadius: '10px',
              border: maintMode ? '1px solid #fecaca' : '1px solid #bbf7d0',
              background: maintMode ? '#fef2f2' : '#f0fdf4',
              color: maintMode ? '#991b1b' : '#166534',
              textAlign: 'left'
            }}>
              <div>
                <strong style={{ fontSize: '14.5px', display: 'block', marginBottom: '3px' }}>
                  {maintMode ? '🚧 System is under maintenance (Offline Mode)' : '🟢 System is active and online'}
                </strong>
                <span style={{ fontSize: '12.5px', color: maintMode ? '#b91c1c' : '#15803d' }}>
                  {maintMode 
                    ? 'Checkers and Customers are currently blocked from logging in or using the dashboard.' 
                    : 'All services are running normally. Customers can upload files and Checkers can process jobs.'}
                </span>
              </div>
              <button
                onClick={handleToggleMaintenance}
                className="btn"
                style={{
                  backgroundColor: maintMode ? '#dc2626' : '#16a34a',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: maintMode ? '0 2px 4px rgba(220, 38, 38, 0.2)' : '0 2px 4px rgba(22, 163, 74, 0.2)',
                  transition: 'all 0.2s'
                }}
              >
                {maintMode ? '⚙️ Enable Online Mode' : '🔧 Set Under Maintenance'}
              </button>
            </div>

            {loadingStorage ? (
              <div className="loading">Retrieving system storage diagnostics...</div>
            ) : (
              <>
                {/* Storage Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

                  {/* DB Sizing Card */}
                  <div style={{ padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
                      🗄️
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>MySQL Database Sizing</span>
                      <p style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0 0', color: '#1e293b' }}>{storageStats?.db_size_formatted || '0 B'}</p>
                    </div>
                  </div>

                  {/* Disk Files Size Card */}
                  <div style={{ padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
                      📂
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Uploads Directory</span>
                      <p style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0 0', color: '#1e293b' }}>{storageStats?.uploads_size_formatted || '0 B'}</p>
                    </div>
                  </div>

                  {/* Total Completed Files Card */}
                  <div style={{ padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
                      ✅
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Total Completed Files</span>
                      <p style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0 0', color: '#1e293b' }}>{storageStats?.total_completed || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Storage Cleanup Section */}
                <div style={{ marginTop: '10px', padding: '30px', borderRadius: '12px', border: '1px solid #fee2e2', background: '#fef2f2', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', color: '#991b1b', fontSize: '18px', fontWeight: '700' }}>🧹 Database Storage Cleanup</h3>
                      <p style={{ margin: 0, color: '#7f1d1d', fontSize: '14px', lineHeight: '1.6' }}>
                        To keep disk storage optimized, the administrator can clear files that have been successfully checked.
                        To protect files currently being downloaded by customers, <strong>only completed files older than 24 hours</strong> will be permanently deleted from the database and disk.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={handleClearCompleted}
                        className="btn"
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: (storageStats?.clearing_eligible_count || 0) === 0 ? 'not-allowed' : 'pointer',
                          opacity: (storageStats?.clearing_eligible_count || 0) === 0 ? 0.6 : 1,
                          boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.25)',
                          transition: 'all 0.2s'
                        }}
                        disabled={clearing || (storageStats?.clearing_eligible_count || 0) === 0}
                      >
                        {clearing ? 'Clearing Files...' : `Clear ${storageStats?.clearing_eligible_count || 0} Files (>24h)`}
                      </button>
                    </div>
                  </div>

                  {/* Eligible items detail */}
                  <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(220, 38, 38, 0.1)' }}>
                    <span style={{ fontSize: '13px', color: '#7f1d1d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ℹ️ <strong>Storage Report:</strong> Out of {storageStats?.total_completed || 0} completed uploads, <strong>{storageStats?.clearing_eligible_count || 0} files</strong> have exceeded the 24-hour download preservation threshold and are ready for safe clearing.
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeMenu === 'checked_counts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div className="portal-content-header">
              <div>
                <h1>📁 Checked File Counts</h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                  Total count of files checked (completed) for each customer and checker separately.
                </p>
              </div>
            </div>

            {/* Customers Checked Counts table */}
            <div className="dashboard-section" style={{ marginTop: '10px' }}>
              <h2>👤 Customer Checked File Counts</h2>
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Customer Info</th>
                      <th>Checked Files Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.customerPerformance || []).length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center' }}>No customers found</td>
                      </tr>
                    ) : (
                      stats.customerPerformance.map(cust => (
                        <tr key={cust.id}>
                          <td><code style={{ color: '#2563eb', fontWeight: 600 }}>{cust.uid}</code></td>
                          <td>
                            <div className="user-info-cell">
                              <span className="user-name-text">{cust.name}</span>
                              <span className="email-subtext">{cust.email}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge-count completed" style={{ fontSize: '14px', padding: '6px 14px' }}>
                              {cust.unpaid_checks || 0} files checked
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Checkers Checked Counts table */}
            <div className="dashboard-section" style={{ marginTop: '20px' }}>
              <h2>🛠️ Checker Checked File Counts</h2>
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Checker ID</th>
                      <th>Checker Info</th>
                      <th>Checked Files Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.checkerPerformance || []).length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center' }}>No checkers found</td>
                      </tr>
                    ) : (
                      stats.checkerPerformance.map(chk => (
                        <tr key={chk.id}>
                          <td><code style={{ color: '#2563eb', fontWeight: 600 }}>{chk.uid}</code></td>
                          <td>
                            <div className="user-info-cell">
                              <span className="user-name-text">{chk.name}</span>
                              <span className="email-subtext">{chk.email}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge-count completed" style={{ fontSize: '14px', padding: '6px 14px' }}>
                              {chk.unpaid_completed_files || 0} files checked
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'retail_links' && (
          <div className="portal-view-wrapper">
            <AdminTemporaryLinks />
          </div>
        )}


      </div>
    </div>
  );
};

export default AdminDashboard;
