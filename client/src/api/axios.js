import axios from 'axios';
import { clearAuthStorage, getStoredToken } from '../utils/authStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
      // Lazy import avoids circular dependency: store ↔ authSlice ↔ api
      const { store } = await import('../redux/store');
      const { logout } = await import('../redux/slices/authSlice');
      store.dispatch(logout());
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
