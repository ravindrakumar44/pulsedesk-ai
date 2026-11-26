import api from './api';

export const adminService = {
  async getDashboard() {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },

  async getAllComplaints(filters = {}) {
    const params = {};
    if (filters.sentiment) params.sentiment = filters.sentiment;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;

    const { data } = await api.get('/admin/complaints', { params });
    return data;
  },

  async getComplaintById(id) {
    const { data } = await api.get(`/admin/complaints/${id}`);
    return data;
  },

  async getAnalytics() {
    const { data } = await api.get('/admin/analytics');
    return data;
  },

  async getCustomers() {
    const { data } = await api.get('/admin/customers');
    return data;
  },

  async getAgents() {
    const { data } = await api.get('/admin/agents');
    return data;
  },

  async createAgent(payload) {
    const { data } = await api.post('/admin/agents', payload);
    return data;
  },
};
