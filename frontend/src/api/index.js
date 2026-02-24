/**
 * Central Axios instance.
 * Reads JWT from 'access_token' key in localStorage (matches AuthContext).
 */
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    timeout: 30000,
});

// ── Attach JWT to every request ───────────────────────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Handle 401: clear auth and go to login ────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only redirect if NOT already on login page (prevents redirect loop)
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('access_token');
                localStorage.removeItem('role');
                localStorage.removeItem('email');
                localStorage.removeItem('full_name');
                window.location.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
