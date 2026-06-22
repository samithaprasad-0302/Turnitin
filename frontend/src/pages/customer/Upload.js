import React, { useState } from 'react';
import axios from 'axios';
import '../../styles/forms.css';

const CustomerUpload = () => {
  const [formData, setFormData] = useState({
    service_type: 'both'
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const ext = selected.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setMessage('Only PDF (.pdf) and Word (.docx) files are accepted.');
      e.target.value = '';
      setFile(null);
      return;
    }
    setMessage('');
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    const uploadFormData = new FormData();
    uploadFormData.append('service_type', formData.service_type);
    uploadFormData.append('file', file);

    try {
      await axios.post('/api/files/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setMessage('File uploaded successfully!');
      setFormData({ service_type: 'both' });
      setFile(null);
    } catch (error) {
      setMessage('Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload Document</h1>
      
      {message && <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="upload-form">

        <div className="form-group">
          <label>Service Type</label>
          <select name="service_type" value={formData.service_type} onChange={handleChange}>
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
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
    </div>
  );
};

export default CustomerUpload;
