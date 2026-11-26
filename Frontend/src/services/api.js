import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pulsedesk_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('pulsedesk_token');
        localStorage.removeItem('pulsedesk_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors) {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey && Array.isArray(data.errors[firstKey]) && data.errors[firstKey].length > 0) {
      return data.errors[firstKey][0];
    }
  }
  if (error?.message === 'Network Error') {
    return 'Unable to connect to the server. Make sure the backend API is running.';
  }
  return fallback;
}

export default api;
