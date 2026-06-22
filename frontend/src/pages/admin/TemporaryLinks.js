import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminTemporaryLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileLimit, setFileLimit] = useState(5);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await axios.get('/api/admin/temporary-links', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLinks(response.data.links || []);
    } catch (error) {
      console.error('Failed to fetch temporary links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await axios.post('/api/admin/temporary-links', {
        file_limit: parseInt(fileLimit, 10)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('✅ Temporary upload link generated successfully!');
      setFileLimit(5);
      fetchLinks();
    } catch (error) {
      alert('Failed to generate link: ' + (error.response?.data?.message || error.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (token) => {
    if (!window.confirm('Are you sure you want to revoke this temporary link? Retail clients will no longer be able to access it or upload files.')) {
      return;
    }
    try {
      await axios.delete(`/api/admin/temporary-links/${token}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('✅ Temporary link revoked successfully.');
      fetchLinks();
    } catch (error) {
      alert('Failed to revoke link: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCopyLink = (token) => {
    const fullUrl = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(fullUrl);
    alert('📋 Link copied to clipboard:\n' + fullUrl);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="portal-view-wrapper">
      <div className="portal-content-header" style={{ marginBottom: '25px' }}>
        <h1>🔗 Temporary Retail Upload Links</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Generate temporary links with set file check limits to send to retail customers without accounts.
        </p>
      </div>

      <div style={{ padding: '24px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px', color: '#1e293b' }}>Generate New Temporary Link</h2>
        <form onSubmit={handleGenerateLink} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>File Check Limit</label>
            <input
              type="number"
              min="1"
              required
              value={fileLimit}
              onChange={(e) => setFileLimit(e.target.value)}
              style={{
                padding: '10px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '14px',
                width: '120px',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-success"
            disabled={generating}
            style={{ padding: '12px 24px', height: '42px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
          >
            {generating ? 'Generating...' : '➕ Generate Link'}
          </button>
        </form>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Created Date</th>
              <th>File Limit</th>
              <th>Actual Uploads</th>
              <th>Temporary Link URL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No temporary upload links generated yet.
                </td>
              </tr>
            ) : (
              links.map(link => (
                <tr key={link.id}>
                  <td>{new Date(link.created_at).toLocaleString()}</td>
                  <td><strong>{link.file_limit}</strong></td>
                  <td>
                    <span className={`badge ${link.uploaded_count >= link.file_limit ? 'badge-secondary' : 'badge-primary'}`}>
                      {link.uploaded_count} / {link.file_limit}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <code style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#0f172a', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {`${window.location.origin}/shared/${link.token}`}
                      </code>
                      <button
                        onClick={() => handleCopyLink(link.token)}
                        className="btn btn-sm btn-info"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleRevoke(link.token)}
                      className="btn btn-sm btn-danger"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTemporaryLinks;
