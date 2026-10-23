const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    date: {
      type: String,
      required: [true, 'Event date is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: String,
      default: ''
    },
    time: {
      type: String,
      default: ''
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    organizer: {
      type: String,
      default: 'Administration'
    },
    targetDepartment: {
      type: String,
      default: 'All Departments'
    },
    targetType: {
      type: String,
      enum: ['all', 'department', 'individual'],
      default: 'all'
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
    audience: {
      type: String,
      default: 'Everyone'
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

// MongoDB TTL (Time-To-Live) index for automatic event deletion upon expiration
EventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Event', EventSchema);
