import api from './api';

export const authService = {
  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  async registerAgent(payload) {
    const { data } = await api.post('/auth/register-agent', payload);
    return data;
  },

  async login(payload) {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data;
  },
};
