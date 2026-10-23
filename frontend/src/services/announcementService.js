import api from './api';

export const announcementService = {
  // Get all announcements with optional department/targetRole filters
  async getAnnouncements(filters = {}) {
    const response = await api.get('/announcements', { params: filters });
    return response.data.data;
  },

  // Create new announcement (Admin only)
  async createAnnouncement(announcementData) {
    const response = await api.post('/announcements', announcementData);
    return response.data.data;
  },

  // Delete announcement (Admin only)
  async deleteAnnouncement(id) {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  }
};

export default announcementService;
