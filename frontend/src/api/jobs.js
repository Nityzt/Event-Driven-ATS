// src/api/jobs.js
import apiClient from './client';

export const jobsAPI = {
  getAll: async (params = {}) => {
    return await apiClient.get('/jobs', { params });
  },

  getById: async (id) => {
    return await apiClient.get(`/jobs/${id}`);
  },

  create: async (jobData) => {
    return await apiClient.post('/jobs', jobData);
  },

  update: async (id, jobData) => {
    return await apiClient.put(`/jobs/${id}`, jobData);
  },

  delete: async (id) => {
    return await apiClient.delete(`/jobs/${id}`);
  },

  search: async (query, filters = {}) => {
    return await apiClient.get('/jobs/search', {
      params: { q: query, ...filters }
    });
  }
};