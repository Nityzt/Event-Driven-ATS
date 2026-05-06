// src/api/auth.js
import apiClient from './client';

export const authAPI = {
  login: async (email, password) => {
    return await apiClient.post('/auth/login', { email, password });
  },

  register: async (name, email, password, role = 'Recruiter') => {
    return await apiClient.post('/auth/register', { name, email, password, role });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    return await apiClient.get('/auth/me');
  }
};