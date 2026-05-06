/* eslint-disable react-refresh/only-export-components */
// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

// Helper function to get initial user state
const getInitialUser = () => {
  try {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      return JSON.parse(savedUser);
    }
  } catch (error) {
    console.error('Failed to parse saved user:', error);
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);

  const login = useCallback(async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      console.log('Login response:', response);
      
      // Backend returns: { success: true, data: { user, accessToken, refreshToken } }
      const { data } = response;
      
      if (!data || !data.accessToken || !data.user) {
        console.error('❌ Login response missing data:', response);
        return { success: false, error: 'Invalid server response' };
      }
      
      // Save accessToken as 'token' for consistency
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      console.log('✅ Login successful!');
      console.log('Token:', data.accessToken.substring(0, 20) + '...');
      console.log('User:', data.user.name, data.user.email);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (name, email, password, role = 'Recruiter') => {
    try {
      const response = await apiClient.post('/auth/register', { 
        name, 
        email, 
        password, 
        role 
      });
      
      console.log('Register response:', response);
      
      // Backend returns: { success: true, data: { user, accessToken, refreshToken } }
      const { data } = response;
      
      if (!data || !data.accessToken || !data.user) {
        console.error('❌ Register response missing data:', response);
        return { success: false, error: 'Invalid server response' };
      }
      
      // Save accessToken as 'token' for consistency
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      console.log('✅ Registration successful!');
      console.log('Token:', data.accessToken.substring(0, 20) + '...');
      console.log('User:', data.user.name, data.user.email);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Register error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('✅ Logged out');
  }, []);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const value = useMemo(() => ({
    user,
    login,
    register,
    logout,
    hasRole,
    isAuthenticated: !!user
  }), [user, login, register, logout, hasRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}