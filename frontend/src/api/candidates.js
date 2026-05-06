// src/api/candidates.js
import apiClient from './client';

export const candidatesAPI = {
  getAll: async (params = {}) => {
    return await apiClient.get('/candidates', { params });
  },

  getById: async (id) => {
    return await apiClient.get(`/candidates/${id}`);
  },

  create: async (candidateData) => {
    // Handle file upload with FormData
    const formData = new FormData();
    
    Object.keys(candidateData).forEach(key => {
      if (key === 'skills' || key === 'experience') {
        formData.append(key, JSON.stringify(candidateData[key]));
      } else if (key === 'resume' && candidateData[key] instanceof File) {
        formData.append('resume', candidateData[key]);
      } else {
        formData.append(key, candidateData[key]);
      }
    });

    return await apiClient.post('/candidates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  update: async (id, candidateData) => {
    const formData = new FormData();
    
    Object.keys(candidateData).forEach(key => {
      if (key === 'skills' || key === 'experience') {
        formData.append(key, JSON.stringify(candidateData[key]));
      } else if (key === 'resume' && candidateData[key] instanceof File) {
        formData.append('resume', candidateData[key]);
      } else if (candidateData[key] !== undefined) {
        formData.append(key, candidateData[key]);
      }
    });

    return await apiClient.put(`/candidates/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  delete: async (id) => {
    return await apiClient.delete(`/candidates/${id}`);
  },

  search: async (query, filters = {}) => {
    return await apiClient.get('/candidates/search', {
      params: { q: query, ...filters }
    });
  }
};