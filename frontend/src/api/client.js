import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('orderwise_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to normalize responses and handle 401s
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data || {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network request failed',
      },
    };

    // If token is expired or unauthorized (and not on login attempt), clear token & notify
    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('orderwise_token');
      localStorage.removeItem('orderwise_user');
      window.dispatchEvent(new CustomEvent('orderwise:unauthorized'));
    }

    return Promise.reject(errorData);
  }
);

export default apiClient;
export { API_BASE_URL };
