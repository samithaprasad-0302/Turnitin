import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/list.css';

const CustomerFiles = () => {
  const [files, setFiles]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [disputingId, setDisputingId]   = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files/my-files', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ── Download report with original checker filename ── */
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

  /* ── Cancel pending order ── */
  const handleCancel = async (fileId) => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setCancellingId(fileId);
    try {
      await axios.post(`/api/files/${fileId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'cancelled' } : f));
    } catch (error) {
      alert('Cancel failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setCancellingId(null);
    }
  };

  /* ── Report wrong file — sends a fixed alert to the checker ── */
  const handleDispute = async (fileId) => {
    if (!window.confirm(
      'Report wrong/incorrect reports to the checker?\n\n' +
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

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="files-container">
      <h1>My Uploaded Files</h1>

      {files.length === 0 ? (
        <p>No files uploaded yet. <a href="/customer/upload">Upload one now</a></p>
      ) : (
        <div className="files-table">
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Service Type</th>
                <th>Status</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.id}>
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

                  {/* ── Actions ── */}
                  <td>
                    <div className="file-action-buttons">

                      {/* Download report buttons for completed files */}
                      {file.status === 'completed' && (
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

                          {/* Wrong file alert — only if not already reported */}
                          {file.dispute_status !== 'reported' && (
                            <button
                              onClick={() => handleDispute(file.id)}
                              className="btn btn-sm btn-dispute"
                              disabled={disputingId === file.id}
                              title="Report that you received wrong or incorrect report files"
                            >
                              {disputingId === file.id ? 'Sending...' : '⚠️ Wrong File?'}
                            </button>
                          )}

                          {/* Already reported — show waiting state */}
                          {file.dispute_status === 'reported' && (
                            <span className="dispute-waiting">
                              🕐 Awaiting correction…
                            </span>
                          )}
                        </>
                      )}

                      {/* Cancel pending order */}
                      {file.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(file.id)}
                          className="btn btn-sm btn-danger"
                          disabled={cancellingId === file.id}
                        >
                          {cancellingId === file.id ? 'Cancelling...' : '✕ Cancel Order'}
                        </button>
                      )}

                      {file.status === 'cancelled' && (
                        <span className="cancelled-label">Order cancelled</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerFiles;
