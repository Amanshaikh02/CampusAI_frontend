const mongoose = require('mongoose');

const FacultySubjectAssignmentSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty ID is required']
    },
    facultyName: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true
    },
    facultyUsername: {
      type: String,
      trim: true,
      default: ''
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    subjectCode: {
      type: String,
      trim: true,
      default: ''
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['AIML', 'Cyber Security'],
      trim: true
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8
    },
    classSection: {
      type: String,
      trim: true,
      default: 'General'
    },
    academicYear: {
      type: String,
      trim: true,
      default: '2026-2027'
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index so a faculty isn't duplicate-assigned to the exact same subject + dept + semester + section
FacultySubjectAssignmentSchema.index(
  { facultyId: 1, subject: 1, department: 1, semester: 1, classSection: 1 },
  { unique: true }
);

// Index for rapid department + semester lookup
FacultySubjectAssignmentSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('FacultySubjectAssignment', FacultySubjectAssignmentSchema);
