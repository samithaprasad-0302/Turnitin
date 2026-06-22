// Helper functions for frontend
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status) => {
  const colors = {
    pending: '#ffc107',
    accepted: '#17a2b8',
    in_progress: '#007bff',
    completed: '#28a745',
    cancelled: '#dc3545'
  };
  return colors[status] || '#6c757d';
};

export const getStatusLabel = (status) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getServiceTypeLabel = (type) => {
  const labels = {
    ai_detection: 'AI Detection',
    plagiarism_check: 'Plagiarism Check',
    both: 'Both (AI + Plagiarism)'
  };
  return labels[type] || type;
};

export const getRoleLabel = (role) => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const truncateText = (text, length) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};
