const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Helper to format role as capitalized model ('Admin', 'Faculty', 'Student')
const formatRoleModel = (role = '') => {
  const r = role.toLowerCase();
  if (r === 'admin') return 'Admin';
  if (r === 'faculty' || r === 'teacher') return 'Faculty';
  return 'Student';
};

// @desc    Global User Search for Chat across Admin, Faculty, and Student roles
// @route   GET /api/chat/search?query=name
// @access  Private (All Authenticated Roles)
exports.searchUsers = async (req, res) => {
  try {
    const rawQuery = (req.query.query || req.query.q || req.query.search || '').trim();
    const currentUserId = req.user?._id;

    let filter = {};
    if (currentUserId) {
      filter._id = { $ne: currentUserId };
    }

    if (rawQuery) {
      const searchRegex = new RegExp(rawQuery, 'i');
      filter.$and = [
        ...(filter._id ? [{ _id: filter._id }] : []),
        {
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { enrollment: searchRegex },
            { username: searchRegex },
            { department: searchRegex },
            { course: searchRegex }
          ]
        }
      ];
      delete filter._id; // merged into $and
    }

    // Simultaneously searches across all users (Admin, Faculty, and Student)
    const users = await User.find(filter)
      .select('_id name email role username enrollment department course classSection')
      .sort({ name: 1 })
      .limit(30)
      .lean();

    const formatted = users.map((u) => ({
      _id: u._id.toString(),
      id: u._id.toString(),
      name: u.name || 'User',
      role: formatRoleModel(u.role),
      rawRole: u.role === 'teacher' ? 'faculty' : (u.role || 'student'),
      email: u.email || '',
      enrollment: u.enrollment || '',
      username: u.username || '',
      department: u.department || u.course || '',
      classSection: u.classSection || ''
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
      users: formatted
    });
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error searching users.'
    });
  }
};

// @desc    Get Chat History between Current User and Target User
// @route   GET /api/chat/history/:userId
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId: targetParam } = req.params;

    if (!targetParam) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID is required.'
      });
    }

    // Resolve target user ObjectId
    let targetUser = null;
    if (mongoose.Types.ObjectId.isValid(targetParam)) {
      targetUser = await User.findById(targetParam).lean();
    }
    if (!targetUser) {
      targetUser = await User.findOne({
        $or: [
          { username: targetParam },
          { enrollment: targetParam },
          { email: targetParam }
        ]
      }).lean();
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found.'
      });
    }

    const targetUserId = targetUser._id;

    // Fetch chronological chat history between both users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
        { senderId: currentUserId.toString(), receiverId: targetUserId.toString() },
        { senderId: targetUserId.toString(), receiverId: currentUserId.toString() }
      ]
    })
      .populate('sender', '_id name role email username enrollment department')
      .populate('receiver', '_id name role email username enrollment department')
      .sort({ createdAt: 1 })
      .lean();

    // Mark unread messages sent by target user to current user as read
    await Message.updateMany(
      {
        $or: [
          { sender: targetUserId, receiver: currentUserId, isRead: false },
          { senderId: targetUserId.toString(), receiverId: currentUserId.toString(), isRead: false }
        ]
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    const formattedMessages = messages.map((m) => ({
      _id: m._id.toString(),
      id: m._id.toString(),
      sender: m.sender?._id ? m.sender._id.toString() : (m.senderId || currentUserId.toString()),
      senderName: m.sender?.name || m.senderName || 'User',
      senderRole: formatRoleModel(m.sender?.role || m.senderRole || m.senderModel),
      receiver: m.receiver?._id ? m.receiver._id.toString() : (m.receiverId || targetUserId.toString()),
      receiverName: m.receiver?.name || m.receiverName || 'User',
      receiverRole: formatRoleModel(m.receiver?.role || m.receiverRole || m.receiverModel),
      text: m.text || m.message || '',
      message: m.text || m.message || '',
      isRead: m.isRead || false,
      timestamp: m.timestamp || new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: m.createdAt,
      isSender: (m.sender?._id ? m.sender._id.toString() : m.senderId) === currentUserId.toString()
    }));

    return res.status(200).json({
      success: true,
      count: formattedMessages.length,
      targetUser: {
        _id: targetUser._id.toString(),
        id: targetUser._id.toString(),
        name: targetUser.name,
        role: formatRoleModel(targetUser.role),
        email: targetUser.email || '',
        enrollment: targetUser.enrollment || '',
        department: targetUser.department || targetUser.course || ''
      },
      data: formattedMessages,
      messages: formattedMessages
    });
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving chat history.'
    });
  }
};

// @desc    Get All Conversations / Recent Chats for Current User
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // 1. Check Conversation collection
    let conversations = await Conversation.find({
      participants: currentUserId
    })
      .populate('participants', '_id name role email username enrollment department course classSection')
      .populate('lastSender', '_id name role')
      .sort({ lastMessageAt: -1 })
      .lean();

    // 2. If no Conversation docs exist yet, dynamically aggregate from Message collection
    if (!conversations || conversations.length === 0) {
      const distinctMessages = await Message.find({
        $or: [
          { sender: currentUserId },
          { receiver: currentUserId },
          { senderId: currentUserId.toString() },
          { receiverId: currentUserId.toString() }
        ]
      })
        .populate('sender', '_id name role email username enrollment department')
        .populate('receiver', '_id name role email username enrollment department')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const partnersMap = new Map();
      for (const m of distinctMessages) {
        const sId = m.sender?._id ? m.sender._id.toString() : m.senderId;
        const rId = m.receiver?._id ? m.receiver._id.toString() : m.receiverId;
        const otherUser = sId === currentUserId.toString() ? m.receiver : m.sender;
        const otherId = sId === currentUserId.toString() ? rId : sId;

        if (otherId && otherId !== currentUserId.toString() && !partnersMap.has(otherId)) {
          partnersMap.set(otherId, {
            otherUser,
            lastMessage: m.text || m.message || '',
            lastMessageAt: m.createdAt,
            unreadCount: (rId === currentUserId.toString() && !m.isRead) ? 1 : 0
          });
        }
      }

      const aggregatedList = [];
      for (const [otherId, item] of partnersMap.entries()) {
        const u = item.otherUser || await User.findById(otherId).select('_id name role email username enrollment department').lean();
        if (u) {
          aggregatedList.push({
            id: otherId,
            partner: {
              _id: u._id.toString(),
              id: u._id.toString(),
              name: u.name || 'User',
              role: formatRoleModel(u.role),
              email: u.email || '',
              department: u.department || u.course || '',
              enrollment: u.enrollment || ''
            },
            lastMessage: item.lastMessage,
            lastMessageAt: item.lastMessageAt,
            unreadCount: item.unreadCount
          });
        }
      }

      return res.status(200).json({
        success: true,
        count: aggregatedList.length,
        data: aggregatedList
      });
    }

    // Format populated conversations
    const formatted = conversations.map((conv) => {
      const partner = conv.participants.find(
        (p) => p && p._id.toString() !== currentUserId.toString()
      ) || conv.participants[0];

      return {
        id: conv._id.toString(),
        conversationId: conv._id.toString(),
        partner: partner ? {
          _id: partner._id.toString(),
          id: partner._id.toString(),
          name: partner.name || 'User',
          role: formatRoleModel(partner.role),
          email: partner.email || '',
          enrollment: partner.enrollment || '',
          department: partner.department || partner.course || ''
        } : null,
        lastMessage: conv.lastMessage || '',
        lastMessageAt: conv.lastMessageAt || conv.updatedAt,
        unreadCount: conv.unreadCounts ? (conv.unreadCounts.get ? conv.unreadCounts.get(currentUserId.toString()) : conv.unreadCounts[currentUserId.toString()]) || 0 : 0
      };
    }).filter((c) => c.partner !== null);

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Error in getConversations:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching conversations.'
    });
  }
};

// @desc    Send Message (REST API Fallback + Socket Dispatch)
// @route   POST /api/chat/send
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { receiverId, text, message } = req.body;
    const content = (text || message || '').trim();

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required.'
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty.'
      });
    }

    // Resolve receiver User
    let receiverUser = null;
    if (mongoose.Types.ObjectId.isValid(receiverId)) {
      receiverUser = await User.findById(receiverId);
    }
    if (!receiverUser) {
      receiverUser = await User.findOne({
        $or: [{ username: receiverId }, { enrollment: receiverId }, { email: receiverId }]
      });
    }

    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found.'
      });
    }

    // Find or create Conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, receiverUser._id] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, receiverUser._id],
        lastMessage: content,
        lastMessageAt: new Date(),
        lastSender: currentUserId
      });
    } else {
      conversation.lastMessage = content;
      conversation.lastMessageAt = new Date();
      conversation.lastSender = currentUserId;
      await conversation.save();
    }

    // Create Message document
    const newMessage = await Message.create({
      sender: currentUserId,
      senderModel: formatRoleModel(req.user.role),
      senderName: req.user.name,
      senderRole: req.user.role,
      senderId: currentUserId.toString(),
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

    const populatedMsg = await Message.findById(newMessage._id)
      .populate('sender', '_id name role email username enrollment department')
      .populate('receiver', '_id name role email username enrollment department')
      .lean();

    const formattedPayload = {
      _id: populatedMsg._id.toString(),
      id: populatedMsg._id.toString(),
      sender: currentUserId.toString(),
      senderName: req.user.name,
      senderRole: formatRoleModel(req.user.role),
      receiver: receiverUser._id.toString(),
      receiverName: receiverUser.name,
      receiverRole: formatRoleModel(receiverUser.role),
      text: content,
      message: content,
      isRead: false,
      timestamp: populatedMsg.timestamp,
      createdAt: populatedMsg.createdAt
    };

    // Broadcast via Socket.IO if server instance is active
    const io = req.app.get('io');
    if (io) {
      // Emit to receiver's personal room
      io.to(receiverUser._id.toString()).emit('receive_message', {
        ...formattedPayload,
        isSender: false
      });
      // Emit acknowledgement back to sender's room
      io.to(currentUserId.toString()).emit('message_sent', {
        ...formattedPayload,
        isSender: true
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: formattedPayload
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error sending message.'
    });
  }
};

// @desc    Mark All Messages from a User as Read
// @route   PUT /api/chat/read/:userId
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId: targetParam } = req.params;

    let targetObjectId = null;
    if (mongoose.Types.ObjectId.isValid(targetParam)) {
      targetObjectId = new mongoose.Types.ObjectId(targetParam);
    } else {
      const u = await User.findOne({
        $or: [{ username: targetParam }, { enrollment: targetParam }]
      });
      if (u) targetObjectId = u._id;
    }

    if (targetObjectId) {
      await Message.updateMany(
        { sender: targetObjectId, receiver: currentUserId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error marking messages as read.'
    });
  }
};
