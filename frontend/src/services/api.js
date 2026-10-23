import axios from 'axios';

// API Base URL configuration:
// 1. Reads from process.env.REACT_APP_API_URL (set in Vercel or .env)
// 2. Production fallback: Deployed Render backend ('https://campusai-backend-sfjj.onrender.com/api')
// 3. Fallback: Deployed Render backend ('https://campusai-backend-sfjj.onrender.com/api')
// Automatically handle Vite, Create React App, or directly fallback to Render
const rawApiUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
  'https://campusai-backend-sfjj.onrender.com/api';

// Normalize API_BASE_URL to strip trailing slashes and ensure /api route suffix
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '').endsWith('/api')
  ? rawApiUrl.replace(/\/+$/, '')
  : `${rawApiUrl.replace(/\/+$/, '')}/api`;

let inMemoryAccessToken = null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
  if (token) {
    localStorage.setItem('campus_ai_token', token);
  } else {
    localStorage.removeItem('campus_ai_token');
  }
};

export const getAccessToken = () => {
  return inMemoryAccessToken || localStorage.getItem('campus_ai_token');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true, // Send HttpOnly refresh cookies across origins
});

// Request Interceptor: Inject JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error handling & automatic token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle Network Errors
    if (!error.response) {
      const customError = new Error('Cannot connect to the server. Please check if the backend is running.');
      customError.isNetworkError = true;
      return Promise.reject(customError);
    }

    // Handle 401 Unauthorized
    if (error.response.status === 401 && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url || '';
      const isAuthRoute =
        url.includes('/auth/login') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/logout') ||
        url.includes('/auth/me');

      // Do not attempt refresh on login or refresh endpoint errors
      if (isAuthRoute) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt session refresh using HttpOnly cookie
        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshRes.data.accessToken || refreshRes.data.token;
        setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        localStorage.removeItem('campus_ai_token');
        localStorage.removeItem('currentUser');

        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/' &&
          window.location.pathname !== '/login'
        ) {
          window.location.href = '/';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Format server error message
    const message =
      error.response.data?.message ||
      error.response.data?.error ||
      `Request failed with status code ${error.response.status}`;

    const formattedError = new Error(message);
    formattedError.status = error.response.status;
    formattedError.data = error.response.data;

    return Promise.reject(formattedError);
  }
);

export default api;
