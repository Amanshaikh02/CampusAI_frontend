import api from './api';

export const chatService = {
  // Global search across Admin, Faculty, and Student users
  async searchUsers(query = '') {
    const response = await api.get('/chat/search', {
      params: { query }
    });
    return response.data.data || response.data.users || [];
  },

  // Get active conversations list for current user
  async getConversations() {
    const response = await api.get('/chat/conversations');
    return response.data.data || [];
  },

  // Get chronological chat history with a specific user
  async getChatHistory(userId) {
    if (!userId) return { messages: [], targetUser: null };
    const response = await api.get(`/chat/history/${userId}`);
    return {
      messages: response.data.data || response.data.messages || [],
      targetUser: response.data.targetUser || null
    };
  },

  // Send message via REST API fallback
  async sendMessage(receiverId, text) {
    const response = await api.post('/chat/send', {
      receiverId,
      text
    });
    return response.data.data;
  },

  // Mark all incoming messages from user as read
  async markAsRead(userId) {
    if (!userId) return;
    const response = await api.put(`/chat/read/${userId}`);
    return response.data;
  }
};

export default chatService;
