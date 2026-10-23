const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['AIML', 'Cyber Security', 'All Departments'],
      default: 'All Departments'
    },
    targetRole: {
      type: String,
      required: [true, 'Target role is required'],
      enum: ['Students', 'Faculty', 'Students & Faculty'],
      default: 'Students & Faculty'
    },
    targetType: {
      type: String,
      enum: ['department', 'individual'],
      default: 'department'
    },
    targetStudentEnrollment: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: String,
      default: 'Admin',
      trim: true
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString('en-IN')
    },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    fileName: {
      type: String,
      trim: true,
      default: ''
    },
    fileType: {
      type: String,
      trim: true,
      default: ''
    },
    fileSize: {
      type: String,
      trim: true,
      default: ''
    },
    fileData: {
      type: String,
      default: ''
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

// MongoDB TTL (Time-To-Live) index for automatic document deletion upon expiration
AnnouncementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
