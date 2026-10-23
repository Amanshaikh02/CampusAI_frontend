const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    audience: {
      type: String,
      default: 'Everyone',
      trim: true
    },
    targetType: {
      type: String,
      enum: ['all', 'department', 'individual'],
      default: 'all'
    },
    targetDepartment: {
      type: String,
      default: 'All Departments'
    },
    targetStudentEnrollment: {
      type: String,
      trim: true,
      default: ''
    },
    student: {
      type: String,
      trim: true,
      default: ''
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true
    },
    postedBy: {
      type: String,
      default: 'Admin'
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString('en-IN')
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date & time is required'],
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  },
  {
    timestamps: true
  }
);

// MongoDB TTL (Time-To-Live) index for automatic notice deletion upon expiration
NoticeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notice', NoticeSchema);
