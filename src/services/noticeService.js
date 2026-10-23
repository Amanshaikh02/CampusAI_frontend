import api from './api';

export const noticeService = {
  // Get all notices with optional department/audience filters
  async getNotices(filters = {}) {
    const response = await api.get('/notices', { params: filters });
    return response.data.data;
  },

  // Create new notice
  async createNotice(noticeData) {
    const response = await api.post('/notices', noticeData);
    return response.data.data;
  },

  // Delete notice
  async deleteNotice(id) {
    const response = await api.delete(`/notices/${id}`);
    return response.data;
  }
};

export default noticeService;
