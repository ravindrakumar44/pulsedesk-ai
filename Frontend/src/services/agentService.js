import api from './api';

export const agentService = {
  async getDashboard() {
    const { data } = await api.get('/agent/dashboard');
    return data;
  },

  async getAvailableComplaints(filters = {}) {
    const params = {};
    if (filters.priority) params.priority = filters.priority;
    if (filters.sentiment) params.sentiment = filters.sentiment;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;

    const { data } = await api.get('/agent/available-complaints', { params });
    return data;
  },

  async getMyComplaints(filters = {}) {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.sentiment) params.sentiment = filters.sentiment;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;

    const { data } = await api.get('/agent/my-complaints', { params });
    return data;
  },

  async getComplaintById(id) {
    const { data } = await api.get(`/agent/complaints/${id}`);
    return data;
  },

  async claimComplaint(id) {
    const { data } = await api.post(`/agent/complaints/${id}/claim`);
    return data;
  },

  async updateStatus(id, status, resolutionMessage = null) {
    const { data } = await api.put(`/agent/complaints/${id}/status`, {
      status,
      resolutionMessage,
    });
    return data;
  },

  async resolveComplaint(id, resolutionMessage) {
    const { data } = await api.post(`/agent/complaints/${id}/resolve`, {
      resolutionMessage,
    });
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/agent/profile');
    return data;
  },
};
