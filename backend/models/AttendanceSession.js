const mongoose = require('mongoose');

const AttendanceSessionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FacultySubjectAssignment',
      required: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    facultyName: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      enum: ['AIML', 'Cyber Security'],
      trim: true
    },
    semester: {
      type: Number,
      required: true
    },
    classSection: {
      type: String,
      trim: true,
      default: ''
    },
    date: {
      type: String,
      required: true,
      trim: true // Format: YYYY-MM-DD
    },
    lectureTopic: {
      type: String,
      trim: true,
      default: ''
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    presentCount: {
      type: Number,
      default: 0
    },
    absentCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Unique index: only ONE session per assignment per date
AttendanceSessionSchema.index(
  { assignmentId: 1, date: 1 },
  { unique: true }
);

AttendanceSessionSchema.index({ facultyId: 1, date: 1 });
AttendanceSessionSchema.index({ department: 1, semester: 1, subject: 1 });

module.exports = mongoose.model('AttendanceSession', AttendanceSessionSchema);
