const mongoose = require('mongoose');

const MarkSchema = new mongoose.Schema(
  {
    student: {
      type: String,
      required: [true, 'Student name/enrollment is required'],
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
    exam: {
      type: String,
      required: [true, 'Exam type is required'],
      trim: true
    },
    score: {
      type: String,
      required: [true, 'Score/Grade is required'],
      trim: true
    },
    maxMarks: {
      type: Number,
      default: 30
    },
    marksObtained: {
      type: String,
      default: ''
    },
    attendanceStatus: {
      type: String,
      enum: ['Present', 'Absent'],
      default: 'Present'
    },
    grade: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: ''
    },
    semester: {
      type: String,
      default: ''
    },
    division: {
      type: String,
      default: ''
    },
    academicYear: {
      type: String,
      default: '2026-2027'
    },
    enteredBy: {
      type: String,
      default: 'Faculty'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for quick querying by class & exam
MarkSchema.index({ department: 1, semester: 1, division: 1, subject: 1, exam: 1 });
MarkSchema.index({ enrollment: 1, subject: 1, exam: 1 });

module.exports = mongoose.model('Mark', MarkSchema);
