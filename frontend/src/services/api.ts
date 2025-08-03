import axios from 'axios';

// Create an axios instance with base settings
const api = axios.create({
  // Make sure we're using the correct port (9002) and no trailing slash
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:9002',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  // For testing purposes, always use a test token if none exists
  const token = localStorage.getItem('token') || 'test-token-123';
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
