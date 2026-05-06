// src/api/applications.js
import apiClient from './client';

export const applicationsAPI = {
  getAll: async (params = {}) => {
    return await apiClient.get('/applications', { params });
  },

  getById: async (id) => {
    return await apiClient.get(`/applications/${id}`);
  },

  create: async (applicationData) => {
    return await apiClient.post('/applications', applicationData);
  },

  update: async (id, applicationData) => {
    return await apiClient.put(`/applications/${id}`, applicationData);
  },

  delete: async (id) => {
    return await apiClient.delete(`/applications/${id}`);
  },

  updateStage: async (id, stage) => {
    return await apiClient.patch(`/applications/${id}/stage`, { stage });
  },

  getTimeline: async (id) => {
    return await apiClient.get(`/applications/${id}/timeline`);
  },

  // SSE endpoint - handled by useSSE hook
  getTimelineStream: (id) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    return `${baseURL}/applications/${id}/timeline/stream?token=${token}`;
  },

  getByCandidateAndJob: async (candidateId, jobId) => {
    return await apiClient.get('/applications', {
      params: { candidateId, jobId }
    });
  }
};