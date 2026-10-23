const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ObjectId is required']
    },
    senderModel: {
      type: String,
      enum: ['Admin', 'Faculty', 'Student', 'admin', 'faculty', 'teacher', 'student'],
      required: [true, 'Sender model role is required'],
      default: 'Student'
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver ObjectId is required']
    },
    receiverModel: {
      type: String,
      enum: ['Admin', 'Faculty', 'Student', 'admin', 'faculty', 'teacher', 'student'],
      required: [true, 'Receiver model role is required'],
      default: 'Faculty'
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true
    },
    // Backwards-compatible alias for existing frontend/controllers
    message: {
      type: String,
      trim: true
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    // Legacy support fields for existing messages
    senderId: {
      type: String,
      trim: true
    },
    senderName: {
      type: String,
      trim: true
    },
    senderRole: {
      type: String,
      trim: true
    },
    receiverId: {
      type: String,
      trim: true
    },
    receiverName: {
      type: String,
      trim: true
    },
    receiverRole: {
      type: String,
      trim: true
    },
    timestamp: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook: ensure text & message are synchronized, and senderId/receiverId are set
MessageSchema.pre('save', function () {
  if (this.text && !this.message) {
    this.message = this.text;
  } else if (this.message && !this.text) {
    this.text = this.message;
  }
  if (this.sender && !this.senderId) {
    this.senderId = this.sender.toString();
  }
  if (this.receiver && !this.receiverId) {
    this.receiverId = this.receiver.toString();
  }
});

// Indexes for high-performance querying of chat history
MessageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ receiver: 1, isRead: 1 });

module.exports = mongoose.model('Message', MessageSchema);
