const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const apiCall = async (method, endpoint, data = null, headers = {}) => {
  const token = localStorage.getItem('token');
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: defaultHeaders
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: data ? JSON.stringify(data) : null
    });

    if (!response.ok) {
      throw new Error('API call failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export default apiCall;
