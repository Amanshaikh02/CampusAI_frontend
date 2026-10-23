import api from './api';

export const eventService = {
  // Get all events with optional department filter
  async getEvents(department) {
    const response = await api.get('/events', {
      params: department ? { department } : {}
    });
    return response.data.data;
  },

  // Create new event
  async createEvent(eventData) {
    const response = await api.post('/events', eventData);
    return response.data.data;
  },

  // Delete event
  async deleteEvent(id) {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  }
};

export default eventService;
