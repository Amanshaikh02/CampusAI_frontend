import { io } from 'socket.io-client';

const rawSocketUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
  'https://campusai-backend-sfjj.onrender.com';

const SOCKET_URL = rawSocketUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

class SocketService {
  constructor() {
    this.socket = null;
    this.currentUserId = null;
  }

  // Connect to Socket.io server with current user ID
  connect(user) {
    const userId = user?._id || user?.id;
    if (!userId) return null;

    if (this.socket && this.socket.connected && this.currentUserId === userId.toString()) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.currentUserId = userId.toString();

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: {
        userId: this.currentUserId
      },
      query: {
        userId: this.currentUserId
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('[SocketClient] Connected to server with ID:', this.socket.id);
      this.socket.emit('join', this.currentUserId);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[SocketClient] Connection warning:', error.message);
    });

    return this.socket;
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
    }
  }

  // Ensure current user is in their personal room
  joinUserRoom(userId) {
    if (this.socket && userId) {
      this.socket.emit('join', userId.toString());
    }
  }

  // Send message via Socket
  sendMessage(senderId, receiverId, text, callback) {
    if (!this.socket) {
      if (callback) callback({ success: false, message: 'Socket not connected' });
      return;
    }
    this.socket.emit('send_message', { senderId, receiverId, text }, callback);
  }

  // Emit typing indicator
  emitTyping(senderId, receiverId, senderName) {
    if (this.socket) {
      this.socket.emit('typing', { senderId, receiverId, senderName });
    }
  }

  // Emit stop typing indicator
  emitStopTyping(senderId, receiverId) {
    if (this.socket) {
      this.socket.emit('stop_typing', { senderId, receiverId });
    }
  }

  // Emit read receipt
  emitMarkRead(readerId, senderId) {
    if (this.socket) {
      this.socket.emit('mark_read', { readerId, senderId });
    }
  }

  // Subscribe to incoming messages
  onReceiveMessage(handler) {
    if (!this.socket) return () => {};
    this.socket.on('receive_message', handler);
    return () => this.socket?.off('receive_message', handler);
  }

  // Subscribe to sent message acknowledgements
  onMessageSent(handler) {
    if (!this.socket) return () => {};
    this.socket.on('message_sent', handler);
    return () => this.socket?.off('message_sent', handler);
  }

  // Subscribe to live typing events
  onUserTyping(handler) {
    if (!this.socket) return () => {};
    this.socket.on('user_typing', handler);
    return () => this.socket?.off('user_typing', handler);
  }

  // Subscribe to stop typing events
  onUserStopTyping(handler) {
    if (!this.socket) return () => {};
    this.socket.on('user_stop_typing', handler);
    return () => this.socket?.off('user_stop_typing', handler);
  }

  // Subscribe to conversation updates
  onConversationUpdated(handler) {
    if (!this.socket) return () => {};
    this.socket.on('conversation_updated', handler);
    return () => this.socket?.off('conversation_updated', handler);
  }
}

export const socketService = new SocketService();
export default socketService;
