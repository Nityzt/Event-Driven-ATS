import apiClient from './client';

export const workflowsAPI = {
  getAll: async (params = {}) => {
    return await apiClient.get('/workflows', { params });
  },

  getById: async (id) => {
    return await apiClient.get(`/workflows/${id}`);
  },

  create: async (workflowData) => {
    return await apiClient.post('/workflows', workflowData);
  },

  update: async (id, workflowData) => {
    return await apiClient.put(`/workflows/${id}`, workflowData);
  },

  delete: async (id) => {
    return await apiClient.delete(`/workflows/${id}`);
  },

  toggle: async (id) => {
    return await apiClient.patch(`/workflows/${id}/toggle`);
  },

  preview: async (workflowData) => {
    return await apiClient.post('/workflows/preview', workflowData);
  }
};
