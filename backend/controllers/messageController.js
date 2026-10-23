const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages
// @route   GET /api/messages
// @access  Private (Authenticated)
exports.getMessages = async (req, res) => {
  try {
    const { userId, senderId, receiverId, assignmentId } = req.query;
    let query = {};

    if (assignmentId) {
      query.assignmentId = assignmentId;
    }

    const currentId = req.user?._id?.toString() || req.user?.enrollment || req.user?.username;

    if (userId) {
      query.$or = [{ senderId: userId }, { receiverId: userId }];
    } else if (senderId && receiverId) {
      query.$or = [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ];
    } else if (currentId) {
      const identifiers = [
        currentId,
        req.user?._id?.toString(),
        req.user?.enrollment,
        req.user?.username
      ].filter(Boolean);

      const orClauses = [
        { senderId: { $in: identifiers } },
        { receiverId: { $in: identifiers } }
      ];
      if (req.user?.name) {
        orClauses.push({ senderName: req.user.name });
        orClauses.push({ receiverName: req.user.name });
      }
      query.$or = orClauses;
    }

    const messages = await Message.find(query).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching messages.'
    });
  }
};

// @desc    Send new message (individual or cohort broadcast)
// @route   POST /api/messages
// @access  Private (Authenticated)
exports.sendMessage = async (req, res) => {
  try {
    const {
      senderId,
      senderName,
      senderRole,
      receiverId,
      receiverName,
      receiverRole,
      message,
      assignmentId,
      subject,
      department,
      semester,
      broadcast,
      timestamp
    } = req.body;

    const resolvedSenderId = senderId || req.user?._id?.toString() || req.user?.enrollment || req.user?.username;
    const resolvedSenderName = senderName || req.user?.name || 'User';
    const resolvedSenderRole = senderRole || req.user?.role || 'student';

    if (!resolvedSenderId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Sender ID and message text are required.'
      });
    }

    // Teacher Broadcast to Class/Cohort (Requirement 18)
    if (broadcast || receiverId === 'all' || receiverId === 'class' || receiverRole === 'class') {
      let studentQuery = { role: { $in: ['student', 'Student'] } };
      if (department && department !== 'All Departments') {
        const escapedDept = department.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        studentQuery.$or = [
          { department: { $regex: new RegExp(`^${escapedDept}$`, 'i') } },
          { course: { $regex: new RegExp(`^${escapedDept}$`, 'i') } }
        ];
      }
      if (semester) {
        const semNum = Number(String(semester).replace(/[^0-9]/g, ''));
        studentQuery.semester = { $in: [String(semNum), semNum, `Semester ${semNum}`, `Sem ${semNum}`, `Sem-${semNum}`] };
      }
      const targetStudents = await User.find(studentQuery);
      if (targetStudents.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No students found matching this department and semester.'
        });
      }

      const createdMessages = [];
      const timeStr = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      for (const stu of targetStudents) {
        const msg = await Message.create({
          senderId: String(resolvedSenderId).trim(),
          senderName: resolvedSenderName.trim(),
          senderRole: resolvedSenderRole,
          receiverId: (stu.enrollment || stu.username || stu._id.toString()).trim(),
          receiverName: stu.name,
          receiverRole: 'student',
          assignmentId: assignmentId || null,
          subject: (subject || '').trim(),
          department: (department || stu.department || '').trim(),
          semester: semester || null,
          message: message.trim(),
          timestamp: timeStr
        });
        createdMessages.push(msg);
      }

      return res.status(201).json({
        success: true,
        message: `Message sent to ${createdMessages.length} student(s) in ${department || 'All Departments'} Sem ${semester || ''}.`,
        count: createdMessages.length,
        data: createdMessages[0]
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required.'
      });
    }

    const newMessage = await Message.create({
      senderId: String(resolvedSenderId).trim(),
      senderName: resolvedSenderName.trim(),
      senderRole: resolvedSenderRole,
      receiverId: String(receiverId).trim(),
      receiverName: (receiverName || receiverId).trim(),
      receiverRole: receiverRole || 'teacher',
      assignmentId: assignmentId || null,
      subject: (subject || '').trim(),
      department: (department || '').trim(),
      semester: semester || null,
      message: message.trim(),
      timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error sending message.'
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private (Authenticated)
exports.markMessageRead = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }
    msg.isRead = true;
    await msg.save();
    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating message.' });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private (Authenticated)
exports.deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);

    if (!msg) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.'
      });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting message.'
    });
  }
};
