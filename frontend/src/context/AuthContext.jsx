import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

function getStoredToken() {
  return localStorage.getItem('access_token');
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = getStoredToken();
      const role = localStorage.getItem('role');
      const email = localStorage.getItem('email');
      const fullName = localStorage.getItem('full_name');

      if (token) {
        const restored = { token, role, email, full_name: fullName };
        setUser(restored);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('[Auth] Failed to restore session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/login`, { email, password });
    const data = res.data;
    const token = data.access_token;

    if (!token) throw new Error(data.error || 'Login failed — no token received');

    localStorage.setItem('access_token', token);
    localStorage.setItem('role', data.role || 'client');
    localStorage.setItem('email', email);
    localStorage.setItem('full_name', data.user?.full_name || '');

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Role-based redirect
    const dest =
      data.role === 'admin' ? '/admin-dashboard' :
        data.role === 'lawyer' ? '/lawyer-dashboard' :
          '/dashboard';
    window.location.replace(dest);
  };

  const logout = () => {
    ['access_token', 'role', 'email', 'full_name', 'token'].forEach(k => localStorage.removeItem(k));
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    window.location.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
