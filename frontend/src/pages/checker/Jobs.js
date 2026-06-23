import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import '../../styles/list.css';
import '../../styles/forms.css';

/* ── helpers ── */
const formatBytes = (bytes) => {
  if (!bytes) return 'Unknown';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  return (kb / 1024).toFixed(2) + ' MB';
};

const CheckerJobs = () => {
  const location = useLocation();

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    if (params.get('filter') === 'accepted' || params.get('tab') === 'accepted') return 'accepted';
    if (params.get('tab') === 'completed') return 'completed';
    return 'pending';
  };

  const [files, setFiles]             = useState([]);
  const [activeCount, setActiveCount]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState(getInitialTab);
  const [acceptingId, setAcceptingId] = useState(null);
  const [uploadPanels, setUploadPanels] = useState({});

  const MAX_JOBS = 3;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let queryTab = 'pending';
    if (params.get('filter') === 'accepted' || params.get('tab') === 'accepted') queryTab = 'accepted';
    else if (params.get('tab') === 'completed') queryTab = 'completed';
    setTab(queryTab);
  }, [location.search]);

  useEffect(() => {
    fetchFiles(false);

    const handleRealtime = () => {
      fetchFiles(true);
    };

    window.addEventListener('realtime-update', handleRealtime);
    const interval = setInterval(handleRealtime, 60000);

    return () => {
      window.removeEventListener('realtime-update', handleRealtime);
      clearInterval(interval);
    };
  }, [tab]);

  const fetchFiles = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    try {
      const endpoint =
        tab === 'pending'   ? '/api/files/pending'   :
        tab === 'completed' ? '/api/files/completed'  :
                              '/api/files/accepted';
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFiles(response.data.files);
      // Active count is only returned by the pending endpoint
      if (response.data.activeCount !== undefined) {
        setActiveCount(response.data.activeCount);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  /* ── Accept job (required before download) ── */
  const handleAccept = async (fileId) => {
    if (!window.confirm('Accept this job? You will be exclusively assigned to this document.')) return;
    setAcceptingId(fileId);
    try {
      await axios.post(`/api/files/${fileId}/accept`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Switch to accepted tab to show the job
      setTab('accepted');
    } catch (error) {
      alert('Failed to accept job: ' + (error.response?.data?.message || error.message));
    } finally {
      setAcceptingId(null);
    }
  };

  /* ── Download (only works after accepting) ── */
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

  /* ── Report panel helpers ── */
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
      fetchFiles();
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

  if (loading) return <div className="loading">Loading...</div>;

  const atLimit = activeCount >= MAX_JOBS;
  const normalAccepted = files.filter(f => f.dispute_status !== 'reported');
  const disputed = files.filter(f => f.dispute_status === 'reported');

  const renderJobCard = (file) => {
    const panel = uploadPanels[file.id] || {};
    const isAccepting = acceptingId === file.id;

    return (
      <div key={file.id} className={`job-card${file.dispute_status === 'reported' && tab === 'accepted' ? ' job-card-disputed' : ''}`}>

        {/* ── Urgent Wrong-file alert — shown at top of disputed cards ── */}
        {tab === 'accepted' && file.dispute_status === 'reported' && (
          <div className="dispute-alert-banner">
            <div className="dispute-alert-icon">🚨</div>
            <div className="dispute-alert-body">
              <strong>Customer Reported Wrong Files!</strong>
              <p>The customer says the uploaded reports are incorrect. Please re-upload the correct files immediately using the <em>Upload Reports</em> button below.</p>
            </div>
          </div>
        )}

        {/* ── Card header ── */}
        <div className="job-card-header">
          <h3>{file.title || file.original_file}</h3>
          <span className={`file-type-badge type-${(file.file_type || 'file').toLowerCase()}`}>
            {file.file_type || 'FILE'}
          </span>
        </div>

        {/* ── File meta info ── */}
        <div className="job-meta">
          <span className="meta-item">👤 {file.customer_name}</span>
          <span className="meta-item">🔧 {file.service_type.replace(/_/g, ' ')}</span>
          <span className="meta-item">📦 {formatBytes(file.file_size)}</span>
          <span className="meta-item">📅 {new Date(file.upload_date).toLocaleString()}</span>
        </div>

        <div className="job-status-row">
          <span className={`badge badge-status-${file.status}`}>{file.status}</span>
        </div>

        {/* ── Actions ── */}
        <div className="job-actions">

          {/* Available tab: Accept first, no download */}
          {tab === 'pending' && (
            <button
              onClick={() => handleAccept(file.id)}
              className={`btn btn-block ${atLimit ? 'btn-secondary' : 'btn-success'}`}
              disabled={isAccepting || atLimit}
              title={atLimit ? 'Complete your current 3 jobs before accepting new ones' : ''}
            >
              {isAccepting ? '⏳ Accepting...' : atLimit ? '🔒 Slot Full' : '✅ Accept Job'}
            </button>
          )}

          {/* Accepted tab: Download + Upload Reports */}
          {tab === 'accepted' && (
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

        {/* Hint shown on available tab */}
        {tab === 'pending' && (
          <p className="accept-hint">
            ⚠️ You must accept this job to download and work on the document.
          </p>
        )}

        {/* ── Inline Report Upload Panel (accepted tab only) ── */}
        {tab === 'accepted' && panel.open && (
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
              {panel.uploading ? '⏳ Uploading & Completing...' : '🚀 Submit Reports & Complete Job'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="jobs-container">
      <h1>Checking Jobs</h1>

      <div className="tabs">
        <button
          className={`tab ${tab === 'pending' ? 'active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Available Jobs {tab === 'pending' ? `(${files.length})` : ''}
        </button>
        <button
          className={`tab ${tab === 'accepted' ? 'active' : ''}`}
          onClick={() => setTab('accepted')}
        >
          My Accepted Jobs {tab === 'accepted' ? `(${files.length})` : ''}
        </button>
        <button
          className={`tab ${tab === 'completed' ? 'active' : ''}`}
          onClick={() => setTab('completed')}
        >
          ✅ Completed Jobs {tab === 'completed' ? `(${files.length})` : ''}
        </button>
      </div>

      {tab === 'pending' ? (
        <>
          {/* ── Capacity banner ── */}
          <div className={`capacity-banner ${atLimit ? 'capacity-full' : activeCount > 0 ? 'capacity-partial' : 'capacity-free'}`}>
            <span className="capacity-icon">
              {atLimit ? '🔒' : activeCount > 0 ? '⚡' : '✅'}
            </span>
            <span className="capacity-text">
              <strong>{activeCount} / {MAX_JOBS}</strong> active job slots used
              {atLimit
                ? ' — Complete your current jobs to accept new ones.'
                : ` — You can accept ${MAX_JOBS - activeCount} more job${MAX_JOBS - activeCount !== 1 ? 's' : ''}.`
              }
            </span>
            {activeCount > 0 && (
              <button
                className="btn btn-sm btn-outline-secondary capacity-view-btn"
                onClick={() => setTab('accepted')}
              >
                View My Jobs
              </button>
            )}
          </div>

          {files.length === 0 ? (
            <div className="empty-state">
              <p>📭 No available jobs at the moment.</p>
            </div>
          ) : (
            <div className="jobs-grid">
              {files.map(renderJobCard)}
            </div>
          )}
        </>
      ) : tab === 'accepted' ? (
        // ── Accepted Jobs tab ──
        files.length === 0 ? (
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
        )
      ) : tab === 'completed' ? (
        // ── Completed Jobs tab ──
        files.length === 0 ? (
          <div className="empty-state">
            <p>🎉 No completed jobs yet.</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {files.map(file => (
              <div key={file.id} className="job-card job-card-completed">
                <div className="job-card-header">
                  <h3>{file.title || file.original_file}</h3>
                  <span className={`file-type-badge type-${(file.file_type || 'file').toLowerCase()}`}>
                    {file.file_type || 'FILE'}
                  </span>
                </div>

                <div className="job-meta">
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
        )
      ) : null}
    </div>
  );
};

export default CheckerJobs;
