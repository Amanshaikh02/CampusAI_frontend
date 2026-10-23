const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const formatRoleModel = (role = '') => {
  const r = role.toLowerCase();
  if (r === 'admin') return 'Admin';
  if (r === 'faculty' || r === 'teacher') return 'Faculty';
  return 'Student';
};

function setupChatSocket(io) {
  io.on('connection', (socket) => {
    const handshakeUserId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    if (handshakeUserId) {
      socket.join(handshakeUserId.toString());
      console.log(`[Socket.io] Connected: ${socket.id} -> User Room: ${handshakeUserId}`);
    }

    // Explicit room join event
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`[Socket.io] User ${userId} joined personal room`);
      }
    });

    socket.on('join_chat', (userId) => {
      if (userId) {
        socket.join(userId.toString());
      }
    });

    // Handle real-time messaging
    socket.on('send_message', async (data, callback) => {
      try {
        const { senderId, receiverId, text, message } = data || {};
        const content = (text || message || '').trim();

        if (!senderId || !receiverId || !content) {
          if (typeof callback === 'function') {
            return callback({ success: false, message: 'senderId, receiverId, and text are required.' });
          }
          return;
        }

        // Look up sender and receiver from DB
        const [senderUser, receiverUser] = await Promise.all([
          User.findById(senderId).lean(),
          User.findById(receiverId).lean()
        ]);

        if (!senderUser || !receiverUser) {
          if (typeof callback === 'function') {
            return callback({ success: false, message: 'Invalid sender or receiver ID.' });
          }
          return;
        }

        // 1. Find or create Conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [senderUser._id, receiverUser._id] }
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [senderUser._id, receiverUser._id],
            lastMessage: content,
            lastMessageAt: new Date(),
            lastSender: senderUser._id
          });
        } else {
          conversation.lastMessage = content;
          conversation.lastMessageAt = new Date();
          conversation.lastSender = senderUser._id;
          await conversation.save();
        }

        // 2. Create Message in MongoDB
        const newMsg = await Message.create({
          sender: senderUser._id,
          senderModel: formatRoleModel(senderUser.role),
          senderName: senderUser.name,
          senderRole: senderUser.role,
          senderId: senderUser._id.toString(),
          receiver: receiverUser._id,
          receiverModel: formatRoleModel(receiverUser.role),
          receiverName: receiverUser.name,
          receiverRole: receiverUser.role,
          receiverId: receiverUser._id.toString(),
          text: content,
          message: content,
          conversationId: conversation._id,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false
        });

        const formattedPayload = {
          _id: newMsg._id.toString(),
          id: newMsg._id.toString(),
          conversationId: conversation._id.toString(),
          sender: senderUser._id.toString(),
          senderName: senderUser.name,
          senderRole: formatRoleModel(senderUser.role),
          receiver: receiverUser._id.toString(),
          receiverName: receiverUser.name,
          receiverRole: formatRoleModel(receiverUser.role),
          text: content,
          message: content,
          isRead: false,
          timestamp: newMsg.timestamp,
          createdAt: newMsg.createdAt
        };

        // 3. Emit receive_message event directly to receiver's room
        io.to(receiverUser._id.toString()).emit('receive_message', {
          ...formattedPayload,
          isSender: false
        });

        // 4. Emit message_sent event back to sender's room
        io.to(senderUser._id.toString()).emit('message_sent', {
          ...formattedPayload,
          isSender: true
        });

        // 5. Notify both parties about conversation update
        const convSummary = {
          conversationId: conversation._id.toString(),
          lastMessage: content,
          lastMessageAt: conversation.lastMessageAt,
          lastSender: senderUser._id.toString()
        };
        io.to(receiverUser._id.toString()).emit('conversation_updated', convSummary);
        io.to(senderUser._id.toString()).emit('conversation_updated', convSummary);

        if (typeof callback === 'function') {
          callback({ success: true, data: formattedPayload });
        }
      } catch (err) {
        console.error('[Socket.io] Error in send_message handler:', err);
        if (typeof callback === 'function') {
          callback({ success: false, message: err.message || 'Server error processing message.' });
        }
      }
    });

    // Real-time typing indicators
    socket.on('typing', ({ senderId, receiverId, senderName }) => {
      if (receiverId) {
        io.to(receiverId.toString()).emit('user_typing', { senderId, senderName });
      }
    });

    socket.on('stop_typing', ({ senderId, receiverId }) => {
      if (receiverId) {
        io.to(receiverId.toString()).emit('user_stop_typing', { senderId });
      }
    });

    // Message read receipts
    socket.on('mark_read', async ({ readerId, senderId }) => {
      try {
        if (readerId && senderId) {
          await Message.updateMany(
            { sender: senderId, receiver: readerId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
          );
          io.to(senderId.toString()).emit('messages_read', { readerId });
        }
      } catch (e) {
        console.error('[Socket.io] Error marking read:', e);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
}

module.exports = { setupChatSocket };
