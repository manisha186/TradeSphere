import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on app load if token exists
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            localStorage.removeItem('accessToken');
          }
        } catch (err) {
          console.error('Failed to load user profile on mount:', err);
          // If token was invalid or expired, Axios interceptor will have cleaned it,
          // but just in case:
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();

    // Listen for global logout events triggered by API interceptor failures
    const handleGlobalLogout = () => {
      setUser(null);
      localStorage.removeItem('accessToken');
    };
    
    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => window.removeEventListener('auth-logout', handleGlobalLogout);
  }, []);

  // Register User
  const registerUser = async (name, email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.accessToken);
        setUser(response.data.user);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // Login User
  const loginUser = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.accessToken);
        setUser(response.data.user);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Invalid email or password';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // Logout User
  const logoutUser = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  // Refresh User Balance (used after transactions)
  const refreshUserBalance = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user balance:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register: registerUser,
        login: loginUser,
        logout: logoutUser,
        refreshBalance: refreshUserBalance,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
