// src/api/matches.js
import apiClient from './client';

export const matchesAPI = {
  getAll: async (params = {}) => {
    return await apiClient.get('/matches', { params });
  },

  getByJobId: async (jobId, params = {}) => {
    return await apiClient.get(`/matches/job/${jobId}`, { params });
  },

  getByCandidateId: async (candidateId, params = {}) => {
    return await apiClient.get(`/matches/candidate/${candidateId}`, { params });
  },

  recalculateForJob: async (jobId) => {
    return await apiClient.post(`/matches/recalculate/job/${jobId}`);
  },

  getMatchScore: async (candidateId, jobId) => {
    return await apiClient.get('/matches/score', {
      params: { candidateId, jobId }
    });
  },

  getById: async (id) => {
    return await apiClient.get(`/matches/${id}`);
  }
};