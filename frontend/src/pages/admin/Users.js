import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../../styles/list.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // Detail expansion state
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [editCharge, setEditCharge] = useState('');
  const [editLimit, setEditLimit] = useState('');

  // Search query state
  const [searchVal, setSearchVal] = useState('');

  // Add User state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    company: '',
    phone: '',
    per_file_charge: '400',
    file_limit: '10'
  });
  const [addError, setAddError] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const queryParams = [];
      if (filter) queryParams.push(`role=${filter}`);
      if (searchVal) queryParams.push(`search=${encodeURIComponent(searchVal)}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const response = await axios.get(`/api/admin/users${queryString}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await axios.put('/api/admin/users/status', { user_id: userId, status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
    } catch (error) {
      alert('Failed to update user status');
    }
  };

  const toggleExpand = (user) => {
    if (expandedUserId === user.id) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(user.id);
      setEditCharge(user.per_file_charge || '10.00');
      setEditLimit(user.file_limit || '10');
    }
  };

  const handleUpdateSettings = async (userId) => {
    try {
      await axios.put('/api/admin/users/settings', {
        user_id: userId,
        per_file_charge: parseFloat(editCharge),
        file_limit: parseInt(editLimit, 10)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('✅ Customer settings updated successfully.');
      fetchUsers();
    } catch (error) {
      alert('Failed to update customer settings: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCustomerPayment = async (customerId, name, dueBalance) => {
    const formattedAmt = parseFloat(dueBalance).toFixed(2);
    if (!window.confirm(`Confirm payment of LKR ${formattedAmt} from ${name}?\n\nThis will reset their unpaid completed checks count to 0.`)) {
      return;
    }

    try {
      await axios.post('/api/admin/customer-payout', { customer_id: customerId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(`✅ Customer payment of LKR ${formattedAmt} recorded. Upload limit count reset for ${name}.`);
      fetchUsers();
    } catch (error) {
      alert('Failed to process customer payment: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCheckerPayout = async (checkerId, name, dueAmount) => {
    const formattedAmt = parseFloat(dueAmount).toFixed(2);
    if (!window.confirm(`Confirm payment of $${formattedAmt} to ${name}?\n\nThis will reset their unpaid file count.`)) {
      return;
    }

    try {
      await axios.post('/api/admin/payout', { checker_id: checkerId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(`✅ Payout of $${formattedAmt} completed and file count reset for ${name}.`);
      fetchUsers();
    } catch (error) {
      alert('Failed to process payout: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddingUser(true);
    try {
      await axios.post('/api/admin/users', {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        company: newUser.company || null,
        phone: newUser.phone || null,
        per_file_charge: newUser.role === 'customer' ? parseFloat(newUser.per_file_charge) : 0,
        file_limit: newUser.role === 'customer' ? parseInt(newUser.file_limit, 10) : 0
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('✅ User created successfully!');
      setShowAddModal(false);
      // Reset form
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'customer',
        company: '',
        phone: '',
        per_file_charge: '400',
        file_limit: '10'
      });
      fetchUsers();
    } catch (error) {
      setAddError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setAddingUser(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="users-container">
      <style>{`
        .user-details-row {
          background-color: #f8fafc;
        }
        .user-details-box {
          padding: 10px 0;
          background: #ffffff;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }
        .details-col h3 {
          margin-top: 0;
          margin-bottom: 16px;
          color: #1e293b;
          font-size: 16px;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 8px;
        }
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .settings-form-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .settings-form-row label {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }
        .settings-form-row input {
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
        }
        .billing-status-item {
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          font-size: 14.5px;
          color: #475569;
        }
        .billing-status-item strong {
          color: #0f172a;
        }
        .due-alert {
          background: #fff5f5;
          color: #c0392b;
          border: 1px solid #f8d7da;
          border-radius: 6px;
          padding: 10px 14px;
          font-size: 13px;
          margin-bottom: 16px;
        }

        /* Modal Overlay and Container Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
        }
        .modal-container {
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 800px;
          width: 90%;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }
        .modal-close-btn {
          background: none;
          border: none;
          font-size: 20px;
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.15s ease;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close-btn:hover {
          color: #475569;
        }
        .modal-body {
          padding: 24px;
          overflow-y: auto;
          max-height: 80vh;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <h1>User Management</h1>

      <div className="filter-bar" style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
            <option value="checker">Checker</option>
          </select>

          <input
            type="text"
            placeholder="🔍 Search name, email, or UID..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            style={{
              padding: '10px 15px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px',
              width: '300px'
            }}
          />
          <button
            className="btn btn-primary"
            onClick={fetchUsers}
            style={{ padding: '10px 20px', fontSize: '14px', height: '40px', display: 'flex', alignItems: 'center' }}
          >
            Search
          </button>
        </div>
        <button
          className="btn btn-success"
          onClick={() => setShowAddModal(true)}
          style={{ padding: '10px 20px', fontSize: '14px', height: '40px', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
        >
          ➕ Add New User
        </button>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td><code style={{ color: '#2563eb', fontWeight: 600 }}>{user.uid}</code></td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td><span className="badge">{user.role}</span></td>
                <td>
                  <select
                    value={user.status}
                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
                    className="status-select"
                    disabled={user.role === 'admin'}
                    title={user.role === 'admin' ? 'Administrator accounts cannot be suspended' : ''}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() => toggleExpand(user)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Popup overlay */}
      {expandedUserId && (() => {
        const activeUser = users.find(u => u.id === expandedUserId);
        if (!activeUser) return null;
        return (
          <div className="modal-overlay" onClick={() => setExpandedUserId(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>👤 User Details & Configurations</h2>
                <button className="modal-close-btn" onClick={() => setExpandedUserId(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div><span style={{ color: '#64748b', fontSize: '13px' }}>User ID:</span> <code style={{ color: '#2563eb', fontWeight: 600 }}>{activeUser.uid}</code></div>
                  <div><span style={{ color: '#64748b', fontSize: '13px' }}>Name:</span> <strong>{activeUser.name}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '13px' }}>Email:</span> <strong>{activeUser.email}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '13px' }}>Role:</span> <span className="badge">{activeUser.role}</span></div>
                  <div><span style={{ color: '#64748b', fontSize: '13px' }}>Status:</span> <span className={`badge`}>{activeUser.status}</span></div>
                </div>

                <div className="user-details-box">
                  {activeUser.role === 'customer' ? (
                    <>
                      <div className="details-col">
                        <h3>⚙️ Billing Settings</h3>
                        <div className="settings-form">
                          <div className="settings-form-row">
                            <label>Per File Charge (LKR)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editCharge}
                              onChange={(e) => setEditCharge(e.target.value)}
                            />
                          </div>
                          <div className="settings-form-row">
                            <label>File Check Limit</label>
                            <input
                              type="number"
                              step="1"
                              min="1"
                              value={editLimit}
                              onChange={(e) => setEditLimit(e.target.value)}
                            />
                          </div>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleUpdateSettings(activeUser.id)}
                            style={{ marginTop: '10px' }}
                          >
                            Update Settings
                          </button>
                        </div>
                      </div>
                      <div className="details-col">
                        <h3>💳 Billing Status & Payments</h3>
                        <div className="billing-status-item">
                          <span>Active Checks (In-Progress):</span>
                          <strong>{activeUser.customer_active_checks || 0} files</strong>
                        </div>
                        <div className="billing-status-item">
                          <span>Completed Unpaid Checks:</span>
                          <strong>{activeUser.unpaid_checks || 0} / {activeUser.file_limit} files</strong>
                        </div>
                        <div className="billing-status-item">
                          <span>Total Unpaid Checks:</span>
                          <strong>{(activeUser.customer_active_checks || 0) + (activeUser.unpaid_checks || 0)} files</strong>
                        </div>
                        <div className="billing-status-item">
                          <span>Due Balance:</span>
                          <strong style={{ color: parseFloat(activeUser.due_balance || 0) > 0 ? '#dc3545' : 'inherit' }}>
                            LKR {parseFloat(activeUser.due_balance || 0).toFixed(2)}
                          </strong>
                        </div>

                        {parseFloat(activeUser.unpaid_checks || 0) >= parseFloat(activeUser.file_limit || 0) && (
                          <div className="due-alert">
                            🚨 Customer upload limit reached! Settle the outstanding balance to allow new uploads.
                          </div>
                        )}

                        <button
                          className="btn btn-sm btn-success"
                          disabled={parseFloat(activeUser.due_balance || 0) <= 0}
                          onClick={() => handleCustomerPayment(activeUser.id, activeUser.name, activeUser.due_balance)}
                          style={{ width: '100%', marginTop: '10px', display: 'block', padding: '10px' }}
                        >
                          💵 Record Payment & Reset Count
                        </button>
                      </div>
                    </>
                  ) : activeUser.role === 'checker' ? (
                    <div style={{ padding: '10px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                      <div className="details-col">
                        <h3>🛠️ Checker Workload</h3>
                        <div className="billing-status-item">
                          <span>Active Checking Jobs:</span>
                          <strong>{activeUser.checker_active_jobs || 0} jobs</strong>
                        </div>
                        <div className="billing-status-item">
                          <span>Completed Unpaid Checks:</span>
                          <strong>{activeUser.checker_unpaid_checks || 0} checks</strong>
                        </div>
                        <div className="billing-status-item">
                          <span>Total Workload Count:</span>
                          <strong>{(activeUser.checker_active_jobs || 0) + (activeUser.checker_unpaid_checks || 0)} jobs</strong>
                        </div>
                      </div>
                      <div className="details-col">
                        <h3>💸 Payouts Info</h3>
                        <div className="billing-status-item">
                          <span>Due Payout:</span>
                          <strong style={{ color: parseFloat(activeUser.checker_due_balance || 0) > 0 ? '#dc3545' : 'inherit' }}>
                            ${parseFloat(activeUser.checker_due_balance || 0).toFixed(2)}
                          </strong>
                        </div>
                        <button
                          className="btn btn-sm btn-success"
                          disabled={parseFloat(activeUser.checker_due_balance || 0) <= 0}
                          onClick={() => handleCheckerPayout(activeUser.id, activeUser.name, activeUser.checker_due_balance)}
                          style={{ width: '100%', marginTop: '10px', display: 'block', padding: '10px' }}
                        >
                          💵 Complete Payout & Reset Count
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '10px', width: '100%' }}>
                      <h3>👤 Administrator</h3>
                      <p>Administrator account with full system configuration access.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Add New Customer or Checker</h2>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {addError && <div className="due-alert" style={{ margin: '0 0 15px' }}>{addError}</div>}
              <form onSubmit={handleAddSubmit} className="settings-form" autoComplete="off">
                <div className="settings-form-row">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="settings-form-row">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="e.g. john@example.com"
                    autoComplete="new-password"
                  />
                </div>
                <div className="settings-form-row">
                  <label>Password (Min 6 chars)</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <div className="settings-form-row">
                  <label>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="customer">Customer</option>
                    <option value="checker">Checker</option>
                  </select>
                </div>

                {newUser.role === 'customer' && (
                  <>
                    <div className="settings-form-row">
                      <label>Rate Per File (LKR)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newUser.per_file_charge}
                        onChange={(e) => setNewUser({ ...newUser, per_file_charge: e.target.value })}
                      />
                    </div>
                    <div className="settings-form-row">
                      <label>File Check Limit</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={newUser.file_limit}
                        onChange={(e) => setNewUser({ ...newUser, file_limit: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="settings-form-row">
                  <label>Company (Optional)</label>
                  <input
                    type="text"
                    value={newUser.company}
                    onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="settings-form-row">
                  <label>Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="e.g. +94771234567"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={addingUser}
                  style={{ width: '100%', padding: '12px', marginTop: '10px', fontWeight: 'bold' }}
                >
                  {addingUser ? '⏳ Creating...' : '🚀 Create User Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
