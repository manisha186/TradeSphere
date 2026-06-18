import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Access Token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Token Expiration & Refresh Automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and not already retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Check if it's due to token expiration
      const errorData = error.response.data;
      const isExpired = errorData.code === 'TOKEN_EXPIRED' || errorData.message === 'Token expired';

      if (isExpired) {
        originalRequest._retry = true;
        try {
          // Attempt token refresh
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          
          if (response.data.success && response.data.accessToken) {
            const newToken = response.data.accessToken;
            localStorage.setItem('accessToken', newToken);
            
            // Retry the original request with new token
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - token is completely invalid/expired
          localStorage.removeItem('accessToken');
          // Dispatch a custom logout event or handle redirection
          window.dispatchEvent(new Event('auth-logout'));
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
