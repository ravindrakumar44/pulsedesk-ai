import api from './api';

export const complaintService = {
  async createComplaint(payload) {
    const { data } = await api.post('/complaints', payload);
    return data;
  },

  async getMyComplaints() {
    const { data } = await api.get('/complaints/my');
    return data;
  },

  async getComplaintById(id) {
    const { data } = await api.get(`/complaints/${id}`);
    return data;
  },

  async previewSentiment(text) {
    const { data } = await api.post('/sentiment/analyze', { text });
    return data;
  },
};
