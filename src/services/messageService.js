import api from './api';

export const messageService = {
  // Get messages with optional filters (userId, senderId, receiverId)
  async getMessages(filters = {}) {
    const response = await api.get('/messages', { params: filters });
    return response.data.data;
  },

  // Send new message
  async sendMessage(messageData) {
    const response = await api.post('/messages', messageData);
    return response.data.data;
  },

  // Delete message
  async deleteMessage(id) {
    const response = await api.delete(`/messages/${id}`);
    return response.data;
  }
};

export default messageService;
