// src/api/auditLogs.js
import apiClient from './client';

export const auditLogsAPI = {
  getAll: async (params = {}) => {
    return await apiClient.get('/audit-logs', { params });
  },

  getById: async (id) => {
    return await apiClient.get(`/audit-logs/${id}`);
  },

  getByEntity: async (entityType, entityId) => {
    return await apiClient.get('/audit-logs', {
      params: { entityType, entityId }
    });
  },

  getByUser: async (userId) => {
    return await apiClient.get('/audit-logs', {
      params: { userId }
    });
  }
};