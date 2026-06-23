import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/auth.css';
import '../styles/dashboard.css';

// Web Audio API Synthesizers for Notifications
const playProcessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Rising chime note sequence (A4 then C#5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(554.37, now + 0.12);
    gain2.gain.setValueAtTime(0.12, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.47);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.47);
  } catch (err) {
    console.error('Audio synthesizer error:', err);
  }
};

const playCompleteSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Rising success chime (C5 -> E5 -> G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.10, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.08);
    gain2.gain.setValueAtTime(0.10, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.33);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.33);

    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(783.99, now + 0.16);
    gain3.gain.setValueAtTime(0.12, now + 0.16);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.16);
    osc3.stop(now + 0.55);
  } catch (err) {
    console.error('Audio synthesizer error:', err);
  }
};

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

  const prevFilesRef = useRef([]);

  useEffect(() => {
    fetchDetails(false);
    const interval = setInterval(() => fetchDetails(true), 10000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchDetails = async (isPoll = false) => {
    try {
      const response = await axios.get(`/api/system/temporary-links/${token}`);
      setLinkInfo(response.data.link);
      const newFiles = response.data.files || [];
      
      if (isPoll && prevFilesRef.current && prevFilesRef.current.length > 0) {
        newFiles.forEach(newFile => {
          const prevFile = prevFilesRef.current.find(f => f.id === newFile.id);
          if (prevFile) {
            if (prevFile.status === 'pending' && (newFile.status === 'accepted' || newFile.status === 'in_progress')) {
              playProcessSound();
            } else if ((prevFile.status === 'accepted' || prevFile.status === 'in_progress') && newFile.status === 'completed') {
              playCompleteSound();
            }
          }
        });
      }
      
      setFiles(newFiles);
      prevFilesRef.current = newFiles;
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

                {uploadFile && uploadFile.size < 7 * 1024 * 1024 && (
                  <div className="file-size-warning-box" style={{ marginTop: '14px' }}>
                    <span>⚠️</span>
                    <div>
                      <strong>Below 7 MB Recommendation</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px' }}>
                        Your selected file size is only <strong>{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</strong>. 
                        Please ensure this is the intended document before uploading.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={uploading || !uploadFile}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px' }}
              >
                {uploading ? '⏳ Uploading...' : '🚀 Submit Document'}
              </button>
            </form>
          )}
        </div>

        {/* Guidelines Block */}
        <div className="upload-guidelines-card" style={{ padding: '30px' }}>
          <h3>📋 Document Requirements</h3>
          <p className="guidelines-subtitle" style={{ margin: '0 0 20px' }}>Please ensure your document meets these conditions before uploading to avoid checking errors:</p>
          
          <ul className="guidelines-list">
            <li>
              <span className="guideline-icon">❌</span>
              <div className="guideline-text">
                <strong>No Cover Sheets or Logos</strong>
                <span>Do not upload files containing cover pages, headers with symbols, or university/institution logos.</span>
              </div>
            </li>
            <li>
              <span className="guideline-icon">🔢</span>
              <div className="guideline-text">
                <strong>Word Count Range</strong>
                <span>The document word count must be between 400 and 29,000 words.</span>
              </div>
            </li>
            <li>
              <span className="guideline-icon">💾</span>
              <div className="guideline-text">
                <strong>Minimum File Size</strong>
                <span>Your file size must be at least 7 MB.</span>
              </div>
            </li>
            <li>
              <span className="guideline-icon">🖼️</span>
              <div className="guideline-text">
                <strong>Remove Images</strong>
                <span>You can strip images from the file to save upload time, as Turnitin does not scan/detect them.</span>
              </div>
            </li>
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
                  <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px', fontWeight: 600, minWidth: '320px' }}>Reports</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontSize: '14.5px', fontWeight: 600, color: '#0f172a' }}>{file.title || file.original_filename}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{file.service_type.replace(/_/g, ' ')}</td>
                    <td style={{ padding: '16px' }}>
                      <span className={`badge badge-status-${file.status === 'accepted' || file.status === 'in_progress' ? 'processing' : file.status}`} style={{ textTransform: 'capitalize' }}>
                        {file.status === 'accepted' || file.status === 'in_progress' ? 'processing' : file.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13.5px', color: '#64748b' }}>{new Date(file.upload_date).toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>
                      {file.status === 'completed' ? (
                        <div className="file-action-buttons">
                          {(file.service_type === 'ai_detection' || file.service_type === 'both') && file.ai_report_file && (
                            <button
                              onClick={() => handleDownload(file.id, 'ai', file.ai_report_original_name)}
                              className="ai-report-btn"
                              title="Download AI Detection Report"
                            >
                              🤖 AI Report
                            </button>
                          )}
                          {(file.service_type === 'plagiarism_check' || file.service_type === 'both') && file.plagiarism_report_file && (
                            <button
                              onClick={() => handleDownload(file.id, 'plagiarism', file.plagiarism_report_original_name)}
                              className="plag-report-btn"
                              title="Download Plagiarism Report"
                            >
                              📋 Plagiarism Report
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
