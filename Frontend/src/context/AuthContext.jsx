import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsedesk_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('pulsedesk_token'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('pulsedesk_token')));

  useEffect(() => {
    let active = true;
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await authService.getProfile();
        if (active) {
          setUser(profile);
          localStorage.setItem('pulsedesk_user', JSON.stringify(profile));
        }
      } catch {
        if (active) {
          localStorage.removeItem('pulsedesk_token');
          localStorage.removeItem('pulsedesk_user');
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    verifySession();
    return () => {
      active = false;
    };
  }, [token]);

  const saveSession = (authResponse) => {
    localStorage.setItem('pulsedesk_token', authResponse.token);
    localStorage.setItem('pulsedesk_user', JSON.stringify(authResponse.user));
    setToken(authResponse.token);
    setUser(authResponse.user);
  };

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    saveSession(data);
    return data.user;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    saveSession(data);
    return data.user;
  };

  const registerAgent = async (payload) => {
    const data = await authService.registerAgent(payload);
    saveSession(data);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('pulsedesk_token');
    localStorage.removeItem('pulsedesk_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        isAdmin: user?.role === 'Admin',
        isAgent: user?.role === 'Agent',
        isCustomer: user?.role === 'Customer',
        login,
        register,
        registerAgent,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
