const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      default: null
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    student: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true
    },
    enrollment: {
      type: String,
      required: [true, 'Enrollment number is required'],
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    department: {
      type: String,
      enum: ['AIML', 'Cyber Security', 'All Departments', ''],
      default: 'AIML',
      trim: true
    },
    semester: {
      type: Number,
      default: null
    },
    classSection: {
      type: String,
      trim: true,
      default: ''
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      trim: true // e.g. YYYY-MM-DD
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Present', 'Absent', 'Late'],
      default: 'Present'
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    markedBy: {
      type: String,
      default: 'Faculty',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure uniqueness per student per subject per date
AttendanceSchema.index(
  { subject: 1, department: 1, semester: 1, date: 1, enrollment: 1 },
  { unique: true, sparse: true }
);

AttendanceSchema.index({ enrollment: 1, subject: 1 });
AttendanceSchema.index({ department: 1, semester: 1, subject: 1, date: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
