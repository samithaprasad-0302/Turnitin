import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import '../../styles/dashboard.css';

const FileDetails = ({ fileId }) => {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFileDetails();
    fetchComments();
  }, [fileId]);

  const fetchFileDetails = async () => {
    try {
      const fileResponse = await api.get(`/files/${fileId}`);
      setFile(fileResponse.data.file);

      if (fileResponse.data.file.status === 'completed') {
        const reportResponse = await api.get(`/reports/${fileId}`);
        setReport(reportResponse.data.report);
      }
    } catch (error) {
      console.error('Failed to fetch file details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/reports/${fileId}/comments`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await api.post('/reports/comment', {
        file_id: fileId,
        comment: newComment
      });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="file-details">
      <h1>{file?.title}</h1>

      <div className="file-info">
        <p><strong>Description:</strong> {file?.description || 'N/A'}</p>
        <p><strong>Service Type:</strong> {file?.service_type.replace(/_/g, ' ')}</p>
        <p><strong>Status:</strong> <span className="badge">{file?.status}</span></p>
        <p><strong>Uploaded:</strong> {new Date(file?.upload_date).toLocaleString()}</p>
      </div>

      {report && (
        <div className="report-section">
          <h2>Reports</h2>
          {report.ai_percentage !== null && (
            <div className="report-item">
              <h3>AI Detection</h3>
              <p><strong>Percentage:</strong> {report.ai_percentage}%</p>
              <p>{report.ai_report}</p>
            </div>
          )}
          {report.plagiarism_percentage !== null && (
            <div className="report-item">
              <h3>Plagiarism Check</h3>
              <p><strong>Percentage:</strong> {report.plagiarism_percentage}%</p>
              <p>{report.plagiarism_report}</p>
            </div>
          )}
          {report.remarks && (
            <div className="remarks">
              <h3>Remarks</h3>
              <p>{report.remarks}</p>
            </div>
          )}
        </div>
      )}

      <div className="comments-section">
        <h2>Comments</h2>
        <div className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows="3"
          />
          <button onClick={handleAddComment} className="btn btn-primary">
            Add Comment
          </button>
        </div>

        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <strong>{comment.name} ({comment.role})</strong>
              <p>{comment.comment}</p>
              <small>{new Date(comment.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileDetails;
