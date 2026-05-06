import apiClient from './client';

export const runsAPI = {
  getAll: async (params = {}) => {
    return await apiClient.get('/runs', { params });
  },

  getById: async (id) => {
    return await apiClient.get(`/runs/${id}`);
  },

  pause: async (id) => {
    return await apiClient.post(`/runs/${id}/pause`);
  },

  resume: async (id, context = {}) => {
    return await apiClient.post(`/runs/${id}/resume`, { context });
  },

  cancel: async (id) => {
    return await apiClient.post(`/runs/${id}/cancel`);
  }
};
