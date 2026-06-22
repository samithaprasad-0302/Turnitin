import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/auth.css';
import '../styles/dashboard.css';

const SharedUpload = () => {
  const { token } = useParams();
  const [linkInfo, setLinkInfo] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Upload state
  const [serviceType, setServiceType] = useState('both');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [token]);

  const fetchDetails = async () => {
    try {
      const response = await axios.get(`/api/system/temporary-links/${token}`);
      setLinkInfo(response.data.link);
      setFiles(response.data.files || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load upload portal. Link may have been revoked.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const ext = selected.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setMsg('❌ Only PDF (.pdf) and Word (.docx) files are accepted.');
      e.target.value = '';
      setUploadFile(null);
      return;
    }
    setMsg('');
    setUploadFile(selected);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setMsg('❌ Please select a file first.');
      return;
    }
    setUploading(true);
    setMsg('');

    const fd = new FormData();
    fd.append('service_type', serviceType);
    fd.append('file', uploadFile);

    try {
      await axios.post(`/api/system/temporary-links/${token}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMsg('✅ File uploaded successfully! Check status below.');
      setUploadFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      fetchDetails();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId, type, filename) => {
    try {
      const response = await axios.get(`/api/system/temporary-links/${token}/download/${fileId}/${type}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `${type}-report-${fileId}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="loading">Loading upload portal...</div>;

  if (error) {
    return (
      <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="auth-form" style={{ maxWidth: '480px', width: '100%', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', color: '#dc2626' }}>Portal Access Expired</h2>
          <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', margin: '0 0 20px' }}>{error}</p>
          <a href="/login" className="btn btn-primary" style={{ display: 'inline-block', width: '100%', padding: '12px', borderRadius: '8px', textDecoration: 'none', boxSizing: 'border-box' }}>Go to Login</a>
        </div>
      </div>
    );
  }

  const reachedLimit = linkInfo?.uploaded_count >= linkInfo?.file_limit;

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', fontFamily: 'Inter, sans-serif' }}>
      <div className="portal-content-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Retail Check Portal</h1>
        <p style={{ color: '#64748b', fontSize: '16px', marginTop: '6px' }}>Upload your documents to check for Plagiarism and AI-generated content.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'start' }}>
        
        {/* Upload Card */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📤 Upload Document</span>
            <span style={{ fontSize: '13px', padding: '4px 10px', background: reachedLimit ? '#fecaca' : '#eff6ff', color: reachedLimit ? '#991b1b' : '#1d4ed8', borderRadius: '20px', fontWeight: 600 }}>
              {linkInfo?.uploaded_count} / {linkInfo?.file_limit} Uploads Used
            </span>
          </h2>

          {reachedLimit ? (
            <div style={{ padding: '20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#b45309', fontSize: '14.5px', lineHeight: '1.6' }}>
              <strong>Upload Limit Reached</strong>
              <p style={{ margin: '6px 0 0' }}>This temporary link has reached its limit of <strong>{linkInfo?.file_limit}</strong> file uploads. Contact the person who shared this link if you need to check more files.</p>
            </div>
          ) : (
            <form onSubmit={handleUploadSubmit} className="upload-form" style={{ marginTop: '10px' }}>
              {msg && (
                <div style={{ padding: '12px', background: msg.startsWith('✅') ? '#f0fdf4' : '#fdf2f2', color: msg.startsWith('✅') ? '#166534' : '#991b1b', border: '1px solid ' + (msg.startsWith('✅') ? '#bbf7d0' : '#fecaca'), borderRadius: '8px', fontSize: '14px', marginBottom: '15px' }}>
                  {msg}
                </div>
              )}
              
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Service Type</label>
                <select 
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  disabled={uploading}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
                >
                  <option value="both">Both (AI + Plagiarism)</option>
                  <option value="ai_detection">AI Detection Only</option>
                  <option value="plagiarism_check">Plagiarism Check Only</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Select Document <span style={{ color: '#94a3b8', fontSize: '12px' }}>(PDF or DOCX only)</span></label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  accept=".pdf,.docx"
                  disabled={uploading}
                  style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={uploading}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px' }}
              >
                {uploading ? '⏳ Uploading...' : '🚀 Submit Document'}
              </button>
            </form>
          )}
        </div>

        {/* Info Card */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '30px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px', color: '#1e293b' }}>ℹ️ How it works</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#475569', lineHeight: '1.7' }}>
            <li style={{ marginBottom: '8px' }}>Select the service type and upload your PDF or Word document.</li>
            <li style={{ marginBottom: '8px' }}>Once uploaded, the checker team is instantly notified to begin evaluation.</li>
            <li style={{ marginBottom: '8px' }}>Keep this page open or save the URL. You will see progress updates in real time.</li>
            <li>When checking completes, download links for your reports will appear in the files table on the right.</li>
          </ul>
        </div>
      </div>

      {/* Files Table Section */}
      <div style={{ marginTop: '40px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>📄 Uploaded Files & Reports</h2>
          <button
            onClick={fetchDetails}
            className="btn btn-sm btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh Status
          </button>
        </div>
        
        {files.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '14.5px', textAlign: 'center', margin: '20px 0' }}>No files uploaded yet. Use the upload box above to submit one.</p>
        ) : (
          <div className="files-table">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>File Name</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Service Type</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Upload Date</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Reports</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontSize: '14.5px', fontWeight: 600, color: '#0f172a' }}>{file.title || file.original_filename}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{file.service_type.replace(/_/g, ' ')}</td>
                    <td style={{ padding: '16px' }}>
                      <span className={`badge badge-status-${file.status}`} style={{ textTransform: 'capitalize' }}>
                        {file.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13.5px', color: '#64748b' }}>{new Date(file.upload_date).toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>
                      {file.status === 'completed' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(file.service_type === 'ai_detection' || file.service_type === 'both') && file.ai_report_file && (
                            <button
                              onClick={() => handleDownload(file.id, 'ai', file.ai_report_original_name)}
                              className="btn btn-sm btn-primary"
                              title={`AI Report (${file.ai_percentage}%)`}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12.5px' }}
                            >
                              🤖 AI ({file.ai_percentage}%)
                            </button>
                          )}
                          {(file.service_type === 'plagiarism_check' || file.service_type === 'both') && file.plagiarism_report_file && (
                            <button
                              onClick={() => handleDownload(file.id, 'plagiarism', file.plagiarism_report_original_name)}
                              className="btn btn-sm btn-success"
                              title={`Plagiarism Report (${file.plagiarism_percentage}%)`}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12.5px' }}
                            >
                              📋 Plag ({file.plagiarism_percentage}%)
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                          {file.status === 'pending' ? 'Awaiting assignment...' : 'Checking in progress...'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedUpload;
